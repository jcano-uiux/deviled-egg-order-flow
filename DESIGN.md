---
name: Deviled Egg Co. — Order Online
description: A warm, cream-and-gold ordering flow built around one earned accent color and near-universal pill radius.
colors:
  golden-yolk: "#F7BA17"
  deep-ink: "#130D00"
  warm-ember: "#554523"
  warm-black: "#140F0A"
  espresso-on-gold: "#261A00"
  toasted-umber: "#402D00"
  warm-taupe: "#635E57"
  soft-taupe: "#7C766F"
  amber-link: "#8B5E00"
  eggshell-cream: "#FFF7EA"
  pure-white: "#FFFFFF"
  pale-cream: "#FFF7E2"
  cool-linen: "#F5F0E8"
  warm-sand: "#FFEFD5"
  golden-wash: "#FFDEA0"
  track-gray: "#E8E8E8"
  signal-red: "#DC2626"
  sand-border: "#D9D1BF"
  linen-border: "#E9E1D8"
  hairline-gray: "#F3F3F3"
  bronze-border: "#88754F"
typography:
  display:
    fontFamily: "Nunito, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: "32px"
  headline:
    fontFamily: "Nunito, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: "28px"
  price:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: "26px"
  body:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  body-sm:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  body-xs:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "18px"
  label:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: "normal"
    letterSpacing: "normal"
rounded:
  pill: "999px"
  tight: "8px"
  card: "12px"
  compact: "14px"
  media: "16px"
  panel: "24px"
spacing:
  2xs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.golden-yolk}"
    textColor: "{colors.espresso-on-gold}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "14px 26px"
  button-dark:
    backgroundColor: "{colors.deep-ink}"
    textColor: "#FBF3E3"
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    padding: "14px 26px"
  icon-button-dark:
    backgroundColor: "{colors.deep-ink}"
    rounded: "{rounded.pill}"
    size: "36px"
  icon-button-dark-hover:
    backgroundColor: "{colors.warm-ember}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  chip:
    backgroundColor: "{colors.cool-linen}"
    textColor: "{colors.warm-black}"
    rounded: "{rounded.pill}"
    padding: "11px 24px"
  chip-active:
    backgroundColor: "{colors.golden-yolk}"
    textColor: "{colors.espresso-on-gold}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.pure-white}"
    rounded: "{rounded.card}"
    padding: "24px"
---

# Design System: Deviled Egg Co. — Order Online

## Overview

**Creative North Star: "The Golden Yolk Standard"**

One earned, confident gold sits against warm cream and near-black ink — everything else in the system stays quiet on purpose, so the gold reads as quality rather than decoration. The palette, radius language, and shadow system all reinforce the same restraint: a single saturated accent, a near-universal pill/rounded corner, and a warm gold glow that appears exclusively on primary calls to action. Nothing competes with the yolk.

Typography carries the same discipline in two voices: Nunito at extrabold/bold weight is reserved for headings only, never body copy and never a number; Plus Jakarta Sans handles everything else — paragraph text, the all-caps 13px navigation labels, and every price or total figure in the product. The system was audited from the live deviledeggco.com site and cross-checked against the DECo_Order_260920 Figma file — it is a real, evidenced brand system, not an invented one.

**Key Characteristics:**
- One saturated accent (`#F7BA17`), rare and rule-bound to primary actions
- Warm cream surfaces (`#FFF7EA`) as the dominant background, never stark white
- Near-universal pill (`999px`) or soft (`8–16px`) corner radius; nothing sharp
- Two-voice type system: Nunito extrabold/bold for headings only, Plus Jakarta Sans for everything else — prices and totals included
- Low-contrast, tonal card shadows; the only colored shadow is the gold CTA glow

## Colors

Warm and restrained: a cream-and-ink neutral base carries almost the entire interface, with the gold accent held in reserve for the handful of moments that should visibly matter.

### Primary
- **Golden Yolk** (`#F7BA17`): the only saturated color in the system. Primary CTA fills, active chip/toggle states, the sole colored drop-shadow (`--deg-shadow-brand`, CTAs only).

