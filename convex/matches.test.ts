/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import agentTest from "@convex-dev/agent/test";
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob([
  "./**/*.ts",
  "!./**/*.test.ts",
  "!./vitest.config.ts",
]);

const browserAKey = "match-a-000000000000000000000000000000001";
const browserBKey = "match-b-000000000000000000000000000000002";
const browserCKey = "match-c-000000000000000000000000000000003";
const browserDKey = "match-d-000000000000000000000000000000004";
const sourceUrl =
  "https://carpenter.org.tw/%E5%BF%97%E5%B7%A5%E5%A0%B1%E5%90%8D/";

function initTest() {
  const t = convexTest(schema, modules);
  agentTest.register(t);
  rateLimiterTest.register(t);
  return t;
}

test("one browser can receive one private source-backed match without granting consent", async () => {
  const t = initTest();
  for (const clientSessionKey of [browserAKey, browserBKey]) {
    await t.mutation(api.talk.ensureSession, { clientSessionKey });
  }

  const sourceMessage = await t.mutation(api.talk.appendUserMessage, {
    clientSessionKey: browserAKey,
    clientMessageId: "match-memory-message-0001",
    content:
      "I spent ten years woodworking and still own my tools, but I do not enjoy public speaking.",
  });
  const turn = await t.query(api.talk.latestTurn, {
    clientSessionKey: browserAKey,
  });
  if (turn === null) {
    throw new Error("Expected a processing Talk turn.");
  }
  await t.mutation(internal.memories.commitExtractedTurn, {
    turnId: turn.id,
    sourceMessageId: sourceMessage.id,
    assistantContent: "That gives me useful context.",
    replyModel: "test-reply-model",
    replyResponseId: "test-reply-response",
    extractionModel: "test-memory-model",
    extractionResponseId: "test-memory-response",
    memoryStatus: "completed",
    turnErrorCode: null,
    candidates: [
      {
        decision: "remember",
        aboutUser: true,
        statement: "I spent ten years woodworking and still own my tools.",
        semanticType: "experience",
        explicitness: "explicit",
        confidence: 0.98,
        freshness: "long_term",
      },
      {
        decision: "remember",
        aboutUser: true,
        statement: "I do not enjoy public speaking.",
        semanticType: "preference",
        explicitness: "explicit",
        confidence: 0.95,
        freshness: "long_term",
      },
    ],
  });
  const initialMemories = await t.query(api.memories.list, {
    clientSessionKey: browserAKey,
    limit: 10,
  });
  const woodworkingMemory = initialMemories.find((memory) =>
    memory.statement.includes("woodworking"),
  );
  const forgottenMemory = initialMemories.find((memory) =>
    memory.statement.includes("public speaking"),
  );
  if (!woodworkingMemory || !forgottenMemory) {
    throw new Error("Expected both source-linked memories.");
  }
  await t.mutation(api.memories.forget, {
    clientSessionKey: browserAKey,
    memoryId: forgottenMemory.id,
  });

  const worldRun = await t.mutation(api.worldSignals.requestScan, {
    clientSessionKey: browserAKey,
    clientRequestId: "match-world-request-0001",
  });
  const worldSignalId = await t.mutation(
    internal.worldSignals.commitInterpretedSignal,
    {
      runId: worldRun.runId,
      providerRequestId: "firecrawl-match-request-001",
      sourceMode: "live",
      interpreterModel: "test-world-interpreter",
      interpreterResponseId: "openai-world-response-001",
      sourceUrl,
      sourceTitle: "志工報名 - 桃園市木匠的家關懷協會",
      sourceDomain: "carpenter.org.tw",
      rawExcerpt: "協會需要家具修復與急難家庭房屋修繕的專業志工參與。",
      situation: "桃園的公益協會正在邀請具修繕經驗的志工協助家具與房屋修復。",
      painOrFriction: "修繕工作需要更多具實作經驗的人手。",
      desiredOutcome: "讓家具恢復使用，並改善家庭居住環境。",
      needHypothesis: "需要能安全評估並動手處理家具或木作修繕的人。",
      location: "桃園市",
      timeContext: "持續招募",
      explicitness: "explicit_need",
      confidence: 0.96,
      evidence: [
        {
          url: sourceUrl,
          excerpt: "公益二手店需要家具修復，並協助急難家庭房屋修繕。",
        },
      ],
    },
  );

  const first = await t.mutation(api.matches.requestMatch, {
    clientSessionKey: browserAKey,
    worldSignalId,
    clientRequestId: "match-request-0001",
  });
  const retry = await t.mutation(api.matches.requestMatch, {
    clientSessionKey: browserAKey,
    worldSignalId,
    clientRequestId: "match-request-0001",
  });
  expect(first.created).toBe(true);
  expect(retry).toEqual({ runId: first.runId, created: false });

  await expect(
    t.mutation(api.matches.requestMatch, {
      clientSessionKey: browserBKey,
      worldSignalId,
      clientRequestId: "match-request-foreign-0001",
    }),
  ).rejects.toThrow(/world signal is unavailable/i);
  await expect(
    t.query(api.matches.latest, { clientSessionKey: browserBKey }),
  ).resolves.toBeNull();

  await expect(
    t.mutation(internal.matches.commitJudgedMatch, {
      runId: first.runId,
      judgeModel: "test-serendipity-judge",
      judgeResponseId: "openai-match-response-invalid",
      relevantMemoryIds: [forgottenMemory.id],
      whyThisSituationMatters: "The public source describes repair work.",
      whyThisPersonCameToMind: "A forgotten memory must not support a match.",
      recommendation: "ask_user",
      riskLevel: "low",
      matchConfidence: 0.5,
      clarificationQuestion: "Would you like to explore this?",
    }),
  ).rejects.toThrow(/relevant memory is unavailable/i);

  await t.mutation(internal.matches.commitJudgedMatch, {
    runId: first.runId,
    judgeModel: "test-serendipity-judge",
    judgeResponseId: "openai-match-response-001",
    relevantMemoryIds: [woodworkingMemory.id],
    whyThisSituationMatters:
      "The association has a source-backed need for hands-on furniture and home repair help.",
    whyThisPersonCameToMind:
      "Your ten years of woodworking and access to tools may be useful for this repair work.",
    recommendation: "ask_user",
    riskLevel: "low",
    matchConfidence: 0.88,
    clarificationQuestion:
      "Would you be comfortable volunteering for furniture or home repair work in Taoyuan?",
  });

  const latest = await t.query(api.matches.latest, {
    clientSessionKey: browserAKey,
  });
  expect(latest).toMatchObject({
    runId: first.runId,
    worldSignalId,
    status: "completed",
    errorCode: null,
    provenance: {
      judgeModel: "test-serendipity-judge",
      judgeResponseId: "openai-match-response-001",
    },
    match: {
      worldSignal: {
        id: worldSignalId,
        sourceUrl,
        sourceTitle: "志工報名 - 桃園市木匠的家關懷協會",
        situation: "桃園的公益協會正在邀請具修繕經驗的志工協助家具與房屋修復。",
        evidence: [
          {
            url: sourceUrl,
            excerpt: "公益二手店需要家具修復，並協助急難家庭房屋修繕。",
          },
        ],
      },
      relevantMemories: [
        {
          id: woodworkingMemory.id,
          statement: "I spent ten years woodworking and still own my tools.",
          sourceMessageId: sourceMessage.id,
        },
      ],
      whyThisSituationMatters:
        "The association has a source-backed need for hands-on furniture and home repair help.",
      whyThisPersonCameToMind:
        "Your ten years of woodworking and access to tools may be useful for this repair work.",
      recommendation: "ask_user",
      riskLevel: "low",
      matchConfidence: 0.88,
      clarificationQuestion:
        "Would you be comfortable volunteering for furniture or home repair work in Taoyuan?",
      consentState: "not_requested",
      canContact: false,
    },
  });
  expect(latest?.match?.relevantMemories).toHaveLength(1);
  expect(latest?.match?.relevantMemories[0]?.id).not.toBe(forgottenMemory.id);

  const matchId = latest?.match?.id;
  if (!matchId) {
    throw new Error("Expected a needs-clarification match.");
  }
  let clarification = await t.mutation(
    api.matchClarifications.submitAnswer,
    {
      clientSessionKey: browserAKey,
      matchId,
      clientRequestId: "clarification-answer-request-0001",
      answer:
        "Yes. I would be comfortable volunteering, and I am usually available on weekends in Taoyuan.",
    },
  );
  const clarificationRetry = await t.mutation(
    api.matchClarifications.submitAnswer,
    {
      clientSessionKey: browserAKey,
      matchId,
      clientRequestId: "clarification-answer-request-0001",
      answer:
        "Yes. I would be comfortable volunteering, and I am usually available on weekends in Taoyuan.",
    },
  );
  expect(clarification.created).toBe(true);
  expect(clarificationRetry).toEqual({
    runId: clarification.runId,
    created: false,
  });
  const clarificationRetryWithNewRequest = await t.mutation(
    api.matchClarifications.submitAnswer,
    {
      clientSessionKey: browserAKey,
      matchId,
      clientRequestId: "clarification-answer-request-0002",
      answer:
        "Yes. I would be comfortable volunteering, and I am usually available on weekends in Taoyuan.",
    },
  );
  expect(clarificationRetryWithNewRequest).toEqual({
    runId: clarification.runId,
    created: false,
  });
  const failedRunId = clarification.runId;
  await t.mutation(internal.matchClarifications.failRun, { runId: failedRunId, errorCode: "CLARIFICATION_JUDGE_FAILED" });
  clarification = await t.mutation(api.matchClarifications.submitAnswer, {
    clientSessionKey: browserAKey, matchId, clientRequestId: "clarification-recovery-0003",
    answer: "Yes. I would be comfortable volunteering, and I am usually available on weekends in Taoyuan.",
  });
  expect(clarification.runId).not.toBe(failedRunId);
  await expect(
    t.mutation(api.matchClarifications.submitAnswer, {
      clientSessionKey: browserBKey,
      matchId,
      clientRequestId: "clarification-answer-foreign-0001",
      answer: "I can help.",
    }),
  ).rejects.toThrow(/match is unavailable/i);

  const processing = await t.query(api.matches.latest, {
    clientSessionKey: browserAKey,
  });
  expect(processing?.match?.clarification).toMatchObject({
    runId: clarification.runId,
    matchId,
    status: "processing",
    errorCode: null,
    question:
      "Would you be comfortable volunteering for furniture or home repair work in Taoyuan?",
    answer:
      "Yes. I would be comfortable volunteering, and I am usually available on weekends in Taoyuan.",
    privacy: "private",
    finalResult: null,
  });

  await t.mutation(internal.matchClarifications.commitFinalResult, {
    runId: clarification.runId,
    judgeModel: "test-clarification-judge",
    judgeResponseId: "openai-clarification-response-001",
    whyThisSituationMatters:
      "The public source still supports a real need for volunteer repair help.",
    whyThisPersonCameToMind:
      "Your woodworking experience now overlaps with your stated willingness and weekend availability.",
    recommendation: "surface",
    riskLevel: "low",
    matchConfidence: 0.94,
  });

  const final = await t.query(api.matches.latest, {
    clientSessionKey: browserAKey,
  });
  expect(final?.match).toMatchObject({
    id: matchId,
    status: "surfaced",
    consentState: "not_requested",
    canContact: false,
    clarification: {
      runId: clarification.runId,
      matchId,
      status: "completed",
      errorCode: null,
      question:
        "Would you be comfortable volunteering for furniture or home repair work in Taoyuan?",
      answer:
        "Yes. I would be comfortable volunteering, and I am usually available on weekends in Taoyuan.",
      privacy: "private",
      provenance: {
        judgeModel: "test-clarification-judge",
        judgeResponseId: "openai-clarification-response-001",
      },
      finalResult: {
        recommendation: "surface",
        status: "surfaced",
        riskLevel: "low",
        matchConfidence: 0.94,
        consentState: "not_requested",
        canContact: false,
      },
    },
  });
  await expect(
    t.mutation(api.matchClarifications.submitAnswer, {
      clientSessionKey: browserAKey,
      matchId,
      clientRequestId: "clarification-answer-request-after-final",
      answer:
        "Yes. I would be comfortable volunteering, and I am usually available on weekends in Taoyuan.",
    }),
  ).resolves.toEqual({ runId: clarification.runId, created: false });
});

