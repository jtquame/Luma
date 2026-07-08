# Luma Design Tokens

Calm, personal, therapeutic — not a SaaS dashboard, not clinical. The app should
feel like a quiet, well-kept room, not a control panel.

Palette is pulled directly from Samara Lynch / Tribe Works Behavioral
Services brand assets (olive/moss green, warm cream, antique gold, soft sage)
so the portal feels like an extension of her practice, not a separate product.

## Color
- `--bg` #F7F1E6 — warm ivory/cream, the brand's card background
- `--surface` #FFFFFF — clean white for elevated cards on top of the ivory
- `--ink` #26261F — near-black warm ink, matches the brand's dark serif text
- `--ink-muted` #6E6A5A — secondary text, warm grey-olive
- `--primary` #57612F — deep moss/olive green, the brand's dominant color
- `--primary-hover` #454E24
- `--accent` #B08D3E — antique gold, used for hairline rules, dividers,
  small accent marks (mirrors the gold arch/star motif in her brand kit)
- `--sage` #B7C99C — soft sage green, the brand's secondary banner color;
  used for tags, subtle section backgrounds, success states
- `--border` #E3DCC8 — warm hairline border, low contrast on purpose
- `--danger` #A8523F — muted brick red for destructive actions, never neon

Dark mode inverts around a deep olive-charcoal (#20241A) rather than pure
black, keeping the same warmth and the gold accent legible.

## Type
- Display: **Playfair Display** — elegant high-contrast serif, used for page
  titles and section headers, matching "Meet Samara Lynch" in her brand kit.
  Used sparingly, never for body copy.
- Body/UI: **Work Sans** — warm, humanist, friendly without being casual;
  matches the tone of her bio copy ("Hi there!").
- Structural labels (timestamps, "CHECK-IN", category eyebrows): **IBM Plex
  Mono**, small caps, letter-spaced, quiet.
- Decorative flourish (used only in the hero, never in UI chrome): an italic
  serif echo of the "tribe works" logotype, for the welcome message only.

## Layout
- Client-facing pages: centered single column, generous margins, editorial
  rhythm — reads like a journal, not a dashboard.
- Therapist pages: left sidebar nav + content area. Functional but never
  dense; same rounded-2xl cards and soft shadows as the client side so it
  doesn't feel like a different, colder product.
- Corners: rounded-2xl on cards, rounded-full on pills/avatars, rounded-lg on
  inputs/buttons. Soft shadows (`shadow-sm`/`shadow-md`), no hard borders as
  the primary separator.

## Signature element: the Breathing Orb
A slow, soft pulsing radial gradient circle (moss green → antique gold) used
as an ambient element on the home page hero and the check-in page — directly
tied to the subject matter (breathing exercises, grounding, the rhythm of a
check-in) rather than a decorative blob. 6s ease-in-out pulse, respects
`prefers-reduced-motion` (falls back to static). Used once per page, never as
generic decoration.

## Motion
Minimal. Page-load fade/rise on hero content, the orb's ambient pulse, and
subtle hover states on cards/buttons. No scroll-jacking, no confetti, nothing
that reads as "look what I can animate."
