/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import agentTest from "@convex-dev/agent/test";
import agentmailTest from "@agentmail/convex/test";
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import workpoolTest from "@convex-dev/workpool/test";
import { convexTest } from "convex-test";
import type { FunctionReference } from "convex/server";
import { expect, test, vi } from "vitest";
import { api, components, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob([
  "./**/*.ts",
  "!./**/*.test.ts",
  "!./vitest.config.ts",
]);
const agentmailModules = import.meta.glob([
  "../node_modules/@agentmail/convex/src/component/**/*.ts",
  "../node_modules/@agentmail/convex/src/component/**/*.js",
]);

const ownerKey = "connection-owner-000000000000000000000000001";
const strangerKey = "connection-stranger-00000000000000000000001";

function initTest() {
  const t = convexTest(schema, modules);
  agentTest.register(t);
  t.registerComponent("agentmail", agentmailTest.schema, agentmailModules);
  workpoolTest.register(t, "agentmail/sendPool");
  workpoolTest.register(t, "agentmail/callbackPool");
  rateLimiterTest.register(t);
  return t;
}

async function seedQueuedMail(t: ReturnType<typeof initTest>) {
  const fixture = await seedSurfacedMatch(t, ownerKey);
  const interest = await t.mutation(api.connections.expressInterest, {
    clientSessionKey: ownerKey, matchId: fixture.matchId,
    clientRequestId: "recovery-interest-0001",
  });
  const pitchId = await t.mutation(internal.connections.commitGeneratedPitch, {
    pitchRunId: interest.pitchRunId, model: "test-model", responseId: "test-response",
    selectedMemoryIds: [fixture.memoryId], subject: "Woodworking help",
    body: "Hello, I can help with woodworking on weekends. Could we discuss the project?",
  });
  const revised = await t.mutation(api.connections.reviseCurrentPitch, {
    clientSessionKey: ownerKey, connectionId: interest.connectionId, pitchId,
    recipientEmail: "repair@example.org", subject: "Woodworking help",
    body: "Hello, I can help with woodworking on weekends. Could we discuss the project?",
  });
  const approval = await t.mutation(api.connections.approveCurrentPitch, {
    clientSessionKey: ownerKey, connectionId: interest.connectionId, pitchId,
    payloadHash: revised.payloadHash, recipientEmail: "repair@example.org",
    clientRequestId: "recovery-approval-0001",
  });
  await t.mutation(api.connections.sendApprovedPitch, {
    clientSessionKey: ownerKey, connectionId: interest.connectionId,
    approvalId: approval.approvalId, clientRequestId: "recovery-send-0001",
  });
  const view = await t.query(api.connections.latest, { clientSessionKey: ownerKey });
  if (!view?.mail) throw new Error("Expected queued mail.");
  return { ...interest, mail: view.mail };
}

test("an early verified reply is reconciled when its outbound receipt arrives, without another send", async () => {
  vi.useFakeTimers();
  vi.stubEnv("AGENTMAIL_API_KEY", "agentmail-test-key");
  vi.stubEnv("AGENTMAIL_INBOX_ID", "might-test@agentmail.to");
  vi.stubEnv("AGENTMAIL_ALLOWED_RECIPIENTS", "repair@example.org");
  try {
    const t = initTest();
    const { mail } = await seedQueuedMail(t);
    const event = {
      eventId: "early-verified-event-0001",
      message: { inbox_id: mail.inboxId, thread_id: "early-thread-0001",
        message_id: "early-reply-0001", from: "repair@example.org",
        to: [mail.inboxId], subject: "Re: Woodworking help", text: "Yes, please tell us more." },
      thread: { thread_id: "early-thread-0001" },
    };
    await t.mutation(internal.agentMailInbound.onMessageReceived, event);
    expect((await t.query(api.connections.latest, { clientSessionKey: ownerKey }))?.reply).toBeNull();
    await markAgentMailOutboundSent(t, mail.outboundId, "early-outbound-0001", "early-thread-0001");
    await t.mutation(internal.agentMailOutbound.syncOutboundStatus, { mailThreadId: mail.id });
    const view = await t.query(api.connections.latest, { clientSessionKey: ownerKey });
    expect(view?.status).toBe("replied");
    expect(view?.reply?.eventId).toBe(event.eventId);
    expect(view?.reply?.summary?.status).toBe("processing");
    const summaryId = view?.reply?.summary?.id;
    if (!summaryId) throw new Error("Expected a source-bound reply summary.");
    await t.mutation(internal.replySummaries.complete, {
      summaryId, attempt: 1, responseId: "test-summary-response",
      summary: "They are interested in hearing more.", nextStep: "Review their reply and decide what to share next.",
    });
    const summarized = await t.query(api.connections.latest, { clientSessionKey: ownerKey });
    expect(summarized?.reply?.summary).toMatchObject({ status: "completed", responseId: "test-summary-response", source: "reply_preview" });
    expect(summarized?.status).toBe("replied");
    expect(view?.sendCount).toBe(1);
    expect(await t.query(api.connections.latest, { clientSessionKey: strangerKey })).toBeNull();
    expect(await t.mutation(internal.agentMailInbound.onMessageReceived, event)).toEqual({ processed: false, reason: "duplicate" });
    const followup = { ...event, eventId: "followup-verified-event-0002", message: { ...event.message, message_id: "followup-reply-0002", text: "One correction: please discuss Sunday instead.", timestamp: new Date(Date.now() + 1000).toISOString() } };
    expect((await t.mutation(internal.agentMailInbound.onMessageReceived, followup)).processed).toBe(true);
    expect((await t.query(api.connections.latest, { clientSessionKey: ownerKey }))?.reply?.preview).toContain("Sunday");
  } finally { vi.unstubAllEnvs(); vi.useRealTimers(); }
});

async function markAgentMailOutboundSent(
  t: ReturnType<typeof initTest>,
  outboundId: string,
  messageId: string,
  threadId: string,
) {
  const componentRunner = t as unknown as {
    runInComponent: (
      componentPath: string,
      handler: (ctx: {
        db: {
          patch: (
            id: string,
            value: Record<string, unknown>,
          ) => Promise<void>;
        };
      }) => Promise<void>,
    ) => Promise<void>;
  };
  await componentRunner.runInComponent("agentmail", async (ctx) => {
    await ctx.db.patch(outboundId, {
      status: "sent",
      agentmailMessageId: messageId,
      threadId,
      finalizedAt: Date.now(),
    });
  });
}

test("an exhausted receipt check can recover the same outbound without sending again", async () => {
  vi.useFakeTimers();
  vi.stubEnv("AGENTMAIL_API_KEY", "agentmail-test-key");
  vi.stubEnv("AGENTMAIL_INBOX_ID", "might-test@agentmail.to");
  vi.stubEnv("AGENTMAIL_ALLOWED_RECIPIENTS", "repair@example.org");
  try {
    const t = initTest();
    const { mail, connectionId } = await seedQueuedMail(t);
    await t.run(async ctx => { await ctx.db.patch("mailThreads", mail.id, { statusSyncAttempts: 19 }); });
    await t.mutation(internal.agentMailOutbound.syncOutboundStatus, { mailThreadId: mail.id });
    const delayed = await t.query(api.connections.latest, { clientSessionKey: ownerKey });
    expect(delayed?.status).toBe("delivery_unknown");
    expect(delayed?.mail?.status).toBe("status_unavailable");
    await expect(t.mutation(api.connections.refreshDeliveryStatus, { clientSessionKey: strangerKey, connectionId })).rejects.toThrow();
    vi.advanceTimersByTime(30_001);
    await markAgentMailOutboundSent(t, mail.outboundId, "recovered-message-0001", "recovered-thread-0001");
    await t.mutation(api.connections.refreshDeliveryStatus, { clientSessionKey: ownerKey, connectionId });
    const recovered = await t.query(api.connections.latest, { clientSessionKey: ownerKey });
    expect(recovered?.status).toBe("contacted");
    expect(recovered?.mail?.outboundId).toBe(mail.outboundId);
    expect(recovered?.sendCount).toBe(1);
  } finally { vi.unstubAllEnvs(); vi.useRealTimers(); }
});

test("provider retries carry one transport idempotency key and recover the original send receipt", async () => {
  vi.useFakeTimers();
  vi.stubEnv("AGENTMAIL_API_KEY", "agentmail-test-key");
  vi.stubEnv("AGENTMAIL_INBOX_ID", "might-test@agentmail.to");
  vi.stubEnv("AGENTMAIL_ALLOWED_RECIPIENTS", "repair@example.org");
  const requests: RequestInit[] = [];
  vi.stubGlobal("fetch", vi.fn(async (_url: unknown, init: RequestInit) => {
    requests.push(init);
    if (requests.length === 1) throw new Error("Provider accepted, response connection lost");
    return new Response(JSON.stringify({ message_id: "idempotent-message", thread_id: "idempotent-thread" }), { headers: { "content-type": "application/json" } });
  }));
  try {
    const t = initTest();
    const { mail } = await seedQueuedMail(t);
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(requests.length).toBe(2);
    for (const request of requests) {
      expect(new Headers(request.headers).get("Idempotency-Key")).toBe(`might-${mail.outboundId}`);
    }
    expect(requests[1].body).toBe(requests[0].body);
    await t.mutation(internal.agentMailOutbound.syncOutboundStatus, { mailThreadId: mail.id });
    const view = await t.query(api.connections.latest, { clientSessionKey: ownerKey });
    expect(view?.mail?.providerMessageId).toBe("idempotent-message");
    expect(view?.sendCount).toBe(1);
  } finally { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); }
});

