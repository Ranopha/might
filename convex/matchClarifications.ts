import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  env,
  internalMutation,
  internalQuery,
  mutation,
  type QueryCtx,
} from "./_generated/server";

const DEFAULT_TEXT_MODEL = "gpt-5.6-luna";
const MIN_SESSION_KEY_LENGTH = 32;
const MAX_SESSION_KEY_LENGTH = 256;
const MIN_CLIENT_REQUEST_ID_LENGTH = 8;
const MAX_CLIENT_REQUEST_ID_LENGTH = 128;
const MAX_ANSWER_LENGTH = 1_000;
const MAX_RELEVANT_MEMORIES = 4;

const runStatusValidator = v.union(
  v.literal("processing"),
  v.literal("completed"),
  v.literal("failed"),
);

const runErrorValidator = v.union(
  v.literal("OPENAI_CONFIGURATION_MISSING"),
  v.literal("RELEVANT_MEMORY_UNAVAILABLE"),
  v.literal("CLARIFICATION_CONTEXT_INVALID"),
  v.literal("CLARIFICATION_JUDGE_FAILED"),
  v.literal("CLARIFICATION_COMMIT_FAILED"),
);

const recommendationValidator = v.union(
  v.literal("ignore"),
  v.literal("surface"),
);

const riskLevelValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
);

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

const memoryExplicitnessValidator = v.union(
  v.literal("explicit"),
  v.literal("inferred"),
);

