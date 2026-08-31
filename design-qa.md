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

## Final result

passed