test("a queued send past the provider idempotency window never makes a POST", async () => {
  vi.useFakeTimers();
  vi.stubEnv("AGENTMAIL_API_KEY", "agentmail-test-key");
  vi.stubEnv("AGENTMAIL_INBOX_ID", "might-test@agentmail.to");
  vi.stubEnv("AGENTMAIL_ALLOWED_RECIPIENTS", "repair@example.org");
  const fetchMock = vi.fn(async () => { throw new Error("No provider request is allowed."); });
  vi.stubGlobal("fetch", fetchMock);
  try {
    const t = initTest();
    const { mail } = await seedQueuedMail(t);
    vi.setSystemTime(Date.now() + 23 * 60 * 60 * 1000);
    const componentFunctions = components.agentmail as unknown as {
      lib: { performSend: FunctionReference<"action", "internal", { outboundId: string }, unknown> };
    };
    await t.action(componentFunctions.lib.performSend, { outboundId: mail.outboundId });
    await t.mutation(internal.agentMailOutbound.syncOutboundStatus, { mailThreadId: mail.id });
    expect(fetchMock).not.toHaveBeenCalled();
    expect((await t.query(api.connections.latest, { clientSessionKey: ownerKey }))?.status).toBe("delivery_unknown");
  } finally { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); }
});

