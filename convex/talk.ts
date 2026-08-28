import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MIN_SESSION_KEY_LENGTH = 32;
const MAX_SESSION_KEY_LENGTH = 256;
const MAX_MESSAGE_LENGTH = 8_000;
const MAX_MESSAGE_PAGE_SIZE = 100;

const messageRoleValidator = v.union(
  v.literal("user"),
  v.literal("assistant"),
  v.literal("system"),
);

const messageSourceValidator = v.union(
  v.literal("user_input"),
  v.literal("assistant_generated"),
  v.literal("system"),
);

const messagePrivacyValidator = v.union(
  v.literal("private"),
  v.literal("shareable_with_consent"),
);

const messageViewValidator = v.object({
  id: v.id("messages"),
  role: messageRoleValidator,
  content: v.string(),
  source: messageSourceValidator,
  privacy: messagePrivacyValidator,
  sequence: v.number(),
  createdAt: v.number(),
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

function normalizeMessageContent(content: string): string {
  const normalized = content.trim();
  if (normalized.length === 0 || normalized.length > MAX_MESSAGE_LENGTH) {
    throw new ConvexError("Message content must be between 1 and 8000 characters.");
  }
  return normalized;
}

function normalizeLimit(limit: number): number {
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > MAX_MESSAGE_PAGE_SIZE
  ) {
    throw new ConvexError("Message limit must be an integer between 1 and 100.");
  }
  return limit;
}

export const status = query({
  args: {},
  returns: v.object({
    status: v.literal("live"),
    backend: v.literal("convex"),
    seam: v.literal("talk-persistence-v1"),
  }),
  handler: async () => ({
    status: "live" as const,
    backend: "convex" as const,
    seam: "talk-persistence-v1" as const,
  }),
});

export const ensureSession = mutation({
  args: {
    clientSessionKey: v.string(),
  },
  returns: v.object({
    sessionId: v.id("anonymousSessions"),
    conversationId: v.id("conversations"),
    createdSession: v.boolean(),
    createdConversation: v.boolean(),
  }),
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    const now = Date.now();

    const existingSession = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", args.clientSessionKey),
      )
      .unique();

    const createdSession = existingSession === null;
    const sessionId = createdSession
      ? await ctx.db.insert("anonymousSessions", {
          clientSessionKey: args.clientSessionKey,
          createdAt: now,
          lastActiveAt: now,
        })
      : existingSession._id;

    if (existingSession !== null) {
      await ctx.db.patch("anonymousSessions", sessionId, {
        lastActiveAt: now,
      });
    }

    const existingConversation = await ctx.db
      .query("conversations")
      .withIndex("by_anonymousSessionId_and_kind", (q) =>
        q.eq("anonymousSessionId", sessionId).eq("kind", "primary"),
      )
      .unique();

    const createdConversation = existingConversation === null;
    const conversationId = createdConversation
      ? await ctx.db.insert("conversations", {
          anonymousSessionId: sessionId,
          kind: "primary",
          nextMessageSequence: 0,
          createdAt: now,
          updatedAt: now,
        })
      : existingConversation._id;

    return {
      sessionId,
      conversationId,
      createdSession,
      createdConversation,
    };
  },
});

export const appendUserMessage = mutation({
  args: {
    clientSessionKey: v.string(),
    content: v.string(),
  },
  returns: messageViewValidator,
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    const content = normalizeMessageContent(args.content);

    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", args.clientSessionKey),
      )
      .unique();
    if (session === null) {
      throw new ConvexError("Anonymous session has not been initialized.");
    }

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_anonymousSessionId_and_kind", (q) =>
        q.eq("anonymousSessionId", session._id).eq("kind", "primary"),
      )
      .unique();
    if (conversation === null) {
      throw new ConvexError("Primary conversation is unavailable.");
    }

    const createdAt = Date.now();
    const sequence = conversation.nextMessageSequence;
    const messageId = await ctx.db.insert("messages", {
      anonymousSessionId: session._id,
      conversationId: conversation._id,
      role: "user",
      content,
      source: "user_input",
      privacy: "private",
      sequence,
      createdAt,
    });

    await ctx.db.patch("conversations", conversation._id, {
      nextMessageSequence: sequence + 1,
      updatedAt: createdAt,
    });
    await ctx.db.patch("anonymousSessions", session._id, {
      lastActiveAt: createdAt,
    });

    return {
      id: messageId,
      role: "user" as const,
      content,
      source: "user_input" as const,
      privacy: "private" as const,
      sequence,
      createdAt,
    };
  },
});

export const listMessages = query({
  args: {
    clientSessionKey: v.string(),
    limit: v.number(),
  },
  returns: v.array(messageViewValidator),
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    const limit = normalizeLimit(args.limit);

    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", args.clientSessionKey),
      )
      .unique();
    if (session === null) {
      return [];
    }

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_anonymousSessionId_and_kind", (q) =>
        q.eq("anonymousSessionId", session._id).eq("kind", "primary"),
      )
      .unique();
    if (conversation === null) {
      return [];
    }

    const newestFirst = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_and_sequence", (q) =>
        q.eq("conversationId", conversation._id),
      )
      .order("desc")
      .take(limit);

    return newestFirst.reverse().map((message) => ({
      id: message._id,
      role: message.role,
      content: message.content,
      source: message.source,
      privacy: message.privacy,
      sequence: message.sequence,
      createdAt: message.createdAt,
    }));
  },
});
