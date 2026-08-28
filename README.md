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

The public app currently ships the animated orb, four responsive product surfaces, a browser-scoped anonymous session, and a real Convex-backed Talk path. A production message has been sent, persisted, rendered through a realtime query, and recovered after reload. OpenAI replies and living memory, Firecrawl sensing, match reasoning, companion image generation, and AgentMail outbound/inbound are still explicitly unfinished.

## Local development

Requirements: Node.js 22+ and a Convex account.

```bash
npm install
npx convex dev
npm run dev:web
```

The Convex CLI creates `.env.local`. Provider secrets belong in the Convex deployment environment, never in client-side Vite variables or Git.

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
