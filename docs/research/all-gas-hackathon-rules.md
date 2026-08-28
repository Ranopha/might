# Convex All Gas Hackathon — official rules research

Verified on **2026-08-28 (Asia/Taipei)**. This note uses first-party Convex pages,
the event page presented by Convex, official Convex documentation, and official
Convex repositories only.

## Executive conclusion

Might's frozen vertical slice is aligned with the event's central requirement:
Convex must be the real backend, while OpenAI, Firecrawl, and AgentMail must each
do real product work. The safe qualification target is a **new app and new public
GitHub repository**, a root `hackathon.md`, a judge-accessible `convex.site`
deployment, a real social post tagging all four named accounts, and a product-led
video that is **strictly under three minutes**.

The official page says that only apps started on or after **August 25 at 12:00 PM
PT** qualify. The submission deadline is **September 22 at 12:00 PM PT**. The
visible pages omit the year; in the live 2026 event context these are understood
as 2026 dates, but that year is an inference rather than text printed alongside
the schedule. [Official event rules](https://www.convex.dev/hackathons/all-gas)

## Verified official facts

### 1. Eligibility and project timing

- Participants must be at least 18. Employees of Convex, sponsors/cohosts, and
  their immediate families are ineligible. Places where US or local law forbids
  participation or receiving a prize are excluded; the official page names
  Quebec, Russia, Crimea, Cuba, Iran, North Korea, and Syria as examples.
  [Convex rules — Eligibility](https://www.convex.dev/hackathons/all-gas#eligibility)
- The Convex event page gives the stricter new-app gate: **only new apps started
  on or after August 25 at 12:00 PM PT qualify**. The Luma page shortens this to
  “on or after August 25,” so use the Convex page's noon cutoff.
  [Convex rules — new apps](https://www.convex.dev/hackathons/all-gas)
- Solo participation is allowed. A team may have at most four people, and only
  one team member needs to register on Luma. Participants may submit more than
  one app.
  [Convex-presented Luma event — terms](https://luma.com/convex-allgas-hackathon)
- The project must be original and must not violate intellectual-property rights.
  [Convex rules — submission requirements](https://www.convex.dev/hackathons/all-gas)
- Registration on the event's Luma page is an explicit participation step.
  [Convex-presented Luma registration](https://luma.com/convex-allgas-hackathon)

### 2. Deadline and schedule

- Kickoff: August 25.
- Submission deadline: **September 22, 12:00 PM PT**.
- Winner announcement: September 25.
  [Official schedule](https://www.convex.dev/hackathons/all-gas)
- Submission is through the event's exact Vibe Apps link:
  [Convex All Gas submission form](https://vibeapps.dev/judging/convex-all-gas-hackathon-openai/submit).
  The public form currently exposes no readable field list to the research tool,
  so the form itself must be inspected manually before final submission.

### 3. Required stack and what “real use” means

- Convex must be the backend. The organizer's event page explicitly describes
  database, functions, and real-time sync as running on Convex.
  [Convex-presented requirements](https://luma.com/convex-allgas-hackathon)
- The event scores what teams ship on **Convex, OpenAI, Firecrawl, and
  AgentMail**. OpenAI, Firecrawl, and AgentMail must generate, crawl, or send in
  the product; listing packages or logos in the README does not satisfy the
  sponsor-stack criterion.
  [Official qualification and judging criteria](https://www.convex.dev/hackathons/all-gas#qualification-and-judging-criteria)
- The general rule says every submission must include Convex and use hackathon
  cohost or partner integrations. Together with the named sponsor-stack judging
  language, Might should treat all four integrations as mandatory for the real
  demo path.
  [Official submission requirements](https://www.convex.dev/hackathons/all-gas)
- Codex is recommended, but teams may use another IDE or coding agent. The Luma
  event instructions say the build should use Codex or another agent/IDE with
  the Convex plugin.
  [Official tool rule](https://www.convex.dev/hackathons/all-gas),
  [Convex-presented requirements](https://luma.com/convex-allgas-hackathon)

### 4. Public repository, deployment, and judge access

- A **public GitHub repository is required**; private GitHub repos do not
  qualify.
  [Official source-code rule](https://www.convex.dev/hackathons/all-gas),
  [Convex-presented event requirements](https://luma.com/convex-allgas-hackathon)
- The live frontend must be published at `convex.site` or `chatgpt.site`, and
  judges or an agent must be able to open it without an invite. Localhost demos
  do not qualify.
  [Official participation steps](https://www.convex.dev/hackathons/all-gas#how-to-participate)
- For Might's selected `convex.site` path, the official quick-start sequence is:

  ```bash
  npm install @convex-dev/static-hosting
  npx @convex-dev/static-hosting setup
  npm run deploy
  ```

  [Official event quick start](https://www.convex.dev/hackathons/all-gas),
  [official Static Hosting integration guide](https://github.com/get-convex/static-hosting/blob/main/INTEGRATION.md)
- The current Static Hosting package's deploy command builds the frontend with
  the production Convex URL, deploys the Convex backend, uploads `dist/`, and
  serves the result at `https://<deployment>.convex.site`. First cloud use may
  require `npx convex login`.
  [Official Static Hosting repository](https://github.com/get-convex/static-hosting)

### 5. `hackathon.md` and `/hackathon`

- `hackathon.md` must be at the repository root. The official event says judges
  read it and expects it to include what was built, the stack, live URL, and demo
  link.
  [Official checklist and judging criteria](https://www.convex.dev/hackathons/all-gas)
- Run `/hackathon` after each work session to keep the build log current.
  [Official participation workflow](https://www.convex.dev/hackathons/all-gas#how-to-participate)
- The official hackathon skill creates the file when missing, can backfill only
  evidence supported by Git/local files, and then appends only new evidence.
  It edits only `hackathon.md`; it does **not** commit, push, deploy, publish, or
  submit.
  [Official Convex hackathon skill](https://github.com/get-convex/convex-hackathon-skill)
- `hackathon.md` is public evidence. The official skill excludes secrets,
  private database records, personal contact details, and other sensitive data.
  Installing a package alone is not evidence that a component is actually used.
  [Hackathon skill — evidence and privacy](https://github.com/get-convex/convex-hackathon-skill)

### 6. Submission, social, and video

- The submission checklist explicitly asks for: a public repository, root
  `hackathon.md`, live `convex.site` or `chatgpt.site` URL, and a three-minute
  video. The participation step also says to submit the repo, live URL, and
  video.
  [Official submission checklist](https://www.convex.dev/hackathons/all-gas)
- The judging criterion is stricter than the checklist wording: the demo must be
  **under three minutes**, with less talking and more clicking through the real
  product. Target `<= 2:50` to avoid an eligibility/scoring dispute caused by
  upload-player rounding.
  [Official video criterion](https://www.convex.dev/hackathons/all-gas#qualification-and-judging-criteria)
- Participants are instructed to share the app on X or LinkedIn and tag
  `@convex`, `@OpenAI`, `@firecrawl`, and `@agentmail`. Social proof is a judging
  factor, and engagement counts.
  [Official participation and social-proof criterion](https://www.convex.dev/hackathons/all-gas)
- The published pages do not specify the video's hosting provider, language,
  aspect ratio, privacy setting, or whether a social-post URL is a required form
  field. Those remain unresolved until the submission form is manually opened.

### 7. Judging criteria

The official criteria are qualitative, not a published point rubric:

1. **Everyday app, not a developer tool:** ship something a person would use.
2. **Creativity and usefulness:** useful this week; copycats and developer-only
   tools score low.
3. **Convex depth:** real queries, mutations, live updates, auth, and components;
   a thin hosted frontend does not count.
4. **Sponsor stack:** OpenAI, Firecrawl, and AgentMail do real work.
5. **Live URL:** judge-accessible `convex.site` or `chatgpt.site`.
6. **Social proof:** post on X or LinkedIn; engagement counts.
7. **Video demo:** under three minutes and product-led.

[Official qualification and judging criteria](https://www.convex.dev/hackathons/all-gas#qualification-and-judging-criteria)

There is one useful nuance: the Luma requirements explicitly say that an app
with no auth is still a valid submission, while “auth” appears in the Convex
depth examples. Therefore auth is **not a hard eligibility requirement**, but a
well-integrated privacy/session story may improve Convex-depth scoring.
[Convex-presented auth clarification](https://luma.com/convex-allgas-hackathon),
[official Convex-depth criterion](https://www.convex.dev/hackathons/all-gas#qualification-and-judging-criteria)

## Official setup and integration references

### Convex-aware Codex setup

Official Convex documentation says:

```bash
# Install the current full plugin from the Convex marketplace
codex plugin marketplace add get-convex/convex-codex-plugin
codex plugin add convex@convex-codex-plugin

# In the app root, create/update the managed Convex section in AGENTS.md
# and install project-local Convex Agent Skills.
npx convex ai-files install

# Provision/check a local backend non-interactively.
npx convex dev --once
```

The built-in directory command `codex plugin add convex@openai-curated` is also
documented, but the same page currently warns that this directory entry is the
lighter ChatGPT-app connector and may lag the full marketplace plugin. Use the
marketplace build when the full skills, specialized agents, deployment access,
and error watcher are desired.
[Using Codex with Convex](https://docs.convex.dev/ai/using-codex),
[Convex Agent Plugins](https://docs.convex.dev/ai/convex-plugins)

`npx convex ai-files install` is especially relevant to Might: it creates or
updates a managed Convex section in `AGENTS.md` and installs Convex skills under
`.agents/skills/`. Project-specific product/rule guidance should remain outside
the tool-managed section so later CLI updates do not overwrite it.
[Using Codex with Convex — AI files](https://docs.convex.dev/ai/using-codex)

### Sponsor components

- Firecrawl's official Convex component is installed with
  `npm install @firecrawl/firecrawl-convex`. It supports search, scrape, map, and
  durable crawls from Convex actions. Durable crawl state/pages can be stored in
  Convex and observed reactively. Local deployments require poll mode unless a
  reachable signed-webhook test setup is used.
  [Official Firecrawl Convex component](https://www.convex.dev/components/firecrawl/firecrawl-convex)
- AgentMail's official Convex component is installed with
  `npm install @agentmail/convex`. It persists inbox/thread/message/delivery
  state in Convex, supports durable sending, and ingests inbound webhooks with
  reactive queries.
  [Official AgentMail Convex component](https://www.convex.dev/components/agentmail/convex)
- Static Hosting's default setup mounts the site at `/` and moves app-owned HTTP
  routes under `/api`. Its official guide says that existing auth or webhook
  callbacks that must remain at root should use app-owned root routing instead.
  Since Might needs AgentMail inbound webhooks, choose and verify the HTTP-route
  topology before freezing any callback URL.
  [Official Static Hosting integration guide](https://github.com/get-convex/static-hosting/blob/main/INTEGRATION.md)

## Reasonable inferences for Might

These are implementation conclusions, not verbatim event rules:

- Treat **all four sponsor systems** as required in the captured demo path. The
  general rule's “cohost or partner integrations” wording is less explicit than
  the judging section, but the sponsor-stack section names OpenAI, Firecrawl,
  and AgentMail individually.
- A “real integration” claim needs runtime evidence: an OpenAI-generated or
  reasoned result, a Firecrawl-derived public signal, a real consent-gated
  AgentMail send, a real inbound reply/webhook, and Convex live state/UI change.
  Package installation, seeded fixtures, logos, or README statements are not
  enough.
- Preserve a single evidence chain for the three-minute demo. If fallback data
  is shown, label it honestly and retain earlier proof that the sponsor call ran;
  do not present seeded/cached data as a live crawl or email event.
- Use the stricter media interpretation: final runtime **below 3:00**, public or
  unlisted-but-judge-accessible, and linked from both `hackathon.md` and the form.
- Although auth is optional for qualification, Might's private living memory
  needs at least browser/session isolation and no cross-user shared dataset. If
  time permits, real auth would strengthen both privacy and Convex-depth scoring.
- For 2026, September 22 at noon Pacific is during daylight time (PDT, UTC-7),
  which converts to **September 23 at 03:00 Asia/Taipei**. Treat this conversion
  as operational guidance; the official source itself publishes only “PT.”

## Unresolved unknowns / final gates

- **Year not printed beside the visible schedule:** the live event context is
  2026, but the official schedule text itself says only Aug 25 / Sep 22 / Sep 25.
- **Submission form fields:** the Vibe Apps page yields no readable schema to the
  research tool. Manually inspect it before final packaging for title,
  description, team, social-post URL, video-host constraints, or account/login
  requirements.
- **Registration state:** this research confirms registration is required but
  cannot verify whether the user's Luma registration is complete.
- **Sponsor credits/account state:** the event says registered participants get
  Firecrawl build credits and says no OpenAI API or Convex credits are provided.
  It does not prove that Might's accounts/keys/credits are active.
- **Social posting deadline:** the pages instruct participants to post and count
  engagement, but do not state a separate social deadline. Complete it before
  form submission.
- **Video hosting and accessibility:** no official provider or privacy setting is
  stated in readable sources. Ensure a signed-out judge can play it.
- **Exact sponsor API feature minimums:** no call-count, model, crawl-size, or
  email-volume minimum is published. The only clear standard is that each
  integration performs real product work.

## Operational checklist to copy into `AGENTS.md`

- [ ] Preserve evidence that the Git/app work began after the official new-app
      cutoff.
- [ ] Keep the GitHub repository public and secret-free.
- [ ] Use Convex for persistent data, functions, and realtime UI state.
- [ ] Make OpenAI, Firecrawl, and AgentMail each perform real work in the E2E.
- [ ] Never claim a package installation or fixture as integration proof.
- [ ] Deploy early to a signed-out-accessible `https://*.convex.site` URL.
- [ ] Keep `hackathon.md` at repo root; run `/hackathon` after each meaningful
      work session and never write secrets or private records into it.
- [ ] Keep the demo video under three minutes and show clicks/state changes.
- [ ] Post on X or LinkedIn and tag all four official accounts.
- [ ] Submit public repo, live URL, build log, and video through the exact Vibe
      Apps link before the PT deadline.
- [ ] Manually verify the submission form, Luma registration, video access, and
      public app from a signed-out browser before submission.
