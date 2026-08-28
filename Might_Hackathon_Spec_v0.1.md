# Might — All Gas Hackathon Product & Build Spec v0.1

**Status:** SCOPE FROZEN FOR HACKATHON PROTOTYPE  
**Build target:** polished full-stack vertical slice  
**Primary implementation agent:** Codex  
**Hackathon:** Convex All Gas Hackathon — Convex × OpenAI × Firecrawl × AgentMail  
**Working brand:** Might  
**Tagline:** **You have more to offer than you know.**  
**Supporting line:** **Might finds where it matters.**  
**Core loop:** **Talk → Remember → Notice → Connect**

---

# 0. Executive Directive for Codex

Build **Might** as a **new app started after Aug 25, 2026**.

Do **not** build a broad social network, marketplace, job board, or generic AI dashboard.  
Build one **deep, polished, emotionally coherent vertical slice** that proves the thesis:

> A user can simply talk to Might.  
> Might gradually understands the user without forcing a résumé or skills form.  
> Might simultaneously observes the public world for needs and situations.  
> When something about the user may matter in a real situation, Might notices the overlap, asks for consent, and helps create the connection.

The prototype is successful when the following **real E2E** works:

1. User opens Might.
2. User shapes Might’s visual manifestation.
3. User has a natural conversation.
4. Might remembers meaningful information from the conversation.
5. Firecrawl discovers a real/public world signal.
6. OpenAI interprets the signal and reasons about a possible overlap with the user.
7. Might surfaces a potential connection.
8. User clarifies missing context and explicitly consents.
9. Might prepares a contextual introduction/pitch.
10. AgentMail sends the outreach.
11. External reply arrives.
12. Convex updates the connection state in real time.
13. User sees **Replied / Connected** without refreshing.

**Do not expand scope until this entire loop is polished and reliable.**

---

# 1. Product Thesis

## 1.1 What Might is

Might is an AI connection layer between a person and the real world.

The user does not need to know:
- what opportunity to search for,
- what their “skills” are,
- whether they are a freelancer,
- whether their interests are economically useful,
- what form a useful connection should take.

The user simply talks to Might naturally.

Might:
- gets to know the user over time,
- remembers context,
- observes real-world public signals,
- notices when something about the user may matter somewhere,
- asks permission before taking action,
- and helps form a useful human-to-human or human-to-organization connection.

## 1.2 Product philosophy

**Might does not define a person’s value in advance.**

It does not need a global ontology of skills.

It does not say:
- “You are a carpenter.”
- “You are an anime expert.”
- “You are a travel advisor.”

Instead it remembers contextual facts and experiences.

Only when a need appears does it ask:

> “Is there something about this person that may be useful here?”

Therefore:

**Do not define the person. Define the overlap.**

## 1.3 Core semantic idea

Traditional systems:

`Profile → category → job/recommendation`

Might:

`Living human memory + world context → contextual reasoning → possible overlap`

The system should support **serendipitous matching**, not simple keyword similarity.

## 1.4 Might is not

Might is **not**:
- LinkedIn with AI,
- Upwork with AI,
- a job scraper,
- a freelance auto-bidder,
- a résumé builder,
- a marketplace,
- an infinite social feed,
- a developer tool,
- a generic ChatGPT wrapper,
- an AI companion whose only value is conversation.

---

# 2. Hackathon Fit & Competition Constraints

## 2.1 Official requirements to satisfy

Current official All Gas requirements include:

- new app only, started on/after Aug 25, 2026;
- Convex must be the backend;
- public live app at `convex.site` or `chatgpt.site`;
- public GitHub repo;
- root-level `hackathon.md`;
- OpenAI, Firecrawl, and AgentMail must do real work;
- submit live app, repo, and <3-minute video;
- social sharing on X or LinkedIn is part of judging;
- “everyday apps, not developer tools”;
- creativity/usefulness matter;
- Convex depth matters: queries, mutations, live updates, components, and optionally auth;
- social engagement counts;
- deadline: Sep 22, 2026 at 12:00 PM PT.

Official source:
https://www.convex.dev/hackathons/all-gas

## 2.2 Sponsor-native product mapping

Might must visibly showcase each sponsor as indispensable:

### OpenAI = Understanding
- natural conversation;
- semantic memory extraction;
- world-signal interpretation;
- serendipitous match reasoning;
- clarification questions;
- contextual intro/pitch generation;
- incoming-email interpretation;
- companion manifestation prompt transformation;
- companion image generation.

### Firecrawl = Seeing
- search/scrape public web signals;
- collect source evidence;
- feed fresh world context into Might;
- not merely “find job listings.”

### Convex = Remembering + State
- conversation state;
- living memory;
- world signals;
- matches;
- connection lifecycle;
- mail thread metadata;
- reactive live UI updates;
- mutations/queries/actions/components.

### AgentMail = Connecting
- persistent agent inbox;
- outbound introduction;
- incoming external reply;
- continued email thread;
- real-world asynchronous connection.

