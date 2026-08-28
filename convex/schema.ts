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
});
