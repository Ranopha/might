# Hackathon log

- **Project:** Might
- **Event:** Convex All Gas Hackathon
- **What it does:** A consent-first companion that helps a person notice where something about them may matter in the real world.
- **Live app:** https://hushed-stork-401.convex.site
- **Repo:** https://github.com/Ranopha/might
- **Frontend:** Convex static hosting
- **Convex deployment:** https://hushed-stork-401.convex.cloud
- **Components:** @convex-dev/agent, @agentmail/convex, @convex-dev/rate-limiter, @convex-dev/static-hosting, @firecrawl/firecrawl-convex
- **Convex features:** schema, tables, indexes, queries, mutations, actions, scheduled functions, realtime queries, HTTP actions, file storage
- **Auth:** none
- **AI models:** gpt-5.6-luna, gpt-image-2
- **Started:** 2026-08-28T14:16:13Z
- **Last updated:** 2026-09-03T04:11:53Z

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

### 2026-08-30 - caf7e05

Promoted the reviewed World Sensor, private Match, clarification, and anonymous
paid-work guards to production `hushed-stork-401`. The production Firecrawl
credential was confirmed present without exposing its value; preflight passed
17 tests, lint, typecheck, build, schema validation, and a zero-index-deletion
dry-run.

The deploy activated the Firecrawl and rate-limiter components plus the World
Signal, Match, and clarification functions. Production function inventory and
the live `/api/health` response were verified afterward. No Sponsor API call,
email, static frontend release, or application-data mutation occurred in this
deployment session.

This proves the backend slice is publicly deployed, not that a fresh production
Firecrawl → OpenAI → Match browser tracer has completed. AgentMail, payload-bound
consent, inbound reply, Replied, Connected, and the complete E2E remain open.

### 2026-08-30 - working tree

Published static deployment `9c72865c-c2a9-43a9-9c0a-5bd9906516c9` and ran one
public Sponsor tracer. A synthetic Talk turn produced four confirmed private
memories; Firecrawl read the allowlisted Taoyuan volunteer source; OpenAI saved
the source-grounded Match; and reload preserved the full private state. The UI
remained at `No consent requested`, `canContact: false`, with zero email sends.

Added the next consent seam in development. “I’m interested” now starts one
private OpenAI pitch intent, while Convex stores the exact recipient, subject,
body, selected private-memory snapshots, SHA-256 payload fingerprint, immutable
approval snapshot, and idempotency key (`convex/connections.ts`,
`convex/connectionPitchOpenai.ts`, `src/screens/ConnectionsScreen.tsx`). Editing
the recipient or words, forgetting a disclosed memory, or crossing browser
sessions invalidates or blocks approval; approval still leaves
`canContact: false` and `sendCount: 0`.

Twenty-two behavior tests, lint, typecheck, production build, diff and secret
checks passed, and the functions synced to development `vibrant-wren-913`.
The real OpenAI pitch action and populated consent UI have not yet been run in a
live browser; this slice is not deployed to production. AgentMail outbound,
signed inbound reply, Replied, Connected, and the complete E2E remain open.

### 2026-08-30 - working tree

Installed the official `@agentmail/convex` component in development and added
the remaining deterministic path from exact approval to one durable outbound,
provider receipt, verified bound inbound reply, realtime `Replied`, and an
explicit in-product `Connected` decision (`convex/connections.ts`,
`convex/agentMailOutbound.ts`, `convex/agentMailInbound.ts`, `convex/http.ts`).

The send mutation revalidates the exact payload and active memory evidence,
requires a short server-side allowlist of controlled demo recipients, and binds
one approval to one component outbound ID. Unknown threads, mismatched inboxes,
duplicate events, and replies without a confirmed outbound receipt fail closed.
Connections presents delivery, reply, and connected states as a bright
editorial story rather than a dashboard.

Twenty-four behavior tests, lint, typecheck, production build, Convex codegen,
development sync, diff, and secret checks passed. The development inbox exists,
but its recipient allowlist remains unset and the account has no webhook, so no
live email can be sent and no real reply was processed. This slice is not
deployed to production; live AgentMail outbound/inbound, populated-browser
realtime proof, production promotion, and the complete E2E remain open.

### 2026-08-30 - working tree

Configured the first real AgentMail development callback after explicit owner
authorization. Exactly one inbox-scoped, enabled webhook now subscribes only to
`message.received` at the development `/api/agentmail/webhook` route. Its signing
secret and a one-mailbox demo allowlist exist only in Convex development; no
secret, mailbox address, or production environment was committed.

