"use node";

import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { env, type ActionCtx } from "./_generated/server";
import { decryptOpenAiApiKey } from "./openAiCredentialCrypto";

type Binding = {
  openAiCredentialSource?: "hackathon_demo" | "user_supplied";
  openAiCredentialId?: Id<"openAiCredentials"> | null;
  openAiCredentialVersion?: number | null;
};

export async function resolveOpenAiApiKey(
  ctx: ActionCtx,
  binding: Binding,
): Promise<{
  apiKey: string;
  source: "hackathon_demo" | "user_supplied";
  markUsed: () => Promise<void>;
}> {
  if (binding.openAiCredentialSource !== "user_supplied") {
    if (!env.OPENAI_API_KEY) throw new Error("OPENAI_CONFIGURATION_MISSING");
    return {
      apiKey: env.OPENAI_API_KEY,
      source: "hackathon_demo",
      markUsed: async () => undefined,
    };
  }
  if (
    binding.openAiCredentialId == null ||
    binding.openAiCredentialVersion == null ||
    !env.OPENAI_BYOK_ENCRYPTION_KEY
  ) {
    throw new Error("OPENAI_CONFIGURATION_MISSING");
  }
  const credential = await ctx.runQuery(
    internal.openAiCredentials.getEncryptedForUse,
    {
      credentialId: binding.openAiCredentialId,
      version: binding.openAiCredentialVersion,
    },
  );
  if (credential === null) throw new Error("OPENAI_CONFIGURATION_MISSING");
  const apiKey = await decryptOpenAiApiKey({
    ciphertext: credential.ciphertext,
    iv: credential.iv,
    encodedMasterKey: env.OPENAI_BYOK_ENCRYPTION_KEY,
    userId: credential.userId,
    version: credential.version,
  });
  return {
    apiKey,
    source: "user_supplied",
    markUsed: async () => {
      await ctx.runMutation(internal.openAiCredentials.markUsed, {
        credentialId: binding.openAiCredentialId!,
        version: binding.openAiCredentialVersion!,
      });
    },
  };
}