const evidenceValidator = v.object({
  url: v.string(),
  excerpt: v.string(),
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

function normalizeClientRequestId(clientRequestId: string): string {
  const normalized = clientRequestId.trim();
  if (
    normalized.length < MIN_CLIENT_REQUEST_ID_LENGTH ||
    normalized.length > MAX_CLIENT_REQUEST_ID_LENGTH ||
    normalized !== clientRequestId ||
    /\s/.test(normalized)
  ) {
    throw new ConvexError("Invalid clarification request id.");
  }
  return normalized;
}

function normalizeAnswer(answer: string): string {
  const normalized = answer.trim().replace(/\s+/g, " ");
  if (normalized.length === 0 || normalized.length > MAX_ANSWER_LENGTH) {
    throw new ConvexError("Clarification answer must be between 1 and 1000 characters.");
  }
  return normalized;
}

function assertBoundedText(
  value: string,
  label: string,
  maxLength: number,
): void {
  if (value.trim() !== value || value.length === 0 || value.length > maxLength) {
    throw new ConvexError(`Invalid ${label}.`);
  }
}

async function activeRelevantMemories(
  ctx: Pick<QueryCtx, "db">,
  match: Doc<"matches">,
): Promise<Doc<"memories">[]> {
  const documents = await Promise.all(
    match.relevantMemoryIds.slice(0, MAX_RELEVANT_MEMORIES).map((memoryId) =>
      ctx.db.get("memories", memoryId),
    ),
  );
  return documents.filter(
    (memory): memory is Doc<"memories"> =>
      memory !== null &&
      memory.anonymousSessionId === match.anonymousSessionId &&
      memory.status === "active",
  );
}

export const submitAnswer = mutation({
  args: {
    clientSessionKey: v.string(),
    matchId: v.id("matches"),
    clientRequestId: v.string(),
    answer: v.string(),
  },
  returns: v.object({
    runId: v.id("matchClarificationRuns"),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    const clientRequestId = normalizeClientRequestId(args.clientRequestId);
    const answer = normalizeAnswer(args.answer);
    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", args.clientSessionKey),
      )
      .unique();
    const match = await ctx.db.get("matches", args.matchId);
    if (
      session === null ||
      match === null ||
      match.anonymousSessionId !== session._id
    ) {
      throw new ConvexError("Match is unavailable.");
    }
    if (match.status === "dismissed") {
      throw new ConvexError("This match is not awaiting clarification.");
    }

    const existing = await ctx.db
      .query("matchClarificationRuns")
      .withIndex(
        "by_anonymousSessionId_and_matchId_and_clientRequestId",
        (q) =>
          q
            .eq("anonymousSessionId", session._id)
            .eq("matchId", match._id)
            .eq("clientRequestId", clientRequestId),
      )
      .unique();
    if (existing !== null) {
      if (existing.answer !== answer) {
        throw new ConvexError(
          "Clarification request id is already bound to another answer.",
        );
      }
      return { runId: existing._id, created: false };
    }

    const reusable = await ctx.db
      .query("matchClarificationRuns")
      .withIndex("by_anonymousSessionId_and_matchId_and_updatedAt", (q) =>
        q.eq("anonymousSessionId", session._id).eq("matchId", match._id),
      )
      .order("desc")
      .first();
    if (reusable !== null) {
      if (reusable.answer !== answer) {
        throw new ConvexError("This clarification has already been answered.");
      }
      return { runId: reusable._id, created: false };
    }

    if (
      match.status !== "needs_clarification" ||
      match.recommendation !== "ask_user" ||
      match.clarificationQuestion === null ||
      match.consentState !== "not_requested"
    ) {
      throw new ConvexError("This match is not awaiting clarification.");
    }

    const memories = await activeRelevantMemories(ctx, match);
    if (memories.length !== match.relevantMemoryIds.length) {
      throw new ConvexError("A relevant memory is unavailable.");
    }

    const now = Date.now();
    const runId = await ctx.db.insert("matchClarificationRuns", {
      anonymousSessionId: session._id,
      matchId: match._id,
      clientRequestId,
      question: match.clarificationQuestion,
      answer,
      privacy: "private",
      status: "processing",
      judgeModel: env.OPENAI_TEXT_MODEL ?? DEFAULT_TEXT_MODEL,
      judgeResponseId: null,
      resultId: null,
      errorCode: null,
      startedAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(
      0,
      internal.matchClarificationJudge.rejudge,
      { runId },
    );
    return { runId, created: true };
  },
});

export const getRunContext = internalQuery({
  args: {
    runId: v.id("matchClarificationRuns"),
  },
  returns: v.union(
    v.null(),
    v.object({
      runId: v.id("matchClarificationRuns"),
      status: runStatusValidator,
      judgeModel: v.string(),
      memoriesAvailable: v.boolean(),
      worldSignal: v.object({
        id: v.id("worldSignals"),
        sourceUrl: v.string(),
        sourceTitle: v.string(),
        sourceDomain: v.string(),
        situation: v.string(),
        painOrFriction: v.string(),
        desiredOutcome: v.string(),
        needHypothesis: v.string(),
        location: v.string(),
        timeContext: v.string(),
        confidence: v.number(),
        evidence: v.array(evidenceValidator),
      }),
      memories: v.array(
        v.object({
          id: v.id("memories"),
          statement: v.string(),
          semanticType: semanticTypeValidator,
          explicitness: memoryExplicitnessValidator,
          confidence: v.number(),
        }),
      ),
      question: v.string(),
      answer: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const run = await ctx.db.get("matchClarificationRuns", args.runId);
    if (run === null) {
      return null;
    }
    const match = await ctx.db.get("matches", run.matchId);
    if (
      match === null ||
      match.anonymousSessionId !== run.anonymousSessionId ||
      match.status !== "needs_clarification" ||
      match.clarificationQuestion !== run.question
    ) {
      return null;
    }
    const worldSignal = await ctx.db.get("worldSignals", match.worldSignalId);
    if (
      worldSignal === null ||
      worldSignal.anonymousSessionId !== run.anonymousSessionId
    ) {
      return null;
    }
    const memories = await activeRelevantMemories(ctx, match);
    return {
      runId: run._id,
      status: run.status,
      judgeModel: run.judgeModel,
      memoriesAvailable: memories.length === match.relevantMemoryIds.length,
      worldSignal: {
        id: worldSignal._id,
        sourceUrl: worldSignal.sourceUrl,
        sourceTitle: worldSignal.sourceTitle,
        sourceDomain: worldSignal.sourceDomain,
        situation: worldSignal.situation,
        painOrFriction: worldSignal.painOrFriction,
        desiredOutcome: worldSignal.desiredOutcome,
        needHypothesis: worldSignal.needHypothesis,
        location: worldSignal.location,
        timeContext: worldSignal.timeContext,
        confidence: worldSignal.confidence,
        evidence: worldSignal.evidence,
      },
      memories: memories.map((memory) => ({
        id: memory._id,
        statement: memory.statement,
        semanticType: memory.semanticType,
        explicitness: memory.explicitness,
        confidence: memory.confidence,
      })),
      question: run.question,
      answer: run.answer,
    };
  },
});

export const commitFinalResult = internalMutation({
  args: {
    runId: v.id("matchClarificationRuns"),
    judgeModel: v.string(),
    judgeResponseId: v.union(v.string(), v.null()),
    whyThisSituationMatters: v.string(),
    whyThisPersonCameToMind: v.string(),
    recommendation: recommendationValidator,
    riskLevel: riskLevelValidator,
    matchConfidence: v.number(),
  },
  returns: v.id("matchClarifications"),
  handler: async (ctx, args) => {
    const run = await ctx.db.get("matchClarificationRuns", args.runId);
    if (run === null) {
      throw new ConvexError("Clarification run is unavailable.");
    }
    if (run.status === "completed" && run.resultId !== null) {
      return run.resultId;
    }
    if (run.status !== "processing") {
      throw new ConvexError("Clarification run cannot accept this result.");
    }
    const match = await ctx.db.get("matches", run.matchId);
    if (
      match === null ||
      match.anonymousSessionId !== run.anonymousSessionId ||
      match.status !== "needs_clarification" ||
      match.clarificationQuestion !== run.question
    ) {
      throw new ConvexError("Clarification context is no longer current.");
    }
    const memories = await activeRelevantMemories(ctx, match);
    if (memories.length !== match.relevantMemoryIds.length) {
      throw new ConvexError("A relevant memory is unavailable.");
    }

    assertBoundedText(args.judgeModel, "judge model", 128);
    assertBoundedText(
      args.whyThisSituationMatters,
      "situation reasoning",
      1_200,
    );
    assertBoundedText(
      args.whyThisPersonCameToMind,
      "person reasoning",
      1_200,
    );
    if (
      !Number.isFinite(args.matchConfidence) ||
      args.matchConfidence < 0 ||
      args.matchConfidence > 1
    ) {
      throw new ConvexError("Invalid match confidence.");
    }

    const now = Date.now();
    const status =
      args.recommendation === "surface"
        ? ("surfaced" as const)
        : ("ignored" as const);
    const resultId = await ctx.db.insert("matchClarifications", {
      anonymousSessionId: run.anonymousSessionId,
      runId: run._id,
      matchId: match._id,
      worldSignalId: match.worldSignalId,
      relevantMemoryIds: match.relevantMemoryIds,
      whyThisSituationMatters: args.whyThisSituationMatters,
      whyThisPersonCameToMind: args.whyThisPersonCameToMind,
      recommendation: args.recommendation,
      riskLevel: args.riskLevel,
      matchConfidence: args.matchConfidence,
      status,
      consentState: "not_requested",
      judgeModel: args.judgeModel,
      judgeResponseId: args.judgeResponseId,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch("matchClarificationRuns", run._id, {
      status: "completed",
      judgeModel: args.judgeModel,
      judgeResponseId: args.judgeResponseId,
      resultId,
      errorCode: null,
      updatedAt: now,
    });
    await ctx.db.patch("matches", match._id, {
      status,
      updatedAt: now,
    });
    return resultId;
  },
});

export const failRun = internalMutation({
  args: {
    runId: v.id("matchClarificationRuns"),
    errorCode: runErrorValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get("matchClarificationRuns", args.runId);
    if (run === null || run.status !== "processing") {
      return null;
    }
    await ctx.db.patch("matchClarificationRuns", run._id, {
      status: "failed",
      errorCode: args.errorCode,
      updatedAt: Date.now(),
    });
    return null;
  },
});
