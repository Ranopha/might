# AgentMail integration decision — 2026-08-30

## Decision

Use the official `@agentmail/convex` component, currently `0.1.0`, for Might's real outbound and inbound tracer. Do not hand-roll AgentMail thread storage, retries, delivery state, webhook signature verification, or event deduplication.

This directly serves the competition path:

`approved payload → durable AgentMail send → outbound status → verified inbound event → Convex realtime connection state`

## Why this component

The component documentation states that it provides:

- mutation-enqueued durable sending through a bounded-retry workpool;
- reactive outbound lifecycle and inbound thread/message queries;
- Svix-verified webhook handling;
- `event_id` deduplication;
- isolated Convex tables for inboxes, inbound/outbound messages, and events;
- callbacks for verified `message.received` events.

This is a better fit than rebuilding the same infrastructure around the generic Node SDK and is stronger Convex/component evidence for the hackathon.

## Route topology

Might's Convex app reserves `/api` for application HTTP routes while Static Hosting owns `/`. The stable callback will therefore be:

`https://hushed-stork-401.convex.site/api/agentmail/webhook`

Do not register a different callback and later move it without re-verifying the AgentMail webhook configuration.

## Secret and external-resource gate

Required Convex environment variables:

- `AGENTMAIL_API_KEY`
- `AGENTMAIL_WEBHOOK_SECRET`
- `AGENTMAIL_INBOX_ID`
- `AGENTMAIL_ALLOWED_RECIPIENTS`, a short comma-separated allowlist of controlled demo mailboxes
- optionally `AGENTMAIL_BASE_URL` only if EU residency is intentionally selected

The secret values must never enter Git, client bundles, logs, screenshots, or `hackathon.md`. Creating the persistent AgentMail inbox and registering the production webhook are external mutations; resolve the exact account/inbox and obtain action-specific authorization before executing them.

## Consent and send contract

- `I'm interested` only creates a pitch intent; it is not permission to share or contact.
- The preview must show the actual recipient, subject, complete body, selected memory statements, and private fields.
- Approval binds the exact payload hash, pitch/connection, recipient, timestamp, and idempotency key.
- Editing recipient, subject, body, or selected memory invalidates the prior approval.
- A valid approval may enqueue exactly one `AgentMail.sendMessage`; retries reuse the same application intent and component `OutboundId`.
- Without a current approval, AgentMail send count is zero.

## Inbound contract

- Mount `AgentMail.handleWebhook` at `/api/agentmail/webhook`; the component verifies `svix-id`, `svix-timestamp`, and `svix-signature` against the raw body.
- AgentMail `message.received` events include `event_id`, `inbox_id`, `thread_id`, `message_id`, message metadata/content, and thread metadata.
- The app callback must accept only the configured inbox and a thread already bound to an existing contacted connection.
- Duplicate `event_id` or component callback retries are idempotent.
- Unknown inboxes, threads, event types, or mismatched recipients fail closed and cannot advance state.
- A verified new reply transitions `CONTACTED → REPLIED`; the Connections realtime query changes without refresh. `CONNECTED` requires a later explicit in-product continuation decision and does not imply agreement, price, payment, or schedule.

## Current evidence boundary

The official `@agentmail/convex` component is installed in development `vibrant-wren-913`. The app now has a payload-bound, idempotent outbound mutation; durable local mail/thread bindings; an official component webhook route; fail-closed inbound thread handling; `CONTACTED → REPLIED`; and an explicit `REPLIED → CONNECTED` continuation mutation. Deterministic tests prove that stale approval and an unallowlisted recipient produce zero sends, one valid approval cannot create a duplicate send, unknown/duplicate inbound events do not advance state, and a bound reply updates the connection once.

The development AgentMail credential and inbox identifier are configured without being recorded here. After exact owner authorization, one controlled recipient was allowlisted and exactly one inbox-scoped `message.received` webhook was registered to the development callback; its signing secret is stored only in Convex development.

The first approved live outbound exposed an upstream `@agentmail/convex@0.1.0` compatibility gap: the package read `AGENTMAIL_API_KEY` from its isolated component runtime without declaring that environment variable. The AgentMail API remained at zero messages while the official workpool retried the same pending outbound. Might now carries a reproducible `patch-package` patch that declares the component API-key/base-URL inputs and maps them from the parent app, following Convex component environment isolation rules.

After the development sync, the existing outbound's final durable retry succeeded. AgentMail API, the component table, and Might's application binding agree on one sent message, one real thread, one provider message ID, the approved payload fingerprint, `sendCount: 1`, and no error.

The first human reply then reached the signed development webhook and was persisted once by the official component. Its real payload used RFC-style display-name addresses (`Display Name <email>`), which the application callback initially rejected because its recipient guard compared the complete display string to the bare inbox address. A red-to-green behavior test now covers that provider shape, and `agentMailInbound.ts` extracts a canonical mailbox only for comparisons while preserving the bounded original strings for display and audit. Exact inbox and thread binding, sender-not-inbox, event idempotency, and contacted-state checks remain fail closed.

Because AgentMail had already received a `204` before this fix, the accepted component event did not redeliver automatically. The already Svix-verified, component-persisted event was reconciled once through the corrected internal mutation; no new webhook, message, or outbound was created. Might now has one application inbound event, `sendCount: 1`, matching real message/thread receipts, and `CONTACTED → REPLIED`. The existing Connections screen changed to `They replied` without refresh and retained that state after reload. Explicit `CONNECTED`, an unassisted post-fix webhook replay, and production promotion remain open.

## Official sources

- Component: https://www.npmjs.com/package/@agentmail/convex
- Quickstart and SDK behavior: https://docs.agentmail.to/quickstart
- Webhook overview and payloads: https://docs.agentmail.to/webhooks-overview
- Webhook events: https://docs.agentmail.to/events
- Signature verification: https://docs.agentmail.to/webhook-verification
- Webhook creation API: https://docs.agentmail.to/api-reference/webhooks/create