test("two early replies are both retained and a stale queued send cannot hide the current unknown send", async () => {
  vi.useFakeTimers();
  vi.stubEnv("AGENTMAIL_API_KEY", "agentmail-test-key");
  vi.stubEnv("AGENTMAIL_INBOX_ID", "might-test@agentmail.to");
  vi.stubEnv("AGENTMAIL_ALLOWED_RECIPIENTS", "repair@example.org");
  try {
    const t = initTest();
    const { mail } = await seedQueuedMail(t);
    await t.run(async ctx => {
      const row = await ctx.db.get("mailThreads", mail.id);
      if (!row) throw new Error("Missing mail.");
      const { _id, _creationTime, ...stale } = row;
      void _id; void _creationTime;
      await ctx.db.insert("mailThreads", { ...stale, status: "queued", createdAt: Date.now() - 86_400_001 });
      await ctx.db.patch("mailThreads", mail.id, { status: "status_unavailable" });
    });
    for (let index = 1; index <= 2; index++) {
      const result = await t.mutation(internal.agentMailInbound.onMessageReceived, {
        eventId: `early-correction-${index}`, thread: { thread_id: "correction-thread" },
        message: { inbox_id: mail.inboxId, thread_id: "correction-thread", message_id: `correction-${index}`,
          from: "repair@example.org", to: [mail.inboxId], text: `Reply ${index}`, timestamp: new Date(Date.now() + index * 1000).toISOString() },
      });
      expect(result).toEqual({ processed: false, reason: "awaiting_outbound_receipt" });
    }
    await markAgentMailOutboundSent(t, mail.outboundId, "correction-outbound", "correction-thread");
    await t.mutation(internal.agentMailOutbound.syncOutboundStatus, { mailThreadId: mail.id });
    const events = await t.run(async ctx => await ctx.db.query("mailInboundEvents").collect());
    expect(events.map(event => event.eventId)).toEqual(["early-correction-1", "early-correction-2"]);
    expect(await t.run(async ctx => await ctx.db.query("pendingMailReplies").collect())).toEqual([]);
  } finally { vi.unstubAllEnvs(); vi.useRealTimers(); }
});

