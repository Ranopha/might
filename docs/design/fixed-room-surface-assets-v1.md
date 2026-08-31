# Fixed-room surface assets v1

Might's four primary surfaces are four story moments in the same sunlit room,
not four separate dashboards. Talk keeps the companion in the alcove. The
other surfaces use transparent scene objects that can be positioned and moved
independently over the approved room background.

## Asset set

| Surface | File | Story role | Intended motion |
| --- | --- | --- | --- |
| Me | `public/assets/surfaces/me-memory-herbarium-v1.png` | A warm botanical folio holds living memories in the alcove. | Very slow page-light breath; individual paper leaves drift by 2–4 px over 8–12 seconds. |
| Might Found | `public/assets/surfaces/found-world-knock-v1.png` | A sealed paper-leaf messenger crosses the doorway: the world has knocked, but nothing has been shared. | Drift in from the door, pause, then settle; trailing leaves follow with restrained stagger. |
| Connections | `public/assets/surfaces/connections-two-way-thread-v1.png` | Two lantern-pods share one living thread after a real two-way hello. | Pods breathe out of phase; the thread warms on Replied and the center sprout unfurls only on Connected. |

The PNGs contain real alpha channels and no baked UI text. Labels, status,
consent controls, focus states, and screen-reader copy remain live interface
elements. Reduced-motion mode should render each object in its settled pose.

## Generation prompt set

The assets were generated with Codex's built-in image generation capability,
using the approved room and paper-and-leaf orb as visual references.

### Me — living-memory herbarium

> Create a single transparent Webtoon-style story prop for the same bright,
> sunlit paper room: an open botanical memory folio resting in the round
> alcove. Its pages form three or four soft leaf-like petals with delicate
> pressed sprigs, warm amber light glowing from the center, muted sage and
> ivory handmade-paper textures, fine ink-and-watercolor outlines, and an
> understated wooden base. Original, non-photorealistic, calm, tactile, and
> low-detail enough for a consumer app hero. No people, no lettering, no UI,
> no frame, no logos, no famous IP, and no background room.

### Might Found — the world knocks

> Create a single transparent Webtoon-style messenger object for the same
> bright, sunlit paper room: a softly folded ivory paper-leaf letter entering
> from the right, sealed with a tiny botanical wax mark and accompanied by
> two or three trailing paper leaves. It should feel like a gentle knock from
> the outside world, curious rather than urgent. Use warm ivory, faint blush,
> muted sage, handmade-paper grain, delicate brown ink lines, and soft amber
> rim light. Original and non-photorealistic. No text, no UI, no dashboard
> iconography, no room background, no logos, and no famous IP.

### Connections — a real hello

> Create one transparent Webtoon-style connection vignette for the same
> bright, sunlit paper room: two original glowing paper-and-leaf lantern pods,
> one ivory and one muted sage, facing one another and joined by a thin living
> botanical thread. A tiny new sprout grows at the thread's midpoint to imply
> a two-way conversation has begun, not a transaction or agreement. Include
> subtle warm grounding rings, handmade-paper grain, restrained watercolor,
> delicate ink outlines, and soft amber inner light. No text, no UI, no
> dashboard symbols, no background room, no logos, and no famous IP.

## Technical note

The first generated exports visually depicted a transparency checkerboard but
were RGB images. They were not accepted as transparent assets. Clean solid-key
versions were generated and converted into deterministic alpha mattes; the
final files were then composited over the approved room for edge and scale
review. Image content came from the built-in generator; the local post-process
only removed the key color and cropped transparent margins.
