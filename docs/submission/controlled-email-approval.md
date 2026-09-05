# Controlled E2E email approval — executed once

Both inboxes are operated by this project. This is a fictional persona test, not
outreach to the nonprofit. The owner approved these two exact messages with
“核准” on September 5, 2026. Each was sent once, and the reply was bound to the
received introduction. This approval is now consumed; it does not authorize a
new recording run or another email.

The real provider and browser evidence is in
[`evidence-2026-09-05-connected.json`](evidence-2026-09-05-connected.json).
AgentMail appended its service footer to both messages and quoted the original
message in the reply. Authored content matched this approval, but the wire bodies
were not byte-identical to the drafts below. The UI now discloses the service footer.

## 1. Introduction through Might

From: `might-hackathon-prod@agentmail.to`

To: `might-demo-partner@agentmail.to`

Subject: `[Might controlled demo] Furniture repair introduction`

Payload fingerprint: `sha256:f913b2c97d402c6dabb0a75c6df4364ca44fae6efb9d1de3ff2eb215be107b35`

The three disclosed synthetic memory fields are furniture-restoration interest,
retained repair tools, and ten years of furniture-repair experience. No actual
user identity, credentials, schedule or contact information is included.

```text
This is a controlled Might hackathon test using a fictional persona, Alex. This inbox is operated by the project team; we are not contacting or representing 木匠的家.

Might noticed that a public volunteer page describes repair and furniture-related work. Alex has ten years of wooden-furniture repair experience, keeps the tools, and enjoys restoring old chairs and shelves.

For this demonstration, would occasional furniture-repair volunteering be worth discussing? No visit or commitment is being arranged.

Please reply to this thread to confirm that the introduction reached the test inbox.

— Might demo
```

## 2. Controlled partner reply

From: `might-demo-partner@agentmail.to`

To: `might-hackathon-prod@agentmail.to`

Subject: `Re: [Might controlled demo] Furniture repair introduction`

```text
Received — this is the project-controlled Might demo partner inbox. Alex's fictional furniture-repair background could be worth exploring. Before any real visit, the person and organization would need to confirm the tasks, location and available time. This test confirms two-way email contact only; no partnership, visit or commitment has been arranged.
```

After the verified reply appears, the demo may advance to Connected, which means
two-way contact only. There is no automatic follow-up email.

The separate user approval is required by `AGENTS.md`: “只有本次 payload 的明確
`Send` approval 才能寄出.” Editing either payload requires renewed approval.