Reused the existing synthetic Firecrawl/OpenAI Match session and ran one real
OpenAI contextual-pitch action with `store: false`. Connections updated live to
show the complete recipient, Chinese subject/body, one disclosed synthetic
private-memory statement, and the revised payload fingerprint. The browser is
stopped at exact-message approval with `Nothing sent` and send count zero.

This proves the live contextual-pitch and development webhook-configuration
gates, not AgentMail E2E. Exact payload approval, the separate outbound Send,
provider message/thread receipts, a human reply, Convex realtime `Replied`,
explicit `Connected`, reload proof, and production promotion remain open.

### 2026-08-30 - working tree

After reviewing the complete recipient, subject, body, one disclosed synthetic
memory, and SHA-256 fingerprint, the owner explicitly approved and sent that
exact payload. The browser invoked approval and the separate Send action once;
Convex created one application mail binding and one official component outbound.

The first durable attempt failed before external delivery because published
`@agentmail/convex@0.1.0` did not declare the API-key environment input required
inside an isolated Convex component. AgentMail still showed zero messages, so
the failure did not create duplicate outreach. Added a reproducible npm patch
that declares and maps the component environment according to Convex's official
isolation model, then synced development only.

The existing pending outbound retried successfully without another Send. The
AgentMail API, official component state, and Might binding now agree on exactly
one sent message, one real provider message/thread pair, the approved payload,
`sendCount: 1`, and no error. Connections updated without refresh to `Reached
out through Might`. A clean dependency install reapplied the patch; 24 tests,
lint, typecheck, build, and the dependency audit passed.

This is real development Consent → AgentMail Contact evidence. The controlled
mailbox still needs a human reply before signed inbound, realtime `Replied`,
reload persistence, explicit `Connected`, full E2E, or production evidence can
be claimed.

### 2026-08-30 - working tree

The first human reply reached the signed development webhook and was persisted
once by the official AgentMail component. Might initially failed closed because
the real event used display-name email addresses while its recipient guard
compared complete display strings to a bare inbox address.

Added a red-to-green provider-shape test and canonical mailbox comparison while
preserving exact inbox/thread binding, external-sender checks, and event
idempotency (`convex/agentMailInbound.ts`, `convex/connections.test.ts`). After
the development sync, the already verified component event was reconciled once;
no new email or webhook was created and the send count remained one.

Connections changed without refresh to `They replied`, and a full reload kept
the same real reply and provider thread receipt. This is real development
inbound and realtime `Replied` evidence with one disclosed reconciliation step;
explicit `Connected`, an unassisted post-fix callback run, production promotion,
and complete E2E acceptance remain open.

### 2026-08-30 - working tree

After the owner's separate explicit continuation decision, the existing
`Replied` connection advanced once to `Connected`. The already-open Connections
screen changed without refresh and a full reload retained the state; no second
email or external commitment was created.

Development now has one continuation, one inbound event, and one mail binding
with real provider receipts, `status: connected`, and `sendCount: 1`. This closes
the real development tracer through Connected while retaining the disclosed
inbound reconciliation boundary. An unassisted post-fix callback run, clean
repeatability rehearsal, production promotion, and final submission acceptance
remain open.

### 2026-08-30 - working tree

Started a three-run repeatability rehearsal on development using three isolated
browser sessions. Each run generated a new original OpenAI companion, completed
Talk and confirmed living memory, interpreted the same public source, ran Match
plus one clarification, and produced a new contextual pitch. Runs one and three
used Firecrawl live; run two replayed a clearly labeled prior real cache.

After reviewing all three full disclosure previews, the owner explicitly
approved and sent each unchanged exact payload. The three isolated screens each
used approval once and Send once, then received real AgentMail thread receipts;
no Send was retried and no fourth email was created.

Redacted Convex reads now show four approvals, four mail bindings, and total
`sendCount: 4` across the earlier completed tracer and these three runs. Every
binding has provider message/thread receipts and no error; connection state is
one `connected` plus three `replied` after the owner replied separately in all
three new threads.

All three new signed inbound events completed automatically through the fixed
callback, each with a unique event, message, and thread identifier. They were
processed about 15–17 seconds after receipt without the earlier tracer's manual
reconciliation. Reopening and fully navigating each isolated session restored
`They replied`; no additional outbound or continuation was created.

The original three Contacted tabs had been reclaimed before the replies, so this
run did not directly observe their instant no-refresh transition; the earlier
tracer remains that UI proof. All three are honestly retained at `replied`.
The owner then authorized continuation for exactly two of the three runs. Those
two open screens changed without refresh to Connected and removed their action;
the unselected run remained Replied with its decision still available.

