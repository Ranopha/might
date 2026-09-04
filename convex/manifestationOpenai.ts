"use node";

import OpenAI from "openai";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import {
  internalAction,
  type ActionCtx,
} from "./_generated/server";
import { resolveOpenAiApiKey } from "./openAiCredentialRuntime";

const MAX_ART_BRIEF_LENGTH = 8_000;
const MAX_ADAPTATION_NOTE_LENGTH = 2_000;
const MAX_IMAGE_BASE64_LENGTH = 25_000_000;

const ART_DIRECTION = `Create one original companion character in a polished Webtoon-style digital illustration. The companion must feel warm, expressive, approachable, imaginative, and clearly non-photorealistic. Use clean line art, soft cel shading, strong silhouette readability, stylized proportions, and modern consumer-app polish. Avoid flat corporate SVG art, generic vector mascot styling, cheap stickers, photorealism, cinematic realism, uncanny human features, logos, text, watermarks, and recognizable copyrighted character design. Preserve only the requested mood and emotional direction. The composition must read clearly as both a large onboarding hero and a small chat portrait. Center one full character on a simple atmospheric background with generous breathing room.`;

const ART_BRIEF_SYSTEM_PROMPT = `You are Might's companion art director. Convert the user's description into a production-ready, copyright-safe prompt for an image model.

The result must describe an original character. If the user references a known character, franchise, celebrity, brand, logo, signature costume, or other protected design, retain only abstract emotional qualities, mood, broad archetype, color atmosphere, and energy. Replace all recognizable names, logos, insignia, costume shapes, props, facial features, and franchise-specific elements with original choices. Do not repeat protected character or franchise names in artBrief. Never claim the result is an imitation or variation of existing IP.

artBrief must be concrete enough to guide image generation and must follow this art direction:
${ART_DIRECTION}

adaptationNote must briefly and warmly explain what emotional direction was preserved and that recognizable elements were replaced. Do not provide legal advice.`;

function normalizeGeneratedText(
  value: unknown,
  name: string,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw new Error(`${name} is missing.`);
  }
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > maxLength) {
    throw new Error(`${name} has an invalid length.`);
  }
  return normalized;
}

function readRequestId(value: unknown): string | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  for (const key of ["_request_id", "request_id"]) {
    const requestId = candidate[key];
    if (typeof requestId === "string" && requestId.length > 0) {
      return requestId.slice(0, 256);
    }
  }
  return null;
}

function decodeBase64Png(base64: string): Blob {
  if (
    base64.length === 0 ||
    base64.length > MAX_IMAGE_BASE64_LENGTH ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)
  ) {
    throw new Error("Image payload is not valid base64.");
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: "image/png" });
}

async function persistFailure(
  ctx: ActionCtx,
  args: {
    manifestationId: Id<"companionManifestations">;
    errorCode:
      | "OPENAI_CONFIGURATION_MISSING"
      | "ART_BRIEF_GENERATION_FAILED"
      | "IMAGE_GENERATION_FAILED"
      | "IMAGE_RESPONSE_INVALID"
      | "STORAGE_WRITE_FAILED";
    textRequestId: string | null;
    imageRequestId: string | null;
    artBrief: string | null;
    adaptationNote: string | null;
  },
): Promise<void> {
  await ctx.runMutation(internal.manifestation.failGeneration, args);
}

