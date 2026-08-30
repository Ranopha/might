import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

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

export const onMessageReceived = internalMutation({
  args: {
    message: v.any(),
    thread: v.any(),
    eventId: v.string(),
  },
  returns: inboundResultValidator,
  handler: async (ctx, args) => {
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
    const threadMetadataId = isRecord(args.thread)
      ? boundedString(args.thread.thread_id, MAX_MESSAGE_ID_LENGTH)
      : null;
    if (
      inboxId === null ||
      threadId === null ||
      messageId === null ||
      from === null ||
      to === null ||
      (threadMetadataId !== null && threadMetadataId !== threadId) ||
      !to.some(
        (recipient) => recipient.toLowerCase() === inboxId.toLowerCase(),
      ) ||
      from.toLowerCase() === inboxId.toLowerCase()
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
      return { processed: false as const, reason: "unknown_thread" as const };
    }
    const connection = await ctx.db.get("connections", mail.connectionId);
    if (
      connection === null ||
      connection.anonymousSessionId !== mail.anonymousSessionId ||
      connection.status !== "contacted" ||
      (mail.status !== "sent" && mail.status !== "delivered")
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
    await ctx.db.insert("mailInboundEvents", {
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
      status: "replied",
      updatedAt: now,
    });
    await ctx.db.patch("connections", connection._id, {
      status: "replied",
      updatedAt: now,
    });
    return { processed: true as const, reason: "replied" as const };
  },
});