## 2.3 Judge-visible sponsor moments

The demo must make these moments obvious:

1. **Firecrawl:** “Might noticed this happening in the world.”
2. **OpenAI:** “Might understood why this situation may connect to you.”
3. **AgentMail:** “Might reached out only after you approved.”
4. **Convex:** `CONTACTED → REPLIED` changes live on screen without refresh.

---

# 3. Scope Freeze

## 3.1 P0 — Must build

- polished public web app;
- responsive UI;
- onboarding conversation;
- text input;
- optional voice input if implementation is low-risk;
- Companion Manifestation;
- default animated orb;
- Webtoon-style generated companion image;
- conversation persistence;
- semantic memory extraction;
- Me / Memory screen;
- Firecrawl world-signal ingestion;
- world-signal evidence/source;
- one reliable serendipitous-match pipeline;
- clarification loop;
- explicit consent gate;
- mini contextual pitch/intro;
- AgentMail outbound;
- AgentMail inbound reply;
- Convex realtime connection state;
- polished sound/motion system;
- hackathon.md continuously maintained;
- public GitHub;
- deployment to convex.site;
- 3-minute demo-ready path.

## 3.2 P1 — Build only after P0 is reliable

- voice input;
- second companion state (idle/thinking generated image);
- a second demo persona;
- basic auth if painless;
- manual “scan now” internal demo control;
- richer source evidence view;
- second public-source category.

## 3.3 Explicitly DO NOT BUILD

Do not build:
- payments;
- phone calls;
- WhatsApp/SMS;
- booking engine;
- full social network;
- follow/friend system;
- follower counts;
- marketplace;
- infinite feed;
- résumé import;
- job board UI;
- profile completion percentage;
- giant skill taxonomy;
- complex vector recommender infrastructure;
- production-scale web crawling;
- multi-agent orchestration dashboard;
- native iOS/Android;
- full Live2D;
- lip sync;
- skeletal avatar rig;
- 3D character generation;
- full avatar editor;
- enterprise-grade permission system;
- production moderation stack;
- broad multilingual localization;
- complicated monetization.

---

# 4. Brand & Emotional Direction

## 4.1 Brand name

**Might**

Intended semantic ambiguity:
- possibility: “this might happen”;
- capacity/power: “human might.”

## 4.2 Core copy

Primary:
> **You have more to offer than you know.**

Secondary:
> **Might finds where it matters.**

Onboarding concept:
> **Keep living. Keep talking. Might will notice.**

Notification concept:
> **I found something you might be great for.**

Product principle:
> **Might doesn't decide what you're good for. It notices when something about you becomes useful somewhere.**

## 4.3 Personality

Might should feel:
- curious;
- warm;
- calm;
- observant;
- non-judgmental;
- lightly playful;
- never patronizing;
- never overenthusiastic;
- never like a recruiter;
- never like a corporate chatbot.

---

# 5. Art Direction

## 5.1 Primary art language

**Polished Webtoon-style digital illustration**

Desired:
- clean line art;
- stylized anatomy;
- expressive silhouettes;
- soft cel shading;
- modern digital illustration;
- warm emotional readability;
- slightly magical;
- visually distinct from reality;
- polished consumer-product look;
- attractive at both hero size and avatar size.

Avoid:
- flat corporate SVG illustration;
- generic vector mascot;
- emoji/sticker collage;
- CSS-generated “character” art;
- photorealism;
- cinematic superhero realism;
- uncanny faces;
- cheap 3D;
- realistic synthetic humans.

## 5.2 Visual principle

The app must immediately communicate:

> “This is a designed product, not an AI dashboard.”

## 5.3 Interface visual character

Recommended direction:
- dark-to-soft-neutral canvas;
- luminous accent atmosphere around Might;
- large negative space;
- high typography quality;
- soft glass/translucent panels used sparingly;
- cards feel editorial, not enterprise-dashboard-like;
- roundness used selectively, not everywhere;
- low visual density;
- motion used to create “life,” not decoration.

Do not hardcode colors until visual exploration; use design tokens.

---

# 6. Companion Manifestation

## 6.1 Product purpose

Companion Manifestation makes Might feel like an entity the user helped create.

Psychological goal:
- user invests identity into Might;
- Might becomes “my Might,” not “an AI tool”;
- the user is more willing to continue the conversation.

This is a **high-value onboarding hook**, not the core product.

## 6.2 Default manifestation

Might initially exists as a softly animated glowing orb.

Orb behavior:
- gentle vertical float;
- slow breathing/pulse;
- subtle internal light movement;
- faint response to cursor/touch proximity if easy;
- thinking state becomes slightly more active;
- no aggressive particle effects.

## 6.3 First-run prompt

Might:

> **Hi. I’m Might.**  
> Before we get to know each other…  
> would you like me to keep this form,  
> or become something you imagine?

Actions:
- **Keep this form**
- **Shape my form**

## 6.4 Form creation

If user chooses Shape my form:

Prompt:
> **What would you like me to feel like?**  
> Describe a creature, mood, energy, or vibe.

Example placeholder:
> “A tiny night guardian with a soft glow.”

The user may say something inspired by a well-known character.

### IP transformation rule

Do not copy recognizable copyrighted characters.

If input:
> “A baby Batman.”

The system should internally reinterpret it into an original design direction, e.g.:

> “A tiny original night guardian, brave but gentle, childlike proportions, soft dark cape-like silhouette, warm glowing eyes, original costume design, no logos or recognizable franchise elements.”

The user should receive the emotional direction, not a copied IP character.

## 6.5 Image pipeline

Recommended:

1. User description.
2. OpenAI text model converts it to an original, copyright-safe art brief.
3. OpenAI **GPT-Image-2** generates the Webtoon-style companion asset.
4. Store generated asset.
5. Display it as the user’s Might manifestation.
6. Apply lightweight CSS/Framer Motion animation.

Current OpenAI model documentation identifies GPT-Image-2 as the state-of-the-art image generation model.

## 6.6 Generation art prompt baseline

System art brief:

> Create an original companion character in a polished Webtoon-style digital illustration. The character should feel warm, expressive, approachable, imaginative, and clearly non-photorealistic. Use clean line art, soft cel shading, strong silhouette readability, stylized proportions, and modern consumer-app polish. Avoid flat corporate SVG art, generic vector mascot styling, cheap stickers, photorealism, cinematic realism, uncanny human features, logos, and recognizable copyrighted character design. Preserve the requested mood and emotional direction while creating an original character. Composition must remain readable in both a large onboarding hero and a small chat companion portrait.

## 6.7 Hackathon scope

P0:
- 1 generated form;
- subtle idle animation.

P1:
- optional second “thinking” state.

Do not implement rigging or full animation.

---

# 7. Audio & Motion Language

The product should feel polished visually **and audibly**, but sound must remain subtle.

## 7.1 Sound cues

Implement only short UI sounds:

### manifestation_complete
Soft shimmer / bloom.

### memory_understood
Very subtle warm tick; optional and low volume.

### match_found
A soft two-note discovery chime.

### external_reply
A slightly brighter notification tone.

### connected
Warm resolved two- or three-note confirmation.

Requirements:
- sounds <1 second except manifestation;
- no loud game-like effects;
- provide global mute toggle;
- respect reduced-motion / accessibility preferences where possible;
- do not autoplay music.

## 7.2 Motion principles

Motion should communicate:
- presence;
- understanding;
- discovery;
- connection.

Do not use motion merely for decoration.

Target transitions:
- 180–320ms normal UI transitions;
- orb idle loop 4–8 seconds;
- match card entrance 450–700ms;
- connected state 700–1200ms, restrained.

---

# 8. App Information Architecture

Might has four primary surfaces.

1. **Talk**
2. **Me**
3. **Might Found**
4. **Connections**

Navigation should be extremely light.

Desktop:
- subtle left rail or top segmented nav.

Mobile:
- bottom nav with 4 items.

The companion presence should remain visible in Talk and appear as a smaller identity element elsewhere.

---

# 9. Screen 1 — Talk

## 9.1 Goal

Make conversation the natural home of the product.

No onboarding form.

## 9.2 Initial state

Hero:
- animated orb or manifested companion;
- brand Might;
- first prompt.

After manifestation:
> **Now I’d like to know you. What should I call you?**

## 9.3 Conversation behavior

Might should begin with lightweight RPG-like character discovery.

Do not ask:
> “What are your skills?”

Prefer:
- “What do you usually do these days?”
- “What do you like doing when you're not working?”
- “What can you spend hours doing without getting bored?”
- “What do people often ask you for help with?”
- “What do you know way too much about?”
- “What does a free Saturday usually look like for you?”

The next question is dynamically chosen from current conversation context.

## 9.4 Conversation UI

Must include:
- chat messages;
- text input;
- send;
- optional voice control;
- companion visual;
- thinking animation;
- no tool-debug output.

Might responses:
- short;
- conversational;
- usually 1 question at a time;
- avoid interrogation.

---

# 10. Onboarding Dialogue Script

This is a reference behavior, not a fixed questionnaire.

## 10.1 Opening

Might:
> Hi. I’m Might. Before we get to know each other, would you like me to keep this form, or become something you imagine?

User shapes form.

Might:
> I like this. Now I want to know the person I’m here for. What should I call you?

User:
> Alex.

Might:
> Nice to meet you, Alex. What do you usually do these days?

## 10.2 Example woodworker path

User:
> I manage a convenience store. I used to do woodworking for about ten years though.

Might:
> Ten years is a long time. Do you still do any woodworking now, or is it mostly part of your past?

User:
> Sometimes on weekends. I still have all my tools.

Might:
> Got it. What do you usually enjoy doing when you actually have a free weekend?

User:
> I take my family around Taiwan, cook sometimes, or mess with wood projects.

