import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  env,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

const DEFAULT_TEXT_MODEL = "gpt-5.6-luna";
const MIN_SESSION_KEY_LENGTH = 32;
const MAX_SESSION_KEY_LENGTH = 256;
const MIN_CLIENT_REQUEST_ID_LENGTH = 8;
const MAX_CLIENT_REQUEST_ID_LENGTH = 128;
const MAX_CANDIDATE_MEMORIES = 12;
const MAX_RELEVANT_MEMORIES = 4;
const MAX_FAILED_MATCHES_PER_SIGNAL = 3;

const runStatusValidator = v.union(
  v.literal("processing"),
  v.literal("completed"),
  v.literal("failed"),
);

const runErrorValidator = v.union(
  v.null(),
  v.literal("OPENAI_CONFIGURATION_MISSING"),
  v.literal("NO_ACTIVE_MEMORIES"),
  v.literal("MATCH_JUDGE_FAILED"),
  v.literal("MATCH_COMMIT_FAILED"),
);

const recommendationValidator = v.union(
  v.literal("ignore"),
  v.literal("ask_user"),
  v.literal("surface"),
);

const riskLevelValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
);

const matchStatusValidator = v.union(
  v.literal("ignored"),
  v.literal("needs_clarification"),
  v.literal("surfaced"),
  v.literal("dismissed"),
);

const clarificationRunStatusValidator = v.union(
  v.literal("processing"),
  v.literal("completed"),
  v.literal("failed"),
);

const clarificationErrorValidator = v.union(
  v.null(),
  v.literal("OPENAI_CONFIGURATION_MISSING"),
  v.literal("RELEVANT_MEMORY_UNAVAILABLE"),
  v.literal("CLARIFICATION_CONTEXT_INVALID"),
  v.literal("CLARIFICATION_JUDGE_FAILED"),
  v.literal("CLARIFICATION_COMMIT_FAILED"),
);

const finalRecommendationValidator = v.union(
  v.literal("ignore"),
  v.literal("surface"),
);

