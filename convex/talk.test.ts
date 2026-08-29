/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import agentTest from "@convex-dev/agent/test";
import { convexTest } from "convex-test";
import type { FunctionArgs } from "convex/server";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob([
  "./**/*.ts",
  "!./**/*.test.ts",
  "!./vitest.config.ts",
]);

const browserAKey = "browser-a-00000000000000000000000000000001";
const browserBKey = "browser-b-00000000000000000000000000000002";
const unknownBrowserKey = "unknown-000000000000000000000000000000003";

function initTest() {
  const t = convexTest(schema, modules);
  agentTest.register(t);
  return t;
}

test("keeps anonymous browser conversations isolated and ordered", async () => {
  const t = initTest();

  await expect(t.query(api.talk.status, {})).resolves.toEqual({
    status: "live",
    backend: "convex",
    seam: "talk-memory-v1",
  });

  const browserA = await t.mutation(api.talk.ensureSession, {
    clientSessionKey: browserAKey,
  });
  const browserAAgain = await t.mutation(api.talk.ensureSession, {
    clientSessionKey: browserAKey,
  });
  const browserB = await t.mutation(api.talk.ensureSession, {
    clientSessionKey: browserBKey,
  });

  expect(browserAAgain.sessionId).toBe(browserA.sessionId);
  expect(browserAAgain.conversationId).toBe(browserA.conversationId);
  expect(browserAAgain.createdSession).toBe(false);
  expect(browserAAgain.createdConversation).toBe(false);
  expect(browserB.sessionId).not.toBe(browserA.sessionId);

  await t.mutation(api.talk.appendUserMessage, {
    clientSessionKey: browserAKey,
    clientMessageId: "message-a-1",
    content: "I manage a convenience store.",
  });
  await t.mutation(api.talk.appendUserMessage, {
    clientSessionKey: browserAKey,
    clientMessageId: "message-a-2",
    content: "I used to do woodworking for ten years.",
  });
  await t.mutation(api.talk.appendUserMessage, {
    clientSessionKey: browserBKey,
    clientMessageId: "message-b-1",
    content: "This belongs only to browser B.",
  });

  const browserAMessages = await t.query(api.talk.listMessages, {
    clientSessionKey: browserAKey,
    limit: 50,
  });
  const browserBMessages = await t.query(api.talk.listMessages, {
    clientSessionKey: browserBKey,
    limit: 50,
  });
  const unknownMessages = await t.query(api.talk.listMessages, {
    clientSessionKey: unknownBrowserKey,
    limit: 50,
  });

  expect(browserAMessages.map((message) => message.content)).toEqual([
    "I manage a convenience store.",
    "I used to do woodworking for ten years.",
  ]);
  expect(browserAMessages.map((message) => message.sequence)).toEqual([0, 1]);
  expect(
    browserAMessages.every((message) => message.privacy === "private"),
  ).toBe(true);
  expect(browserBMessages).toHaveLength(1);
  expect(browserBMessages[0].content).toBe("This belongs only to browser B.");
  expect(unknownMessages).toEqual([]);
});

test("a completed turn adds one sourced private memory and ignores trivial chatter", async () => {
  const t = initTest();

  await t.mutation(api.talk.ensureSession, {
    clientSessionKey: browserAKey,
  });
  const sourceMessage = await t.mutation(api.talk.appendUserMessage, {
    clientSessionKey: browserAKey,
    clientMessageId: "message-memory-1",
    content:
      "I manage a convenience store now, but I did woodworking for ten years and still own my tools.",
  });
  const processingTurn = await t.query(api.talk.latestTurn, {
    clientSessionKey: browserAKey,
  });
  expect(processingTurn).not.toBeNull();

  const commitArgs: FunctionArgs<
    typeof internal.memories.commitExtractedTurn
  > = {
    turnId: processingTurn!.id,
    sourceMessageId: sourceMessage.id,
    assistantContent:
      "Ten years is a long time. Do you still build anything on weekends?",
    replyModel: "test-reply-model",
    replyResponseId: "reply-test-1",
    extractionModel: "test-memory-model",
    extractionResponseId: "memory-test-1",
    memoryStatus: "completed",
    turnErrorCode: null,
    candidates: [
      {
        decision: "remember",
        aboutUser: true,
        statement: "You spent around ten years doing woodworking.",
        semanticType: "experience",
        explicitness: "explicit",
        confidence: 0.98,
        freshness: "long_term",
      },
      {
        decision: "ignore",
        aboutUser: true,
        statement: "You used the word but.",
        semanticType: "other",
        explicitness: "explicit",
        confidence: 0.99,
        freshness: "unknown",
      },
      {
        decision: "remember",
        aboutUser: false,
        statement: "Someone else owns woodworking tools.",
        semanticType: "resource",
        explicitness: "inferred",
        confidence: 0.75,
        freshness: "unknown",
      },
    ],
  };
  await t.mutation(internal.memories.commitExtractedTurn, commitArgs);
  await t.mutation(internal.memories.commitExtractedTurn, commitArgs);

  const messages = await t.query(api.talk.listMessages, {
    clientSessionKey: browserAKey,
    limit: 50,
  });
  const memories = await t.query(api.memories.list, {
    clientSessionKey: browserAKey,
    limit: 20,
  });
  const completedTurn = await t.query(api.talk.latestTurn, {
    clientSessionKey: browserAKey,
  });

  expect(messages.map((message) => [message.role, message.content])).toEqual([
    [
      "user",
      "I manage a convenience store now, but I did woodworking for ten years and still own my tools.",
    ],
    [
      "assistant",
      "Ten years is a long time. Do you still build anything on weekends?",
    ],
  ]);
  expect(memories).toHaveLength(1);
  expect(memories[0]).toMatchObject({
    statement: "You spent around ten years doing woodworking.",
    sourceMessageId: sourceMessage.id,
    semanticType: "experience",
    explicitness: "explicit",
    privacy: "private",
    status: "active",
  });
  expect(completedTurn).toMatchObject({
    id: processingTurn!.id,
    status: "completed",
    errorCode: null,
  });
});

