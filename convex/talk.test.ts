/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob([
  "./**/*.ts",
  "!./**/*.test.ts",
  "!./vitest.config.ts",
]);

const browserAKey = "browser-a-00000000000000000000000000000001";
const browserBKey = "browser-b-00000000000000000000000000000002";
const unknownBrowserKey = "unknown-000000000000000000000000000000003";

test("keeps anonymous browser conversations isolated and ordered", async () => {
  const t = convexTest(schema, modules);

  await expect(t.query(api.talk.status, {})).resolves.toEqual({
    status: "live",
    backend: "convex",
    seam: "talk-persistence-v1",
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
    content: "I manage a convenience store.",
  });
  await t.mutation(api.talk.appendUserMessage, {
    clientSessionKey: browserAKey,
    content: "I used to do woodworking for ten years.",
  });
  await t.mutation(api.talk.appendUserMessage, {
    clientSessionKey: browserBKey,
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
