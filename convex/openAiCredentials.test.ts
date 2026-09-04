/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import agentTest from "@convex-dev/agent/test";
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import { decryptOpenAiApiKey, encryptOpenAiApiKey } from "./openAiCredentialCrypto";
import schema from "./schema";

const modules = import.meta.glob([
  "./**/*.ts",
  "!./**/*.test.ts",
  "!./vitest.config.ts",
]);

const roomA = "byok-room-a-0000000000000000000000000000001";
const roomB = "byok-room-b-0000000000000000000000000000002";
const masterKey = btoa(String.fromCharCode(...Array.from({ length: 32 }, (_, i) => i + 1)));
const testApiKey = ["sk", "project", "this-is-only-a-test-secret"].join("-");

function initTest() {
  const t = convexTest(schema, modules);
  agentTest.register(t);
  rateLimiterTest.register(t);
  return t;
}

test("encrypts a personal OpenAI key with account and version bound as AAD", async () => {
  const sealed = await encryptOpenAiApiKey({
    apiKey: testApiKey,
    encodedMasterKey: masterKey,
    userId: "user-a",
    version: 7,
  });

  expect(sealed.ciphertext).not.toContain("test-secret");
  await expect(
    decryptOpenAiApiKey({
      ...sealed,
      encodedMasterKey: masterKey,
      userId: "user-a",
      version: 7,
    }),
  ).resolves.toBe(testApiKey);
  await expect(
    decryptOpenAiApiKey({
      ...sealed,
      encodedMasterKey: masterKey,
      userId: "user-b",
      version: 7,
    }),
  ).rejects.toThrow();
  await expect(
    decryptOpenAiApiKey({
      ...sealed,
      encodedMasterKey: masterKey,
      userId: "user-a",
      version: 8,
    }),
  ).rejects.toThrow();
});

test("links one account, binds its credential per OpenAI run, and falls back after sign-out", async () => {
  const t = initTest();
  await t.mutation(api.talk.ensureSession, { clientSessionKey: roomA });
  await t.mutation(api.talk.ensureSession, { clientSessionKey: roomB });
  const { userA, userB } = await t.run(async (ctx) => ({
    userA: await ctx.db.insert("users", { email: "a@example.test" }),
    userB: await ctx.db.insert("users", { email: "b@example.test" }),
  }));
  const asA = t.withIdentity({
    subject: `${userA}|session-a`,
    tokenIdentifier: "might-test-a",
  });
  const asB = t.withIdentity({
    subject: `${userB}|session-b`,
    tokenIdentifier: "might-test-b",
  });

  await expect(
    t.query(api.openAiCredentials.current, { clientSessionKey: roomA }),
  ).resolves.toMatchObject({ authenticated: false, configured: false });
  await expect(
    asA.mutation(api.openAiCredentials.claimSession, { clientSessionKey: roomA }),
  ).resolves.toEqual({ linked: true });
  await expect(
    asB.mutation(api.openAiCredentials.claimSession, { clientSessionKey: roomA }),
  ).rejects.toThrow("already linked");

  const sealed = await encryptOpenAiApiKey({
    apiKey: ["sk", "project", "personal-test-9876"].join("-"),
    encodedMasterKey: masterKey,
    userId: userA,
    version: 10,
  });
  await expect(
    asB.mutation(internal.openAiCredentials.storeEncrypted, {
      userId: userA,
      ciphertext: sealed.ciphertext,
      iv: sealed.iv,
      version: 10,
      lastFour: "9876",
      verifiedModel: "test-model",
      verificationResponseId: "response-owner-rejected",
      verifiedAt: 1000,
    }),
  ).rejects.toThrow("ownership");
  const stored = await asA.mutation(internal.openAiCredentials.storeEncrypted, {
    userId: userA,
    ciphertext: sealed.ciphertext,
    iv: sealed.iv,
    version: 10,
    lastFour: "9876",
    verifiedModel: "test-model",
    verificationResponseId: "response-test-1",
    verifiedAt: 1000,
  });
  await expect(
    asA.query(api.openAiCredentials.current, { clientSessionKey: roomA }),
  ).resolves.toMatchObject({
    authenticated: true,
    roomLinked: true,
    configured: true,
    lastFour: "9876",
  });

  await asA.mutation(api.talk.appendUserMessage, {
    clientSessionKey: roomA,
    clientMessageId: "byok-message-a-1",
    content: "Remember that I enjoy repairing old wooden chairs.",
  });
  const authenticatedTurn = await t.run(async (ctx) =>
    ctx.db.query("talkTurns").order("desc").first(),
  );
  expect(authenticatedTurn).toMatchObject({
    openAiCredentialSource: "user_supplied",
    openAiCredentialId: stored.credentialId,
    openAiCredentialVersion: 10,
  });
  await t.mutation(internal.talk.failTurn, {
    turnId: authenticatedTurn!._id,
    errorCode: "TURN_COMMIT_FAILED",
  });

  await t.mutation(api.talk.appendUserMessage, {
    clientSessionKey: roomA,
    clientMessageId: "byok-message-a-2",
    content: "This message starts after the account signs out.",
  });
  const signedOutTurn = await t.run(async (ctx) =>
    ctx.db.query("talkTurns").order("desc").first(),
  );
  expect(signedOutTurn?.openAiCredentialSource).toBe("hackathon_demo");
  expect(signedOutTurn?.openAiCredentialId).toBeUndefined();

  await expect(asB.mutation(api.openAiCredentials.remove, {})).resolves.toEqual({
    removed: false,
  });
  await expect(asA.mutation(api.openAiCredentials.remove, {})).resolves.toEqual({
    removed: true,
  });
  const messages = await t.query(api.talk.listMessages, {
    clientSessionKey: roomA,
    limit: 20,
  });
  expect(messages).toHaveLength(2);
  await expect(
    asA.query(api.openAiCredentials.current, { clientSessionKey: roomA }),
  ).resolves.toMatchObject({ configured: false, roomLinked: true });
});
