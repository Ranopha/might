/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import agentTest from "@convex-dev/agent/test";
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob([
  "./**/*.ts",
  "!./**/*.test.ts",
  "!./vitest.config.ts",
]);

const ownerKey = "connection-owner-000000000000000000000000001";
const strangerKey = "connection-stranger-00000000000000000000001";

function initTest() {
  const t = convexTest(schema, modules);
  agentTest.register(t);
  rateLimiterTest.register(t);
  return t;
}

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
