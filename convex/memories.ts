import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";

const MAX_MEMORY_PAGE_SIZE = 50;
const MIN_MEMORY_CONFIDENCE = 0.65;
const MIN_MEMORY_LENGTH = 8;
const MAX_MEMORY_LENGTH = 240;
const MAX_ASSISTANT_MESSAGE_LENGTH = 8_000;

const semanticTypeValidator = v.union(
  v.literal("experience"),
  v.literal("interest"),
  v.literal("preference"),
  v.literal("availability"),
  v.literal("knowledge"),
  v.literal("resource"),
  v.literal("constraint"),
  v.literal("habit"),
  v.literal("context"),
  v.literal("other"),
);

const explicitnessValidator = v.union(
  v.literal("explicit"),
  v.literal("inferred"),
);

const freshnessValidator = v.union(
  v.literal("long_term"),
  v.literal("temporary"),
  v.literal("unknown"),
);

const memoryStatusValidator = v.union(
  v.literal("active"),
  v.literal("forgotten"),
);

const memoryViewValidator = v.object({
  id: v.id("memories"),
  statement: v.string(),
  semanticType: semanticTypeValidator,
  sourceMessageId: v.id("messages"),
  source: v.union(
    v.literal("conversation"),
    v.literal("user_edit"),
    v.literal("system_inference"),
  ),
  explicitness: explicitnessValidator,
  confidence: v.number(),
  privacy: v.union(
    v.literal("private"),
    v.literal("shareable_with_consent"),
  ),
  freshness: freshnessValidator,
  status: memoryStatusValidator,
  lastConfirmedAt: v.union(v.number(), v.null()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

function assertClientSessionKey(clientSessionKey: string): void {
  if (
    clientSessionKey.length < 32 ||
    clientSessionKey.length > 256 ||
    clientSessionKey.trim() !== clientSessionKey ||
    /\s/.test(clientSessionKey)
  ) {
    throw new ConvexError("Invalid anonymous session key.");
  }
}

function normalizeLimit(limit: number): number {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_MEMORY_PAGE_SIZE) {
    throw new ConvexError("Memory limit must be an integer between 1 and 50.");
  }
  return limit;
}

function normalizeMemoryStatement(statement: string): {
  statement: string;
  normalizedStatement: string;
} | null {
  const normalized = statement.trim().replace(/\s+/g, " ");
  if (
    normalized.length < MIN_MEMORY_LENGTH ||
    normalized.length > MAX_MEMORY_LENGTH
  ) {
    return null;
  }
  return {
    statement: normalized,
    normalizedStatement: normalized.toLowerCase(),
  };
}

function toMemoryView(memory: Doc<"memories">) {
  return {
    id: memory._id,
    statement: memory.statement,
    semanticType: memory.semanticType,
    sourceMessageId: memory.sourceMessageId,
    source: memory.source,
    explicitness: memory.explicitness,
    confidence: memory.confidence,
    privacy: memory.privacy,
    freshness: memory.freshness,
    status: memory.status,
    lastConfirmedAt: memory.lastConfirmedAt,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  };
}

async function requireOwnedMemory(
  ctx: MutationCtx,
  clientSessionKey: string,
  memoryId: Id<"memories">,
): Promise<Doc<"memories">> {
  assertClientSessionKey(clientSessionKey);
  const session = await ctx.db
    .query("anonymousSessions")
    .withIndex("by_clientSessionKey", (q) =>
      q.eq("clientSessionKey", clientSessionKey),
    )
    .unique();
  const memory = await ctx.db.get("memories", memoryId);
  if (
    session === null ||
    memory === null ||
    memory.anonymousSessionId !== session._id
  ) {
    throw new ConvexError("Memory is unavailable.");
  }
  return memory;
}

export const commitExtractedTurn = internalMutation({
  args: {
    turnId: v.id("talkTurns"),
    sourceMessageId: v.id("messages"),
    assistantContent: v.string(),
    replyModel: v.string(),
    replyResponseId: v.union(v.string(), v.null()),
    extractionModel: v.string(),
    extractionResponseId: v.union(v.string(), v.null()),
    memoryStatus: v.union(v.literal("completed"), v.literal("failed")),
    turnErrorCode: v.union(
      v.null(),
      v.literal("MEMORY_EXTRACTION_FAILED"),
    ),
    candidates: v.array(
      v.object({
        decision: v.union(v.literal("remember"), v.literal("ignore")),
        aboutUser: v.boolean(),
        statement: v.string(),
        semanticType: semanticTypeValidator,
        explicitness: explicitnessValidator,
        confidence: v.number(),
        freshness: freshnessValidator,
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const turn = await ctx.db.get("talkTurns", args.turnId);
    if (turn === null || turn.sourceMessageId !== args.sourceMessageId) {
      throw new ConvexError("Turn does not match the memory source message.");
    }
    if (turn.status === "completed") {
      return null;
    }
    if (turn.status !== "processing") {
      throw new ConvexError("Only a processing turn can be committed.");
    }

    const sourceMessage = await ctx.db.get("messages", args.sourceMessageId);
    if (sourceMessage === null || sourceMessage.role !== "user") {
      throw new ConvexError("Memory source must be an existing user message.");
    }

    const assistantContent = args.assistantContent.trim();
    if (
      assistantContent.length === 0 ||
      assistantContent.length > MAX_ASSISTANT_MESSAGE_LENGTH
    ) {
      throw new ConvexError("Assistant response has an invalid length.");
    }

    const conversation = await ctx.db.get(
      "conversations",
      sourceMessage.conversationId,
    );
    if (
      conversation === null ||
      conversation.anonymousSessionId !== sourceMessage.anonymousSessionId
    ) {
      throw new ConvexError("Conversation is unavailable for this source message.");
    }

    const now = Date.now();
    const sequence = conversation.nextMessageSequence;
    await ctx.db.insert("messages", {
      anonymousSessionId: sourceMessage.anonymousSessionId,
      conversationId: sourceMessage.conversationId,
      role: "assistant",
      content: assistantContent,
      source: "assistant_generated",
      privacy: "private",
      sequence,
      createdAt: now,
      model: args.replyModel,
      providerResponseId: args.replyResponseId,
      sourceMessageId: sourceMessage._id,
    });

    await ctx.db.patch("conversations", conversation._id, {
      nextMessageSequence: sequence + 1,
      updatedAt: now,
    });

    for (const candidate of args.candidates.slice(0, 4)) {
      if (
        candidate.decision !== "remember" ||
        !candidate.aboutUser ||
        candidate.confidence < MIN_MEMORY_CONFIDENCE ||
        candidate.confidence > 1
      ) {
        continue;
      }
      const normalized = normalizeMemoryStatement(candidate.statement);
      if (normalized === null) {
        continue;
      }

      const existing = await ctx.db
        .query("memories")
        .withIndex("by_anonymousSessionId_and_normalizedStatement", (q) =>
          q
            .eq("anonymousSessionId", sourceMessage.anonymousSessionId)
            .eq("normalizedStatement", normalized.normalizedStatement),
        )
        .unique();

      const memory = {
        statement: normalized.statement,
        normalizedStatement: normalized.normalizedStatement,
        semanticType: candidate.semanticType,
        sourceMessageId: sourceMessage._id,
        source:
          candidate.explicitness === "explicit"
            ? ("conversation" as const)
            : ("system_inference" as const),
        explicitness: candidate.explicitness,
        confidence: candidate.confidence,
        privacy: "private" as const,
        freshness: candidate.freshness,
        status: "active" as const,
        extractionModel: args.extractionModel,
        extractionResponseId: args.extractionResponseId,
        updatedAt: now,
      };

      if (existing === null) {
        await ctx.db.insert("memories", {
          anonymousSessionId: sourceMessage.anonymousSessionId,
          ...memory,
          lastConfirmedAt: null,
          createdAt: now,
        });
      } else {
        await ctx.db.patch("memories", existing._id, memory);
      }
    }

    await ctx.db.patch("talkTurns", turn._id, {
      status: "completed",
      memoryStatus: args.memoryStatus,
      replyModel: args.replyModel,
      extractionModel: args.extractionModel,
      replyResponseId: args.replyResponseId,
      extractionResponseId: args.extractionResponseId,
      errorCode: args.turnErrorCode,
      updatedAt: now,
    });

    return null;
  },
});

export const list = query({
  args: {
    clientSessionKey: v.string(),
    limit: v.number(),
  },
  returns: v.array(memoryViewValidator),
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

    const memories = await ctx.db
      .query("memories")
      .withIndex("by_anonymousSessionId_and_status_and_updatedAt", (q) =>
        q.eq("anonymousSessionId", session._id).eq("status", "active"),
      )
      .order("desc")
      .take(limit);

    return memories.map(toMemoryView);
  },
});

export const confirm = mutation({
  args: {
    clientSessionKey: v.string(),
    memoryId: v.id("memories"),
  },
  returns: memoryViewValidator,
  handler: async (ctx, args) => {
    const memory = await requireOwnedMemory(
      ctx,
      args.clientSessionKey,
      args.memoryId,
    );
    if (memory.status !== "active") {
      throw new ConvexError("Only an active memory can be confirmed.");
    }
    const now = Date.now();
    await ctx.db.patch("memories", memory._id, {
      lastConfirmedAt: now,
      updatedAt: now,
    });
    return toMemoryView({
      ...memory,
      lastConfirmedAt: now,
      updatedAt: now,
    });
  },
});

export const edit = mutation({
  args: {
    clientSessionKey: v.string(),
    memoryId: v.id("memories"),
    statement: v.string(),
  },
  returns: memoryViewValidator,
  handler: async (ctx, args) => {
    const memory = await requireOwnedMemory(
      ctx,
      args.clientSessionKey,
      args.memoryId,
    );
    if (memory.status !== "active") {
      throw new ConvexError("Only an active memory can be corrected.");
    }
    const normalized = normalizeMemoryStatement(args.statement);
    if (normalized === null) {
      throw new ConvexError("Memory must be between 8 and 240 characters.");
    }
    const duplicate = await ctx.db
      .query("memories")
      .withIndex("by_anonymousSessionId_and_normalizedStatement", (q) =>
        q
          .eq("anonymousSessionId", memory.anonymousSessionId)
          .eq("normalizedStatement", normalized.normalizedStatement),
      )
      .unique();
    if (duplicate !== null && duplicate._id !== memory._id) {
      throw new ConvexError("Might already remembers that.");
    }

    const now = Date.now();
    const patch = {
      statement: normalized.statement,
      normalizedStatement: normalized.normalizedStatement,
      source: "user_edit" as const,
      explicitness: "explicit" as const,
      confidence: 1,
      status: "active" as const,
      lastConfirmedAt: now,
      updatedAt: now,
    };
    await ctx.db.patch("memories", memory._id, patch);
    return toMemoryView({ ...memory, ...patch });
  },
});

export const forget = mutation({
  args: {
    clientSessionKey: v.string(),
    memoryId: v.id("memories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const memory = await requireOwnedMemory(
      ctx,
      args.clientSessionKey,
      args.memoryId,
    );
    await ctx.db.patch("memories", memory._id, {
      status: "forgotten",
      updatedAt: Date.now(),
    });
    return null;
  },
});
