# Might design QA — Talk room continuity after onboarding

## Findings

- [Resolved P1] The fixed room disappeared after `Keep this form`.
  - Location: Talk transition from manifestation to chat.
  - Evidence: the production source capture contains no room scene in the chat state; the revised capture keeps the approved sunlit room, foreground depth, platform, and door around the same Talk content.
  - Fix: both Talk phases now render inside the same room frame. Only the paper story state changes.
- [Resolved P2] Mobile could retain the opening button's scroll position after the phase change and crop the room's establishing moment.
  - Location: 390 px transition into chat.
  - Fix: every entry into chat resets the page to the top before the new state settles.
- [Resolved P2] The mobile composer overlapped the persistent bottom navigation.
  - Location: 390 × 844 Talk chat.
  - Fix: the composer is reserved in the paper layout and fixed 8 px above the navigation; the final measurements are composer bottom `762` and navigation top `770`.

No actionable P0, P1, or P2 findings remain.

## Source visual truth

- Exact broken-state capture: `/Users/liuenyan/.codex/visualizations/2026/08/31/might-settings-drawer/source-production-desktop.png`
- Approved room artwork: `/Users/liuenyan/Might/public/assets/room/might-room-background-v1.png`
- Owner direction: `Keep this form` must remain in the same fixed room rather than switching to the prior blank AI-chat canvas.
- Source capture pixels: 1280 × 900.
- State note: the production source includes existing conversation messages, while the isolated local QA session is intentionally empty. Message density is not treated as a fidelity target; room continuity, hierarchy, controls, and responsive behavior are.

## Implementation evidence

- Desktop: `/Users/liuenyan/.codex/visualizations/2026/08/31/mighty-talk-room-continuity/implementation-desktop-chat-settled.png`
  - Browser viewport and CSS size: 1280 × 900.
  - Screenshot pixels: 1280 × 900.
  - Device pixel ratio: 1.
  - State: house orb selected, private chat ready, Convex live, no messages.
- Mobile: `/Users/liuenyan/.codex/visualizations/2026/08/31/mighty-talk-room-continuity/implementation-mobile-chat-settled.png`
  - Browser viewport and CSS size: 390 × 844.
  - Screenshot pixels: 390 × 844.
  - Device pixel ratio: 1.
  - State: house orb selected, private chat ready, Convex live, no messages.
- Same-input desktop comparison: `/Users/liuenyan/.codex/visualizations/2026/08/31/mighty-talk-room-continuity/source-vs-fixed-desktop-final.png`
  - Pixels: 2560 × 900, equal-density 1280 × 900 captures placed side by side without rescaling.

## Full-view comparison

- The revised Talk state now reads as one continuous Webtoon room rather than a separate AI-chat page.
- Mighty sits on the same left alcove platform; the conversation remains a warm paper surface on the right; the outside door and sunlight remain visible.
- The primary content hierarchy remains companion → greeting → conversation → composer.
- At 390 px the full room is retained as an establishing panel, followed by the paper conversation. Width checks report `scrollWidth === innerWidth === 390`.

## Focused-region comparison

- Desktop room frame: background crop, platform alignment, foreground depth, paper-card opacity, and button plate were readable in the equal-density side-by-side comparison.
- Mobile lower controls: the 390 × 844 viewport capture verifies the composer and bottom navigation simultaneously, including their measured 8 px separation.
- No additional crop was required because both desktop and mobile evidence make typography, controls, imagery, and edge spacing legible at original density.

## Required fidelity surfaces

- Fonts and typography: existing Might display/body families, weights, line heights, casing, and hierarchy are preserved. The desktop heading wraps intentionally at the narrower paper width; mobile keeps a readable two-line title.
- Spacing and layout rhythm: the room uses the approved major proportions, the companion rests on the platform, and the paper card preserves generous calm space. Desktop and mobile have no horizontal overflow.
- Colors and visual tokens: the revised state uses the established ivory, sage, amber, warm-paper, and low-opacity foreground treatment. The prior generic lilac chat canvas is no longer the dominant visual.
- Image quality and asset fidelity: the approved raster room background, transparent foreground, paper-and-leaf orb, and generated button plates are reused directly. No placeholder, CSS-drawn, inline-SVG, or text-glyph asset was introduced.
- Copy and content: Talk copy, privacy disclosure, message labels, Convex status, and four primary navigation labels are unchanged.

## Interaction and browser checks

- Tested `Keep this form` at 1280 × 900 and 390 × 844.
- Verified room background presence in the chat DOM and with browser-rendered screenshots.
- Verified phase entry resets to `scrollY: 0` on mobile.
- Verified composer remains fully above the mobile navigation.
- Verified the original manifestation opening still renders its room, `Shape my form`, and `Keep this form` at 390 px.
- Verified `Convex live`, the empty message state, composer, settings trigger, and all four navigation destinations remain present.
- Browser warnings/errors checked after settling: none.

## Comparison history

1. Initial source: chat state replaced the complete room with a blank lilac canvas. Result: blocked by P1.
2. First revision: room continuity restored on desktop and mobile. Result: blocked by mobile retained-scroll crop and composer/navigation overlap.
3. Final revision: chat entry resets scroll, and the composer is fixed above navigation with reserved paper space. Desktop/mobile captures and browser measurements show no remaining P0/P1/P2 issue.

## Implementation checklist

- [x] Keep the approved room layers in both Talk phases.
- [x] Preserve companion breathing and reduced-motion behavior.
- [x] Preserve Convex conversation and OpenAI processing behavior.
- [x] Reset mobile scroll position on phase entry.
- [x] Keep the mobile composer above bottom navigation.
- [x] Add a regression test for room presence after `Keep this form`.

## Follow-up polish

- P3: once a populated local chat fixture exists, capture one dense-message screenshot to tune the maximum message-list height without calling OpenAI. This is not blocking the room-continuity fix.

## Final result

passed