Might:
> That gives me a much better picture. I’ll keep learning naturally as we talk — you don’t have to build a profile for me.

End onboarding naturally.

## 10.3 Example “no special skill” path

User:
> I don’t really have any special skills. Mostly games and manga after work.

Might:
> That’s fine. What kind of games or manga do you always end up knowing too much about?

The goal is **not** to flatter or force every behavior into a “skill.”
The goal is to keep useful contextual memory without prematurely classifying it.

---

# 11. Screen 2 — Me

## 11.1 Goal

Show the user that Might is actually learning them.

Never call it résumé or profile completion.

Title options:
- **What I remember**
- **What Might knows about me**

## 11.2 Card examples

> You managed a convenience store.

> You spent around ten years doing woodworking.

> You still own your woodworking tools.

> Weekends are usually more flexible for you.

> You enjoy traveling around Taiwan with your family.

Each memory card:
- short statement;
- source/time hint;
- “That’s right”;
- “Not quite” / edit;
- “Forget this”.

## 11.3 Privacy behavior

Every memory defaults private.

Might may reason with private memory internally.

It must not reveal private information externally without user authorization.

Never autonomously disclose:
- precise home address;
- financial details;
- credentials/accounts;
- government IDs;
- sensitive health/body details;
- private family details;
- private conversations;
- contact details unless needed and explicitly authorized.

---

# 12. Memory Model

## 12.1 Do not build a skills ontology

Do not create a large `skills` taxonomy.

Primary truth is **memory with evidence**, not AI-defined labels.

## 12.2 Memory object

Suggested conceptual schema:

```ts
type Memory = {
  id: Id<"memories">;
  userId: Id<"users">;
  statement: string;
  subject: "user";
  semanticType?:
    | "experience"
    | "interest"
    | "preference"
    | "availability"
    | "knowledge"
    | "resource"
    | "constraint"
    | "habit"
    | "context"
    | "other";
  sourceMessageId?: Id<"messages">;
  source: "conversation" | "user_edit" | "system_inference";
  explicitness: "explicit" | "inferred";
  confidence: number;
  privacy: "private" | "shareable_with_consent";
  freshness: "long_term" | "temporary" | "unknown";
  lastConfirmedAt?: number;
  createdAt: number;
  updatedAt: number;
  embedding?: number[];
}
```

## 12.3 Extraction rule

Only store something when it may meaningfully help Might understand the person later.

Do not store every sentence.

Examples worth remembering:
- sustained interests;
- repeated behavior;
- real experience;
- resources;
- availability;
- strong preferences;
- constraints;
- things the person likes/dislikes doing;
- domains they repeatedly discuss.

Examples not worth storing:
- filler;
- temporary wording;
- trivial single-turn conversational detail with no future relevance.

---

# 13. OpenAI Role Architecture

Do not create a huge monolithic prompt.

Use logical roles:

## 13.1 Conversation Explorer

Input:
- recent messages;
- compact living memory.

Output:
- natural response;
- at most one natural follow-up question.

## 13.2 Memory Extractor

Input:
- latest user message;
- local conversation context.

Output:
- structured memory candidates;
- explicit/inferred;
- confidence;
- privacy;
- whether to insert/update/ignore.

Recommended cost strategy:
- use an economical GPT-5.6-family model for routine extraction;
- keep model configurable by env.

## 13.3 World Interpreter

Input:
- Firecrawl source content;
- source metadata.

Output:
- situation;
- pain/friction;
- desired outcome;
- explicit or inferred need;
- location/time;
- uncertainty;
- evidence snippets/URLs;
- confidence.

## 13.4 Serendipity Judge

Input:
- one candidate world signal;
- relevant user memories only.

Question:
> Does something about this person plausibly matter in this situation?

Output:

```ts
{
  matchConfidence: number;
  whyThisSituationMatters: string;
  whyThisPersonCameToMind: string;
  missingContext: string[];
  riskLevel: "low" | "medium" | "high";
  recommendation: "ignore" | "ask_user" | "surface";
}
```

Do not let embedding similarity be the final judge.

## 13.5 Connection Agent

After consent:
- creates contextual intro/pitch;
- sends via AgentMail;
- interprets incoming replies;
- proposes next step;
- never continues sensitive commitments without consent.

---

# 14. World Sensor — Firecrawl

## 14.1 Product role

Firecrawl is Might’s eye on the public world.

Do not position it as a job scraper.

## 14.2 V0.1 sources

Only use a small allowlist of stable public-source categories.

Examples:
- public business websites;
- public service/project request pages;
- public local announcements;
- public company updates;
- public event/community listings.

Avoid for V0.1:
- private social groups;
- login-required content;
- questionable scraping;
- broad social-media automation;
- mass crawling.

## 14.3 Signal pipeline

```text
Firecrawl Search/Scrape
        ↓
raw source
        ↓
OpenAI World Interpreter
        ↓
WorldSignal in Convex
        ↓
candidate retrieval
        ↓
Serendipity Judge
```

