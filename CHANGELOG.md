# Changelog

A running log of design/dev sessions on this prototype. Newest first.

---

## 2026-09-24 — 2026-09-25

Long session covering the checkout order dialog, the store locator, and a full rebuild of the flavor-picker modal to match the real deviledeggco.com ordering widget.

### Checkout & order summary

- Cart drawer ("Your order") restructured into three fixed bands — header, independently-scrolling item list, pinned white footer — matching the reference dialog and fixing a real bug where a short cart left a dead gap above the footer (`margin-top: auto` in a single scrolling column).
- Cart drawer header background set to white per direct request (was golden-wash).
- Cart drawer type sizes corrected against the actual Figma text nodes: item price and the drawer's own Total row are 14px (previously 16px/20px) — the drawer's Total is intentionally *smaller* than checkout's Total, distinguished by weight/color, not size. Checkout's and confirmation's Totals stay at 20px; DESIGN.md's Price/Total rule was corrected to document that size is contextual, not a fixed step.
- Promo code feature removed end-to-end (input, Apply button, validation message, `PROMO_CODES`, `state.promo`/`promoAmount`, both totals panels) — was never part of the reference and was dead weight.
- Checkout "Order total" card: added the missing hairline dividers between Subtotal/Tax and Tax/Tip section, matching the reference exactly.
- "Place order" button no longer repeats the price (was "Place order · $22.70", now just "Place order").
- Checkout header alignment bug fixed: `.checkout-layout` had a second, redundant containment layer nested inside `.view` (which already sets the page's max-width/margin/padding), pushing the body 80px right of the header. Unified onto one containment system.

### Store locator ("Choose a store")

Ran a full dual-assessment critique (design review + detector/browser evidence), scored 21/32 (Acceptable), then fixed the top issues:

- **[P0] Fixed** — store rows had no accessible selected-state (just a CSS class). Added `role="radiogroup"`/`role="radio"`/`aria-checked`.
- **[P1] Fixed** — on mobile, the map visually collided with Confirm/Cancel by ~45px. Root cause: `.store-locator-body` switched to a stacked column at ≤900px but kept `overflow-y: visible` instead of its own scroll region. Fixed.
- **[P1] Fixed** — the map had no loading or error state; a blocked/offline map degraded to a blank box. Added a loading overlay and a timeout-based fallback showing the plain-text address.
- **[P2] Fixed** — the map was raw, unstyled Google chrome next to a fully-tokenized store list. Applied a CSS filter (sepia/saturate/hue-rotate) to warm it toward the brand palette, since the keyless embed (no API key, by design) can't take real Maps JS API styling.
- **[P2] Deferred** — confirming a new store gives no on-screen acknowledgment; the modal just closes silently. Not done — see "Next up."
- Layout pass: dividers, close buttons, and popup chrome made consistent across the pickup-time, store-locator, and add-payment popups.
- Attempted `/impeccable generate 3 quieter` on this modal — the `live-generate` helper isn't implemented in this installed skill version, so it was built manually as a temporary in-page preview (color/ornament/spacing axes) for the user to compare live; discarded, nothing kept.

### Flavor-picker modal (was "Build Your Own Dozen" only, now the whole Deviled Eggs lineup)

The biggest structural change this session. The old picker was a simple "toggle up to 4 flavors" checklist. It's now a real piece-allocation picker copied from the live site's actual mechanic:

- Each flavor gets its own `−`/count/`+` stepper; pieces allocate in fixed steps (`total ÷ max flavors`), and "Add to order" stays disabled until every piece is allocated — exactly matching deviledeggco.com's own "you must allocate exactly all pieces" behavior.
- Added real per-flavor "NO: ingredient" exclusion chips for all 19 flavors, sourced directly from the live site's DOM (not fabricated) — they only reveal once a flavor is selected, and live inside the same card, not a separate block.
- **Extended to the whole lineup**, each with its own verified (not guessed) config — the 24 Count Platter in particular doesn't follow the pattern the other sizes imply:

  | Product | Pieces | Max flavors | Step |
  |---|---|---|---|
  | 2 Pack Deviled Egg | 2 | 2 | 1 |
  | 6 Pack – 3 Flavors | 6 | 3 | 2 |
  | 6 Pack – 6 Flavors | 6 | 6 | 1 |
  | 12 Pack Deviled Egg | 12 | 4 | 3 |
  | 24 Count Platter | 24 | **3** | **8** |
  | Try Them All Platter | — | no picker (fixed platter, matches live site) | — |

- One shared modal now serves all five products (`activeProduct` replaces the old hardcoded `DOZEN_*` constants) — title, price, photo, and description update per product. Fixed a latent bug as a side effect: the cart line item always said "Build Your Own Dozen" regardless of which pack was actually customized.
- Featured card and shop-grid card both renamed/re-imaged to "12 Pack Deviled Egg" (was mislabeled as "Build Your Own Dozen" with the wrong photo).
- Modal no longer auto-selects 4 default flavors — opens empty, matching the live site.
- Modal image now matches the product card's real photo (was a placeholder egg icon).
- Modal title now echoes into the fixed header once you scroll past the inline title (was invisible while scrolling) — found and fixed a CSS bug in the process where a percentage `max-width` was resolving against the wrong (grid auto-track) base and truncating names to "12 Pack D…".
- Disabled dropdown/stepper states made visually obvious (was: a disabled `+` looked identical to an active one).

### Design system / components

- Native `<select>` dropdowns redesigned: custom chevron with real breathing room (was cramped against the field edge), plus a genuinely missing `:focus-visible` ring on all selects (keyboard users had zero focus indicator). The one-off `.qty-select` (boxy 8px radius, flat padding) was folded back into the shared pill-radius field system.
- Published a standalone "Color System" reference page in the linked Figma file — all 21 documented colors as swatches with usage notes, for reference only (no styles/variables touched).

### Documentation

- PRODUCT.md and DESIGN.md updated throughout to stay in sync with the above (promo removal, Price/Total sizing rule, flavor-picker capability description across all pack sizes).

---

## Next up

**Priority: the store locator ("Choose a store" popup) still needs another pass — specifically, it's not visually appealing.** Flagged by the user at the end of this session. The critique fixes earlier (accessibility, mobile overlap, map error state, map color warmth) were all *functional/technical*, not aesthetic — the user's follow-up feedback is that the visual design itself still falls flat even with those fixed. Fresh-eyes observations from looking at it again after those fixes:

- The store rows are plain white rectangles with a thin border and text only — no icon, no visual anchor, no depth. Every other selectable row in the product (pickup date tiles, radio rows) has more visual character than this list.
- The selected row's treatment (gold-tint fill + border) is functionally correct but reads flat next to the list's overall plainness — the whole list needs to feel considered, not just the active state.
- The map, even after the warm color-filter pass, still sits as a visually separate, generic rectangle next to the list rather than feeling like one integrated component — the two halves don't feel designed together.
- Worth considering: a location-pin icon per row (this product already has one, used in the pickup chip), more generous spacing/padding to match the breathing room elsewhere in this product's popups, and a stronger visual treatment for the active selection (shadow/elevation, not just color).
- Also still open from the critique: confirming a new store gives no on-screen feedback (modal just closes silently) — scoped out of the last pass ("top 3 only"), still the one functional item left.
- Worth re-running `/impeccable critique` first, then likely `/impeccable bolder` or a fresh `/impeccable polish` pass specifically on visual treatment rather than function.
- Minor, still open: uneven row heights from address wrapping (Coppell/Rockwall wrap to 2 lines, McKinney/Denison don't), no hover state on store rows, and the modal's copy ("Choose a store") is the most voice-neutral text in an otherwise "warm and quirky" product.

**Other loose threads:**

- The Deviled Eggs flavor-picker modal's ingredient-exclusion feature (checkboxes) is functional but not yet reflected in the checkout order-summary or confirmation screens' item breakdowns beyond the flat "(no bacon)" text appended to the flavor name in the cart line — worth a look if that gets confusing with multiple exclusions.
- Consider whether the "Add payment method" and pickup-time/store-locator popups still read as fully consistent with each other now that the store locator has had more individual attention than the others this session.
