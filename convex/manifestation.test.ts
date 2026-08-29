/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import agentTest from "@convex-dev/agent/test";
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const openAIMock = vi.hoisted(() => ({
  constructorError: null as Error | null,
  createResponse: vi.fn(),
  generateImage: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class OpenAIMock {
    constructor() {
      if (openAIMock.constructorError !== null) {
        throw openAIMock.constructorError;
      }
    }

    responses = { create: openAIMock.createResponse };
    images = { generate: openAIMock.generateImage };
  },
}));

const modules = import.meta.glob([
  "./**/*.ts",
  "!./**/*.test.ts",
  "!./vitest.config.ts",
]);

const browserAKey = "manifest-a-0000000000000000000000000000001";
const browserBKey = "manifest-b-0000000000000000000000000000002";
const browserCKey = "manifest-c-0000000000000000000000000000003";

function initTest() {
  const t = convexTest(schema, modules);
  agentTest.register(t);
  rateLimiterTest.register(t);
  return t;
}

beforeEach(() => {
  openAIMock.constructorError = null;
  openAIMock.createResponse.mockReset();
  openAIMock.generateImage.mockReset();
  vi.stubEnv("OPENAI_API_KEY", "test-key-never-sent");
});

afterEach(() => vi.unstubAllEnvs());

test("settles the lifecycle when the provider runtime rejects unexpectedly", async () => {
  const t = initTest();
  openAIMock.constructorError = new Error(
    "provider runtime rejected before a mapped API response",
  );

  const request = {
    clientSessionKey: browserAKey,
    clientRequestId: "manifest-runtime-failure-000000001",
    description: "A patient pocket-sized sky guide.",
  };

  await expect(t.action(api.manifestation.generate, request)).resolves.toMatchObject(
    {
      status: "failed",
      imageUrl: null,
      errorCode: "PROVIDER_ACTION_FAILED",
    },
  );
  await expect(
    t.query(api.manifestation.current, {
      clientSessionKey: browserAKey,
    }),
  ).resolves.toMatchObject({
    status: "failed",
    imageUrl: null,
    errorCode: "PROVIDER_ACTION_FAILED",
  });
});

test("turns a famous-IP reference into an original brief before storing the generated asset", async () => {
  const t = initTest();
  const safeArtBrief =
    "An original tiny nocturnal guardian with a crescent-shaped travel cloak, warm amber eyes, rounded proportions, and an invented constellation clasp; no logos, franchise symbols, or recognizable costume elements.";
  const adaptationNote =
    "Kept the brave, gentle night-guardian mood while replacing recognizable character and costume elements with an original design.";

  openAIMock.createResponse.mockResolvedValueOnce({
    _request_id: "req_text_public_seam",
    output_text: JSON.stringify({
      artBrief: safeArtBrief,
      adaptationNote,
    }),
  });
  openAIMock.generateImage.mockResolvedValueOnce({
    _request_id: "req_image_public_seam",
    data: [{ b64_json: "cG5nLXRlc3QtYnl0ZXM=" }],
  });

  const generated = await t.action(api.manifestation.generate, {
    clientSessionKey: browserAKey,
    clientRequestId: "manifest-public-request-0000000001",
    description: "A baby Batman who feels brave but gentle.",
  });

  expect(generated).toMatchObject({
    status: "ready",
    description: "A baby Batman who feels brave but gentle.",
    artBrief: safeArtBrief,
    adaptationNote,
    imageUrl: expect.any(String),
    textModel: "gpt-5.6-luna",
    imageModel: "gpt-image-2",
    errorCode: null,
  });
  const imageCall = openAIMock.generateImage.mock.calls[0]?.[0];
  expect(imageCall).toMatchObject({
    model: "gpt-image-2",
    size: "1024x1024",
    quality: "medium",
    output_format: "png",
  });
  expect(imageCall.prompt).toContain(safeArtBrief);
  expect(imageCall.prompt).not.toMatch(/batman/i);

  const persisted = await t.run(async (ctx) => {
    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", browserAKey),
      )
      .unique();
    if (session === null) return null;
    return await ctx.db
      .query("companionManifestations")
      .withIndex("by_anonymousSessionId_and_clientRequestId", (q) =>
        q
          .eq("anonymousSessionId", session._id)
          .eq("clientRequestId", "manifest-public-request-0000000001"),
      )
      .unique();
  });
  expect(persisted).toMatchObject({
    status: "ready",
    textRequestId: "req_text_public_seam",
    imageRequestId: "req_image_public_seam",
    storageId: expect.any(String),
  });
});

test("one private session reuses an active companion generation", async () => {
  const t = initTest();
  let releaseBrief: ((value: unknown) => void) | undefined;
  const pendingBrief = new Promise((resolve) => {
    releaseBrief = resolve;
  });
  openAIMock.createResponse.mockReturnValueOnce(pendingBrief);
  openAIMock.generateImage.mockResolvedValueOnce({
    _request_id: "req_image_single_active",
    data: [{ b64_json: "cG5nLXRlc3QtYnl0ZXM=" }],
  });

  const firstGeneration = t.action(api.manifestation.generate, {
    clientSessionKey: browserCKey,
    clientRequestId: "manifest-active-request-000000001",
    description: "A bright little guide with a warm sunrise cloak.",
  });
  await vi.waitFor(() => {
    expect(openAIMock.createResponse).toHaveBeenCalledTimes(1);
  });

  try {
    const reused = await t.action(api.manifestation.generate, {
      clientSessionKey: browserCKey,
      clientRequestId: "manifest-active-request-000000002",
      description: "A second request that must reuse the active companion.",
    });
    expect(reused).toMatchObject({
      status: "generating_brief",
      description: "A bright little guide with a warm sunrise cloak.",
    });
    expect(openAIMock.createResponse).toHaveBeenCalledTimes(1);
    expect(openAIMock.generateImage).not.toHaveBeenCalled();

    releaseBrief?.({
      _request_id: "req_text_single_active",
      output_text: JSON.stringify({
        artBrief:
          "An original sunrise guide with warm amber eyes and an invented soft coral cloak.",
        adaptationNote:
          "Kept the bright guiding mood in a wholly original companion design.",
      }),
    });
    const ready = await firstGeneration;
    expect(ready.id).toBe(reused.id);
    expect(ready.status).toBe("ready");
  } finally {
    releaseBrief?.({
      _request_id: "req_text_single_active_cleanup",
      output_text: JSON.stringify({
        artBrief:
          "An original sunrise guide with warm amber eyes and an invented soft coral cloak.",
        adaptationNote:
          "Kept the bright guiding mood in a wholly original companion design.",
      }),
    });
    await firstGeneration;
  }
});

