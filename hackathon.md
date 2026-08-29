# Hackathon log

- **Project:** Might
- **Event:** Convex All Gas Hackathon
- **What it does:** A consent-first companion that helps a person notice where something about them may matter in the real world.
- **Live app:** https://hushed-stork-401.convex.site
- **Repo:** https://github.com/Ranopha/might
- **Frontend:** Convex static hosting
- **Convex deployment:** https://hushed-stork-401.convex.cloud
- **Components:** @convex-dev/agent, @convex-dev/rate-limiter, @convex-dev/static-hosting, @firecrawl/firecrawl-convex
- **Convex features:** schema, tables, indexes, queries, mutations, actions, scheduled functions, realtime queries, HTTP actions, file storage
- **Auth:** none
- **AI models:** gpt-5.6-luna, gpt-image-2
- **Started:** 2026-08-28T14:16:13Z
- **Last updated:** 2026-08-29T14:24:29Z

## Log

### 2026-08-28 - working tree
Established the public Might shell with its animated orb and responsive Talk,
Me, Might Found, and Connections surfaces. Added browser-scoped anonymous
sessions and a real Talk flow that persists private messages to Convex and
renders them through a realtime query (`src/`, `convex/schema.ts`,
`convex/talk.ts`).

Configured Convex Static Hosting at the root with application HTTP routes under
`/api`, deployed the signed-out-accessible production app, and verified `/`,
`/talk`, `/api/health`, production message persistence, and reload recovery
(`convex/convex.config.ts`, `convex/http.ts`).

Added the repository constitution, official-rule research, public evidence
policy, and five behavior-test seams. The OpenAI, Firecrawl, and AgentMail
runtime integrations were initially unimplemented (`AGENTS.md`,
`docs/research/all-gas-hackathon-rules.md`).

Added session-private Companion Manifestation. A Convex action asks
`gpt-5.6-luna` for a structured, IP-safe art brief, uses `gpt-image-2` for a
1024x1024 Webtoon-style PNG, and persists the result in Convex file storage.
Retries are idempotent; provider failures settle to an explicit failed state
while the orb remains usable (`convex/manifestation.ts`,
`convex/manifestationOpenai.ts`, `src/components/companion/`).

Verified one real dev E2E using a famous-IP reference: OpenAI preserved the
requested brave, gentle late-night mood while replacing recognizable superhero
elements, the generated original companion appeared through a realtime query,
survived reload, and followed the user into Talk. The interface was also
retuned from a dark night palette to a bright ivory, lilac, and apricot
storybook theme (`src/App.css`, `src/index.css`). This OpenAI proof is verified
on the dev deployment only; production has not received this slice. Firecrawl
and AgentMail runtime integrations remain unimplemented and are not claimed.

### 2026-08-29 - production checkpoint

Deployed the Companion Manifestation backend to production and published the
matching daylight frontend through Convex Static Hosting (deployment
`bd361568-307c-4465-983d-7ab3c8be110e`). Verified signed-out access to `/` and
`/talk`, the production Convex URL in the client bundle, and a live JSON response
from `/api/health`.

Ran one real production Manifestation from a fresh anonymous browser session.
For the prompt `A tiny dawn archivist with an apricot scarf, lavender light,
and a brave but gentle smile.`, Convex realtime state advanced through
`generating_brief`, `generating_image`, and `ready`. OpenAI produced an original
apricot-and-lavender Webtoon-style archivist; visual inspection found no famous
character logo or signature costume. The stored companion survived a full page
reload and appeared in Talk without re-generation.

Production Convex logs link `beginGeneration`, `markBriefGenerated`, and
`completeGeneration` to the successful `manifestation:generate` and
`manifestationOpenai:generateAssets` actions; the provider action completed in
about 61 seconds. This verifies Manifestation through real OpenAI work, Convex
Storage, queries, mutations, actions, and live UI state on the public deployment.
Firecrawl, AgentMail, living-memory extraction, matching, consent outreach,
inbound reply, and the complete end-to-end chain remain unimplemented and are
not claimed.

### 2026-08-29 - 126ac1c