async function seedSurfacedMatch(
  t: ReturnType<typeof initTest>,
  clientSessionKey: string,
) {
  await t.mutation(api.talk.ensureSession, { clientSessionKey });
  return await t.run(async (ctx) => {
    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", clientSessionKey),
      )
      .unique();
    if (session === null) {
      throw new Error("Expected the owner session.");
    }
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_anonymousSessionId_and_kind", (q) =>
        q.eq("anonymousSessionId", session._id).eq("kind", "primary"),
      )
      .unique();
    if (conversation === null) {
      throw new Error("Expected the owner conversation.");
    }

    const now = Date.now();
    const sourceMessageId = await ctx.db.insert("messages", {
      anonymousSessionId: session._id,
      conversationId: conversation._id,
      role: "user",
      content:
        "I have ten years of woodworking experience and can volunteer on weekends.",
      source: "user_input",
      privacy: "private",
      clientMessageId: "connection-source-message-0001",
      sequence: conversation.nextMessageSequence,
      createdAt: now,
    });
    const memoryId = await ctx.db.insert("memories", {
      anonymousSessionId: session._id,
      statement:
        "You have ten years of woodworking experience and can volunteer on weekends.",
      normalizedStatement:
        "you have ten years of woodworking experience and can volunteer on weekends.",
      semanticType: "experience",
      sourceMessageId,
      source: "conversation",
      explicitness: "explicit",
      confidence: 0.98,
      privacy: "private",
      freshness: "long_term",
      status: "active",
      extractionModel: "test-memory-model",
      extractionResponseId: "test-memory-response",
      lastConfirmedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    const worldRunId = await ctx.db.insert("worldSignalRuns", {
      anonymousSessionId: session._id,
      clientRequestId: "connection-world-run-0001",
      sourceUrl: "https://example.org/public-repair-project",
      status: "completed",
      provider: "firecrawl",
      sourceMode: "live",
      providerRequestId: "firecrawl-connection-test-001",
      interpreterModel: "test-world-model",
      interpreterResponseId: "openai-world-test-001",
      signalId: null,
      errorCode: null,
      startedAt: now,
      updatedAt: now,
    });
    const worldSignalId = await ctx.db.insert("worldSignals", {
      anonymousSessionId: session._id,
      runId: worldRunId,
      sourceUrl: "https://example.org/public-repair-project",
      sourceTitle: "Taoyuan Community Repair Project",
      sourceDomain: "example.org",
      rawExcerpt: "The project is seeking experienced repair volunteers.",
      situation: "A public Taoyuan repair project needs volunteer help.",
      painOrFriction: "The project needs more experienced hands.",
      desiredOutcome: "Repair community furniture safely.",
      needHypothesis: "Experienced woodworking volunteers may help.",
      location: "Taoyuan",
      timeContext: "Weekends",
      explicitness: "explicit_need",
      confidence: 0.95,
      evidence: [
        {
          url: "https://example.org/public-repair-project",
          excerpt: "The project is seeking experienced repair volunteers.",
        },
      ],
      provider: "firecrawl",
      sourceMode: "live",
      providerRequestId: "firecrawl-connection-test-001",
      interpreterModel: "test-world-model",
      interpreterResponseId: "openai-world-test-001",
      createdAt: now,
    });
    await ctx.db.patch("worldSignalRuns", worldRunId, { signalId: worldSignalId });
    const matchRunId = await ctx.db.insert("matchRuns", {
      anonymousSessionId: session._id,
      worldSignalId,
      clientRequestId: "connection-match-run-0001",
      candidateMemoryIds: [memoryId],
      status: "completed",
      judgeModel: "test-match-model",
      judgeResponseId: "openai-match-test-001",
      matchId: null,
      errorCode: null,
      startedAt: now,
      updatedAt: now,
    });
    const matchId = await ctx.db.insert("matches", {
      anonymousSessionId: session._id,
      runId: matchRunId,
      worldSignalId,
      relevantMemoryIds: [memoryId],
      whyThisSituationMatters:
        "The source describes a real need for experienced repair volunteers.",
      whyThisPersonCameToMind:
        "Your woodworking experience, willingness, and weekend availability overlap.",
      recommendation: "surface",
      riskLevel: "low",
      matchConfidence: 0.94,
      clarificationQuestion: null,
      status: "surfaced",
      consentState: "not_requested",
      judgeModel: "test-match-model",
      judgeResponseId: "openai-match-test-001",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch("matchRuns", matchRunId, { matchId });
    return { matchId, memoryId };
  });
}

test("a failed private pitch retries with a new request while preserving idempotency and ownership", async () => {
  vi.useFakeTimers();
  try {
    const t = initTest();
    const { matchId } = await seedSurfacedMatch(t, ownerKey);
    const args = { clientSessionKey: ownerKey, matchId, clientRequestId: "pitch-retry-initial-0001" };
    const initial = await t.mutation(api.connections.expressInterest, args);
    await t.mutation(internal.connections.failPitchRun, { pitchRunId: initial.pitchRunId, errorCode: "PITCH_GENERATION_FAILED" });
    expect((await t.mutation(api.connections.expressInterest, args)).pitchRunId).toBe(initial.pitchRunId);
    await expect(t.mutation(api.connections.expressInterest, { ...args, clientSessionKey: strangerKey })).rejects.toThrow();
    const retryArgs = { ...args, clientRequestId: "pitch-retry-second-0001" };
    const retry = await t.mutation(api.connections.expressInterest, retryArgs);
    expect(retry.connectionId).toBe(initial.connectionId);
    expect(retry.pitchRunId).not.toBe(initial.pitchRunId);
    expect((await t.mutation(api.connections.expressInterest, retryArgs)).pitchRunId).toBe(retry.pitchRunId);
    const view = await t.query(api.connections.latest, { clientSessionKey: ownerKey });
    expect(view?.pitchRun.status).toBe("processing");
    expect(view?.sendCount).toBe(0);
  } finally { vi.useRealTimers(); }
});

test("interest starts a private pitch intent without granting contact consent", async () => {
  const t = initTest();
  const fixture = await seedSurfacedMatch(t, ownerKey);
  await t.mutation(api.talk.ensureSession, { clientSessionKey: strangerKey });

  const first = await t.mutation(api.connections.expressInterest, {
    clientSessionKey: ownerKey,
    matchId: fixture.matchId,
    clientRequestId: "connection-interest-request-0001",
  });
  const retry = await t.mutation(api.connections.expressInterest, {
    clientSessionKey: ownerKey,
    matchId: fixture.matchId,
    clientRequestId: "connection-interest-request-0001",
  });

  expect(first.created).toBe(true);
  expect(retry).toEqual({
    connectionId: first.connectionId,
    pitchRunId: first.pitchRunId,
    created: false,
  });
  await expect(
    t.mutation(api.connections.expressInterest, {
      clientSessionKey: strangerKey,
      matchId: fixture.matchId,
      clientRequestId: "connection-interest-foreign-0001",
    }),
  ).rejects.toThrow(/match is unavailable/i);

  await expect(
    t.query(api.connections.latest, { clientSessionKey: strangerKey }),
  ).resolves.toBeNull();
  await expect(
    t.query(api.connections.latest, { clientSessionKey: ownerKey }),
  ).resolves.toMatchObject({
    id: first.connectionId,
    matchId: fixture.matchId,
    status: "user_interested",
    consentState: "not_requested",
    canContact: false,
    sendCount: 0,
    pitchRun: {
      id: first.pitchRunId,
      status: "processing",
      errorCode: null,
      provenance: {
        model: "gpt-5.6-luna",
        responseId: null,
      },
    },
    pitch: null,
    approval: null,
  });
});

test("a generated contextual pitch preserves the exact private disclosure preview", async () => {
  const t = initTest();
  const fixture = await seedSurfacedMatch(t, ownerKey);
  const interest = await t.mutation(api.connections.expressInterest, {
    clientSessionKey: ownerKey,
    matchId: fixture.matchId,
    clientRequestId: "connection-pitch-request-0001",
  });

  const pitchId = await t.mutation(
    internal.connections.commitGeneratedPitch,
    {
      pitchRunId: interest.pitchRunId,
      model: "test-pitch-model",
      responseId: "openai-pitch-response-001",
      selectedMemoryIds: [fixture.memoryId],
      subject: "Woodworking help for your Taoyuan repair project",
      body:
        "Hello Taoyuan Community Repair Project,\n\nI have ten years of woodworking experience and can volunteer on weekends. I would be glad to discuss whether that experience could help your current repair work.",
    },
  );
  const retryPitchId = await t.mutation(
    internal.connections.commitGeneratedPitch,
    {
      pitchRunId: interest.pitchRunId,
      model: "test-pitch-model",
      responseId: "openai-pitch-response-001",
      selectedMemoryIds: [fixture.memoryId],
      subject: "Woodworking help for your Taoyuan repair project",
      body:
        "Hello Taoyuan Community Repair Project,\n\nI have ten years of woodworking experience and can volunteer on weekends. I would be glad to discuss whether that experience could help your current repair work.",
    },
  );
  expect(retryPitchId).toBe(pitchId);

  const latest = await t.query(api.connections.latest, {
    clientSessionKey: ownerKey,
  });
  expect(latest).toMatchObject({
    id: interest.connectionId,
    matchId: fixture.matchId,
    status: "pitch_ready",
    consentState: "awaiting_send_approval",
    canContact: false,
    sendCount: 0,
    pitchRun: {
      id: interest.pitchRunId,
      status: "completed",
      errorCode: null,
      provenance: {
        model: "test-pitch-model",
        responseId: "openai-pitch-response-001",
      },
    },
    pitch: {
      id: pitchId,
      target: {
        displayName: "Taoyuan Community Repair Project",
        email: null,
        status: "unavailable",
      },
      subject: "Woodworking help for your Taoyuan repair project",
      body:
        "Hello Taoyuan Community Repair Project,\n\nI have ten years of woodworking experience and can volunteer on weekends. I would be glad to discuss whether that experience could help your current repair work.",
      selectedMemoryIds: [fixture.memoryId],
      selectedMemories: [
        {
          id: fixture.memoryId,
          statement:
            "You have ten years of woodworking experience and can volunteer on weekends.",
          privacy: "private",
        },
      ],
      privateFields: [
        {
          memoryId: fixture.memoryId,
          statement:
            "You have ten years of woodworking experience and can volunteer on weekends.",
        },
      ],
      revision: 1,
      canApprove: false,
    },
    approval: null,
  });
  expect(latest?.pitch?.payloadHash).toMatch(/^sha256:[0-9a-f]{64}$/);
  expect(latest?.pitch?.createdAt).toEqual(expect.any(Number));
  expect(latest?.pitch?.updatedAt).toEqual(expect.any(Number));
});

test("pitch generation fails explicitly when OpenAI is not configured", async () => {
  const t = initTest();
  const fixture = await seedSurfacedMatch(t, ownerKey);
  const interest = await t.mutation(api.connections.expressInterest, {
    clientSessionKey: ownerKey,
    matchId: fixture.matchId,
    clientRequestId: "connection-missing-openai-0001",
  });

  vi.useFakeTimers();
  try {
    await t.finishAllScheduledFunctions(vi.runAllTimers);
  } finally {
    vi.useRealTimers();
  }

  await expect(
    t.query(api.connections.latest, { clientSessionKey: ownerKey }),
  ).resolves.toMatchObject({
    id: interest.connectionId,
    status: "user_interested",
    consentState: "not_requested",
    canContact: false,
    sendCount: 0,
    pitchRun: {
      id: interest.pitchRunId,
      status: "failed",
      errorCode: "OPENAI_CONFIGURATION_MISSING",
      provenance: {
        model: "gpt-5.6-luna",
        responseId: null,
      },
    },
    pitch: null,
    approval: null,
  });
});

test("send approval binds the current recipient and payload idempotently without sending", async () => {
  const t = initTest();
  const fixture = await seedSurfacedMatch(t, ownerKey);
  await t.mutation(api.talk.ensureSession, { clientSessionKey: strangerKey });
  const interest = await t.mutation(api.connections.expressInterest, {
    clientSessionKey: ownerKey,
    matchId: fixture.matchId,
    clientRequestId: "connection-approval-interest-0001",
  });
  const pitchId = await t.mutation(
    internal.connections.commitGeneratedPitch,
    {
      pitchRunId: interest.pitchRunId,
      model: "test-pitch-model",
      responseId: "openai-pitch-approval-001",
      selectedMemoryIds: [fixture.memoryId],
      subject: "Woodworking help for your repair project",
      body:
        "Hello, I have ten years of woodworking experience and can volunteer on weekends. I would be glad to discuss whether that could help this project.",
    },
  );
  const initial = await t.query(api.connections.latest, {
    clientSessionKey: ownerKey,
  });
  if (!initial?.pitch) {
    throw new Error("Expected a generated pitch.");
  }

  await expect(
    t.mutation(api.connections.reviseCurrentPitch, {
      clientSessionKey: strangerKey,
      connectionId: interest.connectionId,
      pitchId,
      recipientEmail: "repair@example.org",
      subject: initial.pitch.subject,
      body: initial.pitch.body,
    }),
  ).rejects.toThrow(/pitch is unavailable/i);
  await expect(
    t.mutation(api.connections.approveCurrentPitch, {
      clientSessionKey: strangerKey,
      connectionId: interest.connectionId,
      pitchId,
      payloadHash: initial.pitch.payloadHash,
      recipientEmail: "repair@example.org",
      clientRequestId: "connection-foreign-approval-0001",
    }),
  ).rejects.toThrow(/pitch is unavailable/i);

  await expect(
    t.mutation(api.connections.approveCurrentPitch, {
      clientSessionKey: ownerKey,
      connectionId: interest.connectionId,
      pitchId,
      payloadHash: initial.pitch.payloadHash,
      recipientEmail: "repair@example.org",
      clientRequestId: "connection-send-approval-0001",
    }),
  ).rejects.toThrow(/recipient.*not.*current|recipient.*unavailable/i);

  const revised = await t.mutation(api.connections.reviseCurrentPitch, {
    clientSessionKey: ownerKey,
    connectionId: interest.connectionId,
    pitchId,
    recipientEmail: "repair@example.org",
    subject: initial.pitch.subject,
    body: initial.pitch.body,
  });
  expect(revised.revision).toBe(2);
  expect(revised.payloadHash).not.toBe(initial.pitch.payloadHash);

  await expect(
    t.mutation(api.connections.approveCurrentPitch, {
      clientSessionKey: ownerKey,
      connectionId: interest.connectionId,
      pitchId,
      payloadHash: initial.pitch.payloadHash,
      recipientEmail: "repair@example.org",
      clientRequestId: "connection-stale-approval-0001",
    }),
  ).rejects.toThrow(/payload is no longer current/i);

  const approval = await t.mutation(api.connections.approveCurrentPitch, {
    clientSessionKey: ownerKey,
    connectionId: interest.connectionId,
    pitchId,
    payloadHash: revised.payloadHash,
    recipientEmail: "repair@example.org",
    clientRequestId: "connection-send-approval-0001",
  });
  const retry = await t.mutation(api.connections.approveCurrentPitch, {
    clientSessionKey: ownerKey,
    connectionId: interest.connectionId,
    pitchId,
    payloadHash: revised.payloadHash,
    recipientEmail: "repair@example.org",
    clientRequestId: "connection-send-approval-0001",
  });
  expect(approval.created).toBe(true);
  expect(approval.sendCount).toBe(0);
  expect(retry).toEqual({
    approvalId: approval.approvalId,
    created: false,
    sendCount: 0,
  });

  await expect(
    t.query(api.connections.latest, { clientSessionKey: ownerKey }),
  ).resolves.toMatchObject({
    id: interest.connectionId,
    status: "pitch_ready",
    consentState: "send_approved",
    hasValidSendApproval: true,
    canContact: false,
    sendCount: 0,
    pitch: {
      id: pitchId,
      target: {
        displayName: "Taoyuan Community Repair Project",
        email: "repair@example.org",
        status: "configured",
      },
      payloadHash: revised.payloadHash,
      revision: 2,
      canApprove: true,
    },
    approval: {
      id: approval.approvalId,
      connectionId: interest.connectionId,
      pitchId,
      payloadHash: revised.payloadHash,
      recipientEmail: "repair@example.org",
      clientRequestId: "connection-send-approval-0001",
      isValid: true,
    },
  });

  const edited = await t.mutation(api.connections.reviseCurrentPitch, {
    clientSessionKey: ownerKey,
    connectionId: interest.connectionId,
    pitchId,
    recipientEmail: "repair@example.org",
    subject: "Woodworking help for your repair project",
    body:
      "Hello, I have ten years of woodworking experience and can volunteer on weekends. I would be glad to discuss whether that could help this project.\n\nThank you for considering it.",
  });
  expect(edited.payloadHash).not.toBe(revised.payloadHash);
  await expect(
    t.query(api.connections.latest, { clientSessionKey: ownerKey }),
  ).resolves.toMatchObject({
    consentState: "awaiting_send_approval",
    hasValidSendApproval: false,
    sendCount: 0,
    approval: {
      id: approval.approvalId,
      isValid: false,
    },
  });
  await expect(
    t.mutation(api.connections.approveCurrentPitch, {
      clientSessionKey: ownerKey,
      connectionId: interest.connectionId,
      pitchId,
      payloadHash: edited.payloadHash,
      recipientEmail: "repair@example.org",
      clientRequestId: "connection-send-approval-0001",
    }),
  ).rejects.toThrow(/request id.*another payload/i);

  const editedRecipient = await t.mutation(
    api.connections.reviseCurrentPitch,
    {
      clientSessionKey: ownerKey,
      connectionId: interest.connectionId,
      pitchId,
      recipientEmail: "coordinator@example.org",
      subject: "Woodworking help for your repair project",
      body:
        "Hello, I have ten years of woodworking experience and can volunteer on weekends. I would be glad to discuss whether that could help this project.\n\nThank you for considering it.",
    },
  );
  expect(editedRecipient.payloadHash).not.toBe(edited.payloadHash);
  await expect(
    t.query(api.connections.latest, { clientSessionKey: ownerKey }),
  ).resolves.toMatchObject({
    consentState: "awaiting_send_approval",
    hasValidSendApproval: false,
    sendCount: 0,
    pitch: {
      target: { email: "coordinator@example.org", status: "configured" },
      payloadHash: editedRecipient.payloadHash,
    },
    approval: { id: approval.approvalId, isValid: false },
  });
});

test("only the current approval can enqueue one AgentMail outbound", async () => {
  vi.stubEnv("AGENTMAIL_API_KEY", "agentmail-test-key");
  vi.stubEnv("AGENTMAIL_INBOX_ID", "might-test@agentmail.to");
  vi.stubEnv("AGENTMAIL_ALLOWED_RECIPIENTS", "approved@example.org");
  try {
    const t = initTest();
    const fixture = await seedSurfacedMatch(t, ownerKey);
    const interest = await t.mutation(api.connections.expressInterest, {
      clientSessionKey: ownerKey,
      matchId: fixture.matchId,
      clientRequestId: "connection-send-interest-0001",
    });
    const pitchId = await t.mutation(
      internal.connections.commitGeneratedPitch,
      {
        pitchRunId: interest.pitchRunId,
        model: "test-pitch-model",
        responseId: "openai-pitch-send-001",
        selectedMemoryIds: [fixture.memoryId],
        subject: "Woodworking help for your repair project",
        body:
          "Hello, I have ten years of woodworking experience and can volunteer on weekends. I would be glad to discuss whether that could help this project.",
      },
    );
    const initial = await t.query(api.connections.latest, {
      clientSessionKey: ownerKey,
    });
    if (!initial?.pitch) {
      throw new Error("Expected a generated pitch.");
    }
    const revised = await t.mutation(api.connections.reviseCurrentPitch, {
      clientSessionKey: ownerKey,
      connectionId: interest.connectionId,
      pitchId,
      recipientEmail: "repair@example.org",
      subject: initial.pitch.subject,
      body: initial.pitch.body,
    });

    const staleApproval = await t.mutation(
      api.connections.approveCurrentPitch,
      {
        clientSessionKey: ownerKey,
        connectionId: interest.connectionId,
        pitchId,
        payloadHash: revised.payloadHash,
        recipientEmail: "repair@example.org",
        clientRequestId: "connection-stale-send-approval-0001",
      },
    );
    const current = await t.mutation(api.connections.reviseCurrentPitch, {
      clientSessionKey: ownerKey,
      connectionId: interest.connectionId,
      pitchId,
      recipientEmail: "repair@example.org",
      subject: initial.pitch.subject,
      body: `${initial.pitch.body}\n\nThank you for considering it.`,
    });
    await expect(
      t.mutation(api.connections.sendApprovedPitch, {
        clientSessionKey: ownerKey,
        connectionId: interest.connectionId,
        approvalId: staleApproval.approvalId,
        clientRequestId: "connection-send-attempt-0001",
      }),
    ).rejects.toThrow(/not approved or current/i);
    await expect(
      t.query(api.connections.latest, { clientSessionKey: ownerKey }),
    ).resolves.toMatchObject({ sendCount: 0, canContact: false });

    const approval = await t.mutation(api.connections.approveCurrentPitch, {
      clientSessionKey: ownerKey,
      connectionId: interest.connectionId,
      pitchId,
      payloadHash: current.payloadHash,
      recipientEmail: "repair@example.org",
      clientRequestId: "connection-send-approval-0002",
    });
    await expect(
      t.mutation(api.connections.sendApprovedPitch, {
        clientSessionKey: ownerKey,
        connectionId: interest.connectionId,
        approvalId: approval.approvalId,
        clientRequestId: "connection-send-attempt-not-allowed-0001",
      }),
    ).rejects.toThrow(/recipient.*not authorized/i);
    await expect(
      t.query(api.connections.latest, { clientSessionKey: ownerKey }),
    ).resolves.toMatchObject({ sendCount: 0, canContact: false, mail: null });

    vi.stubEnv("AGENTMAIL_ALLOWED_RECIPIENTS", "repair@example.org");
    const first = await t.mutation(api.connections.sendApprovedPitch, {
      clientSessionKey: ownerKey,
      connectionId: interest.connectionId,
      approvalId: approval.approvalId,
      clientRequestId: "connection-send-attempt-0002",
    });
    const sameRequestRetry = await t.mutation(
      api.connections.sendApprovedPitch,
      {
        clientSessionKey: ownerKey,
        connectionId: interest.connectionId,
        approvalId: approval.approvalId,
        clientRequestId: "connection-send-attempt-0002",
      },
    );
    const newRequestRetry = await t.mutation(api.connections.sendApprovedPitch, {
      clientSessionKey: ownerKey,
      connectionId: interest.connectionId,
      approvalId: approval.approvalId,
      clientRequestId: "connection-send-attempt-0003",
    });

    expect(first.created).toBe(true);
    expect(first.sendCount).toBe(1);
    expect(sameRequestRetry).toEqual({
      mailThreadId: first.mailThreadId,
      created: false,
      sendCount: 1,
    });
    expect(newRequestRetry).toEqual(sameRequestRetry);
    await expect(
      t.query(api.connections.latest, { clientSessionKey: ownerKey }),
    ).resolves.toMatchObject({
      id: interest.connectionId,
      status: "contacting",
      consentState: "send_approved",
      hasValidSendApproval: true,
      canContact: true,
      sendCount: 1,
      mail: {
        id: first.mailThreadId,
        status: "queued",
        inboxId: "might-test@agentmail.to",
        recipientEmail: "repair@example.org",
        threadId: null,
        providerMessageId: null,
      },
    });

    const queued = await t.query(api.connections.latest, {
      clientSessionKey: ownerKey,
    });
    if (!queued?.mail) {
      throw new Error("Expected one queued AgentMail outbound.");
    }
    await markAgentMailOutboundSent(
      t,
      queued.mail.outboundId,
      "agentmail-outbound-message-sync-001",
      "agentmail-thread-sync-001",
    );
    const synced = await t.mutation(
      internal.agentMailOutbound.syncOutboundStatus,
      { mailThreadId: first.mailThreadId },
    );
    expect(synced).toEqual({ status: "contacted" });
    await expect(
      t.query(api.connections.latest, { clientSessionKey: ownerKey }),
    ).resolves.toMatchObject({
      status: "contacted",
      sendCount: 1,
      mail: {
        id: first.mailThreadId,
        status: "sent",
        providerMessageId: "agentmail-outbound-message-sync-001",
        threadId: "agentmail-thread-sync-001",
      },
    });
  } finally {
    vi.unstubAllEnvs();
  }
});

test("only a new inbound event on the bound AgentMail thread moves Contacted to Replied", async () => {
  vi.stubEnv("AGENTMAIL_API_KEY", "agentmail-test-key");
  vi.stubEnv("AGENTMAIL_INBOX_ID", "might-test@agentmail.to");
  vi.stubEnv("AGENTMAIL_ALLOWED_RECIPIENTS", "repair@example.org");
  try {
    const t = initTest();
    const fixture = await seedSurfacedMatch(t, ownerKey);
    const interest = await t.mutation(api.connections.expressInterest, {
      clientSessionKey: ownerKey,
      matchId: fixture.matchId,
      clientRequestId: "connection-reply-interest-0001",
    });
    const pitchId = await t.mutation(
      internal.connections.commitGeneratedPitch,
      {
        pitchRunId: interest.pitchRunId,
        model: "test-pitch-model",
        responseId: "openai-pitch-reply-001",
        selectedMemoryIds: [fixture.memoryId],
        subject: "Woodworking help for your repair project",
        body:
          "Hello, I have ten years of woodworking experience and can volunteer on weekends. I would be glad to discuss whether that could help this project.",
      },
    );
    const initial = await t.query(api.connections.latest, {
      clientSessionKey: ownerKey,
    });
    if (!initial?.pitch) {
      throw new Error("Expected a generated pitch.");
    }
    const revised = await t.mutation(api.connections.reviseCurrentPitch, {
      clientSessionKey: ownerKey,
      connectionId: interest.connectionId,
      pitchId,
      recipientEmail: "repair@example.org",
      subject: initial.pitch.subject,
      body: initial.pitch.body,
    });
    const approval = await t.mutation(api.connections.approveCurrentPitch, {
      clientSessionKey: ownerKey,
      connectionId: interest.connectionId,
      pitchId,
      payloadHash: revised.payloadHash,
      recipientEmail: "repair@example.org",
      clientRequestId: "connection-reply-approval-0001",
    });
    const sent = await t.mutation(api.connections.sendApprovedPitch, {
      clientSessionKey: ownerKey,
      connectionId: interest.connectionId,
      approvalId: approval.approvalId,
      clientRequestId: "connection-reply-send-0001",
    });
    await t.run(async (ctx) => {
      await ctx.db.patch("mailThreads", sent.mailThreadId, {
        status: "sent",
        providerMessageId: "agentmail-outbound-message-001",
        threadId: "agentmail-thread-001",
        updatedAt: Date.now(),
      });
      await ctx.db.patch("connections", interest.connectionId, {
        status: "contacted",
        updatedAt: Date.now(),
      });
    });

    const unknown = await t.mutation(
      internal.agentMailInbound.onMessageReceived,
      {
        eventId: "agentmail-inbound-event-unknown-001",
        message: {
          inbox_id: "might-test@agentmail.to",
          thread_id: "unknown-thread",
          message_id: "agentmail-inbound-message-unknown-001",
          from: "coordinator@example.org",
          to: ["might-test@agentmail.to"],
          subject: "Re: Woodworking help",
          text: "Could we talk next Saturday?",
          timestamp: "2026-08-30T05:30:00.000Z",
        },
        thread: { thread_id: "unknown-thread" },
      },
    );
    expect(unknown).toEqual({ processed: false, reason: "unknown_thread" });
    await expect(
      t.query(api.connections.latest, { clientSessionKey: ownerKey }),
    ).resolves.toMatchObject({ status: "contacted", reply: null });

    const receivedArgs = {
      eventId: "agentmail-inbound-event-001",
      message: {
        inbox_id: "might-test@agentmail.to",
        thread_id: "agentmail-thread-001",
        message_id: "agentmail-inbound-message-001",
        from: "Repair Coordinator <coordinator@example.org>",
        to: ["Might <might-test@agentmail.to>"],
        subject: "Re: Woodworking help",
        text: "This sounds useful. Could Alex visit next Saturday?",
        timestamp: "2026-08-30T05:31:00.000Z",
      },
      thread: { thread_id: "agentmail-thread-001" },
    } as const;
    const first = await t.mutation(
      internal.agentMailInbound.onMessageReceived,
      receivedArgs,
    );
    const duplicate = await t.mutation(
      internal.agentMailInbound.onMessageReceived,
      receivedArgs,
    );
    expect(first).toMatchObject({ processed: true, reason: "replied" });
    expect(duplicate).toEqual({ processed: false, reason: "duplicate" });
    await expect(
      t.query(api.connections.latest, { clientSessionKey: ownerKey }),
    ).resolves.toMatchObject({
      id: interest.connectionId,
      status: "replied",
      sendCount: 1,
      mail: {
        id: sent.mailThreadId,
        status: "replied",
        threadId: "agentmail-thread-001",
        providerMessageId: "agentmail-outbound-message-001",
      },
      reply: {
        eventId: "agentmail-inbound-event-001",
        messageId: "agentmail-inbound-message-001",
        from: "Repair Coordinator <coordinator@example.org>",
        subject: "Re: Woodworking help",
        preview: "This sounds useful. Could Alex visit next Saturday?",
        receivedAt: Date.parse("2026-08-30T05:31:00.000Z"),
      },
    });

    const connected = await t.mutation(api.connections.confirmConnected, {
      clientSessionKey: ownerKey,
      connectionId: interest.connectionId,
      clientRequestId: "connection-confirm-connected-0001",
    });
    const connectedRetry = await t.mutation(
      api.connections.confirmConnected,
      {
        clientSessionKey: ownerKey,
        connectionId: interest.connectionId,
        clientRequestId: "connection-confirm-connected-0001",
      },
    );
    expect(connected.created).toBe(true);
    expect(connectedRetry).toEqual({
      continuationId: connected.continuationId,
      created: false,
    });
    await expect(
      t.query(api.connections.latest, { clientSessionKey: ownerKey }),
    ).resolves.toMatchObject({
      id: interest.connectionId,
      status: "connected",
      mail: { id: sent.mailThreadId, status: "connected" },
      reply: {
        eventId: "agentmail-inbound-event-001",
        preview: "This sounds useful. Could Alex visit next Saturday?",
      },
    });
  } finally {
    vi.unstubAllEnvs();
  }
});

test("forgetting a disclosed memory invalidates approval and blocks every retry", async () => {
  const t = initTest();
  const fixture = await seedSurfacedMatch(t, ownerKey);
  const interest = await t.mutation(api.connections.expressInterest, {
    clientSessionKey: ownerKey,
    matchId: fixture.matchId,
    clientRequestId: "connection-forget-interest-0001",
  });
  const pitchId = await t.mutation(
    internal.connections.commitGeneratedPitch,
    {
      pitchRunId: interest.pitchRunId,
      model: "test-pitch-model",
      responseId: "openai-pitch-forget-001",
      selectedMemoryIds: [fixture.memoryId],
      subject: "Woodworking help for your repair project",
      body:
        "Hello, I have ten years of woodworking experience and can volunteer on weekends. I would be glad to discuss whether that could help this project.",
    },
  );
  const initial = await t.query(api.connections.latest, {
    clientSessionKey: ownerKey,
  });
  if (!initial?.pitch) {
    throw new Error("Expected a generated pitch.");
  }
  const revised = await t.mutation(api.connections.reviseCurrentPitch, {
    clientSessionKey: ownerKey,
    connectionId: interest.connectionId,
    pitchId,
    recipientEmail: "repair@example.org",
    subject: initial.pitch.subject,
    body: initial.pitch.body,
  });
  const approvalArgs = {
    clientSessionKey: ownerKey,
    connectionId: interest.connectionId,
    pitchId,
    payloadHash: revised.payloadHash,
    recipientEmail: "repair@example.org",
    clientRequestId: "connection-forget-approval-0001",
  } as const;
  const approval = await t.mutation(
    api.connections.approveCurrentPitch,
    approvalArgs,
  );

  await t.mutation(api.memories.forget, {
    clientSessionKey: ownerKey,
    memoryId: fixture.memoryId,
  });

  await expect(
    t.query(api.connections.latest, { clientSessionKey: ownerKey }),
  ).resolves.toMatchObject({
    id: interest.connectionId,
    consentState: "awaiting_send_approval",
    hasValidSendApproval: false,
    canContact: false,
    sendCount: 0,
    pitch: {
      id: pitchId,
      canApprove: false,
    },
    approval: {
      id: approval.approvalId,
      isValid: false,
    },
  });
  await expect(
    t.mutation(api.connections.approveCurrentPitch, approvalArgs),
  ).rejects.toThrow(/selected memory is unavailable/i);
  await expect(
    t.mutation(api.connections.reviseCurrentPitch, {
      clientSessionKey: ownerKey,
      connectionId: interest.connectionId,
      pitchId,
      recipientEmail: "repair@example.org",
      subject: initial.pitch.subject,
      body: `${initial.pitch.body}\n\nThank you.`,
    }),
  ).rejects.toThrow(/selected memory is unavailable/i);
  await expect(
    t.mutation(api.connections.expressInterest, {
      clientSessionKey: ownerKey,
      matchId: fixture.matchId,
      clientRequestId: "connection-forget-interest-retry-0001",
    }),
  ).rejects.toThrow(/memory was forgotten|match is unavailable/i);
});