test("all anonymous sessions share a strict companion-generation burst budget", async () => {
  const t = initTest();
  openAIMock.createResponse.mockResolvedValue({
    _request_id: "req_text_budget",
    output_text: JSON.stringify({
      artBrief:
        "An original bright pocket guide with amber eyes and a coral travel cloak.",
      adaptationNote:
        "Kept the warm companion mood in a wholly original character design.",
    }),
  });
  openAIMock.generateImage.mockResolvedValue({
    _request_id: "req_image_budget",
    data: [{ b64_json: "cG5nLXRlc3QtYnl0ZXM=" }],
  });

  for (let index = 0; index < 3; index += 1) {
    await t.action(api.manifestation.generate, {
      clientSessionKey: `manifest-budget-${index}-${"0".repeat(32)}`,
      clientRequestId: `manifest-budget-request-00000000${index}`,
      description: `Original bright companion number ${index}.`,
    });
  }

  await expect(
    t.action(api.manifestation.generate, {
      clientSessionKey: `manifest-budget-3-${"0".repeat(32)}`,
      clientRequestId: "manifest-budget-request-000000003",
      description: "This request must not reach image generation.",
    }),
  ).rejects.toThrow(/generation is resting/i);
  expect(openAIMock.createResponse).toHaveBeenCalledTimes(3);
  expect(openAIMock.generateImage).toHaveBeenCalledTimes(3);
});

test("persists one session-private generated companion and reuses a client request", async () => {
  const t = initTest();

  await t.mutation(api.talk.ensureSession, {
    clientSessionKey: browserAKey,
  });

  const first = await t.mutation(internal.manifestation.beginGeneration, {
    clientSessionKey: browserAKey,
    clientRequestId: "manifest-request-0000000000000001",
    description: "A baby Batman who feels brave but gentle.",
    textModel: "gpt-5.6-luna",
    imageModel: "gpt-image-2",
  });
  const replay = await t.mutation(internal.manifestation.beginGeneration, {
    clientSessionKey: browserAKey,
    clientRequestId: "manifest-request-0000000000000001",
    description: "A baby Batman who feels brave but gentle.",
    textModel: "gpt-5.6-luna",
    imageModel: "gpt-image-2",
  });

  expect(first.shouldGenerate).toBe(true);
  expect(replay).toEqual({
    manifestationId: first.manifestationId,
    shouldGenerate: false,
  });

  const storageId = await t.run(async (ctx) =>
    ctx.storage.store(new Blob(["png-test-bytes"], { type: "image/png" })),
  );

  await t.mutation(internal.manifestation.markBriefGenerated, {
    manifestationId: first.manifestationId,
    artBrief:
      "An original tiny nocturnal guardian with a gentle cape-like silhouette, warm eyes, and no logos or franchise elements.",
    adaptationNote:
      "Kept the brave, gentle night-guardian mood while replacing the recognizable character with an original design.",
    textRequestId: "resp_text_test",
  });
  await t.mutation(internal.manifestation.completeGeneration, {
    manifestationId: first.manifestationId,
    artBrief:
      "An original tiny nocturnal guardian with a gentle cape-like silhouette, warm eyes, and no logos or franchise elements.",
    adaptationNote:
      "Kept the brave, gentle night-guardian mood while replacing the recognizable character with an original design.",
    storageId,
    textRequestId: "resp_text_test",
    imageRequestId: "req_image_test",
  });

  const currentA = await t.query(api.manifestation.current, {
    clientSessionKey: browserAKey,
  });
  const currentB = await t.query(api.manifestation.current, {
    clientSessionKey: browserBKey,
  });

  expect(currentA).toMatchObject({
    id: first.manifestationId,
    status: "ready",
    description: "A baby Batman who feels brave but gentle.",
    artBrief: expect.stringContaining("original"),
    adaptationNote: expect.stringContaining("recognizable character"),
    imageUrl: expect.any(String),
    textModel: "gpt-5.6-luna",
    imageModel: "gpt-image-2",
    errorCode: null,
  });
  expect(currentB).toBeNull();
});

test("keeps the orb fallback when generation fails", async () => {
  const t = initTest();
  openAIMock.createResponse.mockRejectedValueOnce({
    request_id: "req_text_failed",
  });

  const failed = await t.action(api.manifestation.generate, {
    clientSessionKey: browserBKey,
    clientRequestId: "manifest-request-0000000000000002",
    description: "A small lantern spirit.",
  });

  expect(failed).toMatchObject({
    status: "failed",
    imageUrl: null,
    errorCode: "ART_BRIEF_GENERATION_FAILED",
  });
  expect(openAIMock.generateImage).not.toHaveBeenCalled();
  await expect(
    t.query(api.manifestation.current, {
      clientSessionKey: browserBKey,
    }),
  ).resolves.toEqual(failed);
});
