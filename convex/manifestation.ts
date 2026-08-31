import { ConvexError, type Infer, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import {
  action,
  env,
  internalMutation,
  internalQuery,
  query,
  type ActionCtx,
  type QueryCtx,
} from "./_generated/server";
import { abuseProtection } from "./abuseProtection";

const DEFAULT_TEXT_MODEL = "gpt-5.6-luna";
const DEFAULT_IMAGE_MODEL = "gpt-image-2";

const MIN_SESSION_KEY_LENGTH = 32;
const MAX_SESSION_KEY_LENGTH = 256;
const MIN_REQUEST_ID_LENGTH = 16;
const MAX_REQUEST_ID_LENGTH = 128;
const MAX_COMPANION_NAME_LENGTH = 40;
const MAX_DESCRIPTION_LENGTH = 1_000;
const MAX_ART_BRIEF_LENGTH = 8_000;
const MAX_ADAPTATION_NOTE_LENGTH = 2_000;

const manifestationStatusValidator = v.union(
  v.literal("generating_brief"),
  v.literal("generating_image"),
  v.literal("ready"),
  v.literal("failed"),
);

const manifestationErrorCodeValidator = v.union(
  v.literal("OPENAI_CONFIGURATION_MISSING"),
  v.literal("PROVIDER_ACTION_FAILED"),
  v.literal("ART_BRIEF_GENERATION_FAILED"),
  v.literal("IMAGE_GENERATION_FAILED"),
  v.literal("IMAGE_RESPONSE_INVALID"),
  v.literal("STORAGE_WRITE_FAILED"),
);

const nullableStringValidator = v.union(v.string(), v.null());

const manifestationViewValidator = v.object({
  id: v.id("companionManifestations"),
  name: v.string(),
  status: manifestationStatusValidator,
  description: v.string(),
  artBrief: nullableStringValidator,
  adaptationNote: nullableStringValidator,
  imageUrl: nullableStringValidator,
  textModel: v.string(),
  imageModel: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  errorCode: v.union(manifestationErrorCodeValidator, v.null()),
});

type ManifestationView = Infer<typeof manifestationViewValidator>;

function assertClientSessionKey(clientSessionKey: string): void {
  if (
    clientSessionKey.length < MIN_SESSION_KEY_LENGTH ||
    clientSessionKey.length > MAX_SESSION_KEY_LENGTH ||
    clientSessionKey.trim() !== clientSessionKey ||
    /\s/.test(clientSessionKey)
  ) {
    throw new ConvexError("Invalid anonymous session key.");
  }
}

function assertClientRequestId(clientRequestId: string): void {
  if (
    clientRequestId.length < MIN_REQUEST_ID_LENGTH ||
    clientRequestId.length > MAX_REQUEST_ID_LENGTH ||
    clientRequestId.trim() !== clientRequestId ||
    /\s/.test(clientRequestId)
  ) {
    throw new ConvexError("Invalid manifestation request id.");
  }
}

function normalizeDescription(description: string): string {
  const normalized = description.trim();
  if (
    normalized.length === 0 ||
    normalized.length > MAX_DESCRIPTION_LENGTH
  ) {
    throw new ConvexError(
      "Companion description must be between 1 and 1000 characters.",
    );
  }
  return normalized;
}

function normalizeCompanionName(name: string | undefined): string {
  const normalized = name?.trim() || "Might";
  const hasControlCharacter = Array.from(normalized).some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f);
  });
  if (
    normalized.length > MAX_COMPANION_NAME_LENGTH ||
    hasControlCharacter
  ) {
    throw new ConvexError(
      "Companion name must be between 1 and 40 visible characters.",
    );
  }
  return normalized;
}

function normalizeModel(model: string | undefined, fallback: string): string {
  const normalized = model?.trim();
  return normalized ? normalized : fallback;
}

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

