# Living paper controls v1

Might's action language now comes from the same handmade-paper world as the
fixed room. The controls are tactile story objects, while every label, focus
state, status, and consent decision remains live HTML.

## Asset set

| Asset | File | Role |
| --- | --- | --- |
| Connection accordion | `public/assets/surfaces/connections-accordion-letter-v1.png` | Six-stage Connections journey from seed to two-way knot. |
| Action tray | `public/assets/controls/might-action-tray-v1.png` | Wide paper shelf behind the next real action. |
| Consent note | `public/assets/controls/might-consent-note-v1.png` | Curled paper reminder for privacy and consent boundaries. |
| Primary plate | `public/assets/controls/might-primary-button-plate-v1.png` | Reused for the primary action on Talk, Me, Might Found, Connections, and Settings. |
| Secondary plate | `public/assets/controls/might-secondary-button-plate-v1.png` | Reused for quiet, reversible, or utility actions. |

All three new PNGs have real alpha channels. The generated art contains no UI
copy, numbers, logos, or baked status. The interface owns accessible labels,
current-step semantics, keyboard focus, disabled states, and responsive layout.

## Motion contract

- The accordion enters from its left edge with a restrained `scaleX` settle,
  suggesting a letter being opened rather than a dashboard loading.
- The current stage is expressed with live typography and the warm first-fold
  artwork; no flashing progress indicator is used.
- Hover and press states swap the approved paper-plate assets and move by no
  more than 2 px.
- Reduced-motion mode keeps every object in its settled state and removes CSS
  control transitions.

## Generation prompts

### Connection accordion

> Create one isolated, text-free, wide handmade-paper accordion for Might's
> Connections journey. Use exactly six connected folds in warm amber, ivory,
> and muted sage. Across the lower half, draw one continuous botanical line
> that evolves from seed to sprout, bud, blossom, paired leaves, and an
> intertwined two-way knot. Preserve generous blank paper for live HTML copy
> and labels. Match the established original Webtoon-storybook room with fine
> ink, restrained watercolor, visible washi grain, and soft directional
> shadow. No text, numbers, UI, people, logos, or background room. Place flat
> chroma magenta outside the continuous object for deterministic alpha keying.

### Action tray

> Recreate the long low handmade-paper action tray beneath the accordion. Use
> warm ivory washi, a folded triangular paper corner with a delicate leaf
> sprig at the far left, a long blank shallow parchment shelf in the center,
> and a restrained curled edge at the right. It must feel like one premium
> tactile consumer-app object from the same Webtoon storybook. No button, text,
> numbers, icons, logos, people, or room background. Place flat chroma magenta
> outside the object for deterministic alpha keying.

### Consent note

> Create one slim blank warm-ivory curled vellum note for Might. Add a pale
> sage pin and a faint botanical watermark, leaving the center empty for live
> privacy copy. Match the existing paper-and-leaf visual language with fine
> ink, soft shadow, and restrained texture. No text, UI, logo, or background
> room. Place flat chroma magenta outside the object for deterministic alpha
> keying.

## Technical note

Image content came from Codex's built-in image generation capability. The
solid-key exports were converted to deterministic alpha mattes, cropped, and
resized locally. No generated checkerboard was accepted as transparency.
