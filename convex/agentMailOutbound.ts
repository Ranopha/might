import { AgentMail, type OutboundId } from "@agentmail/convex";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalMutation, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { reconcilePendingReplies } from "./agentMailInbound";

const agentmail = new AgentMail(components.agentmail);
const MAX_STATUS_SYNC_ATTEMPTS = 20;

function retryDelayMs(attempt: number): number {
  if (attempt <= 1) return 1_000;
  if (attempt === 2) return 2_000;
  if (attempt === 3) return 5_000;
  if (attempt === 4) return 10_000;
  return 30_000;
}

export async function checkOutboundReceipt(ctx: MutationCtx, args: { mailThreadId: Id<"mailThreads"> }) {
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
          status: "status_unavailable",
          errorCode: "AGENTMAIL_STATUS_UNAVAILABLE",
          statusSyncAttempts: nextAttempt,
          lastStatusSyncAt: now,
          updatedAt: now,
        });
        await ctx.db.patch("connections", mail.connectionId, {
          status: "delivery_unknown",
          updatedAt: now,
        });
        return { status: "status_unavailable" as const };
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
      await reconcilePendingReplies(ctx, mail.inboxId, providerStatus.threadId);
      return { status: "contacted" as const };
    }
    if (
      providerStatus?.status === "failed" ||
      providerStatus?.status === "bounced" ||
      providerStatus?.status === "complained" ||
      providerStatus?.status === "rejected"
    ) {
      // The component also reports network failures as "failed". Without a
      // receipt, absence of delivery is unknown; never offer another send.
      const uncertain = providerStatus.status === "failed";
      await ctx.db.patch("mailThreads", mail._id, {
        status: uncertain ? "status_unavailable" : "failed",
        errorCode: uncertain ? "AGENTMAIL_STATUS_UNAVAILABLE" : "AGENTMAIL_SEND_FAILED",
        statusSyncAttempts: nextAttempt,
        lastStatusSyncAt: now,
        updatedAt: now,
      });
      await ctx.db.patch("connections", mail.connectionId, {
        status: uncertain ? "delivery_unknown" : "send_failed",
        updatedAt: now,
      });
      return { status: uncertain ? "status_unavailable" as const : "failed" as const };
    }

    await ctx.db.patch("mailThreads", mail._id, {
      ...(nextAttempt >= MAX_STATUS_SYNC_ATTEMPTS ? {
        status: "status_unavailable" as const,
        errorCode: "AGENTMAIL_STATUS_UNAVAILABLE" as const,
      } : {}),
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
    } else {
      await ctx.db.patch("connections", mail.connectionId, { status: "delivery_unknown", updatedAt: now });
      return { status: "status_unavailable" as const };
    }
    return { status: "queued" as const };
}

export const syncOutboundStatus = internalMutation({
  args: { mailThreadId: v.id("mailThreads") },
  returns: v.object({ status: v.union(v.literal("queued"), v.literal("contacted"), v.literal("failed"), v.literal("status_unavailable")) }),
  handler: checkOutboundReceipt,
});