## 14.4 WorldSignal schema

```ts
type WorldSignal = {
  id: Id<"worldSignals">;
  sourceUrl: string;
  sourceTitle?: string;
  sourceDomain?: string;
  rawExcerpt?: string;
  situation: string;
  painOrFriction?: string;
  desiredOutcome?: string;
  needHypothesis?: string;
  location?: string;
  timeContext?: string;
  explicitness: "explicit_need" | "inferred_need";
  confidence: number;
  evidence: Array<{ url: string; excerpt?: string }>;
  createdAt: number;
  embedding?: number[];
}
```

---

# 15. Serendipity Engine

## 15.1 Principle

Might does not match labels.

It discovers contextual overlap.

## 15.2 Two-stage matching

Stage A — cheap recall:
- embeddings;
- semantic tags;
- rough location/time filters.

Goal:
reduce candidate set.

Stage B — OpenAI reasoning:
- actual world context;
- relevant user memories;
- uncertainty;
- safety.

## 15.3 Progressive semantic resolution

Do not force precision too early.

Example:

Memory:
> “User did woodworking for ten years.”

World signal:
> “Cafe renovation may require a custom counter.”

Initial confidence:
82%.

Missing context:
> “Has user done commercial counter/shelving work?”

Might asks user.

After reply:
> “Yes, I built several shop counters.”

Confidence:
94%.

Only then move toward connection.

---

# 16. Screen 3 — Might Found

## 16.1 Goal

This is the product’s magic moment.

Title:
**Might Found**

Main message:
> **I found something you might be great for.**

Do not use:
- Jobs;
- Leads;
- Marketplace;
- Recommendations.

## 16.2 Opportunity card

Example:

### A café renovation in Taoyuan

**What I noticed**
> They’re renovating and appear to need a custom wooden counter and shelving.

**Why I thought of you**
> You told me you spent about ten years woodworking and still have your tools.

**One thing I’m not sure about**
> Have you done commercial counters or shelving before?

User answers.

Then:
> **This looks like a strong fit. Want me to explore it with you?**

Actions:
- **I’m interested**
- **Not for me**

## 16.3 No percentage fetish

A confidence score can exist internally.

Do not overemphasize a fake precise “94%” in consumer UI unless visually useful for demo.

Prefer natural language:
- Possible fit;
- Strong fit;
- Worth exploring.

---

# 17. Consent Boundary

Might can:
- observe;
- remember;
- reason;
- suggest;
- ask;
- prepare.

Might cannot contact an external person until the user explicitly approves.

Flow:

```text
OBSERVE
  ↓
SUGGEST
  ↓
CLARIFY
  ↓
PREPARE
  ↓
USER APPROVAL
  ↓
CONTACT
```

Before outreach, show:
- what will be sent;
- what private information will be included;
- target destination.

User chooses:
- Send;
- Edit;
- Cancel.

---

# 18. Contextual Pitch

Do not build a PowerPoint generator.

For V0.1, generate a polished **one-page contextual introduction**.

Example:

## Alex — Woodworking experience
- 10 years of woodworking experience
- owns full tool set
- based in Taoyuan
- available mainly on weekends
- experience with shop counters and shelving

CTA / contact context.

The same structured content can be linked from AgentMail.

The pitch is generated **for this opportunity**, not a permanent résumé.

---

# 19. AgentMail Integration

## 19.1 Principle

AgentMail is not a notification sender.

Might should feel like it has a persistent email identity.

## 19.2 Outbound

After user approval:

1. Create/resolve user’s Might inbox identity.
2. Generate email.
3. Send to external contact.
4. Store thread reference in Convex.
5. Connection status becomes `CONTACTED`.

## 19.3 Inbound

When external person replies:

1. AgentMail receives email.
2. webhook/event updates Convex;
3. message metadata stored;
4. `CONTACTED → REPLIED`;
5. live query updates UI;
6. OpenAI summarizes the reply;
7. Might asks user what to do next.

## 19.4 No autonomous commitments

Might may draft:
- “Yes, I’m interested.”
- “Can we discuss details?”
- “Saturday may work.”

But must not commit:
- price;
- legal agreement;
- payment;
- binding schedule;
- sensitive terms;
without explicit user consent.

---

# 20. Screen 4 — Connections

## 20.1 Goal

Show that AI inference became real-world interaction.

Each connection card:

- connection title;
- external party;
- current state;
- short activity timeline;
- last reply;
- next suggested action.

## 20.2 State machine

```text
POTENTIAL
↓
USER_INTERESTED
↓
CLARIFYING
↓
PITCH_READY
↓
CONTACTED
↓
REPLIED
↓
CONTINUING
↓
CONNECTED
```

Alternate terminal states:
- DECLINED_BY_USER
- NO_RESPONSE
- NOT_A_FIT
- CLOSED

## 20.3 Realtime hero moment

When inbound reply arrives:
- status changes live;
- small sound cue;
- subtle motion;
- label becomes **They replied**.

