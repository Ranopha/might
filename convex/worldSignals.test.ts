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

const browserAKey = "world-a-000000000000000000000000000000001";
const browserBKey = "world-b-000000000000000000000000000000002";
const browserCKey = "world-c-000000000000000000000000000000003";

function initTest() {
  const t = convexTest(schema, modules);
  agentTest.register(t);
  rateLimiterTest.register(t);
  return t;
}

test("one browser receives one traceable live world signal without leaking it to another browser", async () => {
  const t = initTest();
  await t.mutation(api.talk.ensureSession, {
    clientSessionKey: browserAKey,
  });
  await t.mutation(api.talk.ensureSession, {
    clientSessionKey: browserBKey,
  });

  const first = await t.mutation(api.worldSignals.requestScan, {
    clientSessionKey: browserAKey,
    clientRequestId: "world-scan-request-0001",
  });
  const retry = await t.mutation(api.worldSignals.requestScan, {
    clientSessionKey: browserAKey,
    clientRequestId: "world-scan-request-0001",
  });

  expect(first.created).toBe(true);
  expect(retry).toEqual({ runId: first.runId, created: false });
  await expect(
    t.query(api.worldSignals.latest, {
      clientSessionKey: browserBKey,
    }),
  ).resolves.toBeNull();

  await t.mutation(internal.worldSignals.commitInterpretedSignal, {
    runId: first.runId,
    providerRequestId: "firecrawl-request-001",
    sourceMode: "live",
    interpreterModel: "test-world-interpreter",
    interpreterResponseId: "openai-response-001",
    sourceUrl:
      "https://carpenter.org.tw/%E5%BF%97%E5%B7%A5%E5%A0%B1%E5%90%8D/",
    sourceTitle: "志工報名 - 桃園市木匠的家關懷協會",
    sourceDomain: "carpenter.org.tw",
    rawExcerpt:
      "協會需要家具修復與急難家庭房屋修繕的專業志工參與。",
    situation:
      "桃園的公益協會正在邀請具修繕經驗的志工協助家具與弱勢家庭房屋修復。",
    painOrFriction: "待修家具與急難家庭的修繕工作需要更多具實作經驗的人手。",
    desiredOutcome: "讓可用家具恢復使用，並改善急難家庭的居住環境。",
    needHypothesis: "需要能安全評估並動手處理家具或木作修繕的人。",
    location: "桃園市",
    timeContext: "持續招募",
    explicitness: "explicit_need",
    confidence: 0.96,
    evidence: [
      {
        url: "https://carpenter.org.tw/%E5%BF%97%E5%B7%A5%E5%A0%B1%E5%90%8D/",
        excerpt: "公益二手店需要家具修復，並協助急難家庭房屋修繕。",
      },
    ],
  });

  const latest = await t.query(api.worldSignals.latest, {
    clientSessionKey: browserAKey,
  });
  expect(latest).toMatchObject({
    runId: first.runId,
    status: "completed",
    errorCode: null,
    provenance: {
      provider: "firecrawl",
      sourceMode: "live",
      providerRequestId: "firecrawl-request-001",
      interpreterModel: "test-world-interpreter",
      interpreterResponseId: "openai-response-001",
    },
    signal: {
      sourceDomain: "carpenter.org.tw",
      situation:
        "桃園的公益協會正在邀請具修繕經驗的志工協助家具與弱勢家庭房屋修復。",
      explicitness: "explicit_need",
      confidence: 0.96,
      evidence: [
        {
          url: "https://carpenter.org.tw/%E5%BF%97%E5%B7%A5%E5%A0%B1%E5%90%8D/",
          excerpt: "公益二手店需要家具修復，並協助急難家庭房屋修繕。",
        },
      ],
    },
  });
});

test("public anonymous sessions share a strict sponsor-call budget", async () => {
  const t = initTest();
  for (const clientSessionKey of [browserAKey, browserBKey, browserCKey]) {
    await t.mutation(api.talk.ensureSession, { clientSessionKey });
  }

  await t.mutation(api.worldSignals.requestScan, {
    clientSessionKey: browserAKey,
    clientRequestId: "world-budget-request-0001",
  });
  await t.mutation(api.worldSignals.requestScan, {
    clientSessionKey: browserBKey,
    clientRequestId: "world-budget-request-0002",
  });
  await expect(
    t.mutation(api.worldSignals.requestScan, {
      clientSessionKey: browserCKey,
      clientRequestId: "world-budget-request-0003",
    }),
  ).rejects.toThrow(/world scan is resting/i);
});
