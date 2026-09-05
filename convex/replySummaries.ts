import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { env, internalMutation, internalQuery, mutation, type MutationCtx } from "./_generated/server";
import { abuseProtection } from "./abuseProtection";
import { selectOpenAiCredential } from "./openAiCredentialPolicy";

export const summaryViewValidator = v.object({
  id: v.id("replySummaries"),
  status: v.union(v.literal("processing"), v.literal("completed"), v.literal("failed")),
  summary: v.union(v.string(), v.null()), nextStep: v.union(v.string(), v.null()),
  model: v.string(), responseId: v.union(v.string(), v.null()),
  source: v.literal("reply_preview"),
});

export async function scheduleReplySummary(ctx: MutationCtx, inboundEventId: Id<"mailInboundEvents">) {
  const event = await ctx.db.get("mailInboundEvents", inboundEventId);
  if (event === null) return;
  const existing = await ctx.db.query("replySummaries").withIndex("by_inboundEventId", q => q.eq("inboundEventId", inboundEventId)).unique();
  if (existing !== null) return;
  const budget = await abuseProtection.limit(ctx, "replySummaryDaily");
  const now = Date.now();
  const summaryId = await ctx.db.insert("replySummaries", {
    anonymousSessionId: event.anonymousSessionId, inboundEventId, source: "reply_preview",
    status: budget.ok ? "processing" : "failed", model: env.OPENAI_TEXT_MODEL ?? "gpt-5.6-luna",
    responseId: null, summary: null, nextStep: null,
    errorCode: budget.ok ? null : "SUMMARY_BUDGET_REACHED", attempts: 1,
    // A background webhook must never spend a user's stored key after sign-out.
    openAiCredentialSource: "hackathon_demo", createdAt: now, updatedAt: now,
  });
  if (budget.ok) await ctx.scheduler.runAfter(0, internal.replySummaryOpenai.summarize, { summaryId, attempt: 1 });
}

export const retry = mutation({
  args: { clientSessionKey: v.string(), summaryId: v.id("replySummaries") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.clientSessionKey.length < 32 || args.clientSessionKey.length > 256) throw new ConvexError("Invalid session.");
    const session = await ctx.db.query("anonymousSessions").withIndex("by_clientSessionKey", q => q.eq("clientSessionKey", args.clientSessionKey)).unique();
    const summary = await ctx.db.get("replySummaries", args.summaryId);
    if (session === null || summary === null || summary.anonymousSessionId !== session._id) throw new ConvexError("Reply is unavailable.");
    if (summary.status !== "failed") return null;
    if (summary.attempts >= 3 || Date.now() - summary.updatedAt < 30_000) throw new ConvexError("The summary is resting. You can still read the reply and continue.");
    const budget = await abuseProtection.limit(ctx, "replySummaryDaily");
    if (!budget.ok) throw new ConvexError("The summary budget is resting.");
    const binding = await selectOpenAiCredential(ctx, session);
    const attempt = summary.attempts + 1;
    await ctx.db.patch("replySummaries", summary._id, { ...binding, status: "processing", errorCode: null, attempts: attempt, updatedAt: Date.now() });
    await ctx.scheduler.runAfter(0, internal.replySummaryOpenai.summarize, { summaryId: summary._id, attempt });
    return null;
  },
});

export const context = internalQuery({
  args: { summaryId: v.id("replySummaries"), attempt: v.number() },
  returns: v.union(v.null(), v.object({
    model: v.string(), subject: v.string(), preview: v.string(),
    openAiCredentialSource: v.union(v.literal("hackathon_demo"), v.literal("user_supplied")),
    openAiCredentialId: v.union(v.id("openAiCredentials"), v.null()),
    openAiCredentialVersion: v.union(v.number(), v.null()),
  })),
  handler: async (ctx, args) => {
    const summary = await ctx.db.get("replySummaries", args.summaryId);
    if (summary === null || summary.status !== "processing" || summary.attempts !== args.attempt) return null;
    const event = await ctx.db.get("mailInboundEvents", summary.inboundEventId);
    if (event === null || event.anonymousSessionId !== summary.anonymousSessionId) return null;
    return {
      model: summary.model, subject: event.subject, preview: event.preview,
      openAiCredentialSource: summary.openAiCredentialSource,
      openAiCredentialId: summary.openAiCredentialId ?? null,
      openAiCredentialVersion: summary.openAiCredentialVersion ?? null,
    };
  },
});

export const complete = internalMutation({
  args: { summaryId: v.id("replySummaries"), attempt: v.number(), responseId: v.string(), summary: v.string(), nextStep: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get("replySummaries", args.summaryId);
    if (row === null || row.status !== "processing" || row.attempts !== args.attempt) return null;
    if (args.summary.trim().length === 0 || args.summary.length > 600 || args.nextStep.trim().length === 0 || args.nextStep.length > 300 || args.responseId.length > 256 || !args.responseId) throw new ConvexError("Invalid reply summary.");
    await ctx.db.patch("replySummaries", row._id, { status: "completed", summary: args.summary.trim(), nextStep: args.nextStep.trim(), responseId: args.responseId, errorCode: null, updatedAt: Date.now() });
    return null;
  },
});

export const fail = internalMutation({
  args: { summaryId: v.id("replySummaries"), attempt: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get("replySummaries", args.summaryId);
    if (row?.status === "processing" && row.attempts === args.attempt) await ctx.db.patch("replySummaries", row._id, { status: "failed", errorCode: "SUMMARY_UNAVAILABLE", updatedAt: Date.now() });
    return null;
  },
});
