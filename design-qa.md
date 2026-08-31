# Design QA — Talk Room Hero

Date: 2026-08-31  
Scope: Opening state of the Talk surface only

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

## Final result

passed