export const generateAssets = internalAction({
  args: {
    manifestationId: v.id("companionManifestations"),
    description: v.string(),
    textModel: v.string(),
    imageModel: v.string(),
    openAiCredentialSource: v.union(
      v.literal("hackathon_demo"),
      v.literal("user_supplied"),
    ),
    openAiCredentialId: v.union(v.id("openAiCredentials"), v.null()),
    openAiCredentialVersion: v.union(v.number(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    let credential: Awaited<ReturnType<typeof resolveOpenAiApiKey>>;
    try {
      credential = await resolveOpenAiApiKey(ctx, args);
    } catch {
      await persistFailure(ctx, {
        manifestationId: args.manifestationId,
        errorCode: "OPENAI_CONFIGURATION_MISSING",
        textRequestId: null,
        imageRequestId: null,
        artBrief: null,
        adaptationNote: null,
      });
      return null;
    }

    // SDK construction is intentionally outside the mapped provider catches.
    // The public wrapper owns the final catch-all lifecycle transition.
    const openai = new OpenAI({ apiKey: credential.apiKey });
    let artBrief: string;
    let adaptationNote: string;
    let textRequestId: string | null = null;

    try {
      const response = await openai.responses.create({
        model: args.textModel,
        input: [
          { role: "system", content: ART_BRIEF_SYSTEM_PROMPT },
          {
            role: "user",
            content: `User description:\n${args.description}`,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "might_companion_art_brief",
            description:
              "An original, copyright-safe companion art brief and a concise adaptation note.",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                artBrief: { type: "string" },
                adaptationNote: { type: "string" },
              },
              required: ["artBrief", "adaptationNote"],
            },
          },
          verbosity: "low",
        },
      });
      textRequestId = readRequestId(response);
      await credential.markUsed().catch(() => undefined);
      const parsed: unknown = JSON.parse(response.output_text);
      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("Art brief response is not an object.");
      }
      const result = parsed as Record<string, unknown>;
      artBrief = normalizeGeneratedText(
        result.artBrief,
        "artBrief",
        MAX_ART_BRIEF_LENGTH,
      );
      adaptationNote = normalizeGeneratedText(
        result.adaptationNote,
        "adaptationNote",
        MAX_ADAPTATION_NOTE_LENGTH,
      );

      await ctx.runMutation(internal.manifestation.markBriefGenerated, {
        manifestationId: args.manifestationId,
        artBrief,
        adaptationNote,
        textRequestId,
      });
    } catch (error: unknown) {
      textRequestId ??= readRequestId(error);
      await persistFailure(ctx, {
        manifestationId: args.manifestationId,
        errorCode: "ART_BRIEF_GENERATION_FAILED",
        textRequestId,
        imageRequestId: null,
        artBrief: null,
        adaptationNote: null,
      });
      return null;
    }

    let imageResponse: Awaited<ReturnType<typeof openai.images.generate>>;
    try {
      imageResponse = await openai.images.generate({
        model: args.imageModel,
        prompt: `${ART_DIRECTION}\n\nSpecific original character brief:\n${artBrief}`,
        n: 1,
        size: "1024x1024",
        quality: "medium",
        output_format: "png",
      });
    } catch (error: unknown) {
      await persistFailure(ctx, {
        manifestationId: args.manifestationId,
        errorCode: "IMAGE_GENERATION_FAILED",
        textRequestId,
        imageRequestId: readRequestId(error),
        artBrief,
        adaptationNote,
      });
      return null;
    }

    const imageRequestId = readRequestId(imageResponse);
    const base64 = imageResponse.data?.[0]?.b64_json;
    let image: Blob;
    try {
      if (typeof base64 !== "string") {
        throw new Error("OpenAI did not return image bytes.");
      }
      image = decodeBase64Png(base64);
    } catch {
      await persistFailure(ctx, {
        manifestationId: args.manifestationId,
        errorCode: "IMAGE_RESPONSE_INVALID",
        textRequestId,
        imageRequestId,
        artBrief,
        adaptationNote,
      });
      return null;
    }

    let storageId: Id<"_storage">;
    try {
      storageId = await ctx.storage.store(image);
    } catch {
      await persistFailure(ctx, {
        manifestationId: args.manifestationId,
        errorCode: "STORAGE_WRITE_FAILED",
        textRequestId,
        imageRequestId,
        artBrief,
        adaptationNote,
      });
      return null;
    }

    try {
      await ctx.runMutation(internal.manifestation.completeGeneration, {
        manifestationId: args.manifestationId,
        artBrief,
        adaptationNote,
        storageId,
        textRequestId,
        imageRequestId,
      });
    } catch (error: unknown) {
      try {
        await ctx.storage.delete(storageId);
      } catch {
        // The public wrapper still settles the database lifecycle fail-closed.
      }
      throw error;
    }

    return null;
  },
});
