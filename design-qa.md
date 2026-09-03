# Might design QA — living accordion, paper controls, and mobile shell

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
  - Earlier fix: at 720 px and below, the same real accordion asset remained
    visible while the labels moved into a separate paper list.
- [Resolved P1] The owner's 420 px Safari capture exposed that the earlier
  responsive list had become a second generic card beneath the accordion; the
  copy then became a third layer, making one story feel like stacked UI.
  - Fix: the artwork and semantic six-stage list now share one responsive
    canvas. All six stages remain aligned to their botanical folds down to the
    supported 320 px width; the detached two-column/single-column card is gone.
- [Resolved P1] The fixed bottom navigation covered the start of “Your first
  connection will unfold here” in the reported mobile state.
  - Fix: the mobile shell is now a `100dvh` two-row app frame. The main story
    owns scrolling and the navigation occupies a separate bottom row with
    safe-area margin, so content never renders beneath the dock.

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
- Reported mobile defect:
  `/var/folders/75/d_z3yqjs27xbcrxzm3vqpnwh0000gn/T/TemporaryItems/NSIRD_screencaptureui_yhWEPq/截圖 2026-09-03 上午10.10.03.png`
  - Original pixels: 2940 × 1912.
  - App-content crop:
    `/Users/liuenyan/.codex/visualizations/2026/09/03/might-mobile-connections-stack/source-user-mobile-content.png`
    at 840 × 1550 pixels, representing a 420 × 775 CSS viewport at 2× density.
  - Normalized source:
    `/Users/liuenyan/.codex/visualizations/2026/09/03/might-mobile-connections-stack/source-user-mobile-content-420x775.png`
    at 420 × 775 pixels for 1:1 comparison.

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
- Mobile implementation at the reported viewport and state:
  `/Users/liuenyan/.codex/visualizations/2026/09/03/might-mobile-connections-stack/after-420x775-matched-state-final.png`
  - Browser viewport and capture: 420 × 775 CSS pixels at device pixel ratio 1.
  - State: anonymous local empty Connections state, main scroll position 345,
    with the same hero-copy/accordion/empty-copy region visible as the source.
- Mobile source-versus-final combined comparison:
  `/Users/liuenyan/.codex/visualizations/2026/09/03/might-mobile-connections-stack/compare-source-vs-final-420x775.png`
  at 876 × 823 pixels.
- Mobile focused comparison:
  `/Users/liuenyan/.codex/visualizations/2026/09/03/might-mobile-connections-stack/compare-focused-final.png`
  at 876 × 523 pixels.
- Desktop regression capture:
  `/Users/liuenyan/.codex/visualizations/2026/09/03/might-mobile-connections-stack/after-desktop-1490x1058-viewport-final.png`
  at 1490 × 1058 pixels.

## Full-view comparison

- Both views retain the same left rail, bright room, paired companion forms,
  centered Connections heading, and low-density story composition.
- The production hero remains taller by design; below it, the selected
  accordion metaphor, warm first fold, paper controls, and curled consent note
  are all represented directly.
- The functional layer spans the full story width instead of returning to the
  former narrow card plus detached editorial aside.
- In the normalized mobile comparison, the source has three successive layers
  (accordion art, detached six-stage card, and empty-state copy) and the dock
  covers the heading. The final view has one accordion journey, exposes the
  complete heading above the dock, and preserves the same room, type, copy,
  palette, and asset crop.

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
- The mobile focused comparison confirms that every label now sits on the fold
  represented by its botanical stage. No generated asset was stretched or
  replaced, and the removed white list card no longer interrupts the story.

## Required fidelity surfaces

- Typography: established Might display and body families are retained. The
  desktop empty-state heading is constrained to the target's three-line rhythm.
  At 420 px the heading remains complete above the dock; 9 px supporting stage
  labels remain secondary but readable and keep full semantic text.
- Spacing: desktop preserves broad room margins; mobile reports
  `scrollWidth === innerWidth` at 320, 390, 420, 540, 980, and 981 px. The
  mobile main viewport ends exactly where the 62 px navigation row begins.
- Color and texture: ivory washi, warm amber, antique gold, muted sage, and
  soft brown ink match the approved room and companion assets.
- Image quality: the accordion, tray, and consent note are real generated RGBA
  assets. No visible placeholder, emoji, handcrafted SVG, CSS drawing, or
  screenshot crop is used as product UI.
- Accessibility: all stage labels, button labels, `aria-current`, focus states,
  privacy copy, and status content remain semantic HTML. Decorative artwork is
  hidden from assistive technology.
- Responsive behavior: desktop and mobile both overlay live text on the real
  folds. The main story is the only scrolling region below 980 px, while the
  bottom navigation stays available outside that content region.

## Interaction and browser checks

- `See what Might found` navigated from `/connections` to `/found` and rendered
  the expected `Somewhere, something may need you.` heading.
- The paper Settings control opened the existing real settings dialog; its
  name, appearance, sound, background-music, and AI-access sections remained
  present.
- The browser console reported no warnings or errors after settling.
- The repeatable mobile geometry check failed before the fix at 540 × 1058:
  the accordion was 631 px tall around a 246 px image, its list and copy were
  separate vertical layers, and the 78 px bottom reserve was 16 px short.
- The same check passed twice at both 390 × 844 and 540 × 1058 after the fix:
  all stages remained inside the paper, copy cleared the paper by 24 px, the
  navigation was outside the main content, and horizontal overflow was zero.
- At 320 × 720 the same checks passed; at the page end both the action tray and
  consent note can scroll entirely above the navigation.
- Talk, Me, Found, and Connections all retained working navigation, contained
  width, and the same docked mobile shell. The Settings drawer opened and
  closed correctly. `See what Might found` still navigated to the expected
  Found heading.
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
5. Owner Safari capture: the 420 px state showed the responsive stage list as a
   detached white card and the fixed dock obscuring the next story heading.
   Result: blocked by two P1 mobile composition/usability regressions.
6. Structure pass: added one accordion canvas and returned all six semantic
   stages to the botanical folds; removed the 420 px single-column expansion.
   Result: stage-stack check passed, but the floating dock still occupied the
   content layer.
7. Shell pass: converted the responsive shell to a viewport-height main-scroll
   row plus a separate safe-area navigation row. The matched 420 × 775 combined
   comparison, 320/390/540 geometry checks, 980/981 breakpoint checks, four-route
   navigation, settings, CTA, desktop regression, and console review passed.

## Final result

passed
