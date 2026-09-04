import { ConvexError, v } from "convex/values";
import { MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components, internal } from "./_generated/api";
import {
  env,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { selectOpenAiCredential } from "./openAiCredentialPolicy";

const DEMO_SOURCE_URL =
  "https://carpenter.org.tw/%E5%BF%97%E5%B7%A5%E5%A0%B1%E5%90%8D/";
const DEFAULT_TEXT_MODEL = "gpt-5.6-luna";
const MIN_SESSION_KEY_LENGTH = 32;
const MAX_SESSION_KEY_LENGTH = 256;
const MIN_CLIENT_REQUEST_ID_LENGTH = 8;
const MAX_CLIENT_REQUEST_ID_LENGTH = 128;
const MAX_FAILED_SCANS_PER_SESSION = 3;

const rateLimiter = new RateLimiter(components.rateLimiter, {
  worldScan: { kind: "fixed window", rate: 2, period: MINUTE },
});

const runStatusValidator = v.union(
  v.literal("processing"),
  v.literal("completed"),
  v.literal("failed"),
);

const sourceModeValidator = v.union(
  v.null(),
  v.literal("live"),
  v.literal("cached"),
  v.literal("unknown"),
);

const runErrorValidator = v.union(
  v.null(),
  v.literal("FIRECRAWL_SCRAPE_FAILED"),
  v.literal("SOURCE_RESPONSE_INVALID"),
  v.literal("OPENAI_CONFIGURATION_MISSING"),
  v.literal("WORLD_INTERPRETATION_FAILED"),
  v.literal("WORLD_SIGNAL_COMMIT_FAILED"),
);

const explicitnessValidator = v.union(
  v.literal("explicit_need"),
  v.literal("inferred_need"),
);

const evidenceValidator = v.object({
  url: v.string(),
  excerpt: v.string(),
});

const signalViewValidator = v.object({
  id: v.id("worldSignals"),
  sourceUrl: v.string(),
  sourceTitle: v.string(),
  sourceDomain: v.string(),
  rawExcerpt: v.string(),
  situation: v.string(),
  painOrFriction: v.string(),
  desiredOutcome: v.string(),
  needHypothesis: v.string(),
  location: v.string(),
  timeContext: v.string(),
  explicitness: explicitnessValidator,
  confidence: v.number(),
  evidence: v.array(evidenceValidator),
  createdAt: v.number(),
});

const latestViewValidator = v.object({
  runId: v.id("worldSignalRuns"),
  status: runStatusValidator,
  errorCode: runErrorValidator,
  startedAt: v.number(),
  updatedAt: v.number(),
  provenance: v.object({
    provider: v.literal("firecrawl"),
    sourceMode: sourceModeValidator,
    providerRequestId: v.union(v.string(), v.null()),
    interpreterModel: v.string(),
    interpreterResponseId: v.union(v.string(), v.null()),
  }),
  signal: v.union(v.null(), signalViewValidator),
});

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

function normalizeClientRequestId(clientRequestId: string): string {
  const normalized = clientRequestId.trim();
  if (
    normalized.length < MIN_CLIENT_REQUEST_ID_LENGTH ||
    normalized.length > MAX_CLIENT_REQUEST_ID_LENGTH ||
    normalized !== clientRequestId ||
    /\s/.test(normalized)
  ) {
    throw new ConvexError("Invalid world-scan request id.");
  }
  return normalized;
}

function assertBoundedText(
  value: string,
  label: string,
  maxLength: number,
): void {
  if (value.trim() !== value || value.length === 0 || value.length > maxLength) {
    throw new ConvexError(`Invalid ${label}.`);
  }
}

function containsContactDetails(value: string): boolean {
  return (
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value) ||
    /(?:\+?886[-\s]?)?0\d{1,2}[-\s]?\d{6,8}/.test(value)
  );
}

