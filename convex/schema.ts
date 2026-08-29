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
    .index("by_anonymousSessionId_and_updatedAt", [
      "anonymousSessionId",
      "updatedAt",
    ]),
});