test("a client turn is idempotent and enters one asynchronous processing state", async () => {
  const t = initTest();

  await t.mutation(api.talk.ensureSession, {
    clientSessionKey: browserAKey,
  });
  const first = await t.mutation(api.talk.appendUserMessage, {
    clientSessionKey: browserAKey,
    clientMessageId: "message-idempotent-1",
    content: "I still have all of my woodworking tools.",
  });
  const retry = await t.mutation(api.talk.appendUserMessage, {
    clientSessionKey: browserAKey,
    clientMessageId: "message-idempotent-1",
    content: "I still have all of my woodworking tools.",
  });
  const latestTurn = await t.query(api.talk.latestTurn, {
    clientSessionKey: browserAKey,
  });
  const messages = await t.query(api.talk.listMessages, {
    clientSessionKey: browserAKey,
    limit: 50,
  });

  expect(first.id).toBe(retry.id);
  expect(first.created).toBe(true);
  expect(retry.created).toBe(false);
  expect(messages).toHaveLength(1);
  expect(latestTurn).toMatchObject({
    sourceMessageId: first.id,
    status: "processing",
  });
});

test("memory controls confirm, correct, and forget only inside the owning session", async () => {
  const t = initTest();
  await t.mutation(api.talk.ensureSession, {
    clientSessionKey: browserAKey,
  });
  await t.mutation(api.talk.ensureSession, {
    clientSessionKey: browserBKey,
  });
  const sourceMessage = await t.mutation(api.talk.appendUserMessage, {
    clientSessionKey: browserAKey,
    clientMessageId: "message-controls-1",
    content: "I used to do woodworking for around ten years.",
  });
  const processingTurn = await t.query(api.talk.latestTurn, {
    clientSessionKey: browserAKey,
  });
  expect(processingTurn).not.toBeNull();
  await t.mutation(internal.memories.commitExtractedTurn, {
    turnId: processingTurn!.id,
    sourceMessageId: sourceMessage.id,
    assistantContent: "Do you ever still build things now?",
    replyModel: "test-reply-model",
    replyResponseId: "reply-controls-1",
    extractionModel: "test-memory-model",
    extractionResponseId: "memory-controls-1",
    memoryStatus: "completed",
    turnErrorCode: null,
    candidates: [
      {
        decision: "remember",
        aboutUser: true,
        statement: "You spent around ten years doing woodworking.",
        semanticType: "experience",
        explicitness: "explicit",
        confidence: 0.98,
        freshness: "long_term",
      },
    ],
  });
  const [memory] = await t.query(api.memories.list, {
    clientSessionKey: browserAKey,
    limit: 20,
  });

  await expect(
    t.mutation(api.memories.forget, {
      clientSessionKey: browserBKey,
      memoryId: memory.id,
    }),
  ).rejects.toThrow();

  const confirmed = await t.mutation(api.memories.confirm, {
    clientSessionKey: browserAKey,
    memoryId: memory.id,
  });
  expect(confirmed.lastConfirmedAt).toEqual(expect.any(Number));

  const corrected = await t.mutation(api.memories.edit, {
    clientSessionKey: browserAKey,
    memoryId: memory.id,
    statement: "You have about ten years of woodworking experience.",
  });
  expect(corrected).toMatchObject({
    statement: "You have about ten years of woodworking experience.",
    source: "user_edit",
    explicitness: "explicit",
    confidence: 1,
  });

  await t.mutation(api.memories.forget, {
    clientSessionKey: browserAKey,
    memoryId: memory.id,
  });
  await expect(
    t.query(api.memories.list, {
      clientSessionKey: browserAKey,
      limit: 20,
    }),
  ).resolves.toEqual([]);
});