No page refresh.

This must work in the demo.

---

# 21. Convex Data Model

Minimum tables:

```text
users
conversations
messages
memories
companionManifestations
worldSignals
matches
connections
mailThreads
```

Suggested match:

```ts
type Match = {
  userId: Id<"users">;
  worldSignalId: Id<"worldSignals">;
  relevantMemoryIds: Id<"memories">[];
  reasoning: string;
  missingContext: string[];
  confidence: number;
  status:
    | "candidate"
    | "needs_clarification"
    | "surfaced"
    | "dismissed"
    | "accepted";
  createdAt: number;
  updatedAt: number;
}
```

Suggested connection:

```ts
type Connection = {
  userId: Id<"users">;
  matchId: Id<"matches">;
  title: string;
  externalEntityName?: string;
  status:
    | "potential"
    | "user_interested"
    | "clarifying"
    | "pitch_ready"
    | "contacted"
    | "replied"
    | "continuing"
    | "connected"
    | "closed";
  pitchText?: string;
  pitchUrl?: string;
  agentMailThreadId?: string;
  createdAt: number;
  updatedAt: number;
}
```

---

# 22. Convex Depth Requirements

To score well, visibly use:

## Queries
- conversation history;
- memories;
- Might Found;
- Connections;
- live connection state.

## Mutations
- append message;
- accept/edit memory;
- create match;
- update consent;
- transition connection state.

## Actions
- call OpenAI;
- call Firecrawl;
- send AgentMail.

## Realtime
- memory cards appear/update;
- match appears;
- inbound mail updates state.

## Components
Use official Firecrawl/AgentMail components where appropriate.

## Auth
Optional for hackathon.
If Auth introduces instability, use a demo user/session.
Reliability wins.

---

# 23. Privacy & Safety Contract

## 23.1 Subject anchoring

Only build a model for the current user.

If user says:
> “My wife has great fashion sense.”

Do not add “fashion sense” to user memory.

## 23.2 Private-by-default

Memory is private by default.

## 23.3 External sharing requires context

Only share information that is:
- relevant to this connection;
- previewed to the user;
- approved.

## 23.4 High-risk categories excluded from V0.1 matching

Do not demo:
- child-care stranger matching;
- medical advice/services;
- financial advice;
- legal representation;
- adult-content matching;
- identity-sensitive matching;
- high-risk physical services.

Use low-risk domains:
- woodworking;
- food;
- hobbies;
- gaming;
- travel;
- photography;
- local creative projects;
- public community help.

---

# 24. Demo Persona & Scenario

Primary demo persona:

**Alex**
- convenience-store manager;
- previously did woodworking for ~10 years;
- owns tools;
- sometimes does projects on weekends;
- lives/works around Taoyuan;
- enjoys family travel.

World signal:

**Public café renovation**
- Taoyuan café;
- renovation;
- mentions new counter/shelving;
- likely short-duration custom woodworking need.

Why this scenario:
- ordinary person, not developer;
- capability not represented by current occupation;
- perfect demonstration of “more to offer than you know”;
- low safety risk;
- sponsor stack naturally visible.

---

# 25. 3-Minute Demo Script

Target: 2:35–2:50, never exceed 3:00.

## 0:00–0:12 — Brand / manifestation

Open Might.

Animated orb.

Might:
> “Would you like me to keep this form, or become something you imagine?”

User:
> “A tiny night guardian, warm and friendly.”

Fast generation / use pre-generated cached result in recorded demo if API latency is risky.

Companion appears.

## 0:12–0:42 — Talk

Might:
> “What do you usually do these days?”

User:
> “I manage a convenience store. I used to do woodworking for ten years…”

Short continuation.

## 0:42–0:55 — Remember

Open Me.

Show:
- convenience store manager;
- 10 years woodworking;
- owns tools;
- weekends somewhat flexible.

No form was filled.

## 0:55–1:20 — Notice

Might Found appears.

Show real Firecrawl source/evidence:

> Café renovation in Taoyuan…

Might:
> “I thought of you because…”

## 1:20–1:35 — Clarify

Might:
> “Have you built commercial counters before?”

User:
> “Yes, several.”

Match strengthens.

## 1:35–1:55 — Consent

User clicks:
**I’m interested**

Show contextual one-page intro.

Then:
**Ready for me to reach out?**

User clicks:
**Send**

## 1:55–2:15 — AgentMail

Show sent state:

`CONTACTED`

Briefly expose “sent via Might inbox” in product UI, not debug console.

## 2:15–2:32 — Real inbound reply + Convex realtime

Demo external inbox replies:
> “This sounds interesting. Could Alex visit next Saturday?”

Connections screen updates live:

`CONTACTED → REPLIED`

Play subtle reply sound.

## 2:32–2:45 — Continue

Might:
> “They’d like to meet next Saturday. You told me weekends are usually flexible. Want me to continue?”

User:
**Yes**

## 2:45–2:55 — Connected

State:
**CONNECTED**

