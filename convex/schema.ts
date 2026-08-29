import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  anonymousSessions: defineTable({
    clientSessionKey: v.string(),
    createdAt: v.number(),
    lastActiveAt: v.number(),
  }).index("by_clientSessionKey", ["clientSessionKey"]),

  conversations: defineTable({
    anonymousSessionId: v.id("anonymousSessions"),
    kind: v.literal("primary"),
    agentThreadId: v.optional(v.string()),
    nextMessageSequence: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_anonymousSessionId_and_kind", [
    "anonymousSessionId",
    "kind",
  ]),

  messages: defineTable({
    anonymousSessionId: v.id("anonymousSessions"),
    conversationId: v.id("conversations"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
    ),
    content: v.string(),
    source: v.union(
      v.literal("user_input"),
      v.literal("assistant_generated"),
      v.literal("system"),
    ),
    privacy: v.union(
      v.literal("private"),
      v.literal("shareable_with_consent"),
    ),
    clientMessageId: v.optional(v.string()),
    sequence: v.number(),
    createdAt: v.number(),
    model: v.optional(v.string()),
    providerResponseId: v.optional(v.union(v.string(), v.null())),
    sourceMessageId: v.optional(v.union(v.id("messages"), v.null())),
  })
    .index("by_conversationId_and_sequence", [
      "conversationId",
      "sequence",
    ])
    .index("by_anonymousSessionId_and_clientMessageId", [
      "anonymousSessionId",
      "clientMessageId",
    ]),

  talkTurns: defineTable({
    anonymousSessionId: v.id("anonymousSessions"),
    conversationId: v.id("conversations"),
    sourceMessageId: v.id("messages"),
    clientMessageId: v.string(),
    agentThreadId: v.string(),
    promptMessageId: v.string(),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    memoryStatus: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    replyModel: v.string(),
    extractionModel: v.string(),
    replyResponseId: v.union(v.string(), v.null()),
    extractionResponseId: v.union(v.string(), v.null()),
    errorCode: v.union(
      v.null(),
      v.literal("OPENAI_CONFIGURATION_MISSING"),
      v.literal("REPLY_GENERATION_FAILED"),
      v.literal("MEMORY_EXTRACTION_FAILED"),
      v.literal("TURN_COMMIT_FAILED"),
    ),
    startedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sourceMessageId", ["sourceMessageId"])
    .index("by_anonymousSessionId_and_status_and_updatedAt", [
      "anonymousSessionId",
      "status",
      "updatedAt",
    ])
    .index("by_anonymousSessionId_and_updatedAt", [
      "anonymousSessionId",
      "updatedAt",
    ]),

  memories: defineTable({
    anonymousSessionId: v.id("anonymousSessions"),
    statement: v.string(),
    normalizedStatement: v.string(),
    semanticType: v.union(
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
    ),
    sourceMessageId: v.id("messages"),
    source: v.union(
      v.literal("conversation"),
      v.literal("user_edit"),
      v.literal("system_inference"),
    ),
    explicitness: v.union(v.literal("explicit"), v.literal("inferred")),
    confidence: v.number(),
    privacy: v.union(
      v.literal("private"),
      v.literal("shareable_with_consent"),
    ),
    freshness: v.union(
      v.literal("long_term"),
      v.literal("temporary"),
      v.literal("unknown"),
    ),
    status: v.union(v.literal("active"), v.literal("forgotten")),
    extractionModel: v.string(),
    extractionResponseId: v.union(v.string(), v.null()),
    lastConfirmedAt: v.union(v.number(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_anonymousSessionId_and_status_and_updatedAt", [
      "anonymousSessionId",
      "status",
      "updatedAt",
    ])
    .index("by_anonymousSessionId_and_normalizedStatement", [
      "anonymousSessionId",
      "normalizedStatement",
    ]),

  worldSignalRuns: defineTable({
    anonymousSessionId: v.id("anonymousSessions"),
    clientRequestId: v.string(),
    sourceUrl: v.string(),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    provider: v.literal("firecrawl"),
    sourceMode: v.union(
      v.null(),
      v.literal("live"),
      v.literal("cached"),
      v.literal("unknown"),
    ),
    providerRequestId: v.union(v.string(), v.null()),
    interpreterModel: v.string(),
    interpreterResponseId: v.union(v.string(), v.null()),
    signalId: v.union(v.id("worldSignals"), v.null()),
    errorCode: v.union(
      v.null(),
      v.literal("FIRECRAWL_SCRAPE_FAILED"),
      v.literal("SOURCE_RESPONSE_INVALID"),
      v.literal("OPENAI_CONFIGURATION_MISSING"),
      v.literal("WORLD_INTERPRETATION_FAILED"),
      v.literal("WORLD_SIGNAL_COMMIT_FAILED"),
    ),
    startedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_anonymousSessionId_and_clientRequestId", [
      "anonymousSessionId",
      "clientRequestId",
    ])
    .index("by_anonymousSessionId_and_updatedAt", [
      "anonymousSessionId",
      "updatedAt",
    ]),

  worldSignals: defineTable({
    anonymousSessionId: v.id("anonymousSessions"),
    runId: v.id("worldSignalRuns"),
    sourceUrl: v.string(),
    sourceTitle: v.string(),
    sourceDomain: v.string(),
    rawExcerpt: v.string(),
    situation: v.string(),
    painOrFriction: v.string(),
    desiredOutcome: v.string(),
    needHypothesis: v.string(),
    location: v.string(),
    timeContext: v.string(),
    explicitness: v.union(
      v.literal("explicit_need"),
      v.literal("inferred_need"),
    ),
    confidence: v.number(),
    evidence: v.array(
      v.object({
        url: v.string(),
        excerpt: v.string(),
      }),
    ),
    provider: v.literal("firecrawl"),
    sourceMode: v.union(
      v.literal("live"),
      v.literal("cached"),
      v.literal("unknown"),
    ),
    providerRequestId: v.union(v.string(), v.null()),
    interpreterModel: v.string(),
    interpreterResponseId: v.union(v.string(), v.null()),
    createdAt: v.number(),
  })
    .index("by_runId", ["runId"])
    .index("by_anonymousSessionId_and_createdAt", [
      "anonymousSessionId",
      "createdAt",
    ]),

  matchRuns: defineTable({
    anonymousSessionId: v.id("anonymousSessions"),
    worldSignalId: v.id("worldSignals"),
    clientRequestId: v.string(),
    candidateMemoryIds: v.array(v.id("memories")),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    judgeModel: v.string(),
    judgeResponseId: v.union(v.string(), v.null()),
    matchId: v.union(v.id("matches"), v.null()),
    errorCode: v.union(
      v.null(),
      v.literal("OPENAI_CONFIGURATION_MISSING"),
      v.literal("NO_ACTIVE_MEMORIES"),
      v.literal("MATCH_JUDGE_FAILED"),
      v.literal("MATCH_COMMIT_FAILED"),
    ),
    startedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_anonymousSessionId_and_worldSignalId_and_clientRequestId", [
      "anonymousSessionId",
      "worldSignalId",
      "clientRequestId",
    ])
    .index("by_anonymousSessionId_and_worldSignalId_and_updatedAt", [
      "anonymousSessionId",
      "worldSignalId",
      "updatedAt",
    ])
    .index("by_anonymousSessionId_and_updatedAt", [
      "anonymousSessionId",
      "updatedAt",
    ]),

  matches: defineTable({
    anonymousSessionId: v.id("anonymousSessions"),
    runId: v.id("matchRuns"),
    worldSignalId: v.id("worldSignals"),
    relevantMemoryIds: v.array(v.id("memories")),
    whyThisSituationMatters: v.string(),
    whyThisPersonCameToMind: v.string(),
    recommendation: v.union(
      v.literal("ignore"),
      v.literal("ask_user"),
      v.literal("surface"),
    ),
    riskLevel: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
    matchConfidence: v.number(),
    clarificationQuestion: v.union(v.string(), v.null()),
    status: v.union(
      v.literal("ignored"),
      v.literal("needs_clarification"),
      v.literal("surfaced"),
      v.literal("dismissed"),
    ),
    consentState: v.literal("not_requested"),
    judgeModel: v.string(),
    judgeResponseId: v.union(v.string(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_runId", ["runId"])
    .index("by_anonymousSessionId_and_createdAt", [
      "anonymousSessionId",
      "createdAt",
    ]),

  matchClarificationRuns: defineTable({
    anonymousSessionId: v.id("anonymousSessions"),
    matchId: v.id("matches"),
    clientRequestId: v.string(),
    question: v.string(),
    answer: v.string(),
    privacy: v.literal("private"),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    judgeModel: v.string(),
    judgeResponseId: v.union(v.string(), v.null()),
    resultId: v.union(v.id("matchClarifications"), v.null()),
    errorCode: v.union(
      v.null(),
      v.literal("OPENAI_CONFIGURATION_MISSING"),
      v.literal("RELEVANT_MEMORY_UNAVAILABLE"),
      v.literal("CLARIFICATION_CONTEXT_INVALID"),
      v.literal("CLARIFICATION_JUDGE_FAILED"),
      v.literal("CLARIFICATION_COMMIT_FAILED"),
    ),
    startedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_anonymousSessionId_and_matchId_and_clientRequestId", [
      "anonymousSessionId",
      "matchId",
      "clientRequestId",
    ])
    .index("by_anonymousSessionId_and_matchId_and_updatedAt", [
      "anonymousSessionId",
      "matchId",
      "updatedAt",
    ]),

  matchClarifications: defineTable({
    anonymousSessionId: v.id("anonymousSessions"),
    runId: v.id("matchClarificationRuns"),
    matchId: v.id("matches"),
    worldSignalId: v.id("worldSignals"),
    relevantMemoryIds: v.array(v.id("memories")),
    whyThisSituationMatters: v.string(),
    whyThisPersonCameToMind: v.string(),
    recommendation: v.union(v.literal("ignore"), v.literal("surface")),
    riskLevel: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
    matchConfidence: v.number(),
    status: v.union(v.literal("ignored"), v.literal("surfaced")),
    consentState: v.literal("not_requested"),
    judgeModel: v.string(),
    judgeResponseId: v.union(v.string(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_runId", ["runId"])
    .index("by_matchId_and_createdAt", ["matchId", "createdAt"]),

  matchDismissals: defineTable({
    anonymousSessionId: v.id("anonymousSessions"),
    matchId: v.id("matches"),
    reason: v.literal("user_dismissed"),
    createdAt: v.number(),
  }).index("by_matchId", ["matchId"]),

  companionManifestations: defineTable({
    anonymousSessionId: v.id("anonymousSessions"),
    clientRequestId: v.string(),
    status: v.union(
      v.literal("generating_brief"),
      v.literal("generating_image"),
      v.literal("ready"),
      v.literal("failed"),
    ),
    description: v.string(),
    artBrief: v.union(v.string(), v.null()),
    adaptationNote: v.union(v.string(), v.null()),
    storageId: v.union(v.id("_storage"), v.null()),
    textModel: v.string(),
    imageModel: v.string(),
    textRequestId: v.union(v.string(), v.null()),
    imageRequestId: v.union(v.string(), v.null()),
    errorCode: v.union(
      v.null(),
      v.literal("OPENAI_CONFIGURATION_MISSING"),
      v.literal("PROVIDER_ACTION_FAILED"),
      v.literal("ART_BRIEF_GENERATION_FAILED"),
      v.literal("IMAGE_GENERATION_FAILED"),
      v.literal("IMAGE_RESPONSE_INVALID"),
      v.literal("STORAGE_WRITE_FAILED"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_anonymousSessionId_and_clientRequestId", [
      "anonymousSessionId",
      "clientRequestId",
    ])
    .index("by_anonymousSessionId_and_status_and_updatedAt", [
      "anonymousSessionId",
      "status",
      "updatedAt",
    ])
    .index("by_anonymousSessionId_and_updatedAt", [
      "anonymousSessionId",
      "updatedAt",
    ]),
});
