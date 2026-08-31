# Design QA — Fixed Room Story Surfaces

Date: 2026-08-31  
Scope: Talk opening plus Me, Might Found, Connections, and the custom-Mighty shaping entry

## Visual target

- Approved direction: fixed sunlit room with the world arriving at the door.
- Companion target: the approved original paper-and-leaf Might orb.
- Reference composite: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-room-orb-frame-composite-v1.png`
- Desktop implementation capture: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-room-implementation/talk-room-desktop-final.png`
- Mobile implementation capture: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-room-implementation/talk-room-mobile-v1.png`
- Side-by-side comparison: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-room-implementation/source-vs-implementation-final.png`

## P0 — Product intent and source fidelity

Result: passed

- The approved room, orb, foreground, and button plates are rendered from real image assets rather than CSS or placeholder art.
- The room remains the dominant visual surface; the manifestation and chat behavior still use the existing production seams.
- The orb occupies the left alcove and preserves the approved paper, warm-light, and botanical identity.
- The conversation is presented as a warm paper page in the room rather than a generic AI dashboard card.
- The provisional foreground frame is intentionally reduced to low opacity so it adds depth without changing the approved room composition.

## P1 — Layout and responsive behavior

Result: passed

- Desktop verified at 1440 × 1000: the full room, orb, door, conversation, and primary decisions are visible without scrolling.
- Mobile verified at 390 × 844: the room becomes a complete establishing image and the conversation flows below it, preserving the door and alcove instead of cropping them away.
- Mobile primary controls remain full-width and clear of the persistent bottom navigation.
- The shaping form can extend vertically and remains reachable by normal page scrolling.

## P2 — Interaction, accessibility, and motion

Result: passed

- `Shape my form` reveals the existing OpenAI manifestation form.
- `Keep this form` enters the existing private Convex chat flow.
- Primary button idle and hover states load distinct approved image plates; pressed and secondary states are defined from the matching approved assets.
- Visible focus styling is retained for buttons and form controls.
- Might uses a slow scale-and-float breathing loop; the room light and foreground use subtler independent breathing loops.
- `prefers-reduced-motion` disables room and foreground animation, while the companion components use Motion's reduced-motion preference.
- Browser console verification returned no errors or warnings.
- Typecheck, lint, all 24 tests, and production build passed.

## Surface-family comparison

- Approved source truth: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-surface-assets/surface-asset-room-family-v1.jpg`
- Desktop captures: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-surface-integration/{me,found,connections}-desktop.png`
- Mobile captures: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-surface-integration/{me,found,connections}-mobile.png`
- Custom-name shaping capture: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-surface-integration/talk-shape-mobile.png`
- Source-to-implementation comparison: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-surface-integration/reference-vs-implementation.png`
- Desktop viewport: 1440 × 1000. Mobile viewport: 390 × 844. Both used a live local Convex-connected build at device pixel ratio 2.
- Verified states: empty living memory, no world overlap, no connection, and the pre-generation shape form. Provider calls were not triggered during visual QA.

### Required fidelity surfaces

Result: passed

- All three secondary surfaces inhabit the same approved sunlit room, paper texture, botanical line language, and warm neutral palette as Talk.
- Me uses the luminous memory folio in the left alcove; Found keeps the current/default companion in the alcove while a paper messenger arrives at the door; Connections places the two botanical lantern-pods and living thread across the room.
- Each illustration is a real transparent image asset. Labels and runtime state remain live HTML so the composition stays accessible and responsive.
- Mobile preserves the complete room as an establishing panel, then moves the story copy onto a warm paper page. No horizontal overflow was observed at 390 px.
- The shaping entry visibly supports both a companion name and a visual description without introducing a fifth primary surface.

### Findings and fixes

- P2 — thin generated chroma fringe: fixed by decontaminating only saturated green edge pixels while retaining the original alpha silhouette.
- P2 — surface illustrations initially took the full breathing-loop duration to appear: fixed by starting motion assets at their intended visible state.
- P2 — the idle Found messenger disappeared at downsampled/mobile sizes: fixed by increasing its resting opacity and reducing the off-door translation.
- P2 — Found and Connections titles crossed mixed-tone wall regions: fixed with a diffuse, unboxed paper-light wash behind the copy.
- Focused QA did not reveal a remaining crop, overlap, missing asset, or first-paint visibility defect.

## Owner screenshot correction round

- Owner references: `/var/folders/75/d_z3yqjs27xbcrxzm3vqpnwh0000gn/T/TemporaryItems/NSIRD_screencaptureui_c72tGy/截圖 2026-08-31 中午12.32.46.png`, `/Users/liuenyan/Desktop/截圖 2026-08-31 中午12.32.26.png`, and `/Users/liuenyan/Desktop/截圖 2026-08-31 中午12.32.33.png` (2940 × 1912 source pixels each).
- Revised medium captures: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-surface-feedback-round2/{me,found,connections}-960.png` at 960 × 1000.
- Revised mobile captures: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-surface-feedback-round2/{me,found,connections}-390.png` at 390 × 844.
- Source-to-revision comparison: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-surface-feedback-round2/user-feedback-vs-revised.png`.
- Verified states were empty living memory, no active overlap, and no connection. The ChatGPT floating composer visible in the owner's browser screenshots is external browser/app chrome and was excluded from the Might target.

