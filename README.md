# Might

**You have more to offer than you know. Might finds where it matters.**

Might is a narrow, full-stack entry for the [Convex All Gas Hackathon](https://www.convex.dev/hackathons/all-gas). A person talks naturally; Might remembers meaningful context, notices a real public-world need, explains a possible overlap, asks for consent, and helps form a real connection.

- **Live app:** [hushed-stork-401.convex.site](https://hushed-stork-401.convex.site)
- **Public repository:** [github.com/Ranopha/might](https://github.com/Ranopha/might)

## The vertical slice

`Talk → Remember → Notice → Match → Consent → Contact → Reply → Connected`

The final path uses:

- Convex for private living memory, state, actions, and realtime UI.
- OpenAI for conversation, structured memory, contextual reasoning, outreach drafting, and original companion manifestation.
- Firecrawl for real public-source discovery and evidence.
- AgentMail for consent-gated outreach and real inbound replies.

Sponsor integrations are counted only after a real runtime call and traceable result. Current verified progress lives in [`hackathon.md`](hackathon.md).

## Current verified slice

The full product path is implemented and deployed: original companion generation,
private conversation and living memory, source-backed discovery and matching,
clarification, exact-payload consent, AgentMail receipts, verified replies,
reply-excerpt summaries, and explicit Connected confirmation. Separate private
rooms support repeatable demonstrations without mixing memories.

Two isolated production rehearsals, on September 5 and 6, completed the real path
from the default orb through Connected. In each run the owner approved two
controlled messages and AgentMail sent each once. The signed inbound reply changed
the same browser tab without refresh, and OpenAI summarized the reply excerpt.
The [first trace](docs/submission/evidence-2026-09-05-connected.json) and
[recorded repeat trace](docs/submission/evidence-2026-09-06-connected.json) link
every stage. Authenticated BYOK use and root Auth discovery were separately verified.

Email recovery tests cover early replies, late receipts, transport idempotency
and the provider's retry window. A 160-second recording with English narration
and captions has been rendered locally; see its
[verification receipt](docs/submission/video-final-2026-09-06.json).
Public video hosting, social publishing, eligibility verification and final
submission remain open; the hackathon build is not yet
declared complete. See the [demo script](docs/submission/demo-script.md) and
[entry draft](docs/submission/entry-draft.md).

This competition slice observes one allowlisted public volunteer source. It uses
a fictional demo persona and controlled email recipients; it does not imply a
partnership or real volunteer arrangement with the source organization.

A known desktop layout issue remains: at 1600 × 900 the decorative consent note
overlaps the center of the approval button. The visible upper-left part is usable;
the recorded approval used an ordinary click there. The issue is documented in
the repeat trace and has not been hidden by changing the recorded application.

## Local development

Requirements: Node.js 22+ and a Convex account.

```bash
npm install
npx convex dev
npm run dev:web
```

The Convex CLI creates `.env.local`. Provider secrets belong in the Convex deployment environment, never in client-side Vite variables or Git.

The app owns HTTP routing: Auth discovery stays at `/.well-known/`, application
endpoints stay under `/api`, and the official Static Hosting component handles
the frontend fallback. The production callback remains
`/api/agentmail/webhook`. Build production assets with the production
`VITE_CONVEX_URL`; never upload a bundle pointing at the development deployment.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Governance and evidence

- [`Might_Hackathon_Spec_v0.1.md`](Might_Hackathon_Spec_v0.1.md) is the frozen product/build specification.
- [`AGENTS.md`](AGENTS.md) is the repository work constitution.
- [`hackathon.md`](hackathon.md) is the public evidence log judges read.
- [`docs/research/all-gas-hackathon-rules.md`](docs/research/all-gas-hackathon-rules.md) records verified official rules and unresolved gates.

User memory is private by default. No external email may be sent without explicit approval of the exact recipient and payload.