export const requestScan = mutation({
  args: {
    clientSessionKey: v.string(),
    clientRequestId: v.string(),
  },
  returns: v.object({
    runId: v.id("worldSignalRuns"),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    const clientRequestId = normalizeClientRequestId(args.clientRequestId);
    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", args.clientSessionKey),
      )
      .unique();
    if (session === null) {
      throw new ConvexError("Anonymous session has not been initialized.");
    }

    const existing = await ctx.db
      .query("worldSignalRuns")
      .withIndex("by_anonymousSessionId_and_clientRequestId", (q) =>
        q
          .eq("anonymousSessionId", session._id)
          .eq("clientRequestId", clientRequestId),
      )
      .unique();
    if (existing !== null) {
      return { runId: existing._id, created: false };
    }

    const recentRuns = await ctx.db
      .query("worldSignalRuns")
      .withIndex("by_anonymousSessionId_and_updatedAt", (q) =>
        q.eq("anonymousSessionId", session._id),
      )
      .order("desc")
      .take(MAX_FAILED_SCANS_PER_SESSION + 1);
    const reusable = recentRuns.find((run) => run.status !== "failed");
    if (reusable) {
      return { runId: reusable._id, created: false };
    }
    if (recentRuns.length >= MAX_FAILED_SCANS_PER_SESSION) {
      throw new ConvexError(
        "Might has paused world scans for this private session after repeated failures.",
      );
    }

    const budget = await rateLimiter.limit(ctx, "worldScan");
    if (!budget.ok) {
      throw new ConvexError(
        "The world scan is resting for a moment. Please try again shortly.",
      );
    }

    const now = Date.now();
    const openAiCredential = await selectOpenAiCredential(ctx, session);
    const runId = await ctx.db.insert("worldSignalRuns", {
      anonymousSessionId: session._id,
      clientRequestId,
      sourceUrl: DEMO_SOURCE_URL,
      status: "processing",
      provider: "firecrawl",
      sourceMode: null,
      providerRequestId: null,
      interpreterModel: env.OPENAI_TEXT_MODEL ?? DEFAULT_TEXT_MODEL,
      ...openAiCredential,
      interpreterResponseId: null,
      signalId: null,
      errorCode: null,
      startedAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.worldSensor.scanSource, { runId });
    return { runId, created: true };
  },
});

export const latest = query({
  args: {
    clientSessionKey: v.string(),
  },
  returns: v.union(v.null(), latestViewValidator),
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

    const run = await ctx.db
      .query("worldSignalRuns")
      .withIndex("by_anonymousSessionId_and_updatedAt", (q) =>
        q.eq("anonymousSessionId", session._id),
      )
      .order("desc")
      .first();
    if (run === null) {
      return null;
    }

    const signal = run.signalId ? await ctx.db.get("worldSignals", run.signalId) : null;
    return {
      runId: run._id,
      status: run.status,
      errorCode: run.errorCode,
      startedAt: run.startedAt,
      updatedAt: run.updatedAt,
      provenance: {
        provider: "firecrawl" as const,
        sourceMode: run.sourceMode,
        providerRequestId: run.providerRequestId,
        interpreterModel: run.interpreterModel,
        interpreterResponseId: run.interpreterResponseId,
      },
      signal:
        signal === null
          ? null
          : {
              id: signal._id,
              sourceUrl: signal.sourceUrl,
              sourceTitle: signal.sourceTitle,
              sourceDomain: signal.sourceDomain,
              rawExcerpt: signal.rawExcerpt,
              situation: signal.situation,
              painOrFriction: signal.painOrFriction,
              desiredOutcome: signal.desiredOutcome,
              needHypothesis: signal.needHypothesis,
              location: signal.location,
              timeContext: signal.timeContext,
              explicitness: signal.explicitness,
              confidence: signal.confidence,
              evidence: signal.evidence,
              createdAt: signal.createdAt,
            },
    };
  },
});

