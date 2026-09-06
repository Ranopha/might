# Might — recording handoff

Status: two complete production E2E runs verified. The September 6 recording includes the exact approval, one outbound, one real inbound, live reply summary and Connected. The complete 160-second MP4 has been rendered and verified locally; public playback and submission remain pending.
Target: 160 seconds, 16:9, product-led, English narration/captions, no autoplay music.

## Recording constraints

The current CUA in-app browser supports screenshots and UI actions, but exposes
no recording capability and rejects content export. The native Codex application
is explicitly blocked from CUA control. The attempted QuickTime setup did not
start a recording, and no footage exists from that attempt. Do not substitute
reconstructed screens or staged state changes for real product footage.

The owner approved local Playwright on September 6, then separately approved the
exact two-message document. The isolated recording room completed the whole path:
601.96 seconds through the draft plus 147.80 seconds of approved outreach and
continuation. Both source videos are retained. The reply changed the same page
without navigation or refresh. See `evidence-2026-09-06-connected.json` and the
executed `recording-email-approval-2026-09-06.md`. Both September 5 and September 6
message approvals are consumed. Any new real send requires a new reviewed
payload and approval, even if the demonstration text is reused.

## Source and truth

- Live app: https://hushed-stork-401.convex.site
- Recording room: its own private saved session in the ignored recording directory.
- Companion: Milo, original OpenAI-generated artwork.
- Persona: fictional Alex; all provider work was real.
- Source: https://carpenter.org.tw/%E5%BF%97%E5%B7%A5%E5%A0%B1%E5%90%8D/
- Production proof: `evidence-2026-09-05-connected.json` and `evidence-2026-09-06-connected.json`.
- Show the caption “Fictional persona · Real integrations · Controlled email demo”.
- Show “Elapsed wait shortened” for edited provider latency. Use “Previously
  verified run” for retained results. Never label replayed state as a new live event.

## Rehearsal inputs

Companion name: Milo.

```text
An original Webtoon-style woodland workshop companion, small and gentle, with curious amber eyes, soft moss-green fabric, a little wooden star charm, warm morning light and hand-drawn paper texture. No famous character or logo.
```

First message:

```text
Call me Alex. I spent ten years repairing wooden furniture and still keep my tools. I enjoy careful work on old chairs and shelves, but I haven’t decided whether volunteering would fit my weekends.
```

Clarification answer, only when the actual model asks about willingness/time:

```text
Yes, I would be interested in an occasional furniture-repair volunteer project. I could offer one Saturday morning a month, and I would want to ask about the tools, location, and tasks before agreeing to a visit.
```

## Edit map and narration

| Timeline | Picture | Narration |
| --- | --- | --- |
| 00:00–00:12 | Fresh room, animated orb. | You have more to offer than you know. Might helps you discover where it matters. This demonstration uses a fictional person and controlled email inboxes. |
| 00:12–00:30 | Shape form, submit original description, show real saved companion. | Start with a quiet orb. Describe the companion you imagine, and OpenAI gives it an original form. This is Milo. |
| 00:30–00:55 | Natural message, real reply, Me, confirm memory. | Alex has ten years of furniture-repair experience and still keeps the tools. Might remembers useful details from the conversation. Alex can confirm, correct, or forget each one. |
| 00:55–01:22 | Found, real source link, excerpt, source check time, contextual overlap. | Firecrawl reads a public volunteer page in Taiwan. OpenAI connects its repair needs with Alex’s experience and interests. Might explains the evidence behind the possibility. |
| 01:22–01:38 | Actual clarification and saved answer. | It still needs to know whether Alex wants to volunteer and has time. One private answer helps resolve that uncertainty. |
| 01:38–02:04 | Interest, full draft, recipient, private fields, fingerprint, provider-footer disclosure. | Before contact, Alex sees the recipient, the complete message, and the three private memories it would disclose. The message clearly says this is a controlled test. AgentMail adds its service footer. |
| 02:04–02:20 | Recorded exact approval, one send and real receipt. | A separate approval allows this message to leave Might. AgentMail returns the real email and thread receipt. |
| 02:20–02:34 | Keep Connections open; approved partner reply arrives through the real webhook. | The reply changes this page without a refresh. Convex carries the live state, while OpenAI summarizes the reply excerpt. |
| 02:34–02:40 | Continue, Connected, closing live URL. | Two-way contact is open. What happens next is still their choice. |

## Export acceptance

- Final duration below 170 seconds; verify with media metadata and playback.
- Full draft and private disclosures legible; no credentials or other rooms shown.
- Recorded state changes must correspond to actual receipts in that recording run.
- Source organization is not represented as a participant or partner.
- Audio/captions agree with visible state; no false live claim over retained results.
- Public or unlisted playback works when signed out before final submission.

## September 6 artifacts and preservation

Final video: `videos/might-demo.local/renders/might-demo.mp4`, 160.000 seconds,
1920 × 1080, 30 fps, H.264/AAC. The editable timeline, source ledger, captions and
selected narration stay under `videos/might-demo.local/`. Public QA and digest:
`video-final-2026-09-06.json`. This is the full demonstration, still local and
unpublished. It contains 21 real ranges at 1×; source seconds 53.6–59.6 preserve
the continuous reply transition, first visible at source 56.36 / final 142.76.

The 124-second local preview is at
`videos/might-demo.local/pre-consent-review/renders/Might-PRE-CONSENT-REVIEW.mp4`.
Its source/editable project stays under `videos/might-demo.local/`; the source
recording and its private session are in `docs/submission/recording-2026-09-06.local/`.
Both directories are ignored. The public verification receipt is
`video-preview-2026-09-06.json`. This is a pre-consent review, not the final entry.

The same room has now completed outreach. Preserve `capture.webm`,
`outreach.webm`, their event logs and the existing 160-second editable project.
Do not rerun the outreach controller or either message helper to reconstruct an
event: both approved messages have already been sent and verified once.
Private session files, provider headers and raw database snapshots stay ignored;
only sanitized evidence and media QA receipts belong in the public repository.

Known recording issue: at 1600 × 900 a decorative note overlaps the center of
the approval button. The failed preflight produced no side effect; an ordinary
click on the visible upper-left part succeeded in the final take. The preflight
is preserved separately and the source application remains unchanged.