Added the first real Talk-to-Memory tracer bullet. Each browser-scoped primary
conversation now owns a durable Convex Agent thread. A user message is saved
once, creates an idempotent processing turn, and schedules an internal action
that obtains an OpenAI reply before a separate structured OpenAI pass proposes
source-linked private living memories (`convex/talk.ts`,
`convex/talkOpenai.ts`, `convex/memories.ts`).

Expanded the schema with provider trace, status, source, confidence, privacy,
freshness, and idempotency fields. Only current-user statements that pass the
meaningfulness threshold are committed; Me subscribes through a realtime query
and lets the same anonymous session confirm, correct, or forget each memory.
Talk exposes processing and failure states without blocking the saved user
message (`convex/schema.ts`, `src/screens/TalkScreen.tsx`,
`src/screens/MeScreen.tsx`).

Verified the development deployment with a synthetic conversation and real
OpenAI work. Might replied contextually, four extracted memories appeared live,
and confirm, correction, and forget controls reduced the persisted set to three.
Those three memories and the assistant reply survived full page reloads; the
browser emitted no warning or error. Eight behavior tests, lint, typecheck, the
production build, Convex codegen, and `convex dev --once` passed. This proof is
limited to development deployment `vibrant-wren-913`; the public production app
still serves the prior Manifestation slice. Firecrawl, AgentMail, matching,
consent outreach, inbound reply, Connected, and the complete E2E remain open.

### 2026-08-29 - de1d546

Deployed the Talk-to-Memory slice and `@convex-dev/agent` component to
production, then published the matching frontend through Convex Static Hosting
(deployment `58f020a6-78ef-45bb-b1b7-2189cb6a486c`). The production schema added
five Talk/Memory indexes and deleted none.

Verified a fresh signed-out public session with real OpenAI work. A natural
message persisted immediately, Might replied contextually, and three private,
source-linked memories appeared in Me through a realtime query. Confirming one,
correcting one, and forgetting one updated the UI live from three memories to
two; the remaining memories and conversation survived a full reload.

Production logs recorded the scheduled `talkOpenai:generateTurn` action in
about 6.16 seconds together with the Talk, memory-commit, confirm, edit, and
forget functions. The public bundle targets the production Convex deployment,
`/api/health` is live, and browser verification found no warning or error.
Firecrawl, AgentMail, matching, consent outreach, inbound reply, Connected, and
the complete E2E remain open and are not claimed.

### 2026-08-29 - eaa0540

Added the real Firecrawl World Sensor tracer bullet on development. One
allowlisted public volunteer page is scraped through the official Firecrawl
Convex component, then a Convex action asks OpenAI for one strict, cautious
structured interpretation. The deterministic commit accepts only one to three
verbatim source excerpts, rejects contact details, and preserves Firecrawl and
OpenAI trace metadata, confidence, failure state, timestamps, and browser-session
ownership (`convex/worldSensor.ts`, `convex/worldSignals.ts`).

The first live attempt failed closed because an unavailable Firecrawl
zero-data-retention entitlement returned `403`; no signal was committed and the
UI exposed a retry state. Removing only that unsupported option let the same
path succeed. Firecrawl read the Taoyuan public source in about 2.8 seconds,
OpenAI interpreted the supported need, and the complete action finished in
about 7.95 seconds. Might Found updated without refresh and a full reload
restored the Convex-stored signal without a second provider call.

Mounted the official Convex Rate Limiter so at most two genuinely new anonymous
world scans can begin per minute globally; idempotent retries and existing
results do not consume another slot. Ten behavior tests, lint, typecheck, build,
development sync, diff/secret checks, and the dependency audit passed. Desktop
and mobile browser inspection found no warning or error. This is a real
Firecrawl → OpenAI → Convex integration verified on `vibrant-wren-913` only.
Production, contextual matching, clarification, consent, AgentMail, reply,
Connected, and the complete E2E remain open and are not claimed.

### 2026-08-29 - 0d9505b

