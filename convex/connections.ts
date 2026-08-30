import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  env,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";

const DEFAULT_TEXT_MODEL = "gpt-5.6-luna";
const MIN_SESSION_KEY_LENGTH = 32;
const MAX_SESSION_KEY_LENGTH = 256;
const MIN_CLIENT_REQUEST_ID_LENGTH = 8;
const MAX_CLIENT_REQUEST_ID_LENGTH = 128;
const MAX_SELECTED_MEMORIES = 4;

const connectionStatusValidator = v.union(
  v.literal("user_interested"),
  v.literal("pitch_ready"),
);
const pitchRunStatusValidator = v.union(
  v.literal("processing"),
  v.literal("completed"),
  v.literal("failed"),
);
const pitchRunErrorValidator = v.union(
  v.null(),
  v.literal("OPENAI_CONFIGURATION_MISSING"),
  v.literal("MATCH_CONTEXT_INVALID"),
  v.literal("RELEVANT_MEMORY_UNAVAILABLE"),
  v.literal("PITCH_GENERATION_FAILED"),
  v.literal("PITCH_COMMIT_FAILED"),
);
const memoryPrivacyValidator = v.union(
  v.literal("private"),
  v.literal("shareable_with_consent"),
);
const selectedMemoryViewValidator = v.object({
  id: v.id("memories"),
  statement: v.string(),
  privacy: memoryPrivacyValidator,
});
const privateFieldValidator = v.object({
  memoryId: v.id("memories"),
  statement: v.string(),
});
const pitchViewValidator = v.object({
  id: v.id("connectionPitches"),
  target: v.object({
    displayName: v.string(),
    email: v.union(v.string(), v.null()),
    status: v.union(v.literal("unavailable"), v.literal("configured")),
  }),
  subject: v.string(),
  body: v.string(),
  selectedMemoryIds: v.array(v.id("memories")),
  selectedMemories: v.array(selectedMemoryViewValidator),
  privateFields: v.array(privateFieldValidator),
  payloadHash: v.string(),
  revision: v.number(),
  canApprove: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
});
const approvalViewValidator = v.object({
  id: v.id("sendApprovals"),
  connectionId: v.id("connections"),
  pitchId: v.id("connectionPitches"),
  payloadHash: v.string(),
  recipientEmail: v.string(),
  clientRequestId: v.string(),
  approvedAt: v.number(),
  isValid: v.boolean(),
});
const latestViewValidator = v.object({
  id: v.id("connections"),
  matchId: v.id("matches"),
  status: connectionStatusValidator,
  consentState: v.union(
    v.literal("not_requested"),
    v.literal("awaiting_send_approval"),
    v.literal("send_approved"),
  ),
  hasValidSendApproval: v.boolean(),
  canContact: v.literal(false),
  sendCount: v.literal(0),
  pitchRun: v.object({
    id: v.id("connectionPitchRuns"),
    status: pitchRunStatusValidator,
    errorCode: pitchRunErrorValidator,
    provenance: v.object({
      model: v.string(),
      responseId: v.union(v.string(), v.null()),
    }),
    startedAt: v.number(),
    updatedAt: v.number(),
  }),
  pitch: v.union(v.null(), pitchViewValidator),
  approval: v.union(v.null(), approvalViewValidator),
  createdAt: v.number(),
  updatedAt: v.number(),
});
const worldSignalContextValidator = v.object({
  id: v.id("worldSignals"),
  sourceUrl: v.string(),
  sourceTitle: v.string(),
  sourceDomain: v.string(),
  situation: v.string(),
  painOrFriction: v.string(),
  desiredOutcome: v.string(),
  needHypothesis: v.string(),
  location: v.string(),
  timeContext: v.string(),
  evidence: v.array(v.object({ url: v.string(), excerpt: v.string() })),
});
const memoryContextValidator = v.object({
  id: v.id("memories"),
  statement: v.string(),
  privacy: memoryPrivacyValidator,
});

