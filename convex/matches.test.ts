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
});
