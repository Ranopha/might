# Might design QA — living accordion and paper controls

## Findings

- [Resolved P1] The empty Connections state read as a generic white product
  card and timeline rather than part of Might's room.
  - Fix: it is now a generated six-fold paper letter with a continuous
    seed-to-connection botanical line and live semantic stage labels.
- [Resolved P1] Primary actions, Sound, and Settings used flat web controls
  that broke the tactile storybook illusion.
  - Fix: all visible primary actions on Talk, Me, Might Found, Connections,
    and Settings now share generated paper plates; desktop Sound and Settings
    use the quiet secondary plate.
- [Resolved P2] The first accordion draft placed the story heading across the
  lit `Noticed` fold and made its current-step ellipse look like a dashboard
  control.
  - Fix: the copy begins on the second fold, the first fold remains a clear
    opening beat, and the generated amber paper carries the active state
    without a synthetic progress bubble.
- [Resolved P2] The first action treatment was a translucent rounded rectangle
  beneath otherwise tactile art.
  - Fix: a dedicated generated paper tray now holds the live action, while a
    separate curled note carries the consent boundary.
- [Resolved P2] A desktop-only overlay would have made six stage labels
  unreadable on mobile.
  - Fix: at 720 px and below, the same real accordion asset remains visible,
    while the live stage labels reflow into a two-column paper list and then a
    single column at 420 px.

No actionable P0, P1, or P2 findings remain.

## Source visual truth

- Selected target:
  `/var/folders/75/d_z3yqjs27xbcrxzm3vqpnwh0000gn/T/codex-clipboard-8e09c97c-7843-41b0-aeb2-fd0dbb506c14.png`
- Source pixels: 1487 × 1058.
- Owner choice: option 3, the living accordion letter with tactile function
  controls.
- Deliberate retained constraint: the already approved Connections room hero
  keeps its production aspect ratio. The selected concept compresses the hero
  vertically, but this implementation changes only the requested functional
  layer beneath it.

## Implementation evidence

- Desktop top:
  `/Users/liuenyan/.codex/visualizations/2026/09/03/might-accordion-controls/implementation-desktop-top.png`
  - Browser viewport: 1490 × 1058.
  - Captured content pixels: 1397 × 1058 at device pixel ratio 1.
  - State: anonymous local session, no connection, Convex live.
- Desktop accordion focus:
  `/Users/liuenyan/.codex/visualizations/2026/09/03/might-accordion-controls/implementation-desktop-fold.png`
  - Same browser viewport and session, scrolled to the complete functional
    layer.
- Mobile top:
  `/Users/liuenyan/.codex/visualizations/2026/09/03/might-accordion-controls/implementation-mobile-top.png`
  - Browser viewport and captured pixels: 390 × 844 at device pixel ratio 1.
- Mobile accordion focus:
  `/Users/liuenyan/.codex/visualizations/2026/09/03/might-accordion-controls/implementation-mobile-fold.png`
  - Same mobile viewport, scrolled to the stages, action, and consent note.
- Full comparison:
  `/Users/liuenyan/.codex/visualizations/2026/09/03/might-accordion-controls/comparison-full.png`
- Focused comparison:
  `/Users/liuenyan/.codex/visualizations/2026/09/03/might-accordion-controls/comparison-fold.png`

## Full-view comparison

- Both views retain the same left rail, bright room, paired companion forms,
  centered Connections heading, and low-density story composition.
- The production hero remains taller by design; below it, the selected
  accordion metaphor, warm first fold, paper controls, and curled consent note
  are all represented directly.
- The functional layer spans the full story width instead of returning to the
  former narrow card plus detached editorial aside.

## Focused-region comparison

- The comparison uses one combined 2474 × 650 input with the selected target
  on the left and the final implementation on the right.
- Copy begins on the second fold in both views. The six live stages align with
  the generated seed, sprout, bud, blossom, paired leaves, and intertwined
  connection mark.
- The implementation uses a narrower six-fold object than the illustrative
  target's extra blank end panel, but preserves every real product stage and
  avoids inventing a seventh status.
- The primary action is live HTML placed over its own generated paper tray;
  the privacy lock and separate reminder remain readable rather than being
  baked into artwork.

## Required fidelity surfaces

- Typography: established Might display and body families are retained. The
  desktop empty-state heading is constrained to the target's three-line rhythm.
- Spacing: desktop preserves broad room margins; mobile reports
  `scrollWidth === innerWidth === 390` and keeps all objects inside the page.
- Color and texture: ivory washi, warm amber, antique gold, muted sage, and
  soft brown ink match the approved room and companion assets.
- Image quality: the accordion, tray, and consent note are real generated RGBA
  assets. No visible placeholder, emoji, handcrafted SVG, CSS drawing, or
  screenshot crop is used as product UI.
- Accessibility: all stage labels, button labels, `aria-current`, focus states,
  privacy copy, and status content remain semantic HTML. Decorative artwork is
  hidden from assistive technology.
- Responsive behavior: desktop overlays live text on the folds; mobile keeps
  the accordion as an establishing object and reflows the semantic stages below
  it without horizontal overflow.

## Interaction and browser checks

- `See what Might found` navigated from `/connections` to `/found` and rendered
  the expected `Somewhere, something may need you.` heading.
- The paper Settings control opened the existing real settings dialog; its
  name, appearance, sound, background-music, and AI-access sections remained
  present.
- The browser console reported no warnings or errors after settling.
- Desktop and mobile screenshots were captured after the generated assets and
  final responsive CSS loaded.
- The existing sponsor-critical connection mutations, payload-bound approval,
  AgentMail send, reply, and Connected transitions were not changed.

## Comparison history

1. Source implementation: flat empty card, six-dot timeline, detached text
   note, and flat utility controls. Result: blocked by P1 visual mismatch.
2. First paper pass: accordion and note were present, but copy collided with
   the opening fold and the action sat on a generic glass strip. Result:
   blocked by P2 hierarchy and material mismatch.
3. Second paper pass: copy moved to the second fold, dashboard-like current
   bubble removed, and a dedicated paper tray added. Result: blocked by P2
   desktop heading rhythm.
4. Final pass: heading constrained to the selected three-line rhythm; desktop
   and 390 px responsive captures, combined comparisons, navigation, settings,
   and console checks passed.

## Final result

passed
