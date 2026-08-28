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
    sequence: v.number(),
    createdAt: v.number(),
  }).index("by_conversationId_and_sequence", [
    "conversationId",
    "sequence",
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