### Comparison history

- P1 — Found's companion and incoming messenger both read from the left-to-right composition without an obvious action toward the door: fixed by moving Might to the right doorway, raising the messenger near the door, and moving the headline into the now-empty left alcove.
- P2 — Me's memory folio was oversized and extended below its intended support: fixed by reducing its width and raising it until the wooden base rests on the alcove platform at medium and mobile widths.
- P2 — Connections' idle lantern-pods were more transparent than the intended paper-lantern presence: fixed by raising normal idle opacity from `0.50` to `0.64` and reduced-motion idle opacity from `0.58` to `0.66`.
- Medium and mobile browser checks showed no horizontal overflow, clipped control, text collision, or displaced illustration. The room, paper texture, door, platform, live HTML copy, persistent navigation, and reduced-motion behavior were all retained.
- Focused comparison found no remaining actionable P0, P1, or P2 defect in these three owner-requested corrections.

### Production verification

- Public target: `https://hushed-stork-401.convex.site` at static deployment `bb26da34-811a-461a-8abb-c316daff83b5`.
- Talk, Me, Found, and Connections were verified in the in-app browser at the default 1280 px viewport and at 390 × 844. Each mobile route had `scrollWidth === innerWidth`.
- The production Found composition visibly places Might at the right-hand door and leaves the alcove available for copy. Connections computed idle asset opacity is `0.64`.
- The released bundle targets `https://hushed-stork-401.convex.cloud`; live Convex-backed Me and Found content rendered and the browser console returned no warning or error.

## Room-native settings drawer

- Source capture: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-settings-drawer/source-production-desktop.png` at 1280 × 900.
- Final desktop capture: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-settings-drawer/implementation-desktop-final.png` at 1280 × 900.
- Final mobile captures: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-settings-drawer/implementation-mobile-final.png` and `/Users/liuenyan/.codex/visualizations/2026/08/31/might-settings-drawer/implementation-mobile-lower-final.png` at 390 × 844.
- Combined source-to-implementation review: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-settings-drawer/source-vs-settings-final.png`.

### P0 — Product intent and visual continuity

Result: passed

- Settings opens as one continuous paper drawer over the existing room, not a fifth primary surface, route, dashboard, or collection of generic cards.
- The panel reuses the approved room foreground, paper, sage, amber, botanical line, and restrained blur language. Lucide supplies interface icons; no emoji, placeholder art, custom SVG, or CSS-drawn mascot was introduced.
- The four primary navigation destinations remain unchanged and visible as spatial context behind the drawer.
- Identity, appearance, sound, AI access, and privacy are presented in consumer language. The API area contains no key input and explicitly preserves the authenticated server-vault boundary.

### P1 — Layout and responsive behavior

Result: passed

- At 1280 × 900 the drawer grows out from the desktop rail, leaves the fixed room legible, and keeps its own scrolling region without moving the app or clipping the header.
- At 390 × 844 the same object becomes a bottom sheet below the mobile brand bar. Both top and lower states keep a fixed header, readable controls, and `scrollWidth === innerWidth === 390`.
- The parent drawer initially accepted programmatic scroll even with `overflow: hidden`, which let an auto-focused lower control pull the header upward. The parent now uses non-scrollable clipping while only the inner paper body scrolls; explicit stacking keeps the title and close control visible.

### P2 — Behavior, accessibility, and honest states

Result: passed

- A synthetic development session changed the companion name to `Aster`, Talk updated through the live Convex query, and the same field was restored to `Might`. Cross-session privacy and invalid generated-form selection are covered by Convex behavior tests.
- House orb / generated-form selection is real and persisted. A new session can reveal the original OpenAI manifestation prompt, while an unavailable generated form remains disabled instead of being faked.
- The global sound control and drawer switch stay synchronized. Disabling sound also disables the volume slider and preview; a local two-note Web Audio preview respects the stored master volume. A dedicated browser-local preference test covers reload restoration.
- Background music is visibly disabled and labeled as not yet available. The API section exposes Sponsor mode and an official OpenAI link but contains zero password or key-named inputs.
- The dialog has an accessible name, close control, Escape handling, focus return, and a Tab loop. Reduced-motion mode removes drawer movement.
- Browser console inspection returned no warnings or errors. Six test files / 26 tests, ESLint, TypeScript, production build, Convex development sync, and `git diff --check` passed.
- Visual QA triggered no OpenAI, Firecrawl, AgentMail, email, webhook, production deploy, or production application-data change.

## Final result

passed