Added the private WorldSignal-to-Match tracer bullet. One session-owned,
completed public signal and at most twelve active private-memory candidates now
enter a scheduled OpenAI Serendipity Judge. The deterministic commit accepts at
most four relevant memory IDs, revalidates ownership and active state, stores
both reasoning sides and provider trace metadata, and exposes the result only to
the owning browser (`convex/matches.ts`, `convex/matchJudge.ts`).

The public behavior test proves idempotency, browser isolation, exclusion of a
forgotten memory, source evidence on both sides, at most one clarification, and
the hard `consentState: not_requested` / `canContact: false` boundary. Eleven
tests, lint, typecheck, build, development sync, secret/diff checks, and the
dependency audit passed.

Verified a real development flow using the earlier Firecrawl signal and one new
synthetic Talk turn. Four private memories appeared, two were confirmed, and
OpenAI selected only the confirmed woodworking/tools memory for the low-risk
repair overlap. The Judge action finished in about 3.35 seconds; Might Found
updated without refresh and survived reload. Desktop and mobile inspection
found no browser warning or error.

The real Judge returned `surface` without a clarification, so live clarification
is not claimed. The Judge instructions were tightened afterward: skills and
tools cannot imply willingness or relevant availability, and volunteer contexts
missing either must ask one neutral question that is explicitly not consent.
This correction is synced to development and covered by the deterministic seam,
but still needs a fresh live run. Production, clarification answer, consent,
AgentMail, reply, Connected, and the complete E2E remain open.

### 2026-08-29 - 1adfe2d

Added the private clarification tracer. The owning browser may answer the one
neutral Match question once; Convex preserves the exact private question and
answer, schedules an OpenAI re-judge, revalidates every supporting memory, and
saves a separate final audit without overwriting the original Match reasoning
(`convex/matchClarifications.ts`, `convex/matchClarificationJudge.ts`). A
session-owned, idempotent `Not for me` path closes the Match without external
contact.

Verified a fresh real development flow from Talk and private memories through a
new Firecrawl signal, corrected OpenAI Match clarification, private answer, and
final OpenAI re-judging. Might Found updated in realtime, showed strengthened
context, retained `consentState: not_requested` and `canContact: false`, and
survived reload. Desktop and mobile checks found no browser warning or error.

Twelve behavior tests, lint, typecheck, build, development sync, diff/secret
checks, and the dependency audit passed. AgentMail remains unconfigured, so no
email or webhook call occurred. Production was not changed; interest, pitch,
payload-bound Send consent, AgentMail outbound/inbound, Replied, Connected, and
the complete E2E remain open.

### 2026-08-29 - 95f3705

Investigated Zeabur's environment-variable incident and found no Zeabur,
LiteLLM, or related deployment path in Might; cross-project credential reuse
remains unprovable from repository evidence (`docs/research/zeabur-incident-2026-08-29.md`).

A security scan found two public paid-work abuse paths. Added component-backed
global, daily, and per-session budgets plus one-active-turn/generation guards
before OpenAI, scheduler, image, or Storage work (`convex/abuseProtection.ts`,
`convex/talk.ts`, `convex/manifestation.ts`). Seventeen tests, lint, typecheck,
build, secret/dependency checks, and development sync passed. The guards are
verified on `vibrant-wren-913`; production was not changed and remains open
until a fresh deploy approval.

### 2026-08-29 - 48f54ed

Production preflight for exact `main@4fc1a1d` passed 17 tests, lint, typecheck,
build, and a non-destructive Convex dry-run. The approved push failed closed at
finalization because production lacks the required `FIRECRAWL_API_KEY`; the new
functions and paid-work guards were not activated. The existing public health
route remained live, and no Sponsor call, email, or environment change occurred.

Compared current OpenAI and Gemini pricing, data terms, image availability, and
hackathon scoring using official sources
(`docs/research/openai-vs-gemini-cost-2026-08-29.md`). GPT-5.6 Luna is already a
low-cost Sponsor-visible path; free Gemini is not suitable for Might's private
memory content and does not provide free image generation. The submission path
therefore remains on OpenAI with Convex quotas, idempotency, and persistent asset
reuse rather than adding a second provider before the complete E2E is reliable.