Convex now has three continuations for three unique connections and a final
development split of three `connected` plus one `replied`, including the earlier
tracer. Total `sendCount` remains four, all provider receipts remain present,
and no new email was sent. Full navigation restored the same selective state.
Production promotion remains open.

### 2026-08-31 - 2163ec3

Rebuilt the Talk opening as a fixed, sunlit Webtoon-style room using original
room, foreground, companion, and interaction-state image assets. The default
Might is now the approved paper-and-leaf orb with a restrained breathing loop;
the existing OpenAI manifestation and private Convex chat paths remain intact
(`public/assets/`, `src/components/companion/Orb.tsx`,
`src/screens/TalkScreen.tsx`, `src/App.css`).

Desktop and 390 px mobile checks covered the opening, shape form, and transition
into chat. The approved button plate changes on hover, reduced-motion fallbacks
remain in place, and the browser console returned no warning or error. Typecheck,
lint, 24 behavior tests, and the production build passed. This slice is locally
verified only; production and Sponsor runtime state were not changed.

### 2026-08-31 - 3b053a4

Integrated the matching Webtoon-style asset family into Me, Might Found, and
Connections so all four primary surfaces now tell different moments in one
fixed sunlit room. The real transparent illustrations breathe with runtime
state, become static for reduced motion, and preserve the existing live memory,
world-signal, consent, reply, and Connected behavior
(`src/components/room/SurfaceRoomHero.tsx`, `src/screens/`,
`public/assets/surfaces/`).

After owner screenshot review, moved Might to the right-hand Found doorway so
the room reads as opening the door, reduced and seated Me's memory folio on the
alcove platform, and made the idle Connections lanterns slightly more present.
Live comparison at 960 × 1000 and 390 × 844 found no horizontal overflow
(`src/App.css`, `src/components/room/SurfaceRoomHero.tsx`, `design-qa.md`).

The Shape flow now accepts and persists a private companion name alongside the
original OpenAI-generated manifestation; existing records and the house orb
continue to read as `Might` (`convex/manifestation.ts`, `convex/schema.ts`,
`src/screens/TalkScreen.tsx`). Desktop and 390 px mobile comparison QA, all 24
behavior tests, lint, typecheck, production build, alpha/edge checks, and a
development Convex sync passed.

Documented—but did not implement—a future authenticated user-owned OpenAI-key
option. The anonymous app does not collect secrets, no Sponsor call or email was
triggered while building this slice
(`docs/design/companion-identity-and-byok-boundary-v1.md`, `design-qa.md`).

Promoted the consent, AgentMail, inbound-reply, and Connected functions plus 17
additive indexes to production `hushed-stork-401`, then published static
deployment `bb26da34-811a-461a-8abb-c316daff83b5`. The release required three
AgentMail configuration names to be copied without exposing their values; the
webhook secret was intentionally not copied and no production webhook was
registered.

The public `/`, Talk, Me, Found, Connections, and health routes returned `200`.
The released bundle targets the production Convex deployment; browser checks at
1280 and 390 px found no horizontal overflow or console error. This proves the
new UI and backend are publicly deployed, not a production AgentMail reply E2E:
no OpenAI, Firecrawl, or AgentMail call ran and no email was sent in this release.

### 2026-08-31 - 1d3e23b

Added one room-native settings drawer without changing the four primary
surfaces. Companion name and house-orb/generated-form choice now persist in the
browser-scoped Convex session and update shared companion presence reactively;
the existing OpenAI manifestation entry remains available for a first form
(`convex/companionSettings.ts`, `src/components/settings/SettingsDrawer.tsx`).

Added a device-local sound switch, master volume, and user-triggered preview.
Background music remains explicitly unavailable, and the anonymous app exposes
no API-key input. Six test files / 26 tests, lint, typecheck, build, Convex dev
sync, and 1280/390 px browser QA passed. This work is not deployed to production
and triggered no OpenAI, Firecrawl, AgentMail, email, or webhook call.

### 2026-08-31 - fc06563

Kept the Talk conversation inside the same approved sunlit room after
`Keep this form`, instead of replacing the room with the prior blank AI-chat
canvas. The companion remains on the alcove platform while messages and the
composer live on the warm paper surface (`src/screens/TalkScreen.tsx`,
`src/App.css`).

