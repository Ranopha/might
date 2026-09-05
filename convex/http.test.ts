/// <reference types="vite/client" />
// @vitest-environment edge-runtime
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts", "!./vitest.config.ts"]);

test("Auth discovery resolves its real root JWKS while established API URLs stay protected", async () => {
  vi.stubEnv("CONVEX_SITE_URL", "https://might-test.convex.site");
  vi.stubEnv("JWKS", JSON.stringify({ keys: [{ kty: "RSA", use: "sig", n: "test-public-key", e: "AQAB" }] }));
  vi.stubEnv("AGENTMAIL_WEBHOOK_SECRET", "whsec_dGVzdC1zZWNyZXQ=");
  try {
    const t = convexTest(schema, modules);
    expect((await t.fetch("/api/health")).status).toBe(200);
    const discovery = await (await t.fetch("/.well-known/openid-configuration")).json();
    const jwks = await t.fetch(new URL(discovery.jwks_uri).pathname);
    expect(jwks.status).toBe(200);
    expect((await jwks.json()).keys).toHaveLength(1);
    expect((await t.fetch("/api/agentmail/webhook", { method: "POST", body: "{}" })).status).toBe(401);
    expect((await t.fetch("/api/openai/credential", { method: "POST", body: "{}" })).status).toBe(401);
  } finally { vi.unstubAllEnvs(); }
});