type SurfaceContext = {
  worldSignal: Doc<"worldSignals">;
  memories: Doc<"memories">[];
  whyThisSituationMatters: string;
  whyThisPersonCameToMind: string;
};

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
    throw new ConvexError("Invalid connection request id.");
  }
  return normalized;
}

function normalizeRecipientEmail(recipientEmail: string): string {
  const normalized = recipientEmail.trim();
  if (
    normalized !== recipientEmail ||
    normalized.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    throw new ConvexError("Invalid recipient email.");
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

async function loadSurfaceContext(
  ctx: Pick<QueryCtx, "db">,
  sessionId: Id<"anonymousSessions">,
  match: Doc<"matches">,
): Promise<SurfaceContext | null> {
  if (
    match.anonymousSessionId !== sessionId ||
    match.status !== "surfaced" ||
    match.consentState !== "not_requested"
  ) {
    return null;
  }
  const worldSignal = await ctx.db.get("worldSignals", match.worldSignalId);
  if (
    worldSignal === null ||
    worldSignal.anonymousSessionId !== sessionId
  ) {
    return null;
  }
  const memoryDocuments = await Promise.all(
    match.relevantMemoryIds.map((memoryId) => ctx.db.get("memories", memoryId)),
  );
  const memories = memoryDocuments.filter(
    (memory): memory is Doc<"memories"> =>
      memory !== null &&
      memory.anonymousSessionId === sessionId &&
      memory.status === "active",
  );
  if (
    memories.length === 0 ||
    memories.length !== match.relevantMemoryIds.length
  ) {
    return null;
  }

  const clarificationRun = await ctx.db
    .query("matchClarificationRuns")
    .withIndex("by_anonymousSessionId_and_matchId_and_updatedAt", (q) =>
      q.eq("anonymousSessionId", sessionId).eq("matchId", match._id),
    )
    .order("desc")
    .first();
  if (clarificationRun === null) {
    return match.recommendation === "surface"
      ? {
          worldSignal,
          memories,
          whyThisSituationMatters: match.whyThisSituationMatters,
          whyThisPersonCameToMind: match.whyThisPersonCameToMind,
        }
      : null;
  }
  const finalResult = clarificationRun.resultId
    ? await ctx.db.get("matchClarifications", clarificationRun.resultId)
    : null;
  if (
    clarificationRun.status !== "completed" ||
    finalResult === null ||
    finalResult.anonymousSessionId !== sessionId ||
    finalResult.matchId !== match._id ||
    finalResult.status !== "surfaced"
  ) {
    return null;
  }
  return {
    worldSignal,
    memories,
    whyThisSituationMatters: finalResult.whyThisSituationMatters,
    whyThisPersonCameToMind: finalResult.whyThisPersonCameToMind,
  };
}

async function hashPitchPayload(payload: {
  targetDisplayName: string;
  recipientEmail: string | null;
  subject: string;
  body: string;
  selectedMemories: Array<{
    id: Id<"memories">;
    statement: string;
    privacy: "private" | "shareable_with_consent";
  }>;
}): Promise<string> {
  const canonical = JSON.stringify({
    version: 1,
    target: {
      displayName: payload.targetDisplayName,
      email: payload.recipientEmail,
    },
    subject: payload.subject,
    body: payload.body,
    selectedMemories: payload.selectedMemories.map((memory) => ({
      id: memory.id,
      statement: memory.statement,
      privacy: memory.privacy,
    })),
  });
  const bytes = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")}`;
}

async function pitchEvidenceIsCurrent(
  ctx: Pick<QueryCtx, "db">,
  sessionId: Id<"anonymousSessions">,
  pitch: Doc<"connectionPitches">,
): Promise<boolean> {
  const memories = await Promise.all(
    pitch.selectedMemorySnapshots.map((snapshot) =>
      ctx.db.get("memories", snapshot.id),
    ),
  );
  return memories.every(
    (memory, index) =>
      memory !== null &&
      memory.anonymousSessionId === sessionId &&
      memory.status === "active" &&
      memory.statement === pitch.selectedMemorySnapshots[index]?.statement &&
      memory.privacy === pitch.selectedMemorySnapshots[index]?.privacy,
  );
}

export const expressInterest = mutation({
  args: {
    clientSessionKey: v.string(),
    matchId: v.id("matches"),
    clientRequestId: v.string(),
  },
  returns: v.object({
    connectionId: v.id("connections"),
    pitchRunId: v.id("connectionPitchRuns"),
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
    const match = await ctx.db.get("matches", args.matchId);
    if (
      session === null ||
      match === null ||
      match.anonymousSessionId !== session._id
    ) {
      throw new ConvexError("Match is unavailable.");
    }
    const surface = await loadSurfaceContext(ctx, session._id, match);
    if (surface === null) {
      throw new ConvexError("Match is unavailable or its memory was forgotten.");
    }
    const existing = await ctx.db
      .query("connections")
      .withIndex("by_anonymousSessionId_and_matchId", (q) =>
        q.eq("anonymousSessionId", session._id).eq("matchId", match._id),
      )
      .unique();
    if (existing !== null && existing.pitchRunId !== null) {
      return {
        connectionId: existing._id,
        pitchRunId: existing.pitchRunId,
        created: false,
      };
    }
    const now = Date.now();
    const connectionId = await ctx.db.insert("connections", {
      anonymousSessionId: session._id,
      matchId: match._id,
      interestRequestId: clientRequestId,
      status: "user_interested",
      pitchRunId: null,
      createdAt: now,
      updatedAt: now,
    });
    const pitchRunId = await ctx.db.insert("connectionPitchRuns", {
      anonymousSessionId: session._id,
      connectionId,
      matchId: match._id,
      clientRequestId,
      status: "processing",
      model: env.OPENAI_TEXT_MODEL ?? DEFAULT_TEXT_MODEL,
      responseId: null,
      pitchId: null,
      errorCode: null,
      startedAt: now,
      updatedAt: now,
    });
    await ctx.db.patch("connections", connectionId, {
      pitchRunId,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.connectionPitchOpenai.generate, {
      pitchRunId,
    });
    return { connectionId, pitchRunId, created: true };
  },
});

export const latest = query({
  args: { clientSessionKey: v.string() },
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
    const connection = await ctx.db
      .query("connections")
      .withIndex("by_anonymousSessionId_and_updatedAt", (q) =>
        q.eq("anonymousSessionId", session._id),
      )
      .order("desc")
      .first();
    if (connection === null || connection.pitchRunId === null) {
      return null;
    }
    const pitchRun = await ctx.db.get(
      "connectionPitchRuns",
      connection.pitchRunId,
    );
    if (
      pitchRun === null ||
      pitchRun.anonymousSessionId !== session._id ||
      pitchRun.connectionId !== connection._id
    ) {
      return null;
    }
    const pitch = pitchRun.pitchId
      ? await ctx.db.get("connectionPitches", pitchRun.pitchId)
      : null;
    const pitchVisible =
      pitch !== null &&
      pitch.anonymousSessionId === session._id &&
      pitch.connectionId === connection._id &&
      pitch.pitchRunId === pitchRun._id;
    const evidenceCurrent =
      pitchVisible &&
      (await pitchEvidenceIsCurrent(ctx, session._id, pitch));
    const approval = pitchVisible
      ? await ctx.db
          .query("sendApprovals")
          .withIndex("by_pitchId_and_createdAt", (q) => q.eq("pitchId", pitch._id))
          .order("desc")
          .first()
      : null;
    const hasValidSendApproval =
      approval !== null &&
      pitchVisible &&
      evidenceCurrent &&
      approval.anonymousSessionId === session._id &&
      approval.connectionId === connection._id &&
      approval.pitchId === pitch._id &&
      approval.payloadHash === pitch.payloadHash &&
      approval.recipientEmail === pitch.recipientEmail &&
      pitch.recipientStatus === "configured";

    return {
      id: connection._id,
      matchId: connection.matchId,
      status: connection.status,
      consentState: hasValidSendApproval
        ? ("send_approved" as const)
        : pitchVisible && pitchRun.status === "completed"
          ? ("awaiting_send_approval" as const)
          : ("not_requested" as const),
      hasValidSendApproval,
      canContact: false as const,
      sendCount: 0 as const,
      pitchRun: {
        id: pitchRun._id,
        status: pitchRun.status,
        errorCode: pitchRun.errorCode,
        provenance: {
          model: pitchRun.model,
          responseId: pitchRun.responseId,
        },
        startedAt: pitchRun.startedAt,
        updatedAt: pitchRun.updatedAt,
      },
      pitch: pitchVisible
        ? {
            id: pitch._id,
            target: {
              displayName: pitch.targetDisplayName,
              email: pitch.recipientEmail,
              status: pitch.recipientStatus,
            },
            subject: pitch.subject,
            body: pitch.body,
            selectedMemoryIds: pitch.selectedMemoryIds,
            selectedMemories: pitch.selectedMemorySnapshots,
            privateFields: pitch.privateFields,
            payloadHash: pitch.payloadHash,
            revision: pitch.revision,
            canApprove:
              evidenceCurrent &&
              pitch.recipientStatus === "configured" &&
              pitch.recipientEmail !== null,
            createdAt: pitch.createdAt,
            updatedAt: pitch.updatedAt,
          }
        : null,
      approval:
        approval !== null && pitchVisible
          ? {
              id: approval._id,
              connectionId: approval.connectionId,
              pitchId: approval.pitchId,
              payloadHash: approval.payloadHash,
              recipientEmail: approval.recipientEmail,
              clientRequestId: approval.clientRequestId,
              approvedAt: approval.approvedAt,
              isValid: hasValidSendApproval,
            }
          : null,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  },
});

export const reviseCurrentPitch = mutation({
  args: {
    clientSessionKey: v.string(),
    connectionId: v.id("connections"),
    pitchId: v.id("connectionPitches"),
    recipientEmail: v.union(v.string(), v.null()),
    subject: v.string(),
    body: v.string(),
  },
  returns: v.object({
    pitchId: v.id("connectionPitches"),
    payloadHash: v.string(),
    revision: v.number(),
  }),
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    assertBoundedText(args.subject, "pitch subject", 240);
    assertBoundedText(args.body, "pitch body", 8_000);
    const recipientEmail =
      args.recipientEmail === null
        ? null
        : normalizeRecipientEmail(args.recipientEmail);
    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", args.clientSessionKey),
      )
      .unique();
    const connection = await ctx.db.get("connections", args.connectionId);
    const pitch = await ctx.db.get("connectionPitches", args.pitchId);
    if (
      session === null ||
      connection === null ||
      pitch === null ||
      connection.anonymousSessionId !== session._id ||
      pitch.anonymousSessionId !== session._id ||
      pitch.connectionId !== connection._id ||
      connection.status !== "pitch_ready" ||
      connection.pitchRunId !== pitch.pitchRunId
    ) {
      throw new ConvexError("Pitch is unavailable.");
    }
    const pitchRun = await ctx.db.get("connectionPitchRuns", pitch.pitchRunId);
    if (
      pitchRun === null ||
      pitchRun.status !== "completed" ||
      pitchRun.pitchId !== pitch._id
    ) {
      throw new ConvexError("Pitch is unavailable.");
    }
    if (!(await pitchEvidenceIsCurrent(ctx, session._id, pitch))) {
      throw new ConvexError("A selected memory is unavailable.");
    }
    if (
      pitch.recipientEmail === recipientEmail &&
      pitch.subject === args.subject &&
      pitch.body === args.body
    ) {
      return {
        pitchId: pitch._id,
        payloadHash: pitch.payloadHash,
        revision: pitch.revision,
      };
    }
    const payloadHash = await hashPitchPayload({
      targetDisplayName: pitch.targetDisplayName,
      recipientEmail,
      subject: args.subject,
      body: args.body,
      selectedMemories: pitch.selectedMemorySnapshots,
    });
    const revision = pitch.revision + 1;
    await ctx.db.patch("connectionPitches", pitch._id, {
      recipientEmail,
      recipientStatus: recipientEmail === null ? "unavailable" : "configured",
      subject: args.subject,
      body: args.body,
      payloadHash,
      revision,
      updatedAt: Date.now(),
    });
    return { pitchId: pitch._id, payloadHash, revision };
  },
});

export const approveCurrentPitch = mutation({
  args: {
    clientSessionKey: v.string(),
    connectionId: v.id("connections"),
    pitchId: v.id("connectionPitches"),
    payloadHash: v.string(),
    recipientEmail: v.string(),
    clientRequestId: v.string(),
  },
  returns: v.object({
    approvalId: v.id("sendApprovals"),
    created: v.boolean(),
    sendCount: v.literal(0),
  }),
  handler: async (ctx, args) => {
    assertClientSessionKey(args.clientSessionKey);
    const clientRequestId = normalizeClientRequestId(args.clientRequestId);
    const recipientEmail = normalizeRecipientEmail(args.recipientEmail);
    const session = await ctx.db
      .query("anonymousSessions")
      .withIndex("by_clientSessionKey", (q) =>
        q.eq("clientSessionKey", args.clientSessionKey),
      )
      .unique();
    const connection = await ctx.db.get("connections", args.connectionId);
    const pitch = await ctx.db.get("connectionPitches", args.pitchId);
    if (
      session === null ||
      connection === null ||
      pitch === null ||
      connection.anonymousSessionId !== session._id ||
      pitch.anonymousSessionId !== session._id ||
      pitch.connectionId !== connection._id ||
      connection.status !== "pitch_ready" ||
      connection.pitchRunId !== pitch.pitchRunId
    ) {
      throw new ConvexError("Pitch is unavailable.");
    }

    const existingRequest = await ctx.db
      .query("sendApprovals")
      .withIndex("by_anonymousSessionId_and_clientRequestId", (q) =>
        q
          .eq("anonymousSessionId", session._id)
          .eq("clientRequestId", clientRequestId),
      )
      .unique();
    const pitchRun = await ctx.db.get("connectionPitchRuns", pitch.pitchRunId);
    if (
      pitchRun === null ||
      pitchRun.status !== "completed" ||
      pitchRun.pitchId !== pitch._id
    ) {
      throw new ConvexError("Pitch is unavailable.");
    }
    if (!(await pitchEvidenceIsCurrent(ctx, session._id, pitch))) {
      throw new ConvexError("A selected memory is unavailable.");
    }
    if (
      pitch.recipientStatus !== "configured" ||
      pitch.recipientEmail === null ||
      pitch.recipientEmail !== recipientEmail
    ) {
      throw new ConvexError("The recipient is unavailable or not current.");
    }
    if (pitch.payloadHash !== args.payloadHash) {
      throw new ConvexError("The pitch payload is no longer current.");
    }
    if (existingRequest !== null) {
      if (
        existingRequest.connectionId !== connection._id ||
        existingRequest.pitchId !== pitch._id ||
        existingRequest.payloadHash !== args.payloadHash ||
        existingRequest.recipientEmail !== recipientEmail
      ) {
        throw new ConvexError(
          "Approval request id is already bound to another payload.",
        );
      }
      return {
        approvalId: existingRequest._id,
        created: false,
        sendCount: 0 as const,
      };
    }

    const existingApproval = await ctx.db
      .query("sendApprovals")
      .withIndex("by_pitchId_and_createdAt", (q) => q.eq("pitchId", pitch._id))
      .order("desc")
      .first();
    if (
      existingApproval !== null &&
      existingApproval.anonymousSessionId === session._id &&
      existingApproval.connectionId === connection._id &&
      existingApproval.payloadHash === pitch.payloadHash &&
      existingApproval.recipientEmail === recipientEmail
    ) {
      return {
        approvalId: existingApproval._id,
        created: false,
        sendCount: 0 as const,
      };
    }

    const now = Date.now();
    const approvalId = await ctx.db.insert("sendApprovals", {
      anonymousSessionId: session._id,
      connectionId: connection._id,
      pitchId: pitch._id,
      payloadHash: pitch.payloadHash,
      targetDisplayName: pitch.targetDisplayName,
      recipientEmail,
      subject: pitch.subject,
      body: pitch.body,
      selectedMemoryIds: pitch.selectedMemoryIds,
      selectedMemorySnapshots: pitch.selectedMemorySnapshots,
      privateFields: pitch.privateFields,
      clientRequestId,
      approvedAt: now,
      createdAt: now,
    });
    return { approvalId, created: true, sendCount: 0 as const };
  },
});

export const getPitchRunContext = internalQuery({
  args: { pitchRunId: v.id("connectionPitchRuns") },
  returns: v.union(
    v.null(),
    v.object({
      pitchRunId: v.id("connectionPitchRuns"),
      status: pitchRunStatusValidator,
      model: v.string(),
      targetDisplayName: v.string(),
      worldSignal: worldSignalContextValidator,
      memories: v.array(memoryContextValidator),
      whyThisSituationMatters: v.string(),
      whyThisPersonCameToMind: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const pitchRun = await ctx.db.get("connectionPitchRuns", args.pitchRunId);
    if (pitchRun === null) {
      return null;
    }
    const connection = await ctx.db.get("connections", pitchRun.connectionId);
    const match = await ctx.db.get("matches", pitchRun.matchId);
    if (
      connection === null ||
      match === null ||
      connection.anonymousSessionId !== pitchRun.anonymousSessionId ||
      connection.matchId !== match._id ||
      connection.pitchRunId !== pitchRun._id ||
      match.anonymousSessionId !== pitchRun.anonymousSessionId
    ) {
      return null;
    }
    const surface = await loadSurfaceContext(
      ctx,
      pitchRun.anonymousSessionId,
      match,
    );
    if (surface === null) {
      return null;
    }
    return {
      pitchRunId: pitchRun._id,
      status: pitchRun.status,
      model: pitchRun.model,
      targetDisplayName:
        surface.worldSignal.sourceTitle || surface.worldSignal.sourceDomain,
      worldSignal: {
        id: surface.worldSignal._id,
        sourceUrl: surface.worldSignal.sourceUrl,
        sourceTitle: surface.worldSignal.sourceTitle,
        sourceDomain: surface.worldSignal.sourceDomain,
        situation: surface.worldSignal.situation,
        painOrFriction: surface.worldSignal.painOrFriction,
        desiredOutcome: surface.worldSignal.desiredOutcome,
        needHypothesis: surface.worldSignal.needHypothesis,
        location: surface.worldSignal.location,
        timeContext: surface.worldSignal.timeContext,
        evidence: surface.worldSignal.evidence,
      },
      memories: surface.memories.map((memory) => ({
        id: memory._id,
        statement: memory.statement,
        privacy: memory.privacy,
      })),
      whyThisSituationMatters: surface.whyThisSituationMatters,
      whyThisPersonCameToMind: surface.whyThisPersonCameToMind,
    };
  },
});

export const commitGeneratedPitch = internalMutation({
  args: {
    pitchRunId: v.id("connectionPitchRuns"),
    model: v.string(),
    responseId: v.union(v.string(), v.null()),
    selectedMemoryIds: v.array(v.id("memories")),
    subject: v.string(),
    body: v.string(),
  },
  returns: v.id("connectionPitches"),
  handler: async (ctx, args) => {
    const pitchRun = await ctx.db.get("connectionPitchRuns", args.pitchRunId);
    if (pitchRun === null) {
      throw new ConvexError("Pitch run is unavailable.");
    }
    if (pitchRun.status === "completed" && pitchRun.pitchId !== null) {
      return pitchRun.pitchId;
    }
    if (pitchRun.status !== "processing") {
      throw new ConvexError("Pitch run cannot accept this result.");
    }
    const connection = await ctx.db.get("connections", pitchRun.connectionId);
    const match = await ctx.db.get("matches", pitchRun.matchId);
    if (
      connection === null ||
      match === null ||
      connection.anonymousSessionId !== pitchRun.anonymousSessionId ||
      connection.pitchRunId !== pitchRun._id ||
      connection.matchId !== match._id
    ) {
      throw new ConvexError("Pitch context is no longer current.");
    }
    const surface = await loadSurfaceContext(
      ctx,
      pitchRun.anonymousSessionId,
      match,
    );
    if (surface === null) {
      throw new ConvexError("A relevant memory is unavailable.");
    }
    assertBoundedText(args.model, "pitch model", 128);
    assertBoundedText(args.subject, "pitch subject", 240);
    assertBoundedText(args.body, "pitch body", 8_000);
    const selectedMemoryIds = [...new Set(args.selectedMemoryIds)];
    if (
      selectedMemoryIds.length === 0 ||
      selectedMemoryIds.length !== args.selectedMemoryIds.length ||
      selectedMemoryIds.length > MAX_SELECTED_MEMORIES
    ) {
      throw new ConvexError("Invalid selected memories.");
    }
    const availableById = new Map(
      surface.memories.map((memory) => [memory._id, memory]),
    );
    const selectedMemories = selectedMemoryIds.map((memoryId) =>
      availableById.get(memoryId),
    );
    if (selectedMemories.some((memory) => memory === undefined)) {
      throw new ConvexError("A selected memory is unavailable.");
    }
    const snapshots = selectedMemories.map((memory) => ({
      id: memory!._id,
      statement: memory!.statement,
      privacy: memory!.privacy,
    }));
    const targetDisplayName =
      surface.worldSignal.sourceTitle || surface.worldSignal.sourceDomain;
    assertBoundedText(targetDisplayName, "pitch target", 300);
    const payloadHash = await hashPitchPayload({
      targetDisplayName,
      recipientEmail: null,
      subject: args.subject,
      body: args.body,
      selectedMemories: snapshots,
    });
    const now = Date.now();
    const pitchId = await ctx.db.insert("connectionPitches", {
      anonymousSessionId: pitchRun.anonymousSessionId,
      connectionId: connection._id,
      pitchRunId: pitchRun._id,
      matchId: match._id,
      targetDisplayName,
      recipientEmail: null,
      recipientStatus: "unavailable",
      subject: args.subject,
      body: args.body,
      selectedMemoryIds,
      selectedMemorySnapshots: snapshots,
      privateFields: snapshots
        .filter((memory) => memory.privacy === "private")
        .map((memory) => ({
          memoryId: memory.id,
          statement: memory.statement,
        })),
      payloadHash,
      revision: 1,
      model: args.model,
      responseId: args.responseId,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch("connectionPitchRuns", pitchRun._id, {
      status: "completed",
      model: args.model,
      responseId: args.responseId,
      pitchId,
      errorCode: null,
      updatedAt: now,
    });
    await ctx.db.patch("connections", connection._id, {
      status: "pitch_ready",
      updatedAt: now,
    });
    return pitchId;
  },
});

export const failPitchRun = internalMutation({
  args: {
    pitchRunId: v.id("connectionPitchRuns"),
    errorCode: v.union(
      v.literal("OPENAI_CONFIGURATION_MISSING"),
      v.literal("MATCH_CONTEXT_INVALID"),
      v.literal("RELEVANT_MEMORY_UNAVAILABLE"),
      v.literal("PITCH_GENERATION_FAILED"),
      v.literal("PITCH_COMMIT_FAILED"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const pitchRun = await ctx.db.get("connectionPitchRuns", args.pitchRunId);
    if (pitchRun === null || pitchRun.status !== "processing") {
      return null;
    }
    await ctx.db.patch("connectionPitchRuns", pitchRun._id, {
      status: "failed",
      errorCode: args.errorCode,
      updatedAt: Date.now(),
    });
    return null;
  },
});
