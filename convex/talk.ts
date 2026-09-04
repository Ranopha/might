import { createThread, saveMessage } from "@convex-dev/agent";
import { ConvexError, v } from "convex/values";
import { components, internal } from "./_generated/api";
import {
  env,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { abuseProtection } from "./abuseProtection";
import { selectOpenAiCredential } from "./openAiCredentialPolicy";

const MIN_SESSION_KEY_LENGTH = 32;
const MAX_SESSION_KEY_LENGTH = 256;
const MAX_MESSAGE_LENGTH = 8_000;
const MAX_MESSAGE_PAGE_SIZE = 100;
const MIN_CLIENT_MESSAGE_ID_LENGTH = 8;
const MAX_CLIENT_MESSAGE_ID_LENGTH = 128;
const DEFAULT_TEXT_MODEL = "gpt-5.6-luna";

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

const appendedMessageValidator = messageViewValidator.extend({
  created: v.boolean(),
});

const turnStatusValidator = v.union(
  v.literal("processing"),
  v.literal("completed"),
  v.literal("failed"),
);

const turnErrorValidator = v.union(
  v.null(),
  v.literal("OPENAI_CONFIGURATION_MISSING"),
  v.literal("REPLY_GENERATION_FAILED"),
  v.literal("MEMORY_EXTRACTION_FAILED"),
  v.literal("TURN_COMMIT_FAILED"),
);

const memoryProcessingStatusValidator = v.union(
  v.literal("pending"),
  v.literal("completed"),
  v.literal("failed"),
);

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

function normalizeClientMessageId(clientMessageId: string): string {
  const normalized = clientMessageId.trim();
  if (
    normalized.length < MIN_CLIENT_MESSAGE_ID_LENGTH ||
    normalized.length > MAX_CLIENT_MESSAGE_ID_LENGTH ||
    normalized !== clientMessageId ||
    /\s/.test(normalized)
  ) {
    throw new ConvexError("Invalid client message id.");
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
    seam: v.literal("talk-memory-v1"),
  }),
  handler: async () => ({
    status: "live" as const,
    backend: "convex" as const,
    seam: "talk-memory-v1" as const,
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

    if (existingSession === null) {
      const sessionBudget = await abuseProtection.limit(
        ctx,
        "anonymousSessionCreation",
      );
      if (!sessionBudget.ok) {
        throw new ConvexError(
          "New private sessions are resting for a moment. Please try again shortly.",
        );
      }
    }

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

    let agentThreadId = existingConversation?.agentThreadId;
    if (!agentThreadId) {
      agentThreadId = await createThread(ctx, components.agent, {
        userId: sessionId,
        title: "Private Might conversation",
      });
    }

    const createdConversation = existingConversation === null;
    const conversationId = createdConversation
      ? await ctx.db.insert("conversations", {
          anonymousSessionId: sessionId,
          kind: "primary",
          agentThreadId,
          nextMessageSequence: 0,
          createdAt: now,
          updatedAt: now,
        })
      : existingConversation._id;

    if (
      existingConversation !== null &&
      existingConversation.agentThreadId === undefined
    ) {
      await ctx.db.patch("conversations", existingConversation._id, {
        agentThreadId,
        updatedAt: now,
      });
    }

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
    clientMessageId: v.string(),
    content: v.string(),
  },
  returns: appendedMessageValidator,
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    const clientMessageId = normalizeClientMessageId(args.clientMessageId);
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

    const existingMessage = await ctx.db
      .query("messages")
      .withIndex("by_anonymousSessionId_and_clientMessageId", (q) =>
        q
          .eq("anonymousSessionId", session._id)
          .eq("clientMessageId", clientMessageId),
      )
      .unique();
    if (existingMessage !== null) {
      if (existingMessage.role !== "user" || existingMessage.content !== content) {
        throw new ConvexError("Client message id is already bound to other content.");
      }
      return {
        id: existingMessage._id,
        role: "user" as const,
        content: existingMessage.content,
        source: "user_input" as const,
        privacy: "private" as const,
        sequence: existingMessage.sequence,
        createdAt: existingMessage.createdAt,
        created: false,
      };
    }

    const processingTurn = await ctx.db
      .query("talkTurns")
      .withIndex(
        "by_anonymousSessionId_and_status_and_updatedAt",
        (q) =>
          q
            .eq("anonymousSessionId", session._id)
            .eq("status", "processing"),
      )
      .order("desc")
      .first();
    if (processingTurn !== null) {
      throw new ConvexError(
        "Might is still replying to your previous message.",
      );
    }

    const burstBudget = await abuseProtection.limit(ctx, "talkBurst");
    const dailyBudget = await abuseProtection.limit(ctx, "talkDaily");
    const sessionBudget = await abuseProtection.limit(
      ctx,
      "talkSessionHourly",
      { key: session._id },
    );
    if (!burstBudget.ok || !dailyBudget.ok || !sessionBudget.ok) {
      throw new ConvexError(
        "Might is resting for a moment. Please try again shortly.",
      );
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
    if (!conversation.agentThreadId) {
      throw new ConvexError("Conversation agent thread is unavailable.");
    }

    const { messageId: promptMessageId } = await saveMessage(
      ctx,
      components.agent,
      {
        threadId: conversation.agentThreadId,
        prompt: content,
      },
    );

    const createdAt = Date.now();
    const sequence = conversation.nextMessageSequence;
    const messageId = await ctx.db.insert("messages", {
      anonymousSessionId: session._id,
      conversationId: conversation._id,
      role: "user",
      content,
      source: "user_input",
      privacy: "private",
      clientMessageId,
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

    const openAiCredential = await selectOpenAiCredential(ctx, session);
    const turnId = await ctx.db.insert("talkTurns", {
      anonymousSessionId: session._id,
      conversationId: conversation._id,
      sourceMessageId: messageId,
      clientMessageId,
      agentThreadId: conversation.agentThreadId,
      promptMessageId,
      status: "processing",
      memoryStatus: "pending",
      replyModel: env.OPENAI_TEXT_MODEL ?? DEFAULT_TEXT_MODEL,
      extractionModel: env.OPENAI_TEXT_MODEL ?? DEFAULT_TEXT_MODEL,
      ...openAiCredential,
      replyResponseId: null,
      extractionResponseId: null,
      errorCode: null,
      startedAt: createdAt,
      updatedAt: createdAt,
    });
    await ctx.scheduler.runAfter(0, internal.talkOpenai.generateTurn, {
      turnId,
    });

    return {
      id: messageId,
      role: "user" as const,
      content,
      source: "user_input" as const,
      privacy: "private" as const,
      sequence,
      createdAt,
      created: true,
    };
  },
});

export const latestTurn = query({
  args: {
    clientSessionKey: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      id: v.id("talkTurns"),
      sourceMessageId: v.id("messages"),
      status: turnStatusValidator,
      memoryStatus: memoryProcessingStatusValidator,
      errorCode: turnErrorValidator,
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", args.clientSessionKey),
      )
      .unique();
    if (session === null) {
      return null;
    }

    const turn = await ctx.db
      .query("talkTurns")
      .withIndex("by_anonymousSessionId_and_updatedAt", (q) =>
        q.eq("anonymousSessionId", session._id),
      )
      .order("desc")
      .first();
    if (turn === null) {
      return null;
    }
    return {
      id: turn._id,
      sourceMessageId: turn.sourceMessageId,
      status: turn.status,
      memoryStatus: turn.memoryStatus,
      errorCode: turn.errorCode,
      updatedAt: turn.updatedAt,
    };
  },
});

export const getTurnContext = internalQuery({
  args: {
    turnId: v.id("talkTurns"),
  },
  returns: v.union(
    v.null(),
    v.object({
      sourceMessageId: v.id("messages"),
      agentThreadId: v.string(),
      promptMessageId: v.string(),
      replyModel: v.string(),
      extractionModel: v.string(),
      openAiCredentialSource: v.union(
        v.literal("hackathon_demo"),
        v.literal("user_supplied"),
      ),
      openAiCredentialId: v.union(v.id("openAiCredentials"), v.null()),
      openAiCredentialVersion: v.union(v.number(), v.null()),
      recentMessages: v.array(
        v.object({
          role: messageRoleValidator,
          content: v.string(),
        }),
      ),
      activeMemories: v.array(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const turn = await ctx.db.get("talkTurns", args.turnId);
    if (turn === null || turn.status !== "processing") {
      return null;
    }

    const recentMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_and_sequence", (q) =>
        q.eq("conversationId", turn.conversationId),
      )
      .order("desc")
      .take(12);
    const activeMemories = await ctx.db
      .query("memories")
      .withIndex("by_anonymousSessionId_and_status_and_updatedAt", (q) =>
        q.eq("anonymousSessionId", turn.anonymousSessionId).eq("status", "active"),
      )
      .order("desc")
      .take(20);

    return {
      sourceMessageId: turn.sourceMessageId,
      agentThreadId: turn.agentThreadId,
      promptMessageId: turn.promptMessageId,
      replyModel: turn.replyModel,
      extractionModel: turn.extractionModel,
      openAiCredentialSource:
        turn.openAiCredentialSource ?? "hackathon_demo",
      openAiCredentialId: turn.openAiCredentialId ?? null,
      openAiCredentialVersion: turn.openAiCredentialVersion ?? null,
      recentMessages: recentMessages.reverse().map((message) => ({
        role: message.role,
        content: message.content,
      })),
      activeMemories: activeMemories.map((memory) => memory.statement),
    };
  },
});

export const failTurn = internalMutation({
  args: {
    turnId: v.id("talkTurns"),
    errorCode: v.union(
      v.literal("OPENAI_CONFIGURATION_MISSING"),
      v.literal("REPLY_GENERATION_FAILED"),
      v.literal("TURN_COMMIT_FAILED"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const turn = await ctx.db.get("talkTurns", args.turnId);
    if (turn === null || turn.status === "completed") {
      return null;
    }
    await ctx.db.patch("talkTurns", turn._id, {
      status: "failed",
      memoryStatus: "failed",
      errorCode: args.errorCode,
      updatedAt: Date.now(),
    });
    return null;
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