test("forgotten match evidence fails closed and dismissal becomes terminal", async () => {
  const t = initTest();
  for (const clientSessionKey of [browserCKey, browserDKey]) {
    await t.mutation(api.talk.ensureSession, { clientSessionKey });
  }

  const fixture = await t.run(async (ctx) => {
    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", browserCKey),
      )
      .unique();
    if (session === null) {
      throw new Error("Expected browser C session.");
    }
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_anonymousSessionId_and_kind", (q) =>
        q.eq("anonymousSessionId", session._id).eq("kind", "primary"),
      )
      .unique();
    if (conversation === null) {
      throw new Error("Expected browser C conversation.");
    }
    const now = Date.now();
    const sourceMessageId = await ctx.db.insert("messages", {
      anonymousSessionId: session._id,
      conversationId: conversation._id,
      role: "user",
      content: "I have woodworking experience and tools.",
      source: "user_input",
      privacy: "private",
      clientMessageId: "dismiss-fixture-message-0001",
      sequence: conversation.nextMessageSequence,
      createdAt: now,
    });
    await ctx.db.patch("conversations", conversation._id, {
      nextMessageSequence: conversation.nextMessageSequence + 1,
      updatedAt: now,
    });
    const memoryId = await ctx.db.insert("memories", {
      anonymousSessionId: session._id,
      statement: "I have woodworking experience and tools.",
      normalizedStatement: "i have woodworking experience and tools.",
      semanticType: "experience",
      sourceMessageId,
      source: "conversation",
      explicitness: "explicit",
      confidence: 0.98,
      privacy: "private",
      freshness: "long_term",
      status: "active",
      extractionModel: "test-memory-model",
      extractionResponseId: "test-memory-response-dismiss",
      lastConfirmedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    const worldRunId = await ctx.db.insert("worldSignalRuns", {
      anonymousSessionId: session._id,
      clientRequestId: "dismiss-world-request-0001",
      sourceUrl,
      status: "processing",
      provider: "firecrawl",
      sourceMode: "live",
      providerRequestId: "firecrawl-dismiss-request-001",
      interpreterModel: "test-world-interpreter",
      interpreterResponseId: "openai-world-dismiss-001",
      signalId: null,
      errorCode: null,
      startedAt: now,
      updatedAt: now,
    });
    const worldSignalId = await ctx.db.insert("worldSignals", {
      anonymousSessionId: session._id,
      runId: worldRunId,
      sourceUrl,
      sourceTitle: "志工報名 - 桃園市木匠的家關懷協會",
      sourceDomain: "carpenter.org.tw",
      rawExcerpt: "協會需要家具修復志工。",
      situation: "桃園的公益協會正在邀請家具修復志工。",
      painOrFriction: "修復工作需要實作人手。",
      desiredOutcome: "讓家具恢復使用。",
      needHypothesis: "需要能處理木作修繕的人。",
      location: "桃園市",
      timeContext: "持續招募",
      explicitness: "explicit_need",
      confidence: 0.95,
      evidence: [{ url: sourceUrl, excerpt: "協會需要家具修復志工。" }],
      provider: "firecrawl",
      sourceMode: "live",
      providerRequestId: "firecrawl-dismiss-request-001",
      interpreterModel: "test-world-interpreter",
      interpreterResponseId: "openai-world-dismiss-001",
      createdAt: now,
    });
    await ctx.db.patch("worldSignalRuns", worldRunId, {
      status: "completed",
      signalId: worldSignalId,
      updatedAt: now,
    });
    const matchRunId = await ctx.db.insert("matchRuns", {
      anonymousSessionId: session._id,
      worldSignalId,
      clientRequestId: "dismiss-match-request-0001",
      candidateMemoryIds: [memoryId],
      status: "processing",
      judgeModel: "test-serendipity-judge",
      judgeResponseId: "openai-match-dismiss-001",
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
      whyThisSituationMatters: "The source describes a volunteer repair need.",
      whyThisPersonCameToMind: "The user has woodworking experience.",
      recommendation: "ask_user",
      riskLevel: "low",
      matchConfidence: 0.8,
      clarificationQuestion: "Would you want and have time to volunteer?",
      status: "needs_clarification",
      consentState: "not_requested",
      judgeModel: "test-serendipity-judge",
      judgeResponseId: "openai-match-dismiss-001",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch("matchRuns", matchRunId, {
      status: "completed",
      matchId,
      updatedAt: now,
    });
    return { matchId, memoryId };
  });

  await t.mutation(api.memories.forget, {
    clientSessionKey: browserCKey,
    memoryId: fixture.memoryId,
  });
  await expect(
    t.mutation(api.matchClarifications.submitAnswer, {
      clientSessionKey: browserCKey,
      matchId: fixture.matchId,
      clientRequestId: "forgotten-answer-request-0001",
      answer: "Yes, weekends work for me.",
    }),
  ).rejects.toThrow(/relevant memory is unavailable/i);
  await expect(
    t.mutation(api.matches.dismiss, {
      clientSessionKey: browserDKey,
      matchId: fixture.matchId,
    }),
  ).rejects.toThrow(/match is unavailable/i);

  const dismissed = await t.mutation(api.matches.dismiss, {
    clientSessionKey: browserCKey,
    matchId: fixture.matchId,
  });
  const dismissedRetry = await t.mutation(api.matches.dismiss, {
    clientSessionKey: browserCKey,
    matchId: fixture.matchId,
  });
  expect(dismissed.created).toBe(true);
  expect(dismissedRetry).toEqual({
    dismissalId: dismissed.dismissalId,
    created: false,
  });

  const latest = await t.query(api.matches.latest, {
    clientSessionKey: browserCKey,
  });
  expect(latest?.match).toMatchObject({
    id: fixture.matchId,
    status: "dismissed",
    consentState: "not_requested",
    canContact: false,
    canContinue: false,
    canAnswerClarification: false,
    canExpressInterest: false,
    dismissal: {
      id: dismissed.dismissalId,
      reason: "user_dismissed",
    },
  });
  await expect(
    t.mutation(api.matchClarifications.submitAnswer, {
      clientSessionKey: browserCKey,
      matchId: fixture.matchId,
      clientRequestId: "dismissed-answer-request-0001",
      answer: "I changed my mind.",
    }),
  ).rejects.toThrow(/not awaiting clarification/i);
});