### Neutral
- **Deep Ink** (`#130D00`): headings, prices, dark button fills (Add-to-cart, cart icon, Customize→ dozen builder), footer base.
- **Warm Ember** (`#554523`): the hover fill for dark icon buttons — a shop card's Quick Add button lightens from Deep Ink to Warm Ember on hover. The only documented hover-state color in the system.
- **Warm Black** (`#140F0A`): default body text color.
- **Espresso on Gold** (`#261A00`): text set directly on the gold accent — never black-on-gold.
- **Toasted Umber** (`#402D00`): secondary heading tier — card titles, feature-card title, active drawer-nav item text.
- **Warm Taupe** (`#635E57`): muted/secondary body text — card descriptions, meta text ("140 Cal."), placeholders' parent color.
- **Soft Taupe** (`#7C766F`): input placeholder text specifically (one step lighter than Warm Taupe).
- **Amber Link** (`#8B5E00`): text links and eyebrow labels ("Signature").
- **Eggshell Cream** (`#FFF7EA`): the dominant page background.
- **Pure White** (`#FFFFFF`): cards, inputs, the header bar.
- **Pale Cream** (`#FFF7E2`): count-pill fill.
- **Cool Linen** (`#F5F0E8`): default chip/segmented-track fill, secondary button fill.
- **Warm Sand** (`#FFEFD5`): gradient partner for photo-placeholder panels.
- **Golden Wash** (`#FFDEA0`): active sidebar category-nav item fill.
- **Track Gray** (`#E8E8E8`): the segmented-toggle track.
- **Signal Red** (`#DC2626`): the cart-count badge. Deliberately darkened from the Figma source's `#F04438` — white text on the original only measured 3.8:1 contrast against the 4.5:1 AA floor for its 11px bold size.
- **Sand Border** (`#D9D1BF`) / **Linen Border** (`#E9E1D8`) / **Hairline Gray** (`#F3F3F3`) / **Bronze Border** (`#88754F`): border hairlines, lightest to most saturated — inputs and cards use Sand/Hairline; the active drawer-nav item and focused inputs use Bronze as the one "accented" border.

### Named Rules
**The One Accent Rule.** Golden Yolk is the only saturated color anywhere in the system. It appears on primary buttons, active toggle/chip states, the selected state of a single-choice row, and nowhere else — its rarity is what makes it read as intentional rather than decorative.

## Typography

**Display Font:** Nunito (with sans-serif fallback)
**Body Font:** Plus Jakarta Sans (with sans-serif fallback)

**Character:** A confident, rounded extrabold display face paired with a clean, highly legible grotesque body face — the pairing reads as approachable craft-food rather than corporate delivery-app.

### Hierarchy
- **Display** (800, 28px/32px): page-level and card-level hero moments — store name, feature-card title ("Build Your Own Dozen"), confirmation heading.
- **Headline** (700, 20px/28px): section headings — menu category titles ("Deviled Eggs"), checkout card headings ("Pickup details"), order-summary heading. Bold, not extrabold — this is the one deliberate weight step down from Display.
- **Body** (400, 16px/24px): sidebar drawer-nav items, default paragraph text.
- **Body Small** (400–600, 14px/20px): small card prices (semibold), meta text and toggle labels (medium), form copy (regular).
- **Price/Total** (700, Plus Jakarta Sans): every price and "Total" row is bold Plus Jakarta Sans, but size follows context, not a fixed step. The feature-card price, checkout order-total, and confirmation total stand alone and run 20px/28px — the same scale as Headline, deliberately, so a number reads with as much weight as a section title. The cart drawer's Total is compact instead: 14px/20px, flush with its own Subtotal/Tax neighbors (per the Figma order-dialog reference), told apart only by weight and `--deg-ink-deep` color, not a size jump.
- **Body XS** (400–600, 12px/18px): address lines, sidebar hours, delivery-info copy.
- **Label** (700, 13px, uppercase): the top navigation only — the single place in the system that uses uppercase tracking-free bold caps.

### Named Rules
**The Two-Voice Rule.** Nunito is for headers and nothing else. A header is an `h1`/`h2`/`h3`, a named heading class, or a modal or panel title. It is never used for body copy, links, buttons, labels, tags, step numbers, list or group names, prices, totals, distances, or any other number. The one standing exception is the mobile navigation drawer's links (below), which the owner chose to keep. Plus Jakarta Sans carries every other voice in the system, including the uppercase nav labels and every number a customer has to read as money. If a piece of text isn't a header, it is Plus Jakarta Sans, whatever its size or weight.

