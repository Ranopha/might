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
- **Last updated:** 2026-08-29T05:16:44Z

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
