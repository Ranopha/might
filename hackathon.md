# Hackathon log

- **Project:** Might
- **Event:** Convex All Gas Hackathon
- **What it does:** A consent-first companion that helps a person notice where something about them may matter in the real world.
- **Live app:** https://hushed-stork-401.convex.site
- **Repo:** https://github.com/Ranopha/might
- **Frontend:** Convex static hosting
- **Convex deployment:** https://hushed-stork-401.convex.cloud
- **Components:** @convex-dev/static-hosting
- **Convex features:** schema, tables, indexes, queries, mutations, actions, realtime queries, HTTP actions, file storage
- **Auth:** none
- **AI models:** gpt-5.6-luna, gpt-image-2
- **Started:** 2026-08-28T14:16:13Z
- **Last updated:** 2026-08-28T16:05:49Z

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
