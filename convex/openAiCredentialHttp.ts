import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { env, httpAction } from "./_generated/server";
import { encryptOpenAiApiKey } from "./openAiCredentialCrypto";

const DEFAULT_TEXT_MODEL = "gpt-5.6-luna";
const jsonHeaders = {
  "cache-control": "no-store, max-age=0",
  "content-type": "application/json; charset=utf-8",
  pragma: "no-cache",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function validApiKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 20 &&
    value.length <= 512 &&
    value.startsWith("sk-") &&
    !/\s/.test(value)
  );
}

export const saveOpenAiCredential = httpAction(async (ctx, request) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return json({ error: "Sign in first." }, 401);
  if (!env.OPENAI_BYOK_ENCRYPTION_KEY) {
    return json({ error: "The personal-key vault is not configured." }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const apiKey =
    typeof body === "object" && body !== null && "apiKey" in body
      ? (body as { apiKey?: unknown }).apiKey
      : undefined;
  if (!validApiKey(apiKey)) {
    return json({ error: "Enter a valid OpenAI project key." }, 400);
  }

  try {
    await ctx.runMutation(internal.openAiCredentials.reserveVerification, {});
  } catch {
    return json({ error: "Too many verification attempts. Try again later." }, 429);
  }

  const model = env.OPENAI_TEXT_MODEL ?? DEFAULT_TEXT_MODEL;
  let verification: Response;
  try {
    verification = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: "Reply with the single word ready.",
        max_output_tokens: 16,
        store: false,
      }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    return json({ error: "OpenAI could not be reached. The key was not saved." }, 502);
  }
  if (!verification.ok) {
    const status = verification.status === 401 || verification.status === 403 ? 400 : 502;
    return json(
      {
        error:
          status === 400
            ? "OpenAI rejected this key. Check its project and permissions."
            : "OpenAI could not verify this key right now. It was not saved.",
      },
      status,
    );
  }
  const verificationReceipt = (await verification.json().catch(() => null)) as
    | { id?: unknown }
    | null;
  const verificationResponseId =
    typeof verificationReceipt?.id === "string"
      ? verificationReceipt.id.slice(0, 256)
      : null;

  const version = Date.now() * 1000 + crypto.getRandomValues(new Uint16Array(1))[0] % 1000;
  let encrypted: { ciphertext: string; iv: string };
  try {
    encrypted = await encryptOpenAiApiKey({
      apiKey,
      encodedMasterKey: env.OPENAI_BYOK_ENCRYPTION_KEY,
      userId,
      version,
    });
  } catch {
    return json({ error: "The personal-key vault could not seal this key." }, 503);
  }
  const verifiedAt = Date.now();
  await ctx.runMutation(internal.openAiCredentials.storeEncrypted, {
    userId,
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    version,
    lastFour: apiKey.slice(-4),
    verifiedModel: model,
    verificationResponseId,
    verifiedAt,
  });
  return json({ configured: true, lastFour: apiKey.slice(-4), model, verifiedAt });
});