Warm completion animation.

End frame:

# Might
**You have more to offer than you know.**  
**Might finds where it matters.**

---

# 26. UI/UX Detailed Screen Spec

## 26.1 Global shell

Responsive.

Desktop:
- max content width ~1200–1320px;
- generous negative space;
- navigation visually secondary.

Mobile:
- one-hand-friendly;
- bottom navigation;
- primary controls within thumb reach.

Global nav:
- Talk
- Me
- Might Found
- Connections

No “Dashboard.”

## 26.2 Talk screen layout

Desktop:
- companion visual left/top third;
- chat column centered;
- input anchored lower;
- ambient gradient around companion.

Mobile:
- companion 96–140px region;
- chat occupies majority;
- input fixed above bottom nav.

## 26.3 Me screen

Use editorial memory cards.

Avoid grids of “skills.”

Cards can vary size slightly to create a more human, scrapbook-like feel while remaining polished.

Memory controls unobtrusive.

## 26.4 Might Found screen

Primary match should receive hero treatment.

Visual hierarchy:
1. discovered situation;
2. what Might noticed;
3. why it thought of user;
4. uncertainty/clarification;
5. consent action.

Source evidence accessible but not dominant.

## 26.5 Connections screen

Timeline-based.

The user should feel motion over time:
- I was noticed;
- I agreed;
- Might reached out;
- someone replied;
- now we are connected.

---

# 27. Design System Starter

Do not lock exact colors before implementation exploration.

Use tokens:

```text
--bg
--surface
--surface-elevated
--text-primary
--text-secondary
--accent
--accent-soft
--success
--warning
--border-soft
--glow
```

Typography:
- modern sans-serif;
- strong display weight for brand moments;
- high legibility for chat.

Radius:
- medium-to-large, not excessively bubbly.

Shadows:
- soft, low opacity;
- companion can use glow rather than standard shadow.

Motion:
- Framer Motion preferred if React stack allows.

---

# 28. Performance & Demo Reliability

## 28.1 Cache demo-critical outputs

For recorded demo reliability:
- companion image can be pre-generated/cached after showing the real generation flow once;
- world signal can have a stable demo seed but must originate from a real/public Firecrawl source;
- external reply can be sent from a controlled demo mailbox.

## 28.2 Never fake sponsor integration

Do not mock the sponsor-critical steps in final submission.

Must be real:
- Convex data state;
- Firecrawl fetch/search;
- OpenAI reasoning/generation;
- AgentMail send/receive.

## 28.3 Graceful fallback

If image generation fails:
- default orb remains usable.

If Firecrawl query fails:
- allow re-run against a known stable public source.

If AgentMail reply latency is problematic:
- controlled external mailbox sends the real reply during demo.

---

# 29. Cost / Quota Control

The goal is a polished prototype, not production scale.

## 29.1 OpenAI

Use cost-efficient model by default for:
- memory extraction;
- source interpretation.

Use stronger reasoning model only for:
- final match judge if needed;
- high-quality pitch generation if visible.

Model IDs must be environment-configurable.

Current OpenAI docs recommend:
- GPT-5.6 Sol for complex reasoning;
- GPT-5.6 Terra for balanced cost/intelligence;
- GPT-5.6 Luna for cost-sensitive high-volume tasks;
- GPT-Image-2 for image generation.

## 29.2 Firecrawl

Scan only:
- a few stable source types;
- on demand or low-frequency scheduler for prototype.

## 29.3 Matching

Do not perform all-users × all-signals LLM matching.

Use cheap candidate recall first.

---

# 30. 48-Hour Build Plan

## Session 0 — Compliance (30–60 min)

- Register Luma if not already done.
- Run official hackathon setup prompt.
- Install Convex integration/plugin.
- Initialize `hackathon.md`.
- Create public repo.
- First commit.
- Configure env keys.

## Session 1 — Product shell + art (3–4h)

- routes;
- design tokens;
- nav;
- animated orb;
- core typography;
- Talk/Me/Found/Connections skeleton;
- deploy early to convex.site.

Definition of Done:
public URL already opens a beautiful shell.

## Session 2 — Companion Manifestation (2–3h)

- shape-my-form flow;
- prompt transformation;
- GPT-Image-2 call;
- asset storage;
- generated companion display;
- subtle idle animation;
- sound cue.

## Session 3 — Talk + Memory E2E (3–5h)

- chat persistence;
- Conversation Explorer;
- Memory Extractor;
- Convex memories;
- Me live query;
- edit/forget.

Definition of Done:
talking causes real Me-screen memory changes.

## Session 4 — World Sensor (2–4h)

- Firecrawl component;
- one stable public source path;
- World Interpreter;
- save world signal;
- source evidence UI.

## Session 5 — Serendipity E2E (3–4h)

- candidate retrieval;
- Serendipity Judge;
- Might Found hero card;
- clarification;
- interested/dismiss.

Definition of Done:
real memory + real world signal produces a convincing match.

