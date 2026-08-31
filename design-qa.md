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

## Final result

passed