async function toManifestationView(
  ctx: QueryCtx,
  manifestation: Doc<"companionManifestations">,
): Promise<ManifestationView> {
  const imageUrl =
    manifestation.storageId === null
      ? null
      : await ctx.storage.getUrl(manifestation.storageId);

  return {
    id: manifestation._id,
    name: manifestation.name ?? "Might",
    status: manifestation.status,
    description: manifestation.description,
    artBrief: manifestation.artBrief,
    adaptationNote: manifestation.adaptationNote,
    imageUrl,
    textModel: manifestation.textModel,
    imageModel: manifestation.imageModel,
    createdAt: manifestation.createdAt,
    updatedAt: manifestation.updatedAt,
    errorCode: manifestation.errorCode,
  };
}

export const current = query({
  args: {
    clientSessionKey: v.string(),
  },
  returns: v.union(manifestationViewValidator, v.null()),
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);

    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", args.clientSessionKey),
      )
      .unique();
    if (session === null) {
      return null;
    }

    const manifestation = await ctx.db
      .query("companionManifestations")
      .withIndex("by_anonymousSessionId_and_updatedAt", (q) =>
        q.eq("anonymousSessionId", session._id),
      )
      .order("desc")
      .first();

    return manifestation === null
      ? null
      : await toManifestationView(ctx, manifestation);
  },
});

export const getOwnedById = internalQuery({
  args: {
    clientSessionKey: v.string(),
    manifestationId: v.id("companionManifestations"),
  },
  returns: v.union(manifestationViewValidator, v.null()),
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", args.clientSessionKey),
      )
      .unique();
    if (session === null) {
      return null;
    }

    const manifestation = await ctx.db.get(
      "companionManifestations",
      args.manifestationId,
    );
    if (
      manifestation === null ||
      manifestation.anonymousSessionId !== session._id
    ) {
      return null;
    }
    return await toManifestationView(ctx, manifestation);
  },
});

export const beginGeneration = internalMutation({
  args: {
    clientSessionKey: v.string(),
    clientRequestId: v.string(),
    name: v.optional(v.string()),
    description: v.string(),
    textModel: v.string(),
    imageModel: v.string(),
  },
  returns: v.object({
    manifestationId: v.id("companionManifestations"),
    shouldGenerate: v.boolean(),
  }),
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    assertClientRequestId(args.clientRequestId);
    const name = normalizeCompanionName(args.name);
    const description = normalizeDescription(args.description);
    const now = Date.now();

    const existingSession = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", args.clientSessionKey),
      )
      .unique();
    if (existingSession === null) {
      const sessionBudget = await abuseProtection.limit(
        ctx,
        "anonymousSessionCreation",
      );
      if (!sessionBudget.ok) {
        throw new ConvexError(
          "New private sessions are resting for a moment. Please try again shortly.",
        );
      }
    }
    const sessionId =
      existingSession?._id ??
      (await ctx.db.insert("anonymousSessions", {
        clientSessionKey: args.clientSessionKey,
        createdAt: now,
        lastActiveAt: now,
      }));

    const existing = await ctx.db
      .query("companionManifestations")
      .withIndex("by_anonymousSessionId_and_clientRequestId", (q) =>
        q
          .eq("anonymousSessionId", sessionId)
          .eq("clientRequestId", args.clientRequestId),
      )
      .unique();
    if (existing !== null) {
      if (
        existing.description !== description ||
        (existing.name ?? "Might") !== name
      ) {
        throw new ConvexError(
          "A manifestation request id cannot be reused with a new name or description.",
        );
      }
      return {
        manifestationId: existing._id,
        shouldGenerate: false,
      };
    }

    const ready = await ctx.db
      .query("companionManifestations")
      .withIndex(
        "by_anonymousSessionId_and_status_and_updatedAt",
        (q) =>
          q
            .eq("anonymousSessionId", sessionId)
            .eq("status", "ready"),
      )
      .order("desc")
      .first();
    if (ready !== null) {
      return { manifestationId: ready._id, shouldGenerate: false };
    }

    const generatingImage = await ctx.db
      .query("companionManifestations")
      .withIndex(
        "by_anonymousSessionId_and_status_and_updatedAt",
        (q) =>
          q
            .eq("anonymousSessionId", sessionId)
            .eq("status", "generating_image"),
      )
      .order("desc")
      .first();
    const generatingBrief = await ctx.db
      .query("companionManifestations")
      .withIndex(
        "by_anonymousSessionId_and_status_and_updatedAt",
        (q) =>
          q
            .eq("anonymousSessionId", sessionId)
            .eq("status", "generating_brief"),
      )
      .order("desc")
      .first();
    const active = generatingImage ?? generatingBrief;
    if (active !== null) {
      return { manifestationId: active._id, shouldGenerate: false };
    }

    const failedAttempts = await ctx.db
      .query("companionManifestations")
      .withIndex(
        "by_anonymousSessionId_and_status_and_updatedAt",
        (q) =>
          q
            .eq("anonymousSessionId", sessionId)
            .eq("status", "failed"),
      )
      .order("desc")
      .take(3);
    if (failedAttempts.length >= 3) {
      throw new ConvexError(
        "Companion generation is paused for this private session after repeated failures.",
      );
    }

    const burstBudget = await abuseProtection.limit(
      ctx,
      "manifestationBurst",
    );
    const dailyBudget = await abuseProtection.limit(
      ctx,
      "manifestationDaily",
    );
    if (!burstBudget.ok || !dailyBudget.ok) {
      throw new ConvexError(
        "Companion generation is resting for a moment. Please try again shortly.",
      );
    }

    if (existingSession !== null) {
      await ctx.db.patch("anonymousSessions", sessionId, {
        lastActiveAt: now,
      });
    }

    const manifestationId = await ctx.db.insert("companionManifestations", {
      anonymousSessionId: sessionId,
      clientRequestId: args.clientRequestId,
      name,
      status: "generating_brief",
      description,
      artBrief: null,
      adaptationNote: null,
      storageId: null,
      textModel: args.textModel,
      imageModel: args.imageModel,
      textRequestId: null,
      imageRequestId: null,
      errorCode: null,
      createdAt: now,
      updatedAt: now,
    });

    return { manifestationId, shouldGenerate: true };
  },
});

