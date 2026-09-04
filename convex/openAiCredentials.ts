import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { abuseProtection } from "./abuseProtection";

const MIN_SESSION_KEY_LENGTH = 32;
const MAX_SESSION_KEY_LENGTH = 256;

function assertClientSessionKey(clientSessionKey: string): void {
  if (
    clientSessionKey.length < MIN_SESSION_KEY_LENGTH ||
    clientSessionKey.length > MAX_SESSION_KEY_LENGTH ||
    clientSessionKey.trim() !== clientSessionKey ||
    /\s/.test(clientSessionKey)
  ) {
    throw new ConvexError("Invalid private room key.");
  }
}

export const current = query({
  args: { clientSessionKey: v.string() },
  returns: v.object({
    authenticated: v.boolean(),
    email: v.union(v.string(), v.null()),
    roomLinked: v.boolean(),
    roomConflict: v.boolean(),
    configured: v.boolean(),
    lastFour: v.union(v.string(), v.null()),
    verifiedModel: v.union(v.string(), v.null()),
    verifiedAt: v.union(v.number(), v.null()),
    lastUsedAt: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return {
        authenticated: false,
        email: null,
        roomLinked: false,
        roomConflict: false,
        configured: false,
        lastFour: null,
        verifiedModel: null,
        verifiedAt: null,
        lastUsedAt: null,
      };
    }
    const [user, session, credential] = await Promise.all([
      ctx.db.get("users", userId),
      ctx.db
        .query("anonymousSessions")
        .withIndex("by_clientSessionKey", (q) =>
          q.eq("clientSessionKey", args.clientSessionKey),
        )
        .unique(),
      ctx.db
        .query("openAiCredentials")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique(),
    ]);
    const roomConflict =
      session?.ownerUserId !== undefined && session.ownerUserId !== userId;
    return {
      authenticated: true,
      email: user?.email ?? null,
      roomLinked: session?.ownerUserId === userId,
      roomConflict,
      configured: credential !== null,
      lastFour: credential?.lastFour ?? null,
      verifiedModel: credential?.verifiedModel ?? null,
      verifiedAt: credential?.verifiedAt ?? null,
      lastUsedAt: credential?.lastUsedAt ?? null,
    };
  },
});

export const claimSession = mutation({
  args: { clientSessionKey: v.string() },
  returns: v.object({ linked: v.boolean() }),
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Sign in before linking this room.");
    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", args.clientSessionKey),
      )
      .unique();
    if (session === null) throw new ConvexError("This private room is not ready yet.");
    if (session.ownerUserId !== undefined && session.ownerUserId !== userId) {
      throw new ConvexError("This private room is already linked to another account.");
    }
    if (session.ownerUserId === undefined) {
      await ctx.db.patch("anonymousSessions", session._id, {
        ownerUserId: userId,
        lastActiveAt: Date.now(),
      });
    }
    return { linked: true };
  },
});

export const remove = mutation({
  args: {},
  returns: v.object({ removed: v.boolean() }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Sign in before removing a key.");
    const credential = await ctx.db
      .query("openAiCredentials")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (credential === null) return { removed: false };
    await ctx.db.delete("openAiCredentials", credential._id);
    return { removed: true };
  },
});

export const reserveVerification = internalMutation({
  args: {},
  returns: v.object({ userId: v.id("users") }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Authentication is required.");
    const burst = await abuseProtection.limit(ctx, "openAiCredentialBurst", {
      key: userId,
    });
    const daily = await abuseProtection.limit(ctx, "openAiCredentialDaily", {
      key: userId,
    });
    if (!burst.ok || !daily.ok) {
      throw new ConvexError("Key verification is resting. Please try again later.");
    }
    return { userId };
  },
});

export const storeEncrypted = internalMutation({
  args: {
    userId: v.id("users"),
    ciphertext: v.string(),
    iv: v.string(),
    version: v.number(),
    lastFour: v.string(),
    verifiedModel: v.string(),
    verificationResponseId: v.union(v.string(), v.null()),
    verifiedAt: v.number(),
  },
  returns: v.object({ credentialId: v.id("openAiCredentials") }),
  handler: async (ctx, args) => {
    const authenticatedUserId = await getAuthUserId(ctx);
    if (authenticatedUserId === null || authenticatedUserId !== args.userId) {
      throw new ConvexError("Credential ownership could not be verified.");
    }
    const existing = await ctx.db
      .query("openAiCredentials")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (existing !== null && existing.version >= args.version) {
      throw new ConvexError("A newer credential is already active.");
    }
    const now = Date.now();
    if (existing !== null) {
      await ctx.db.patch("openAiCredentials", existing._id, {
        ciphertext: args.ciphertext,
        iv: args.iv,
        version: args.version,
        lastFour: args.lastFour,
        verifiedModel: args.verifiedModel,
        verificationResponseId: args.verificationResponseId,
        verifiedAt: args.verifiedAt,
        lastUsedAt: null,
        updatedAt: now,
      });
      return { credentialId: existing._id };
    }
    const credentialId = await ctx.db.insert("openAiCredentials", {
      userId: args.userId,
      ciphertext: args.ciphertext,
      iv: args.iv,
      version: args.version,
      lastFour: args.lastFour,
      verifiedModel: args.verifiedModel,
      verificationResponseId: args.verificationResponseId,
      verifiedAt: args.verifiedAt,
      lastUsedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    return { credentialId };
  },
});

export const getEncryptedForUse = internalQuery({
  args: {
    credentialId: v.id("openAiCredentials"),
    version: v.number(),
  },
  returns: v.union(
    v.null(),
    v.object({
      userId: v.id("users"),
      ciphertext: v.string(),
      iv: v.string(),
      version: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const credential = await ctx.db.get("openAiCredentials", args.credentialId);
    if (credential === null || credential.version !== args.version) return null;
    return {
      userId: credential.userId,
      ciphertext: credential.ciphertext,
      iv: credential.iv,
      version: credential.version,
    };
  },
});

export const markUsed = internalMutation({
  args: {
    credentialId: v.id("openAiCredentials"),
    version: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const credential = await ctx.db.get("openAiCredentials", args.credentialId);
    if (credential !== null && credential.version === args.version) {
      await ctx.db.patch("openAiCredentials", credential._id, {
        lastUsedAt: Date.now(),
      });
    }
    return null;
  },
});