Added a regression test for the exact transition. At 390 px the phase change
returns to the room's top and the composer remains above the persistent bottom
navigation. Seven test files / 27 tests, lint, typecheck, build, equal-density
desktop comparison, 390 × 844 browser QA, and console review passed
(`src/screens/TalkScreen.test.tsx`, `design-qa.md`).

This correction is locally verified only. Ordinary browser QA may have created
one empty, browser-scoped development session through the existing Talk
`ensureSession` path. It changed no Convex schema, function, environment,
production row, Sponsor provider call, email, webhook, or production deployment.

### 2026-08-31 - e74cf37

Rotated the previously exposed OpenAI, Firecrawl, and AgentMail credentials,
verified each replacement through an official read-only endpoint, promoted the
hidden values to Convex development and production, and revoked the superseded
keys. No scrape, generation, email, webhook registration, or application-data
mutation occurred; production intentionally still has no AgentMail webhook
secret.

Deployed the room-native settings backend and Talk room-continuity correction
to production `hushed-stork-401` with no index deletion, then published the
matching 13-file static release as deployment
`902b0117-b08c-4b15-a858-18595a308443`. Public Talk now keeps the fixed sunlit
room during conversation, and the settings drawer exposes private naming,
appearance, sound, volume, an honest unavailable-music state, and no secret
input.

All six public routes returned `200`. Browser verification at 1280 × 900 and
390 × 844 found no horizontal overflow or console warning/error; the mobile
composer remained above navigation. This is a verified public UI/backend
release, not a new production Sponsor E2E or inbound-email proof.

### 2026-09-03 - c1d7e86

Replaced the flat Connections card and timeline with a generated, responsive
six-fold paper journey whose live stages follow a seed-to-two-way botanical
line. Added separate generated action-tray and consent-note assets while
keeping all labels, current state, privacy copy, and navigation as semantic UI
(`src/screens/ConnectionsScreen.tsx`, `src/App.css`, `public/assets/`).

Reused the paper control language for real actions on Me, Might Found,
Connections, Talk manifestation, Sound, and Settings. Seven test files / 27
tests, lint, typecheck, production build, 1490 × 1058 desktop comparison,
390 × 844 mobile QA, interaction checks, and browser console review passed
(`docs/design/living-paper-controls-v1.md`, `design-qa.md`).

This slice is locally verified only. It did not change Convex functions or
data, call OpenAI/Firecrawl/AgentMail, send email, register a webhook, or deploy
production.

### 2026-09-03 - a61c486

Corrected the mobile Connections regression exposed by an owner Safari capture.
The six semantic lifecycle stages now stay on their matching botanical folds
instead of becoming detached stacked cards, and the responsive shell gives
scrolling content and bottom navigation separate viewport rows
(`src/screens/ConnectionsScreen.tsx`, `src/App.css`).

A deterministic browser geometry check failed on the reported structure before
the fix and passed twice at 390 × 844 and 540 × 1058 afterward. Checks at 320,
420, 980, and 981 px, four-route navigation, Settings, the Connections CTA,
27 tests, lint, typecheck, build, combined visual comparison, and the browser
console also passed (`design-qa.md`). This is local UI verification only; no
Convex data/function, Sponsor call, email, webhook, or production deploy changed.

### 2026-09-03 - 44c25e1

Repaired the medium-desktop Connections collision exposed at 1152 px. The
accordion now scales typography and paper overlap from its own inline size;
below 740 px of available component width, the story copy and privacy boundary
move into normal flow instead of being squeezed into fixed artwork coordinates
(`src/App.css`).

The original browser geometry check failed twice before the fix and passed
twice afterward. A 15-viewport matrix from 320 through 1440 px, four-route
navigation, Settings, the Connections action, 27 tests, lint, typecheck, build,
combined visual comparison, and browser-console review passed
(`design-qa.md`). This is local frontend evidence only; no Convex state,
Sponsor call, email, webhook, or production deployment changed.

### 2026-09-03 - working tree

Rebalanced the empty Connections ending so the real `See what Might found`
action and consent note share one responsive footer: left/right on desktop and
a clean stack only when space is constrained (`src/screens/ConnectionsScreen.tsx`,
`src/App.css`). The selected paper assets and all connection behavior remain
unchanged.

The reported 1152 × 768 collision failed twice before the fix and passed twice
afterward. A 14-width browser matrix from 320 through 1440 px, CTA and Settings
interactions, 27 tests, lint, typecheck, build, combined visual comparison, and
browser-console review passed (`design-qa.md`). This is local frontend evidence
only; no Convex data/function, Sponsor call, email, webhook, or production
deployment changed.