export const markBriefGenerated = internalMutation({
  args: {
    manifestationId: v.id("companionManifestations"),
    artBrief: v.string(),
    adaptationNote: v.string(),
    textRequestId: nullableStringValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const manifestation = await ctx.db.get(
      "companionManifestations",
      args.manifestationId,
    );
    if (manifestation === null) {
      throw new ConvexError("Manifestation request is unavailable.");
    }
    if (manifestation.status !== "generating_brief") {
      throw new ConvexError("Manifestation art brief is no longer pending.");
    }

    const artBrief = normalizeGeneratedText(
      args.artBrief,
      "artBrief",
      MAX_ART_BRIEF_LENGTH,
    );
    const adaptationNote = normalizeGeneratedText(
      args.adaptationNote,
      "adaptationNote",
      MAX_ADAPTATION_NOTE_LENGTH,
    );
    await ctx.db.patch("companionManifestations", manifestation._id, {
      status: "generating_image",
      artBrief,
      adaptationNote,
      textRequestId: args.textRequestId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const completeGeneration = internalMutation({
  args: {
    manifestationId: v.id("companionManifestations"),
    artBrief: v.string(),
    adaptationNote: v.string(),
    storageId: v.id("_storage"),
    textRequestId: nullableStringValidator,
    imageRequestId: nullableStringValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const manifestation = await ctx.db.get(
      "companionManifestations",
      args.manifestationId,
    );
    if (manifestation === null) {
      throw new ConvexError("Manifestation request is unavailable.");
    }
    if (manifestation.status === "ready") {
      return null;
    }
    if (manifestation.status !== "generating_image") {
      throw new ConvexError("Manifestation request is not active.");
    }

    const artBrief = normalizeGeneratedText(
      args.artBrief,
      "artBrief",
      MAX_ART_BRIEF_LENGTH,
    );
    const adaptationNote = normalizeGeneratedText(
      args.adaptationNote,
      "adaptationNote",
      MAX_ADAPTATION_NOTE_LENGTH,
    );
    await ctx.db.patch("companionManifestations", manifestation._id, {
      status: "ready",
      artBrief,
      adaptationNote,
      storageId: args.storageId,
      textRequestId: args.textRequestId,
      imageRequestId: args.imageRequestId,
      errorCode: null,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const failGeneration = internalMutation({
  args: {
    manifestationId: v.id("companionManifestations"),
    errorCode: manifestationErrorCodeValidator,
    textRequestId: nullableStringValidator,
    imageRequestId: nullableStringValidator,
    artBrief: nullableStringValidator,
    adaptationNote: nullableStringValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const manifestation = await ctx.db.get(
      "companionManifestations",
      args.manifestationId,
    );
    if (manifestation === null) {
      throw new ConvexError("Manifestation request is unavailable.");
    }
    if (manifestation.status === "ready") {
      return null;
    }

    await ctx.db.patch("companionManifestations", manifestation._id, {
      status: "failed",
      artBrief: args.artBrief,
      adaptationNote: args.adaptationNote,
      storageId: null,
      textRequestId: args.textRequestId,
      imageRequestId: args.imageRequestId,
      errorCode: args.errorCode,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const failUnexpectedGeneration = internalMutation({
  args: {
    manifestationId: v.id("companionManifestations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const manifestation = await ctx.db.get(
      "companionManifestations",
      args.manifestationId,
    );
    if (
      manifestation === null ||
      manifestation.status === "ready" ||
      manifestation.status === "failed"
    ) {
      return null;
    }

    await ctx.db.patch("companionManifestations", manifestation._id, {
      status: "failed",
      storageId: null,
      errorCode: "PROVIDER_ACTION_FAILED",
      updatedAt: Date.now(),
    });
    return null;
  },
});

async function readOwnedView(
  ctx: ActionCtx,
  clientSessionKey: string,
  manifestationId: Id<"companionManifestations">,
): Promise<ManifestationView> {
  const view: ManifestationView | null = await ctx.runQuery(
    internal.manifestation.getOwnedById,
    { clientSessionKey, manifestationId },
  );
  if (view === null) {
    throw new ConvexError("Manifestation request is unavailable.");
  }
  return view;
}

export const generate = action({
  args: {
    clientSessionKey: v.string(),
    name: v.optional(v.string()),
    description: v.string(),
    clientRequestId: v.string(),
  },
  returns: manifestationViewValidator,
  handler: async (ctx, args): Promise<ManifestationView> => {
    assertClientSessionKey(args.clientSessionKey);
    assertClientRequestId(args.clientRequestId);
    const name = normalizeCompanionName(args.name);
    const description = normalizeDescription(args.description);
    const textModel = normalizeModel(env.OPENAI_TEXT_MODEL, DEFAULT_TEXT_MODEL);
    const imageModel = normalizeModel(
      env.OPENAI_IMAGE_MODEL,
      DEFAULT_IMAGE_MODEL,
    );

    const started: {
      manifestationId: Id<"companionManifestations">;
      shouldGenerate: boolean;
    } = await ctx.runMutation(internal.manifestation.beginGeneration, {
      clientSessionKey: args.clientSessionKey,
      clientRequestId: args.clientRequestId,
      name,
      description,
      textModel,
      imageModel,
    });

    if (!started.shouldGenerate) {
      return await readOwnedView(
        ctx,
        args.clientSessionKey,
        started.manifestationId,
      );
    }

    try {
      await ctx.runAction(internal.manifestationOpenai.generateAssets, {
        manifestationId: started.manifestationId,
        description,
        textModel,
        imageModel,
      });
    } catch {
      await ctx.runMutation(
        internal.manifestation.failUnexpectedGeneration,
        { manifestationId: started.manifestationId },
      );
    }

    return await readOwnedView(
      ctx,
      args.clientSessionKey,
      started.manifestationId,
    );
  },
});