## Session 6 — Connection E2E (3–4h)

- contextual pitch;
- consent preview;
- AgentMail send;
- thread ID;
- inbound webhook;
- Convex realtime state transition.

Definition of Done:
external reply changes UI live.

## Session 7 — Polish (4–6h)

- animation timing;
- sound;
- responsive behavior;
- empty/loading/error states;
- copy;
- accessibility basics;
- remove debug UI;
- demo stability.

## Session 8 — Submission prep

- `/hackathon`;
- README;
- verify public repo;
- verify convex.site;
- rehearse demo;
- record <3min video;
- capture social teaser;
- publish X/LinkedIn tagging sponsors;
- submit vibeapps.dev.

---

# 31. Quality Bar

The prototype may be narrow, but it must not feel unfinished.

Before submission, judge every screen by:

### Visual
Would someone screenshot this?

### Emotional
Does Might feel alive without becoming gimmicky?

### Product
Can a non-technical person understand the value without architecture explanation?

### Sponsor
Can a judge see why each sponsor technology matters?

### Demo
Can the product tell its own story in under 3 minutes?

### Reliability
Can the E2E run multiple times without manual repair?

---

# 32. Acceptance Tests

## A. Manifestation

- fresh user sees animated orb;
- user chooses shape;
- user description generates original Webtoon-style companion;
- famous-IP reference is transformed, not copied;
- generated companion persists;
- failure falls back to orb.

## B. Conversation

- user can chat;
- message persists in Convex;
- Might asks natural follow-up;
- no questionnaire feel.

## C. Memory

- meaningful facts become memories;
- trivial chatter is ignored;
- Me updates live;
- user can edit/forget memory.

## D. Firecrawl

- system fetches real public source;
- source URL/evidence stored;
- world signal generated.

## E. Match

- relevant memory is retrieved;
- OpenAI produces contextual match reasoning;
- missing information generates clarification;
- user can dismiss or continue.

## F. Consent

- no outbound email before explicit approval;
- outbound preview clearly shows what is sent.

## G. AgentMail

- real email sent;
- real reply received;
- same thread tracked.

## H. Convex realtime

- reply changes state without refresh.

## I. Final experience

- connected state is visually polished;
- all core screens responsive;
- no debug console exposed;
- no broken empty states.

---

# 33. Repo Structure — Suggested

```text
/
├─ app/ or src/
│  ├─ routes/
│  │  ├─ talk/
│  │  ├─ me/
│  │  ├─ found/
│  │  └─ connections/
│  ├─ components/
│  │  ├─ companion/
│  │  ├─ chat/
│  │  ├─ memory/
│  │  ├─ opportunity/
│  │  └─ connection/
│  ├─ lib/
│  │  ├─ openai/
│  │  ├─ firecrawl/
│  │  ├─ agentmail/
│  │  └─ audio/
│  └─ styles/
├─ convex/
│  ├─ schema.ts
│  ├─ messages.ts
│  ├─ memories.ts
│  ├─ worldSignals.ts
│  ├─ matches.ts
│  ├─ connections.ts
│  ├─ openaiActions.ts
│  ├─ firecrawlActions.ts
│  └─ agentmailActions.ts
├─ public/
│  └─ audio/
├─ hackathon.md
├─ README.md
└─ .env.example
```

---

# 34. Codex Build Rules

1. Keep main branch deployable.
2. Commit at the end of every meaningful slice.
3. Run `/hackathon` after each work session.
4. Never commit secrets.
5. Never replace sponsor integration with mocks in final path.
6. Prefer reliable simple code over premature abstraction.
7. No new feature unless it improves:
   - core loop reliability,
   - demo clarity,
   - visual polish,
   - sponsor scoring.
8. If a feature does not improve the 3-minute demo, defer it.
9. Keep generated companion IP-original.
10. Do not expand scope into a social platform.

---

# 35. Final Product Story

Might should be explainable in under 20 seconds:

> Most AI waits for you to know what to ask.  
> Might simply gets to know you while you live your life.  
> It watches the public world for situations where something about you might matter.  
> When it notices a meaningful overlap, it asks permission — then helps make the connection.

The experience should end on:

# Might

**You have more to offer than you know.**  
**Might finds where it matters.**

---

# 36. Final Definition of Done

Do not call the hackathon build complete until this exact story works:

> A normal person opens Might and shapes its form.  
> They casually mention that they manage a convenience store but used to do woodworking for ten years and still own their tools.  
> Might remembers this without asking them to build a résumé.  
> Firecrawl discovers a real public café-renovation signal.  
> OpenAI understands the need and realizes something about this person may matter.  
> Might asks one clarifying question.  
> The user says they are interested.  
> Might creates a contextual introduction.  
> The user approves it.  
> AgentMail sends the message.  
> The external party replies.  
> Convex updates the app live.  
> Might asks whether to continue.  
> The user agrees.  
> The connection becomes real.

**That is the prototype. Stop there. Polish it. Submit it.**
