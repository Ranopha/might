import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { scheduleReplySummary } from "./replySummaries";

const MAX_EVENT_ID_LENGTH = 256;
const MAX_MESSAGE_ID_LENGTH = 512;
const MAX_ADDRESS_LENGTH = 320;
const MAX_SUBJECT_LENGTH = 240;
const MAX_PREVIEW_LENGTH = 1_200;

const inboundResultValidator = v.union(
  v.object({
    processed: v.literal(true),
    reason: v.literal("replied"),
  }),
  v.object({
    processed: v.literal(false),
    reason: v.union(
      v.literal("duplicate"),
      v.literal("invalid_message"),
      v.literal("unknown_thread"),
      v.literal("connection_not_contacted"),
      v.literal("awaiting_outbound_receipt"),
    ),
  }),
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedString(
  value: unknown,
  maxLength: number,
): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > maxLength) {
    return null;
  }
  return normalized;
}

function addresses(value: unknown): string[] | null {
  const values = Array.isArray(value) ? value : [value];
  if (values.length === 0 || values.length > 20) {
    return null;
  }
  const normalized = values.map((address) =>
    boundedString(address, MAX_ADDRESS_LENGTH),
  );
  return normalized.every((address): address is string => address !== null)
    ? normalized
    : null;
}

function mailboxAddress(value: string): string | null {
  const bracketed = /<([^<>]+)>$/.exec(value);
  const candidate = (bracketed?.[1] ?? value).trim().toLowerCase();
  return /^[^\s@<>]+@[^\s@<>]+$/.test(candidate) ? candidate : null;
}

