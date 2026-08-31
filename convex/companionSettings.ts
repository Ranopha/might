import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MIN_SESSION_KEY_LENGTH = 32;
const MAX_SESSION_KEY_LENGTH = 256;
const MAX_COMPANION_NAME_LENGTH = 40;

const appearanceValidator = v.union(
  v.literal("orb"),
  v.literal("generated"),
);

const settingsViewValidator = v.object({
  name: v.string(),
  appearance: appearanceValidator,
  hasGeneratedAppearance: v.boolean(),
});

function assertClientSessionKey(clientSessionKey: string): void {
  if (
    clientSessionKey.length < MIN_SESSION_KEY_LENGTH ||
    clientSessionKey.length > MAX_SESSION_KEY_LENGTH ||
    clientSessionKey.trim() !== clientSessionKey ||
    /\s/.test(clientSessionKey)
  ) {
    throw new ConvexError("Invalid anonymous session key.");
  }
}

function normalizeCompanionName(name: string): string {
  const normalized = name.trim();
  const hasControlCharacter = Array.from(normalized).some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f);
  });
  if (
    normalized.length === 0 ||
    normalized.length > MAX_COMPANION_NAME_LENGTH ||
    hasControlCharacter
  ) {
    throw new ConvexError(
      "Companion name must be between 1 and 40 visible characters.",
    );
  }
  return normalized;
}

export const current = query({
  args: {
    clientSessionKey: v.string(),
  },
  returns: settingsViewValidator,
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", args.clientSessionKey),
      )
      .unique();
    if (session === null) {
      return {
        name: "Might",
        appearance: "orb" as const,
        hasGeneratedAppearance: false,
      };
    }

    const latestManifestation = await ctx.db
      .query("companionManifestations")
      .withIndex("by_anonymousSessionId_and_updatedAt", (q) =>
        q.eq("anonymousSessionId", session._id),
      )
      .order("desc")
      .first();
    const readyManifestation = await ctx.db
      .query("companionManifestations")
      .withIndex(
        "by_anonymousSessionId_and_status_and_updatedAt",
        (q) =>
          q
            .eq("anonymousSessionId", session._id)
            .eq("status", "ready"),
      )
      .order("desc")
      .first();
    const hasGeneratedAppearance =
      readyManifestation !== null && readyManifestation.storageId !== null;
    const savedAppearance = session.companionAppearance;
    const appearance =
      savedAppearance === "generated" && !hasGeneratedAppearance
        ? "orb"
        : (savedAppearance ?? (hasGeneratedAppearance ? "generated" : "orb"));

    return {
      name: session.companionName ?? latestManifestation?.name ?? "Might",
      appearance,
      hasGeneratedAppearance,
    };
  },
});

export const updateName = mutation({
  args: {
    clientSessionKey: v.string(),
    name: v.string(),
  },
  returns: v.object({
    name: v.string(),
  }),
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    const name = normalizeCompanionName(args.name);
    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", args.clientSessionKey),
      )
      .unique();
    if (session === null) {
      throw new ConvexError("Anonymous session has not been initialized.");
    }

    await ctx.db.patch("anonymousSessions", session._id, {
      companionName: name,
      lastActiveAt: Date.now(),
    });
    return { name };
  },
});

export const updateAppearance = mutation({
  args: {
    clientSessionKey: v.string(),
    appearance: appearanceValidator,
  },
  returns: v.object({
    appearance: appearanceValidator,
  }),
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", args.clientSessionKey),
      )
      .unique();
    if (session === null) {
      throw new ConvexError("Anonymous session has not been initialized.");
    }

    if (args.appearance === "generated") {
      const readyManifestation = await ctx.db
        .query("companionManifestations")
        .withIndex(
          "by_anonymousSessionId_and_status_and_updatedAt",
          (q) =>
            q
              .eq("anonymousSessionId", session._id)
              .eq("status", "ready"),
        )
        .order("desc")
        .first();
      if (readyManifestation?.storageId == null) {
        throw new ConvexError("A generated companion form is not ready yet.");
      }
    }

    await ctx.db.patch("anonymousSessions", session._id, {
      companionAppearance: args.appearance,
      lastActiveAt: Date.now(),
    });
    return { appearance: args.appearance };
  },
});