**The Numbers-Are-Never-Nunito Rule.** An earlier pass in this file wrongly grouped "prices" in with Nunito's headings; a rounded extrabold display face reads as a logotype, not a ledger, and set a dollar figure it looks like a toy-store price tag. Every price and every "Total" — the feature-card price, the cart drawer total, the checkout order-total, the confirmation total — is Plus Jakarta Sans Bold (700) in `--deg-ink-deep`, at whatever size its own context calls for (see Price/Total above). Nunito's domain is strictly `h1`/`h2`/`h3` and named heading classes (`.feature-title`, `.menu-section h2`, `.checkout-card h2`, `.summary-panel h2`).

## Layout

Centered container, max-width `1280px`, `40px` side padding. The menu view splits into a `276px` sticky left sidebar (store card + category drawer) and a flexible right column holding the hero image, search, store-info card, feature card, and category sections.

Vertical rhythm is deliberately two-tiered: tight spacing *within* a group (16px between cards in the same category grid, 14px between a section heading and its grid), and generous spacing *between* groups (56px before every new category-section heading, scaled to 40px under 640px). The gap between groups is always larger than any gap inside one — that's what makes categories read as distinct groups rather than one continuous scroll.

The same container and the same two-tier rhythm carry the other pages. **Nationwide Shipping** and **Catering** are single-column content pages: a 24px-radius hero panel (gold on Shipping, Deep Ink with egg-shaped cutout photography on Catering), then sections 56px apart (40px under 640px), each a heading with a one-line muted subhead above its cards. Each cart (Pickup, Shipping, Catering) checks out on its own page in the checkout layout (form cards left, order summary right), with the checkout header in place of the site nav.

Responsive behavior is structural, not cosmetic: at ≤900px the sidebar drops above the content and the category drawer becomes a horizontal wrapping row; the two-column shop-grid collapses to one column. At ≤640px the top nav's link list wraps to its own row below the logo/cart, and multi-column form rows stack.

## Elevation & Depth

Flat by default, with one very restrained ambient shadow system for cards and exactly one colored shadow reserved for the primary CTA. Nothing else in the system casts a colored glow.