function previewFromMessage(message: Record<string, unknown>): string {
  const candidates = [
    message.extracted_text,
    message.text,
    message.preview,
  ];
  const selected = candidates.find(
    (candidate): candidate is string => typeof candidate === "string",
  );
  return (selected ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .slice(0, MAX_PREVIEW_LENGTH);
}

async function receive(
  ctx: MutationCtx,
  args: { message: unknown; thread: unknown; eventId: string },
  allowPending: boolean,
) {
    const eventId = boundedString(args.eventId, MAX_EVENT_ID_LENGTH);
    if (eventId === null) {
      return { processed: false as const, reason: "invalid_message" as const };
    }
    const duplicate = await ctx.db
      .query("mailInboundEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", eventId))
      .unique();
    if (duplicate !== null) {
      return { processed: false as const, reason: "duplicate" as const };
    }
    if (!isRecord(args.message)) {
      return { processed: false as const, reason: "invalid_message" as const };
    }

    const inboxId = boundedString(args.message.inbox_id, MAX_ADDRESS_LENGTH);
    const threadId = boundedString(
      args.message.thread_id,
      MAX_MESSAGE_ID_LENGTH,
    );
    const messageId = boundedString(
      args.message.message_id,
      MAX_MESSAGE_ID_LENGTH,
    );
    const from = boundedString(args.message.from, MAX_ADDRESS_LENGTH);
    const to = addresses(args.message.to);
    const normalizedInboxId =
      inboxId === null ? null : mailboxAddress(inboxId);
    const normalizedFrom = from === null ? null : mailboxAddress(from);
    const threadMetadataId = isRecord(args.thread)
      ? boundedString(args.thread.thread_id, MAX_MESSAGE_ID_LENGTH)
      : null;
    if (
      inboxId === null ||
      threadId === null ||
      messageId === null ||
      from === null ||
      to === null ||
      normalizedInboxId === null ||
      normalizedFrom === null ||
      (threadMetadataId !== null && threadMetadataId !== threadId) ||
      !to.some(
        (recipient) => mailboxAddress(recipient) === normalizedInboxId,
      ) ||
      normalizedFrom === normalizedInboxId
    ) {
      return { processed: false as const, reason: "invalid_message" as const };
    }

    const mail = await ctx.db
      .query("mailThreads")
      .withIndex("by_inboxId_and_threadId", (q) =>
        q.eq("inboxId", inboxId).eq("threadId", threadId),
      )
      .unique();
    if (mail === null) {
      // This callback is reachable only after the component verifies the webhook.
      // Retention never makes an unknown thread a connection: the outbound
      // provider receipt must subsequently bind the exact inbox and thread.
      if (allowPending) {
        const queuedSend = await ctx.db.query("mailThreads")
          .withIndex("by_inboxId_and_status", q => q.eq("inboxId", inboxId).eq("status", "queued"))
          .order("desc").first();
        const uncertainSend = await ctx.db.query("mailThreads")
          .withIndex("by_inboxId_and_status", q => q.eq("inboxId", inboxId).eq("status", "status_unavailable"))
          .order("desc").first();
        if ([queuedSend, uncertainSend].some(send => send !== null && send.createdAt > Date.now() - 86_400_000)) {
          const duplicatePending = await ctx.db.query("pendingMailReplies")
            .withIndex("by_eventId", q => q.eq("eventId", eventId)).unique();
          const pending = await ctx.db.query("pendingMailReplies")
            .withIndex("by_inboxId", q => q.eq("inboxId", inboxId)).take(20);
          if (duplicatePending !== null) {
            return { processed: false as const, reason: "duplicate" as const };
          }
          if (pending.length < 20) {
            const timestamp = typeof args.message.timestamp === "string" ? Date.parse(args.message.timestamp) : NaN;
            const pendingId = await ctx.db.insert("pendingMailReplies", {
              eventId, inboxId, threadId, messageId, from, to,
              subject: boundedString(args.message.subject, MAX_SUBJECT_LENGTH) ?? "(no subject)",
              preview: previewFromMessage(args.message),
              receivedAt: Number.isFinite(timestamp) ? timestamp : Date.now(),
              expiresAt: Date.now() + 86_400_000,
            });
            await ctx.scheduler.runAfter(86_400_000, internal.agentMailInbound.expirePending, { pendingId });
            return { processed: false as const, reason: "awaiting_outbound_receipt" as const };
          }
        }
      }
      return { processed: false as const, reason: "unknown_thread" as const };
    }
    const connection = await ctx.db.get("connections", mail.connectionId);
    if (
      connection === null ||
      connection.anonymousSessionId !== mail.anonymousSessionId ||
      !["contacted", "replied", "connected"].includes(connection.status) ||
      !["sent", "delivered", "replied", "connected"].includes(mail.status)
    ) {
      return {
        processed: false as const,
        reason: "connection_not_contacted" as const,
      };
    }

    const subject =
      boundedString(args.message.subject, MAX_SUBJECT_LENGTH) ?? "(no subject)";
    const timestamp =
      typeof args.message.timestamp === "string"
        ? Date.parse(args.message.timestamp)
        : Number.NaN;
    const now = Date.now();
    const receivedAt = Number.isFinite(timestamp) ? timestamp : now;
    const inboundEventId = await ctx.db.insert("mailInboundEvents", {
      anonymousSessionId: mail.anonymousSessionId,
      connectionId: connection._id,
      mailThreadId: mail._id,
      eventId,
      inboxId,
      threadId,
      messageId,
      from,
      to,
      subject,
      preview: previewFromMessage(args.message),
      receivedAt,
      processedAt: now,
    });
    await ctx.db.patch("mailThreads", mail._id, {
      status: mail.status === "connected" ? "connected" : "replied",
      updatedAt: now,
    });
    await ctx.db.patch("connections", connection._id, {
      status: connection.status === "connected" ? "connected" : "replied",
      updatedAt: now,
    });
    await scheduleReplySummary(ctx, inboundEventId);
    return { processed: true as const, reason: "replied" as const };
}

export async function reconcilePendingReplies(ctx: MutationCtx, inboxId: string, threadId: string) {
  const events = await ctx.db.query("pendingMailReplies")
    .withIndex("by_inboxId_and_threadId", q => q.eq("inboxId", inboxId).eq("threadId", threadId))
    .take(20);
  for (const event of events) {
    if (event.expiresAt > Date.now()) {
      await receive(ctx, {
        eventId: event.eventId,
        thread: { thread_id: event.threadId },
        message: {
          inbox_id: event.inboxId, thread_id: event.threadId, message_id: event.messageId,
          from: event.from, to: event.to, subject: event.subject, text: event.preview,
          timestamp: new Date(event.receivedAt).toISOString(),
        },
      }, false);
    }
    await ctx.db.delete("pendingMailReplies", event._id);
  }
}

export const onMessageReceived = internalMutation({
  args: { message: v.any(), thread: v.any(), eventId: v.string() },
  returns: inboundResultValidator,
  handler: async (ctx, args) => await receive(ctx, args, true),
});

export const expirePending = internalMutation({
  args: { pendingId: v.id("pendingMailReplies") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.db.get("pendingMailReplies", args.pendingId);
    if (event !== null && event.expiresAt <= Date.now()) await ctx.db.delete("pendingMailReplies", event._id);
    return null;
  },
});
