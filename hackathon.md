# Hackathon log

- **Project:** Might
- **Event:** Convex All Gas Hackathon
- **What it does:** A consent-first companion that helps a person notice where something about them may matter in the real world.
- **Live app:** https://hushed-stork-401.convex.site
- **Repo:** https://github.com/Ranopha/might
- **Frontend:** Convex static hosting
- **Convex deployment:** https://hushed-stork-401.convex.cloud
- **Components:** @convex-dev/static-hosting
- **Convex features:** schema, tables, indexes, queries, mutations, realtime queries, HTTP actions
- **Auth:** none
- **AI models:** none
- **Started:** 2026-08-28T14:16:13Z
- **Last updated:** 2026-08-28T14:55:26Z

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
runtime integrations are not implemented or claimed yet (`AGENTS.md`,
`docs/research/all-gas-hackathon-rules.md`).