### Shadow Vocabulary
- **Card** (`0 3px 9px -1px rgba(17,24,39,.06), 0 1px 2px rgba(17,24,39,.04)`): the default resting shadow for every card — shop cards, feature card, order-mode card.
- **Brand** (`0 10px 12px rgba(247,186,23,.25)`): gold primary buttons only — the page-level call to action (a marketing hero's "Shop Now"/"Order Now", the signup "Subscribe"). Never on a dark surface, where the glow reads as a halo; there the gold fill carries the button alone.
- **Ambient** (`0 12px 32px rgba(0,0,0,.08)`): larger floating panels — the checkout order-summary panel.
- **Modal** (`0 24px 64px rgba(19,13,0,.32)`): the item-customization modals.
- **Float** (`0 2px 12px rgba(0,0,0,.12)`): small circular controls sitting on top of photo/hero media — the add-to-cart button on a card thumbnail, the hero's "more photos" button.

### Named Rules
**The Earned Glow Rule.** The one colored shadow in the system (`--deg-shadow-brand`) is bound to primary CTAs and nothing else. A card, a chip, a hover state — none of them borrow the gold glow. If it isn't the primary action, its shadow is neutral gray.

## Shapes

Nothing in the system is sharp-cornered. Radius scales by role, not by size alone: `999px` (pill) for every button, dropdown, chip, and badge, and for the location picker's ZIP search field; `14px` for every text field (contact, address, notes, card details, tip, date and time); `8px` for small controls like the search field and an active drawer-nav row; `12px` for the dominant card radius (shop cards, feature card); `14px` for compact selectable rows (radio/option/flavor rows); `16px` for standalone photo/hero containers and the pickup/delivery card; `24px` for large panels and modals.

### Named Rules
**The No-Sharp-Corner Rule.** Every rectangle in the system carries a radius from the scale above. A `border-radius: 0` anywhere is a bug, not a style.

## Components

Soft and confident: near-universal pill/rounded radius, very low-contrast card shadows, and exactly one bold gold CTA per screen — nothing else fights for attention.

### Buttons
- **Shape:** pill (`999px` radius) for every variant.
- **Primary (gold):** Golden Yolk fill, Espresso-on-Gold text, bold (700) 15px, the brand glow shadow. One per screen — the single loudest element in view. Used for page-level calls to action and the signup "Subscribe" button; on a gold surface (the Shipping hero) the button is Dark instead, since gold on gold disappears.
- **Dark:** Deep Ink fill, warm off-white text (`#FBF3E3`), medium (500) weight. The working action everywhere a customer is building or paying for an order: modal footers ("Add to order", "Add to Bag", "Update order"), "Go to checkout", "Place order", the kit and catering "Add to Bag" / "Order Now" buttons, and secondary actions like "Store info".
- **Outline:** transparent fill, 1.5px Deep Ink border, Deep Ink text, no shadow — tertiary/back actions.
- **Icon buttons** (cart, close, quantity steppers, add-to-cart): circular, no border, centered icon; float above photo media use the Float shadow.
- **Icon button hover (dark fill):** Deep Ink lightens to Warm Ember (`#554523`) on hover, a 150ms background transition.

### Chips
- **Style:** Cool Linen fill, Warm Black text, pill radius, no border.
- **State:** active swaps to Golden Yolk fill / Espresso-on-Gold text and steps up to bold (700). A `.segmented` wrapper (the tip picker, the cart drawer's Pickup | Shipping | Catering tabs with a count on each, the catering Pickup/Delivery choice) adds a Track Gray or Cool Linen track behind transparent chips.

### Cards / Containers
- **Corner Style:** `12px` (shop cards, feature card) or `16px` (photo/hero and the pickup-delivery card).
- **Background:** Pure White on a Eggshell Cream page — the white-on-cream contrast is the only way cards separate from the page; there's no border-heavy treatment.
- **Shadow Strategy:** the Card shadow — see Elevation & Depth.
- **Border:** 1px Hairline Gray, present but nearly invisible; it reinforces the shadow rather than replacing it.
- **Shop card as one interactive unit:** in the source Figma component, the Quick Add button sits inside a single card-wide `Link`, and the component's "hover" variant is defined at the card level — hovering it is what changes the button's fill, not a hover rule on the button alone. Implemented as: the whole card is `cursor: pointer` and clickable (same action as the button — every product opens its own modal first, never an instant add; see PRODUCT.md), `.shop-card:hover .add-btn`/`:focus-within` drives the Warm Ember fill, and a click listener on the card guards against double-firing when the click actually lands on the button (`.add-btn` keeps its own listener for keyboard/focus users; the card's listener no-ops when the event target is inside it).

### Inputs / Fields
- **Style:** pill radius, 1px Sand Border, Pure White fill, generous `14px 22px` padding.
- **Focus:** a two-ring halo — Eggshell Cream ring, then Deep Ink ring — so focus reads against any background, including gold buttons and active chips where a same-hue outline would vanish.

### Selectable rows
- **Single choice** (`.radio-choice`: one flavor, payment method, pickup time, catering protein, bagel preset, pickup location): Cool Linen row, `12px` radius, name over a muted note, a 24px circular indicator on the right. Selected fills the whole row Golden Yolk and the indicator turns solid Deep Ink with a white dot. Native radios sit inside the label so arrow keys and focus work; the focus halo wraps the row.
- **Multi choice** (`.addon-row`, checkbox role): same row with a 24px square box. Where many rows can be on at once (catering flavors and sides), selection is a 2px Deep Ink ring plus a filled check instead of a gold fill per row, so gold stays rare.
- **Saved order block and store cards** (location picker): the saved order is a white 16px-radius card (Nunito title, bold store, muted address, semibold day and time, a dark pill and an underlined text link). Store results are white cards with the name and distance on one line, the address, a one-line status in plain text and a text action with a › (never a badge or an outlined pill); only the closest card carries a dark button, and no gold appears on any of them.
- **Checkout field labels:** on the three checkout pages (inside `.checkout-card` and `.summary-panel`) `.field-label` is a 14px / 600 sentence-case label in Cocoa (`--deg-ink-heading`), not tracked caps. Other forms still use the older uppercase label (see Known deviations). The tip picker is a radio group (`aria-checked` follows the active chip).
- **Cart line** (`.drawer-line`): a 56px photo, then the name and price on one row, the muted choices line, a quantity row (a muted "Qty" and a compact 36px pill dropdown from 1 to 100, or "10 boxes" for a box meal), and below it three plain-word actions (Edit, Duplicate, Remove: 13px semibold body text, 44px tall, underline on hover, no icons, gold or red). A duplicated line fades in from Warm Sand for 1.6 seconds (not under reduced motion).
- **Checkout title** (`.checkout-title`): above the form and the summary, an h1 "Secure Checkout" (Nunito 800, 32px; 28px and centered on phones), and on Shipping and Catering a 15px muted line under it naming the path. The back-to-cart button lives in the top bar, not here.
- **Tip picker** (`.tip-chip`): four equal chips in one row under "Add a tip for the team", each a 12px muted percentage over the dollars it comes to in 14px bold tabular figures (15%, 18%, 20% of the subtotal, and Custom, which shows the custom amount and opens a $ field below). 14px corners (the compact tile radius, not a pill, since a pill this tall and narrow reads as an oval), cream-cool at rest and solid gold when chosen.
- **Pay bar** (`.pay-bar`, phones only): a white strip fixed to the bottom of the pickup checkout with a hairline top rule and a soft upward shadow, a muted "Total" over a 20px tabular-figure amount on the left, and the dark Place order pill on the right. The strip pads for the home-indicator safe area.
- **Order tile and row** (`.order-tile`, `.order-row`): on the pickup order page, a tile is a white card with a photo panel, a Nunito 800 name, a muted "N options · from $X" line and a chevron (a 3-column grid with the photo on top from 900px); a row is a white 12px-radius card with a 96px photo, a 16px semibold name, price and calories, a two-line description and a 36px dark Add circle. No gold on either: the dark circle is the one action.
- **Pickup banner** (`.order-banner`): a full-bleed white strip (screen edge to edge, flush under the header, no vertical padding, a 1px bottom rule) above the menu, its content on the page gutter: a pin, "Pickup at" + the store (and its address from tablet width up), the day and time in semibold, and an outline pill **Change**. No gold: the pin disc is the only tint, and drops away on phones so the day and time fit on one line.
- **Allocation** (`.flavor-row`): a white row with a − / + stepper, for splitting a fixed number of pieces across flavors. In the dozen picker the row leads with the flavor's poster (56px, play badge); tapping it opens that flavor's clip (2:3, muted, looping) and live description inline under the stepper, one open at a time.

### Cart drawer
- A right-hand drawer (full screen on phones) holding three carts. With more than one cart in use it shows a full-width segmented tab bar (Pickup | Shipping | Catering, each with an item count; Catering counts lines, not boxes); with one it shows none. Each tab has its own one-line context under the title, its own items, its own total (Pickup total includes tax; Shipping and Catering show a subtotal and say fees come at checkout) and its own "Go to checkout".
- Lines step with a −/+ stepper; a catering box meal instead shows "Edit" (reopens its modal filled in) and a trash button. Removing any line shows a Deep Ink "Removed … Undo" bar for 8 seconds.

### Modals
- Product modals are full-screen on phones and a 1000px, `32px`-radius dialog on desktop: a photo panel and a content column, a sticky footer with the Dark "Add to order" button that states what is still missing ("Choose 10 sandwiches to continue") until the order is valid. Catering cutouts sit in a compact 300px Cool Linen panel; the box meal modal fills the space below the photo with a live "Your order" summary (hidden on phones).

### Navigation

**Top nav** — measured against the Figma frame (node `29:18791`), not approximated:

- **Bar:** Pure White background, hairline (`1px #F3F3F3`) bottom border, `8px` vertical padding. Content max-width `1360px`, centered, `12px` horizontal padding on the row itself.
- **Logo:** the wordmark image at `37px` tall, width auto (native ratio ~5:1, renders ~185px wide). This is a deliberate, measured size — Figma's own Link node is `190×37.289px`, and the source logo asset is natively `190×38px`, so the two agree almost exactly. `16px` margin to its right before the link list.
- **Links:** bold (700) `13px` Plus Jakarta Sans, uppercase, Warm Black (`#140F0A`), `10px` padding on each link, centered as a group in the remaining space. No letter-spacing and no gap beyond each link's own padding — Figma's link list has neither; the uppercase weight and padding alone carry the rhythm. `16px` margin between the link list and the cart button.
- **Cart button:** `40px` Deep Ink (`#130D00`) circle, centered `18px` icon. The count badge is `18px` (grows via `min-width` for 2+ digits), Signal Red fill, white bold `11px` text, positioned `4px` above and `6px` right of the button's own edges (i.e. it overhangs the circle on the top-right corner, not flush-inset).
- **A found-and-fixed rhythm bug:** the nav previously stacked a container-level `gap: 16px` *on top of* the logo's own `margin-right: 16px` and the cart button's own `margin-left: 16px`, doubling both side gaps to 32px. The container has no gap of its own — spacing comes entirely from each element's individual margin, matching Figma's own per-element (not per-container) spacing model.
- **Bar height (a rule, not a side effect):** the top bar is `69px` tall on every page and at every width, and it must stay that way: other things are placed against it (the mobile category bar sticks at `top: 69px`, the full-bleed banners start flush under it). Don't let a page add rows to it, shrink it, or swap in a different bar. Measured at 1024px: Home, location picker, products page, order page (and its group screens), Shipping, Catering and the checkouts are all 69px. On the checkouts it is the same 69px bar with the way out taken away: no menu button, no links, no cart, just a round back-to-cart chevron on the left and the logo centered (`body.is-checkout`).
- **Links (current):** Pickup & Delivery, Nationwide Shipping, Catering, Gift Cards, Corporate Gifting, About, Franchise, Contact. The page being viewed carries a 3px Golden Yolk underline (`aria-current`).
- **Mobile (≤640px):** the link list is a left side drawer (80% of the viewport, max 320px) behind a dimmed backdrop with the page inert, opened from a menu button at the left of the header. Its links are the one sanctioned exception to the Two-Voice Rule: Nunito 800 at 20px/28px in sentence case, 24px drawer padding. The owner chose to leave them as they are; this exception covers those links only, never any other navigation or UI text. This replaced the earlier wrap-to-its-own-row layout.

**Sidebar category drawer** — a second navigation surface, not shown in the top-nav frame but part of the same menu page:

- Medium-weight (500) `16px` Plus Jakarta Sans items, `14px 12px 14px 16px` padding, Warm Taupe (`#635E57`) text at rest.
- The active item gets a `4px` Bronze Border (`#88754F`) left accent, `8px` corner radius, Golden Wash (`#FFDEA0`) fill, and its text steps to Toasted Umber (`#402D00`).
- **Mobile:** becomes a horizontal wrapping row instead of a vertical list.

## Do's and Don'ts

### Do:
- **Do** keep Golden Yolk to primary CTAs and active-selection states only — one per screen is the target.
- **Do** use Nunito exclusively for headers (plus the mobile nav drawer's links, the one sanctioned exception); every other piece of text — links, buttons, labels, prices, totals, distances, numbers — is Plus Jakarta Sans.
- **Do** keep the top bar the same height on every page (69px); see Navigation.
- **Do** make the gap between content groups larger than the gap within a group — that's the entire grouping mechanism in this system, not borders or dividers.
- **Do** reuse an existing radius/shadow/spacing token before introducing a new value; the scales above already cover buttons, cards, panels, and photo containers.
- **Do** prefer a project token over a raw Figma literal when a source design's color is unbound to a variable — several near-duplicate grays in the Figma file (`#4b4b4b`, `#5e5e5e`, `#6b6155`) are one-off authoring slips a few percent off Warm Taupe (`#635E57`), which is the bound, repeated token and the real source of truth.

### Don't:
- **Don't** add a second saturated color. The system's entire visual identity depends on gold staying rare.
- **Don't** use a colored shadow anywhere except the primary-CTA brand glow — cards, hover states, and chips all stay on the neutral Card shadow or no shadow at all.
- **Don't** introduce a sharp (`0px`) corner anywhere; every rectangle in this system has a radius.
- **Don't** letter-space the nav labels or add extra gap between them — the uppercase weight and each link's own padding already carry the rhythm.
- **Don't** set Nunito on anything that isn't a header, however large or bold it is meant to feel; reach for Plus Jakarta Sans 700/800 instead.
- **Don't** set any label in tracked uppercase except the top navigation; chips and tags that need a name use sentence-case chip type.
- **Don't** make "Add to Bag" (or any add-to-order control) a link to an outside page. It opens the product's in-app modal and adds to the in-app cart — shipping kits included. See PRODUCT.md principle 5.

### Known deviations (built, not yet brought back to the rules above)
The Nationwide Shipping and Catering pages were built before these rules were re-checked against them. Treat these as bugs to fix, not as precedents, and see the critique notes in `.impeccable/critique/`:
- Nunito on non-header text has been moved to Plus Jakarta Sans everywhere except the mobile nav drawer's links (the sanctioned exception). That covered the Shipping and Catering prices, the Shipping step numbers, and the store locator's distances, state names and pickup-dock store name; none remain.
- They spend gold on tags (`.kit-tag`, `.cater-tag`), step numbers, bullet dots and status pills, beyond the one-accent rule, and their tags and status labels are tracked uppercase.
- The hero language differs by page (gold panel on Shipping, Deep Ink on Catering); the difference is intentional, the gold budget is not.