const finalStatusValidator = v.union(
  v.literal("ignored"),
  v.literal("surfaced"),
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

const relevantMemoryViewValidator = v.object({
  id: v.id("memories"),
  statement: v.string(),
  sourceMessageId: v.id("messages"),
});

const worldSignalViewValidator = v.object({
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
});

const clarificationFinalViewValidator = v.object({
  id: v.id("matchClarifications"),
  whyThisSituationMatters: v.string(),
  whyThisPersonCameToMind: v.string(),
  recommendation: finalRecommendationValidator,
  status: finalStatusValidator,
  riskLevel: riskLevelValidator,
  matchConfidence: v.number(),
  consentState: v.literal("not_requested"),
  canContact: v.literal(false),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const clarificationViewValidator = v.object({
  runId: v.id("matchClarificationRuns"),
  matchId: v.id("matches"),
  status: clarificationRunStatusValidator,
  errorCode: clarificationErrorValidator,
  question: v.string(),
  answer: v.string(),
  privacy: v.literal("private"),
  provenance: v.object({
    judgeModel: v.string(),
    judgeResponseId: v.union(v.string(), v.null()),
  }),
  finalResult: v.union(v.null(), clarificationFinalViewValidator),
  startedAt: v.number(),
  updatedAt: v.number(),
});

const dismissalViewValidator = v.object({
  id: v.id("matchDismissals"),
  reason: v.literal("user_dismissed"),
  createdAt: v.number(),
});

const matchViewValidator = v.object({
  id: v.id("matches"),
  worldSignal: worldSignalViewValidator,
  relevantMemories: v.array(relevantMemoryViewValidator),
  whyThisSituationMatters: v.string(),
  whyThisPersonCameToMind: v.string(),
  recommendation: recommendationValidator,
  riskLevel: riskLevelValidator,
  matchConfidence: v.number(),
  clarificationQuestion: v.union(v.string(), v.null()),
  status: matchStatusValidator,
  consentState: v.literal("not_requested"),
  canContact: v.literal(false),
  canContinue: v.boolean(),
  canAnswerClarification: v.boolean(),
  canExpressInterest: v.boolean(),
  supportingMemoryAvailable: v.boolean(),
  clarification: v.union(v.null(), clarificationViewValidator),
  dismissal: v.union(v.null(), dismissalViewValidator),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const latestViewValidator = v.object({
  runId: v.id("matchRuns"),
  worldSignalId: v.id("worldSignals"),
  status: runStatusValidator,
  errorCode: runErrorValidator,
  startedAt: v.number(),
  updatedAt: v.number(),
  provenance: v.object({
    judgeModel: v.string(),
    judgeResponseId: v.union(v.string(), v.null()),
  }),
  match: v.union(v.null(), matchViewValidator),
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
    throw new ConvexError("Invalid match request id.");
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

function matchStatusForRecommendation(
  recommendation: "ignore" | "ask_user" | "surface",
): "ignored" | "needs_clarification" | "surfaced" {
  if (recommendation === "ignore") {
    return "ignored";
  }
  if (recommendation === "ask_user") {
    return "needs_clarification";
  }
  return "surfaced";
}

export const requestMatch = mutation({
  args: {
    clientSessionKey: v.string(),
    worldSignalId: v.id("worldSignals"),
    clientRequestId: v.string(),
  },
  returns: v.object({
    runId: v.id("matchRuns"),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    const clientRequestId = normalizeClientRequestId(args.clientRequestId);
    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", args.clientSessionKey),
      )
      .unique();
    if (session === null) {
      throw new ConvexError("Anonymous session has not been initialized.");
    }

    const worldSignal = await ctx.db.get("worldSignals", args.worldSignalId);
    if (
      worldSignal === null ||
      worldSignal.anonymousSessionId !== session._id
    ) {
      throw new ConvexError("World signal is unavailable.");
    }
    const worldRun = await ctx.db.get("worldSignalRuns", worldSignal.runId);
    if (
      worldRun === null ||
      worldRun.status !== "completed" ||
      worldRun.signalId !== worldSignal._id
    ) {
      throw new ConvexError("World signal is not ready for matching.");
    }

    const existing = await ctx.db
      .query("matchRuns")
      .withIndex(
        "by_anonymousSessionId_and_worldSignalId_and_clientRequestId",
        (q) =>
          q
            .eq("anonymousSessionId", session._id)
            .eq("worldSignalId", worldSignal._id)
            .eq("clientRequestId", clientRequestId),
      )
      .unique();
    if (existing !== null) {
      return { runId: existing._id, created: false };
    }

    const recentRuns = await ctx.db
      .query("matchRuns")
      .withIndex(
        "by_anonymousSessionId_and_worldSignalId_and_updatedAt",
        (q) =>
          q
            .eq("anonymousSessionId", session._id)
            .eq("worldSignalId", worldSignal._id),
      )
      .order("desc")
      .take(MAX_FAILED_MATCHES_PER_SIGNAL + 1);
    const reusable = recentRuns.find((run) => run.status !== "failed");
    if (reusable) {
      return { runId: reusable._id, created: false };
    }
    if (recentRuns.length >= MAX_FAILED_MATCHES_PER_SIGNAL) {
      throw new ConvexError(
        "Might paused matching for this signal after repeated failures.",
      );
    }

    const activeMemories = await ctx.db
      .query("memories")
      .withIndex("by_anonymousSessionId_and_status_and_updatedAt", (q) =>
        q.eq("anonymousSessionId", session._id).eq("status", "active"),
      )
      .order("desc")
      .take(MAX_CANDIDATE_MEMORIES);
    if (activeMemories.length === 0) {
      throw new ConvexError("Might needs a living memory before matching.");
    }

    const now = Date.now();
    const runId = await ctx.db.insert("matchRuns", {
      anonymousSessionId: session._id,
      worldSignalId: worldSignal._id,
      clientRequestId,
      candidateMemoryIds: activeMemories.map((memory) => memory._id),
      status: "processing",
      judgeModel: env.OPENAI_TEXT_MODEL ?? DEFAULT_TEXT_MODEL,
      judgeResponseId: null,
      matchId: null,
      errorCode: null,
      startedAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.matchJudge.judge, { runId });
    return { runId, created: true };
  },
});

export const latest = query({
  args: {
    clientSessionKey: v.string(),
  },
  returns: v.union(v.null(), latestViewValidator),
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

    const run = await ctx.db
      .query("matchRuns")
      .withIndex("by_anonymousSessionId_and_updatedAt", (q) =>
        q.eq("anonymousSessionId", session._id),
      )
      .order("desc")
      .first();
    if (run === null) {
      return null;
    }

    const storedMatch = run.matchId
      ? await ctx.db.get("matches", run.matchId)
      : null;
    const worldSignal = storedMatch
      ? await ctx.db.get("worldSignals", storedMatch.worldSignalId)
      : null;
    const memoryDocuments = storedMatch
      ? await Promise.all(
          storedMatch.relevantMemoryIds.map((memoryId) =>
            ctx.db.get("memories", memoryId),
          ),
        )
      : [];
    const clarificationRun = storedMatch
      ? await ctx.db
          .query("matchClarificationRuns")
          .withIndex(
            "by_anonymousSessionId_and_matchId_and_updatedAt",
            (q) =>
              q
                .eq("anonymousSessionId", session._id)
                .eq("matchId", storedMatch._id),
          )
          .order("desc")
          .first()
      : null;
    const clarificationResult = clarificationRun?.resultId
      ? await ctx.db.get("matchClarifications", clarificationRun.resultId)
      : null;
    const dismissal = storedMatch
      ? await ctx.db
          .query("matchDismissals")
          .withIndex("by_matchId", (q) => q.eq("matchId", storedMatch._id))
          .unique()
      : null;
    const relevantMemories = memoryDocuments.filter(
      (memory): memory is Doc<"memories"> =>
        memory !== null &&
        memory.anonymousSessionId === session._id &&
        memory.status === "active",
    );
    const supportingMemoryAvailable =
      storedMatch !== null &&
      storedMatch.anonymousSessionId === session._id &&
      worldSignal !== null &&
      worldSignal.anonymousSessionId === session._id &&
      relevantMemories.length === storedMatch.relevantMemoryIds.length;
    const canRevealMatch =
      supportingMemoryAvailable ||
      (storedMatch !== null &&
        storedMatch.anonymousSessionId === session._id &&
        storedMatch.status === "dismissed" &&
        worldSignal !== null &&
        worldSignal.anonymousSessionId === session._id &&
        dismissal !== null &&
        dismissal.anonymousSessionId === session._id);

    return {
      runId: run._id,
      worldSignalId: run.worldSignalId,
      status: run.status,
      errorCode: run.errorCode,
      startedAt: run.startedAt,
      updatedAt: run.updatedAt,
      provenance: {
        judgeModel: run.judgeModel,
        judgeResponseId: run.judgeResponseId,
      },
      match: canRevealMatch
        ? {
            id: storedMatch._id,
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
            relevantMemories: supportingMemoryAvailable
              ? relevantMemories.map((memory) => ({
                  id: memory._id,
                  statement: memory.statement,
                  sourceMessageId: memory.sourceMessageId,
                }))
              : [],
            whyThisSituationMatters: storedMatch.whyThisSituationMatters,
            whyThisPersonCameToMind: supportingMemoryAvailable
              ? storedMatch.whyThisPersonCameToMind
              : "A supporting private memory was forgotten, so Might will not continue this match.",
            recommendation: storedMatch.recommendation,
            riskLevel: storedMatch.riskLevel,
            matchConfidence: storedMatch.matchConfidence,
            clarificationQuestion: storedMatch.clarificationQuestion,
            status: storedMatch.status,
            consentState: "not_requested" as const,
            canContact: false as const,
            canContinue:
              storedMatch.status === "needs_clarification" ||
              storedMatch.status === "surfaced",
            canAnswerClarification:
              storedMatch.status === "needs_clarification" &&
              clarificationRun === null,
            canExpressInterest: storedMatch.status === "surfaced",
            supportingMemoryAvailable,
            clarification:
              clarificationRun === null
                ? null
                : {
                    runId: clarificationRun._id,
                    matchId: clarificationRun.matchId,
                    status: clarificationRun.status,
                    errorCode: clarificationRun.errorCode,
                    question: clarificationRun.question,
                    answer: clarificationRun.answer,
                    privacy: "private" as const,
                    provenance: {
                      judgeModel: clarificationRun.judgeModel,
                      judgeResponseId: clarificationRun.judgeResponseId,
                    },
                    finalResult:
                      clarificationResult !== null &&
                      clarificationResult.anonymousSessionId === session._id &&
                      clarificationResult.matchId === storedMatch._id &&
                      clarificationResult.runId === clarificationRun._id
                        ? {
                            id: clarificationResult._id,
                            whyThisSituationMatters:
                              clarificationResult.whyThisSituationMatters,
                            whyThisPersonCameToMind:
                              clarificationResult.whyThisPersonCameToMind,
                            recommendation:
                              clarificationResult.recommendation,
                            status: clarificationResult.status,
                            riskLevel: clarificationResult.riskLevel,
                            matchConfidence:
                              clarificationResult.matchConfidence,
                            consentState: "not_requested" as const,
                            canContact: false as const,
                            createdAt: clarificationResult.createdAt,
                            updatedAt: clarificationResult.updatedAt,
                          }
                        : null,
                    startedAt: clarificationRun.startedAt,
                    updatedAt: clarificationRun.updatedAt,
                  },
            dismissal:
              dismissal !== null &&
              dismissal.anonymousSessionId === session._id
                ? {
                    id: dismissal._id,
                    reason: "user_dismissed" as const,
                    createdAt: dismissal.createdAt,
                  }
                : null,
            createdAt: storedMatch.createdAt,
            updatedAt: storedMatch.updatedAt,
          }
        : null,
    };
  },
});

export const dismiss = mutation({
  args: {
    clientSessionKey: v.string(),
    matchId: v.id("matches"),
  },
  returns: v.object({
    dismissalId: v.id("matchDismissals"),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
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

    const existing = await ctx.db
      .query("matchDismissals")
      .withIndex("by_matchId", (q) => q.eq("matchId", match._id))
      .unique();
    if (existing !== null) {
      return { dismissalId: existing._id, created: false };
    }
    if (match.status === "dismissed") {
      throw new ConvexError("Dismissed match audit is unavailable.");
    }

    const now = Date.now();
    const dismissalId = await ctx.db.insert("matchDismissals", {
      anonymousSessionId: session._id,
      matchId: match._id,
      reason: "user_dismissed",
      createdAt: now,
    });
    await ctx.db.patch("matches", match._id, {
      status: "dismissed",
      updatedAt: now,
    });
    return { dismissalId, created: true };
  },
});

export const getRunContext = internalQuery({
  args: {
    runId: v.id("matchRuns"),
  },
  returns: v.union(
    v.null(),
    v.object({
      runId: v.id("matchRuns"),
      status: runStatusValidator,
      judgeModel: v.string(),
      worldSignal: worldSignalViewValidator,
      memories: v.array(
        v.object({
          id: v.id("memories"),
          statement: v.string(),
          semanticType: semanticTypeValidator,
          explicitness: memoryExplicitnessValidator,
          confidence: v.number(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const run = await ctx.db.get("matchRuns", args.runId);
    if (run === null) {
      return null;
    }
    const worldSignal = await ctx.db.get("worldSignals", run.worldSignalId);
    if (
      worldSignal === null ||
      worldSignal.anonymousSessionId !== run.anonymousSessionId
    ) {
      return null;
    }
    const memoryDocuments = await Promise.all(
      run.candidateMemoryIds.slice(0, MAX_CANDIDATE_MEMORIES).map((memoryId) =>
        ctx.db.get("memories", memoryId),
      ),
    );
    const memories = memoryDocuments.filter(
      (memory): memory is Doc<"memories"> =>
        memory !== null &&
        memory.anonymousSessionId === run.anonymousSessionId &&
        memory.status === "active",
    );
    return {
      runId: run._id,
      status: run.status,
      judgeModel: run.judgeModel,
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
    };
  },
});

export const commitJudgedMatch = internalMutation({
  args: {
    runId: v.id("matchRuns"),
    judgeModel: v.string(),
    judgeResponseId: v.union(v.string(), v.null()),
    relevantMemoryIds: v.array(v.id("memories")),
    whyThisSituationMatters: v.string(),
    whyThisPersonCameToMind: v.string(),
    recommendation: recommendationValidator,
    riskLevel: riskLevelValidator,
    matchConfidence: v.number(),
    clarificationQuestion: v.union(v.string(), v.null()),
  },
  returns: v.id("matches"),
  handler: async (ctx, args) => {
    const run = await ctx.db.get("matchRuns", args.runId);
    if (run === null) {
      throw new ConvexError("Match run is unavailable.");
    }
    if (run.status === "completed" && run.matchId !== null) {
      return run.matchId;
    }
    if (run.status !== "processing") {
      throw new ConvexError("Match run cannot accept this result.");
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
    const relevantMemoryIds = [...new Set(args.relevantMemoryIds)];
    if (
      relevantMemoryIds.length !== args.relevantMemoryIds.length ||
      relevantMemoryIds.length > MAX_RELEVANT_MEMORIES ||
      (args.recommendation !== "ignore" && relevantMemoryIds.length === 0)
    ) {
      throw new ConvexError("Invalid relevant memories.");
    }
    const candidateIds = new Set<Id<"memories">>(run.candidateMemoryIds);
    for (const memoryId of relevantMemoryIds) {
      const memory = await ctx.db.get("memories", memoryId);
      if (
        !candidateIds.has(memoryId) ||
        memory === null ||
        memory.anonymousSessionId !== run.anonymousSessionId ||
        memory.status !== "active"
      ) {
        throw new ConvexError("Relevant memory is unavailable.");
      }
    }

    const clarificationQuestion = args.clarificationQuestion;
    if (args.recommendation === "ask_user") {
      if (clarificationQuestion === null) {
        throw new ConvexError("A clarification question is required.");
      }
      assertBoundedText(clarificationQuestion, "clarification question", 500);
    } else if (clarificationQuestion !== null) {
      throw new ConvexError(
        "Only an ask-user recommendation may include clarification.",
      );
    }

    const now = Date.now();
    const matchId = await ctx.db.insert("matches", {
      anonymousSessionId: run.anonymousSessionId,
      runId: run._id,
      worldSignalId: run.worldSignalId,
      relevantMemoryIds,
      whyThisSituationMatters: args.whyThisSituationMatters,
      whyThisPersonCameToMind: args.whyThisPersonCameToMind,
      recommendation: args.recommendation,
      riskLevel: args.riskLevel,
      matchConfidence: args.matchConfidence,
      clarificationQuestion,
      status: matchStatusForRecommendation(args.recommendation),
      consentState: "not_requested",
      judgeModel: args.judgeModel,
      judgeResponseId: args.judgeResponseId,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch("matchRuns", run._id, {
      status: "completed",
      judgeModel: args.judgeModel,
      judgeResponseId: args.judgeResponseId,
      matchId,
      errorCode: null,
      updatedAt: now,
    });
    return matchId;
  },
});

export const failRun = internalMutation({
  args: {
    runId: v.id("matchRuns"),
    errorCode: v.union(
      v.literal("OPENAI_CONFIGURATION_MISSING"),
      v.literal("NO_ACTIVE_MEMORIES"),
      v.literal("MATCH_JUDGE_FAILED"),
      v.literal("MATCH_COMMIT_FAILED"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get("matchRuns", args.runId);
    if (run === null || run.status !== "processing") {
      return null;
    }
    await ctx.db.patch("matchRuns", run._id, {
      status: "failed",
      errorCode: args.errorCode,
      updatedAt: Date.now(),
    });
    return null;
  },
});
