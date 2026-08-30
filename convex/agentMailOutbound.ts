import { AgentMail, type OutboundId } from "@agentmail/convex";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

const agentmail = new AgentMail(components.agentmail);
const MAX_STATUS_SYNC_ATTEMPTS = 20;

function retryDelayMs(attempt: number): number {
  if (attempt <= 1) return 1_000;
  if (attempt === 2) return 2_000;
  if (attempt === 3) return 5_000;
  if (attempt === 4) return 10_000;
  return 30_000;
}

export const syncOutboundStatus = internalMutation({
  args: { mailThreadId: v.id("mailThreads") },
  returns: v.object({
    status: v.union(
      v.literal("queued"),
      v.literal("contacted"),
      v.literal("failed"),
    ),
  }),
  handler: async (ctx, args) => {
    const mail = await ctx.db.get("mailThreads", args.mailThreadId);
    if (mail === null) {
      return { status: "failed" as const };
    }
    if (mail.status === "sent" || mail.status === "delivered") {
      return { status: "contacted" as const };
    }
    if (mail.status === "failed") {
      return { status: "failed" as const };
    }
    if (mail.status === "replied" || mail.status === "connected") {
      return { status: "contacted" as const };
    }

    const providerStatus = await agentmail.status(
      ctx,
      mail.outboundId as OutboundId,
    );
    const now = Date.now();
    const nextAttempt = mail.statusSyncAttempts + 1;
    if (
      providerStatus?.status === "sent" ||
      providerStatus?.status === "delivered"
    ) {
      if (
        providerStatus.agentmailMessageId === null ||
        providerStatus.threadId === null
      ) {
        await ctx.db.patch("mailThreads", mail._id, {
          status: "failed",
          errorCode: "AGENTMAIL_STATUS_UNAVAILABLE",
          statusSyncAttempts: nextAttempt,
          lastStatusSyncAt: now,
          updatedAt: now,
        });
        await ctx.db.patch("connections", mail.connectionId, {
          status: "send_failed",
          updatedAt: now,
        });
        return { status: "failed" as const };
      }
      await ctx.db.patch("mailThreads", mail._id, {
        status: providerStatus.status,
        providerMessageId: providerStatus.agentmailMessageId,
        threadId: providerStatus.threadId,
        errorCode: null,
        statusSyncAttempts: nextAttempt,
        lastStatusSyncAt: now,
        updatedAt: now,
      });
      await ctx.db.patch("connections", mail.connectionId, {
        status: "contacted",
        updatedAt: now,
      });
      return { status: "contacted" as const };
    }
    if (
      providerStatus?.status === "failed" ||
      providerStatus?.status === "bounced" ||
      providerStatus?.status === "complained" ||
      providerStatus?.status === "rejected"
    ) {
      await ctx.db.patch("mailThreads", mail._id, {
        status: "failed",
        errorCode: "AGENTMAIL_SEND_FAILED",
        statusSyncAttempts: nextAttempt,
        lastStatusSyncAt: now,
        updatedAt: now,
      });
      await ctx.db.patch("connections", mail.connectionId, {
        status: "send_failed",
        updatedAt: now,
      });
      return { status: "failed" as const };
    }

    await ctx.db.patch("mailThreads", mail._id, {
      statusSyncAttempts: nextAttempt,
      lastStatusSyncAt: now,
      updatedAt: now,
    });
    if (nextAttempt < MAX_STATUS_SYNC_ATTEMPTS) {
      await ctx.scheduler.runAfter(
        retryDelayMs(nextAttempt),
        internal.agentMailOutbound.syncOutboundStatus,
        { mailThreadId: mail._id },
      );
    }
    return { status: "queued" as const };
  },
});