export const getRunForAction = internalQuery({
  args: {
    runId: v.id("worldSignalRuns"),
  },
  returns: v.union(
    v.null(),
    v.object({
      runId: v.id("worldSignalRuns"),
      anonymousSessionId: v.id("anonymousSessions"),
      sourceUrl: v.string(),
      status: runStatusValidator,
      interpreterModel: v.string(),
      openAiCredentialSource: v.union(
        v.literal("hackathon_demo"),
        v.literal("user_supplied"),
      ),
      openAiCredentialId: v.union(v.id("openAiCredentials"), v.null()),
      openAiCredentialVersion: v.union(v.number(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const run = await ctx.db.get("worldSignalRuns", args.runId);
    if (run === null) {
      return null;
    }
    return {
      runId: run._id,
      anonymousSessionId: run.anonymousSessionId,
      sourceUrl: run.sourceUrl,
      status: run.status,
      interpreterModel: run.interpreterModel,
      openAiCredentialSource:
        run.openAiCredentialSource ?? "hackathon_demo",
      openAiCredentialId: run.openAiCredentialId ?? null,
      openAiCredentialVersion: run.openAiCredentialVersion ?? null,
    };
  },
});

export const commitInterpretedSignal = internalMutation({
  args: {
    runId: v.id("worldSignalRuns"),
    providerRequestId: v.union(v.string(), v.null()),
    sourceMode: v.union(
      v.literal("live"),
      v.literal("cached"),
      v.literal("unknown"),
    ),
    interpreterModel: v.string(),
    interpreterResponseId: v.union(v.string(), v.null()),
    sourceUrl: v.string(),
    sourceTitle: v.string(),
    sourceDomain: v.string(),
    rawExcerpt: v.string(),
    situation: v.string(),
    painOrFriction: v.string(),
    desiredOutcome: v.string(),
    needHypothesis: v.string(),
    location: v.string(),
    timeContext: v.string(),
    explicitness: explicitnessValidator,
    confidence: v.number(),
    evidence: v.array(evidenceValidator),
  },
  returns: v.id("worldSignals"),
  handler: async (ctx, args) => {
    const run = await ctx.db.get("worldSignalRuns", args.runId);
    if (run === null) {
      throw new ConvexError("World-signal run is unavailable.");
    }
    if (run.status === "completed" && run.signalId !== null) {
      return run.signalId;
    }
    if (run.status !== "processing" || args.sourceUrl !== run.sourceUrl) {
      throw new ConvexError("World-signal run cannot accept this result.");
    }
    if (new URL(args.sourceUrl).hostname !== "carpenter.org.tw") {
      throw new ConvexError("World-signal source is outside the allowlist.");
    }

    assertBoundedText(args.sourceTitle, "source title", 300);
    assertBoundedText(args.sourceDomain, "source domain", 120);
    assertBoundedText(args.rawExcerpt, "raw excerpt", 1_000);
    assertBoundedText(args.situation, "situation", 1_000);
    assertBoundedText(args.painOrFriction, "pain or friction", 1_000);
    assertBoundedText(args.desiredOutcome, "desired outcome", 1_000);
    assertBoundedText(args.needHypothesis, "need hypothesis", 1_000);
    assertBoundedText(args.location, "location", 240);
    assertBoundedText(args.timeContext, "time context", 240);
    assertBoundedText(args.interpreterModel, "interpreter model", 128);
    if (
      !Number.isFinite(args.confidence) ||
      args.confidence < 0 ||
      args.confidence > 1
    ) {
      throw new ConvexError("Invalid world-signal confidence.");
    }
    if (args.evidence.length < 1 || args.evidence.length > 3) {
      throw new ConvexError("World signal requires one to three evidence excerpts.");
    }
    for (const evidence of args.evidence) {
      if (evidence.url !== args.sourceUrl) {
        throw new ConvexError("World-signal evidence must use the scanned source.");
      }
      assertBoundedText(evidence.excerpt, "evidence excerpt", 400);
    }
    if (
      containsContactDetails(args.rawExcerpt) ||
      args.evidence.some((item) => containsContactDetails(item.excerpt))
    ) {
      throw new ConvexError("World-signal evidence contains contact details.");
    }
    if (args.providerRequestId !== null) {
      assertBoundedText(args.providerRequestId, "provider request id", 256);
    }
    if (args.interpreterResponseId !== null) {
      assertBoundedText(
        args.interpreterResponseId,
        "interpreter response id",
        256,
      );
    }

    const now = Date.now();
    const sourceMode = args.sourceMode;
    const signalId = await ctx.db.insert("worldSignals", {
      anonymousSessionId: run.anonymousSessionId,
      runId: run._id,
      sourceUrl: args.sourceUrl,
      sourceTitle: args.sourceTitle,
      sourceDomain: args.sourceDomain,
      rawExcerpt: args.rawExcerpt,
      situation: args.situation,
      painOrFriction: args.painOrFriction,
      desiredOutcome: args.desiredOutcome,
      needHypothesis: args.needHypothesis,
      location: args.location,
      timeContext: args.timeContext,
      explicitness: args.explicitness,
      confidence: args.confidence,
      evidence: args.evidence,
      provider: "firecrawl",
      sourceMode,
      providerRequestId: args.providerRequestId,
      interpreterModel: args.interpreterModel,
      interpreterResponseId: args.interpreterResponseId,
      createdAt: now,
    });
    await ctx.db.patch("worldSignalRuns", run._id, {
      status: "completed",
      sourceMode,
      providerRequestId: args.providerRequestId,
      interpreterModel: args.interpreterModel,
      interpreterResponseId: args.interpreterResponseId,
      signalId,
      errorCode: null,
      updatedAt: now,
    });
    return signalId;
  },
});

export const failRun = internalMutation({
  args: {
    runId: v.id("worldSignalRuns"),
    errorCode: v.union(
      v.literal("FIRECRAWL_SCRAPE_FAILED"),
      v.literal("SOURCE_RESPONSE_INVALID"),
      v.literal("OPENAI_CONFIGURATION_MISSING"),
      v.literal("WORLD_INTERPRETATION_FAILED"),
      v.literal("WORLD_SIGNAL_COMMIT_FAILED"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get("worldSignalRuns", args.runId);
    if (run === null || run.status === "completed") {
      return null;
    }
    await ctx.db.patch("worldSignalRuns", run._id, {
      status: "failed",
      errorCode: args.errorCode,
      updatedAt: Date.now(),
    });
    return null;
  },
});
