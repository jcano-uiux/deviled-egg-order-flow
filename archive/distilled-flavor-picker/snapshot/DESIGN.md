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
  control-border: "#968B76"
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
  control:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: "22px"
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
  checkout-card: "20px"
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
- **Signal Red** (`#DC2626`): the cart-count badge. Deliberately darkened from the Figma source's `#F04438` — white text on the original only measured 3.8:1 contrast against the 4.5:1 AA floor for its 11px bold size. It is also the "left out" mark in the Customize list (the circle-slash and the strikethrough); on a gold row that mark darkens to `#B91C1C` so it keeps its contrast.
- **Control Border** (`#968B76`): the edge of text fields and select-like buttons; the only border that has to meet 3:1. **Sand Border** (`#D9D1BF`) / **Linen Border** (`#E9E1D8`) / **Hairline Gray** (`#F3F3F3`) / **Bronze Border** (`#88754F`): border hairlines, lightest to most saturated — inputs and cards use Sand/Hairline; the active drawer-nav item and focused inputs use Bronze as the one "accented" border.

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

The same container and the same two-tier rhythm carry the other pages. **Nationwide Shipping** is a single-column content page: a 24px-radius hero panel (gold), then sections 56px apart (40px under 640px), each a heading with a one-line muted subhead above its cards. **Catering** is built like a location page instead: the same rounded banner (a five-photo collage, three on phones), a sidebar with the back link, the name "Catering", a one-line description and the category list (a sticky pill bar that fades in on phones), and menu sections of the menu's own product cards; the catering notes ("per box · 10-box minimum") take their own line under the price, and the add-ons are a plain price list in a white card. Only its newsletter sign-up keeps the content-page style. Each cart (Pickup, Delivery, Shipping) checks out on its own page in the checkout layout (form cards left, order summary right), with the checkout header in place of the site nav.

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

Nothing in the system is sharp-cornered. Radius scales by role, not by size alone: `999px` (pill) for every button, quantity dropdown, chip, and badge, and for the location picker's ZIP search field; `14px` for every text field (contact, address, notes, card details, tip, date and time); `8px` for small controls like the search field and an active drawer-nav row; `12px` for the dominant card radius (shop cards, feature card); `14px` for compact selectable rows (radio/option/flavor rows); `16px` for standalone photo/hero containers and the pickup/delivery card; `24px` for large panels and modals.

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
- **State:** active swaps to Golden Yolk fill / Espresso-on-Gold text and steps up to bold (700). A `.segmented` wrapper (the tip picker, the cart drawer's Pickup | Delivery | Shipping tabs with a count on each) adds a Track Gray or Cool Linen track behind transparent chips.

### Cards / Containers
- **Corner Style:** `12px` (shop cards, feature card) or `16px` (photo/hero and the pickup-delivery card).
- **Background:** Pure White on a Eggshell Cream page — the white-on-cream contrast is the only way cards separate from the page; there's no border-heavy treatment.
- **Shadow Strategy:** the Card shadow — see Elevation & Depth.
- **Border:** 1px Hairline Gray, present but nearly invisible; it reinforces the shadow rather than replacing it.
- **Shop card as one interactive unit:** in the source Figma component, the Quick Add button sits inside a single card-wide `Link`, and the component's "hover" variant is defined at the card level — hovering it is what changes the button's fill, not a hover rule on the button alone. Implemented as: the whole card is `cursor: pointer` and clickable (same action as the button — every product opens its own modal first, never an instant add; see PRODUCT.md), `.shop-card:hover .add-btn`/`:focus-within` drives the Warm Ember fill, and a click listener on the card guards against double-firing when the click actually lands on the button (`.add-btn` keeps its own listener for keyboard/focus users; the card's listener no-ops when the event target is inside it).

### Inputs / Fields
- **Style:** `14px` radius (the same for the dropdowns in a form: State, Country, a catering flavor; only the quantity dropdowns are pills), 1px Control Border (`#968B76`, 3.4:1 on white, so the field's edge is findable), Pure White fill, generous `14px 22px` padding. Text is 16px, never smaller: iOS Safari zooms the page when a focused field is under 16px. The checkout's store and pickup-time buttons share this border and the 15px Control text.
- **Errors:** the message sits under the field, is linked to it with `aria-describedby`, and is announced as an alert; a submit with several problems also announces how many.
- **Focus:** a two-ring halo — Eggshell Cream ring, then Deep Ink ring — so focus reads against any background, including gold buttons and active chips where a same-hue outline would vanish.

### Selectable rows
- **Single choice** (`.radio-choice`: one flavor, payment method, pickup time, catering protein, bagel preset, pickup location): Cool Linen row, `12px` radius, name over a muted note, a 24px circular indicator on the right. Selected fills the whole row Golden Yolk and the indicator turns solid Deep Ink with a white dot. Native radios sit inside the label so arrow keys and focus work; the focus halo wraps the row.
- **Multi choice** (`.addon-row`, checkbox role): same row with a 24px square box. Chosen = Golden Yolk fill and a filled Deep Ink box with a check, the same in every modal (wrap and bowl add-ons, the bagel's options, the catering boxes' sides). A side with its own choice (the 2-Pack's or the egg salad's flavor) is one continuous gold card, the chosen row and its white select together. The catering boxes' flavors are not these rows but the multi-pick variant of the photo choice rows below.
- **Saved order block and store cards** (location picker): the saved order is a white 16px-radius card (Nunito title, bold store, muted address, semibold day and time, a dark pill and an underlined text link). Store results are white cards with the name and distance on one line, the address, a one-line status in plain text and a text action with a › (never a badge or an outlined pill); only the closest card carries a dark button, and no gold appears on any of them.
- **Checkout field labels:** on the three checkout pages (inside `.checkout-card` and `.summary-panel`) `.field-label` is a 14px / 600 sentence-case label in Cocoa (`--deg-ink-heading`), not tracked caps. Other forms still use the older uppercase label (see Known deviations). The tip picker is a radio group (`aria-checked` follows the active chip).
- **Cart line** (`.drawer-line`): a 56px photo, then the name and price on one row, the muted choices line, a quantity row (a muted "Qty" and a compact 36px pill dropdown from 1 to 100, or "10 boxes" for a box meal), and below it three plain-word actions (Edit, Duplicate, Remove: 13px semibold body text, 44px tall, underline on hover, no icons, gold or red). A duplicated line fades in from Warm Sand for 1.6 seconds (not under reduced motion).
- **Confirmation recap lines** (`.summary-line`, `.summary-line-sub`): each line is the name and quantity at the left over a muted 12.5px line of what was chosen (what was left out, toast, add-ons: the same text as the bag and checkout), and the amount at the right; fee, tax and tip lines have no second line. The delivery card carries the drop-off choice followed by the customer's own note.
- **Shipping checkout cards:** Contact info, Shipping address (a "Ship to someone else" checkbox at its top, the site's checkbox (a 24px box that fills Deep Ink with a white check, on a 44px row), that reveals a Recipient's name field), Choose your holiday week (a muted note, then `.radio-choice` rows: the holiday over "Oct 28 – Oct 30 · order by Oct 27"; a closed window is dimmed to 50% and cannot be picked; a missing choice shows a role=alert error under the rows and focuses the first open one), and Payment method. The summary has Subtotal, "Shipping and handling" (the line "Enter your address to view shipping options." until a ZIP is entered, then the amount), the same five-chip tip picker as the other checkouts (starting on No tip) and Total.
- **Checkout title** (`.checkout-title`): above the form and the summary, an h1 "Secure Checkout" (Nunito 800, 32px; 28px and centered on phones), and on Shipping and Delivery a 15px muted line under it naming the path. The back-to-cart button lives in the top bar, not here.
- **The "where" modal** (Pickup and Delivery, one modal): two panes on desktop (choices on the left, a street map on the right, 1120px wide, 32px corners), a full-screen sheet on phones (the map in the top third, the choices on a cream panel with 24px top corners over its lower edge). On the map: a white pill at the top left ("Deliver to Work" or "Pick up at McKinney, TX", once known), a white round close button at the top right, and stacked white 44px locate, zoom-in and zoom-out buttons at the bottom right. The street tiles are warmed toward cream; store pins are Deep Ink teardrops with a cream egg and gold yolk (the chosen store's pin grows slightly but keeps its colour and icon; a "Closed" tag shows outside 10 AM – 8 PM), and the delivery pin is a gold teardrop with a Deep Ink truck. The panel starts with the Pickup / Delivery segmented toggle (gold on the chosen side, an icon with each word). Delivery: an "Address" field with a clear button, a quiet "Searching…" line while suggestions load (the public geocoder can take several seconds, and a request is never cancelled by the next keystroke), and a suggestion list under it (white, 14px radius, a round pin icon, the street in bold over the city and ZIP), then the answer, centered in a fixed-height block so nothing jumps: a delivery-truck icon (gold when we can deliver, muted otherwise), "You're in luck, we can deliver to" or "Sorry, we can't deliver to" in Nunito 800, the address in 17px semibold, one muted line, and an underlined "Pickup instead". Pickup: a "City, state or ZIP" field, a one-line note ("Showing stores near Dallas, Texas."), a list titled "Our stores" or "Nearby" of selectable rows (the radio-choice row: store, address, then distance and "Open until 8:00 PM"), and the one dark "Pick up here" button, sticky at the panel's foot and shown only once a store is chosen. There is no check button anywhere. At most one dark button is on screen. The saved order (flat on the panel with a hairline under it, no card, only while that tab's session is valid) uses an outline pill so it never adds a second dark button. The map is a companion: everything on it can be done with the fields, the list and the buttons. Opened from a checkout it is about changing that order and keeps the toggle: on the checkout's own path it is store-only (pickup: the current store starts chosen and marked "Your store", the saved-order card is hidden, and the one dark button reads "Update pickup location" and waits for a different store; the day and time stay); on the other path a muted line under the toggle says "Your order moves to delivery when you finish here." and the order moves when the new path's steps are done. Both tabs are set up when the modal opens, whichever tab it opens on, so flipping between them from a checkout never finds one empty. From a checkout nothing says "menu": the saved-order button reads "Continue to checkout", the day and time button "Continue to checkout" ("Update order" when only the time is being changed), and the saved order of the checkout's own path is not offered again. The details modal is the Pickup details modal: sentence-case labels, 14px-radius fields, a Home / Work / Other chip row (gold when chosen), the two drop-off choices as selectable rows, a notes box with a character count, and one dark "Continue" pill. The delivery checkout reuses the pickup checkout's cards: a Delivery details card (the address with its drop-off line, and the delivery time, each a Control Border button that reopens its modal), Contact info, Payment method, and a summary with Subtotal, Delivery fee, Tax, a courier tip picker (the same four chips; "All of your tip goes to your courier") and Total. Below the delivery minimum an error-coloured line says how much to add and the Place order buttons are disabled; the cart drawer says the same and holds the checkout button.
- **Checkout "where" card** (`.where-card`, first card on the pickup and delivery checkouts, mobile first): a 240px street map across the top of the card (280px from 641px), the Pickup / Delivery segmented toggle laid over its top centre (gold on the current side, a white track with a Control Border outline, no shadow: a shadowed pill inside the card reads as a card inside a card), the pin centred horizontally and vertically in the part of the map the toggle leaves clear (the store's dark pin, or the delivery address's gold truck pin), then the body: an h2 ("Pickup location" or "Delivery info") with an underlined "Change" text link at its right, the place in bold over the address (delivery adds the drop-off line), and the time as a Control Border row. Delivery ends with "Estimated arrival": a centred block under a hairline, "35–50" at 56px Nunito 800 over "minutes until arrival (soonest available)", or for a scheduled order the window ("10:00–10:30", with "AM · Tomorrow"). The map here is only a picture (it does not pan or zoom, so it never catches a scroll). The toggle's other side opens the "where" modal with the order carried over.
- **Locations finder and store pages:** on the finder (`#location-picker`) a real store's card is one link: the stretched "View store" link covers the card (the lead card keeps its one dark "View store" button on top), a hover lifts the card's shadow, and keyboard focus rings the whole card; there are no order buttons on the finder. Placeholder cities carry the plain status "Coming soon" and no link. A store's own page (`#store/<id>`) is the menu page: a small underlined "← All locations" link above the store name, the store's name and address, and the dark "Store info" pill (shown on phones too), then the menu as before. "Store info" opens a white 24px-radius card (a bottom sheet on phones): a 220px still street map with the store's dark pin centred and a round close button at the top left, then the store name in Nunito, "Deviled Egg Co. · Pickup and delivery", and hairline-divided rows with a line icon each: the address with a copy button, the hours (today's status, a plus that opens "Every day, 10:00 AM – 8:00 PM"), "Delivery" with the fee and minimum and a chevron that opens the "where" modal on its Delivery tab, and "Get directions" (a link to the address in Maps). Ratings, phone and photos are left out until there is real data.
- **Catering in the order flow:** the order page's "Catering" tile is the same wide tile as the others (the Power Pair photo, "Catering", "7 options · from $10.00"), and its rows are the same rows (photo, name, price and a note: "per box · 10-box minimum", "Serves 10", "Serves 10–12"). When the bag has a catering item, a muted one-line note (`.field-note`) sits under the time row at both checkouts and in the cart drawer, saying the notice needed and, for delivery, the catering fee; the day and time step adds the same sentence to its hours line and drops ASAP.
- **Tip picker** (`.tip-chip`): five chips under "Add a tip for the team" (and the delivery checkout's courier tip), each a 12px muted label over the dollars it comes to in 14px bold tabular figures: 15%, 18% and 20% of the subtotal, No tip ($0.00), and Custom, which shows the custom amount and opens a $ field below. The three percentages share the first row and No tip and Custom the second, wider; all five sit in one row only when the picker's own box is 440px or wider (a one-column checkout on a tablet; the desktop summary column is too narrow). 18% is chosen when the page opens. 14px corners (the compact tile radius, not a pill, since a pill this tall and narrow reads as an oval), cream-cool at rest and solid gold when chosen.
- **Place order** (pickup and delivery checkouts): the dark full-width Place order pill sits at the foot of the Order total card at every width, under the total and the ready or arrival line. There is no sticky total bar on phones.
- **Order tile and row** (`.order-tile`, `.order-row`): on the pickup order page, a tile is a white card with a photo panel, a Nunito 800 name, a muted "N options · from $X" line and a chevron (a 3-column grid with the photo on top from 900px); a group's screen is a photo grid, two across even on a phone (three from 900px, 12px gaps on a phone, 16px from 900px): each product is a white card with a 4:3 photo, a Nunito 800 name (16px, two lines at most), price and calories, a two-line description and a 36px dark Add circle on the photo's lower-right corner with a 3px white ring. There is one card style (the earlier list, tile and menu-list versions, and their temporary switcher, were dropped). The screen's title row sits 24px under the top bar and 16px above the grid; the tiles screen uses the same 24px. No gold on either: the dark circle is the one action.
- **Order indicator** (`.nav-where`, in the top nav, left of the cart; it replaced the order page's banner): the map's own pin at 26×32px (the Deep Ink teardrop with a cream egg and gold yolk for pickup and before a choice, the gold teardrop with a Deep Ink truck for delivery), then two lines: a 12px muted "Pickup from" or "Deliver to" over a 14px bold store name or address nickname, cut off with an ellipsis at 220px. Before anything is chosen it reads "Pickup or delivery?" over "Choose a store". It is a plain text button (the name underlines on hover), no fill, no gold, no pill. Tapping it opens the "where" modal. With a path already chosen, the modal's saved-order card ("Your pickup" or "Your delivery") offers an outline "Continue to menu" pill, which closes the modal and goes to the order page from any page, and a small "Change time" link; the modal still has at most one dark button. It changes with where the customer is. **Hidden** (the cart then keeps the right edge) on the checkout bar, the Nationwide Shipping page, the location finder, the order confirmation, and anywhere while the bag holds only shipping items and no store or address is chosen. **First line changes** (bold, in Deep Ink): "Catering pickup from" / "Catering delivery to" on the Catering page; "Your pickup store" on another store's page than the chosen one; "$5.01 to the minimum" while a delivery bag is under the minimum. **Alert** (the first line in Error Red, "Time has passed", with the store or address under it): the chosen day and time have gone by; tapping it starts the where modal again on that path.
- **Allocation** (`.flavor-row`, the pack pickers): a row with a − / + stepper, for splitting a fixed number of pieces across flavors. It is the **Distilled** layout, the default: a Cool Linen row (Linen Border `#E9E1D8` on hover) with a 56px still of the flavor's clip at the left, the flavor name over one line of calories and protein (ellipsis, never wrapped), and the stepper at the right. Tapping the still opens that flavor's clip (2:3, muted, looping) and live description inline under the row, one open at a time. A flavor in the mix turns the row white with a 2px Deep Ink stroke and a soft drop shadow, and shows its "Customize" link (see Customize). The stepper's − and + are 36px outlined circles with a 44px tap area; when the pack is full only the steppers disable, the rows are never dimmed. Wherever the live catering page has a photo for a flavor, that photo is the still instead of a pack clip: the catering bundles' sandwich and deviled egg flavors, the Sandwich/Wrap cards and the Eggceptional Wraps rows (assets/catering/flavors/); expanded, the photo shows square, beside the description and a "Hide details" link. A flavor with no photo or clip yet (the catering bundles' other flavors, and the sandwiches' Vegetarian) shows a Cool Linen placeholder still with an egg outline, still with the expand badge; expanded, its panel keeps the clip's 2:3 slot with the same outline and "Photo coming soon", beside the flavor's description and a "Hide details" link. The still's corner carries a 24px Deep Ink square with a white expand icon (collapse once open), flush in the corner with only its top-left corner rounded (2px). **Pair** (two tiles across, refined 2026-10-16: see the next paragraph) and **Grow** (140px clips that expand in place from a "Details" link) are temporary comparison layouts behind a pill switcher above the list (Distilled | Pair | Grow), offered only in the 6 Pack Deviled Egg's modal; every other flavor picker is Distilled. The switcher and the layouts not chosen are removed once the owner decides. Pair's selected tile has no number badge; its outline marks it.
- **Pair tile (mobile first):** every tile is the same height whatever it holds (306px at 375px wide, 278px at 320px), so the grid reads as even rows and the controls line up across a row. Four fixed regions: the clip (a square, tap to play or pause, with the "i" at its top left); the **name**, two lines reserved (a longer name stops at two with an ellipsis; today only "Buffalo Chicken Ranch" at 320px does, and the full name is in the sheet and the buttons' labels); **one line** (12px) that is calories and protein ("85 cal · 5g protein") until ingredients are removed, then **what was removed** in Deep Ink semibold ("No bacon, tomato +1": the first two, then how many more; the full list is in its title and the sheet); and the **stepper**, a 44px row of three fixed columns, so − sits at the tile's left edge and + at its right on every tile, and the name never shares their row. A chosen tile has the 2px Deep Ink edge. A full pack does not dim any tile; only the + buttons dim. There is no Customize link or ingredient list on the tile: a **chip on the clip** (bottom left, Deep Ink pill, "Customize" on a chosen flavor, "Customized" once something is removed) opens the flavor sheet scrolled to **Remove ingredients**, the shared list, with a full-width "Done" below it; the "i" opens the same sheet at the top. For a flavor not in the pack the sheet says "Add this flavor to your pack to customize it."
- **Photo choice rows** (the catering boxes' flavors, which use a 24px square check box instead of the radio and allow two): the Distilled row with a pick-one radio where the stepper is. In the boxes' flavor list a full pick (two) never dims a row: a third tick bounces back and the hint under the title says to untick one first; bowls without a photo show the egg placeholder. Cool Linen at rest; chosen = white, 2px Deep Ink stroke, the drop shadow, a solid Deep Ink radio with a white dot; the whole label is the native radio, the still and the Customize link sit outside it. Wraps: a static 56px still (the matching deviled egg flavor's photo, since the wraps have none), the name and the ingredient line (two lines, in full once chosen). Bagel: the 56px still with the expand badge (it plays the clip in the row as in the packs), the name and a one-line description. The choices around them are the standard rows: Toast and Bagel Type and the wraps' "Wrap or meal" are `.radio-choice` rows (gold when chosen), the bagel's Options and the wraps' Add-Ons are `.addon-row` checkbox rows (Add-Ons carry a price, Options do not).
- **Individual bagels, like the bowls and sandwiches:** the Bagels tile and menu section are grids of 19 bagel cards (the clip's still, the name as "BLTE Bagel", price, "350 Cal."). A bagel's modal plays its clip muted and looped in the photo's place (a tap pauses it; under reduced motion it waits; the phone crops it to a square on the bagel), then the name, price, a line made from what is on it, the Customize link ("Remove ingredients"), Toast and Bagel Type (radio rows), Options (check rows), Qty. A sandwich's modal is the same: "BLTE Eggceptional Wrap", its ingredient line and Customize, "Wrap or meal", Add-Ons. Neither has a flavor picker inside.
- **Home featured sections** (`.home-feat`): below the hero, each with a 28px Nunito 800 title, a muted line and an underlined "See all" link at the right. A row is four of the menu's featured cards (a horizontal swipe row on a phone); a spotlight is a Cool Linen panel with one flavor still, its name in 32px Nunito 800, its description and a dark pill button. They are listed in HOME_FEATURED in app.js.
- **"View full calendar"** (day and time step): an underlined text link under the day tiles opens a white month card (44px day cells, Deep Ink for the chosen day, a ring on today, dimmed days that have no times, previous and next month buttons) up to 60 days ahead; choosing a day closes it and adds that day as the last tile.
- **Pick-first option** (the 6 Pack Deviled Egg's "How many flavors?", `#option-block`): two `.radio-choice` rows (3 flavors $12.99, 6 flavors $14.99) with neither chosen when the modal opens. Until one is chosen the "Choose your flavors" section below is dimmed to 45%, inert and out of the tab order, its hint says to choose how many flavors above, the footer counter is hidden and the dark button reads "Choose how many flavors to continue". Choosing one lifts all of that, updates the price, photo and limits, and scrolls the modal so the flavors section is at the top (72px under the edge; instant when motion is reduced). An item being edited opens with its option chosen.

### Customize (remove ingredients)
- **One component, everywhere an item can lose an ingredient:** the pack pickers (Distilled, Pair, Grow, the egg salads' single flavor), the wraps, the Full Size Bagel and the Eggceptional Bowls. In code it is `customizeHTML` / `mountCustomize` (the link, the summary and the list) over `exclusionListHTML` (the list alone, which Pair and Grow draw into their own persistent nodes).
- **The link:** a `Customize` text button (underlined, 14px/600, 44px tall) with `aria-expanded` and an accessible name that carries the item ("Customize BLTE"), then a summary beside it ("No bacon, tomato", 13px) that stays visible whether the list is open or closed and wraps onto as many lines as it needs: the section grows in height, never in width, so a long list can't widen the card or push it past the screen. The list is closed until the link is tapped.
- **The list:** a "Remove ingredients" label (12.5px caps, muted) over one 48px row per ingredient, hairline dividers, no nested cards. Each row is a toggle button: a 24px line glyph at the left (picked from the ingredient's own words), the name, and a circle-slash at the right that is Warm Taupe until the ingredient is left out, then Signal Red (a darker red on a gold row) with a faint red fill, and the name struck through. Pair's half-width tiles use the same rows at 20px glyphs, 14px names and tighter gaps, so a name may take two lines there.
- **Where it lives:** inside the chosen row's white card (packs, wraps, bagel), under the radio row (egg salads), or in its own "Ingredients" section (bowls). It never replaces the "NO:" chips, which are gone.

### Nationwide Shipping page
- **The same skeleton as Catering and the store pages:** a 3-panel banner (the sampler, the "We ship nationwide" map, the 24-count collage; the first two on a phone are enough), then `.menu-layout` with a `.store-sidebar` (the Nunito name, one line of description, a "Menu" label with "You choose a holiday window at checkout", and the `.drawer-nav` of Shipping Kits, How It Ships and Holiday Windows) beside `.menu-section`s; on phones the `.drawer-nav-mobile` pill bar appears once the kits are scrolled past. There is no gold hero, no tag pills and no hero button.
- **Kits are shop cards:** the three kits are drawn by `renderShopGrid` as the same `.shop-card` as the menu (name, price and a short note, a two-line description, a 36px dark add circle on the photo, the whole card one click target), 162px tall on a phone, and each opens its in-app modal.
- **How It Ships** and **Holiday Windows** are white `.cater-addons-list` cards: three numbered steps (a 28px Cool Linen disc with a Deep Ink digit, bold title, muted line, a "Shipping & Returns" text link), and one row per holiday window (a 56px still, the name over the dates, "Order by Oct 27" at the right). The holiday rows are drawn from the same list the checkout offers, so the two cannot disagree, and they are not links.
- **Shipping page versions (temporary comparison, 2026-10-15):** four versions of the page sit behind a floating dark pill bar at the bottom of the screen (Current, Distilled, Polished, Optimized; `#shipping/distilled` and so on open one directly), as the Pair and Grow pickers do. The bar is for review only; the other versions and the bar are deleted once the owner picks (`ship-variants.css`, the `data-ship-variant` blocks in index.html, `setShipVersion` and `renderShipKits` in app.js). The three new versions share one **kit card** (`.ship-kit`): the photo, the name in Nunito 700 20px/28px, the price (16px, bold) beside a Cool Linen chip saying what the kit is ("Try them all", "2 flavors"), the full description (never cut off mid-sentence), and one plain action, "Choose flavors" or "View kit" for the fixed-flavor sampler. The whole card opens the kit's modal and the button carries the kit's name for screen readers ("Choose flavors for 24 Count Kit"). **Distilled:** the one job is choosing a kit. No banner and no sidebar: a centered 32px title with one line, three large vertical kit cards (4:3 photo, a dark pill button each), then one centered block, "Choose a holiday window at checkout", with the three windows as Cool Linen tiles (name, dates, "Order by"), and "How shipping works" folded into a disclosure with the Shipping & Returns link. **Polished:** the current structure and copy, finished: the kit cards laid out photo-right with a text action and an arrow that nudges on hover, the photo easing in on hover; "How It Ships" as three steps across in one card under 48px line icons (calendar, snowflake, box; stacked under 900px); the windows as white rows with the art, the dates it arrives, the last day to order over the days left (the first open window carries a 2px ink ring and a "Next window" tag, a closed one is quiet); a sidebar that follows the section on screen; one spacing scale (48px column gap, 56px between sections, the first section level with the sidebar title); a visible focus ring on every card. **Optimized:** the same finished page, built to load fast and hold still: one banner file in place of three, WebP photos cut to the size they show (kit photos 240/480px, window art 128px) with their size set up front, each photo's average color behind it so it fades in instead of popping, the banner and first card photo loaded at once and the rest lazy, "How It Ships" and "Holiday Windows" skipped by the browser until they near the screen (`content-visibility`), each card and row its own layout island drawn with a border and no shadow, and a flatter DOM (step numbers drawn by a counter, window rows with no wrapper elements).
- **Gold** is spent only on the primary actions; kit-modal bullets are plain dots in Cocoa.

### Cart drawer
- A right-hand drawer (full screen on phones) holding three carts. With more than one cart in use it shows a full-width segmented tab bar (Pickup | Delivery | Shipping, each with an item count; a catering line counts as one, not by its boxes); with one it shows none. Each tab has its own one-line context under the title, its own items, its own subtotal, with a muted line saying what checkout adds ("Tax and tip are added at checkout.", plus the delivery fee or shipping on those tabs), so the bag never shows a "Total" that differs from the checkout's and its own "Go to checkout".
- Lines step with a −/+ stepper; a catering box meal instead shows "Edit" (reopens its modal filled in) and a trash button. Removing any line shows a Deep Ink "Removed … Undo" bar for 8 seconds.

### Modals
- **Price under the name, always:** in every product modal (packs, egg salads, platters, kits, catering bundles and box meals, bowls, wraps, bagel, quick view) the title block is the name (Nunito 28px) with the price directly under it (Plus Jakarta Sans 700, 20px, muted, 4px below), left-aligned, and the description follows. The price never sits beside the name, whatever the flavor layout.
- Product modals are full-screen on phones and a 1000px, `32px`-radius dialog on desktop: a photo panel and a content column, a sticky footer with the Dark "Add to order" button that states what is still missing ("Choose 10 sandwiches to continue") until the order is valid. In the flavor-picker modals (packs, egg salads' sizes, kits, catering bundles) the footer also carries the flavor counter above that button: a 13px semibold "2 of 6 eggs · 4 to go" over a segmented bar, one 6px Golden Yolk segment per flavor the pack allows, filling as the mix is built (hidden for single-flavor items and fixed kits). The section above keeps only the instruction line. The flavor rows themselves are the Distilled layout described under Allocation (the earlier "Current" list with its "FLAVOR n" strip is gone). The pack modal's header is compact: the description is clamped to two lines; "Qty" sits beside the action; the note to the kitchen is the plain "Add a note for the kitchen" field. Catering photos are full-frame rectangles like every other product's: the bundles use the standard 420px photo panel, and the box meal modal uses a 300px Cool Linen panel with the photo across its top and a live "Your order" summary below it (hidden on phones). On the Catering page each card stacks a 4:3 photo above its text.

### Stacked sheet (Pair's flavor info)
- **What it is:** a second card laid over the open product modal, the way a phone stacks one sheet on another. In Pair each tile's clip carries an "i": a 28px Deep Ink circle with a white glyph, 10px in from the top-left corner (where the number badge used to sit), with a 44px tap area; it opens the sheet and leaves the tile's own tap (play or pause) alone.
- **The sheet:** up to 440px wide, centered, anchored to the bottom, 16px top corners, Eggshell Cream, the Modal shadow, tall enough to sit 20px under the top of the screen (40px on desktop). It rises from the bottom in 300ms and drops away in 220ms. The whole 2:3 clip runs edge to edge from the sheet's top (no gap; on a short screen it is held to 62% of the height and crops a little top and bottom), a tap plays or pauses it, and it autoplays muted unless motion is reduced. Under it: the flavor name (Plus Jakarta Sans 20px/700), the calorie line, and the flavor's description. A white 44px circle with the close ×, with the shadow, floats over the clip at the top left.
- **Also used by the Sampler's flavor grid:** the same sheet opens from a tile and carries a **Previous / Next row** under the description (Previous and Next as 44px text buttons with arrows, "11 of 16" between, the end buttons dimmed), and the left and right arrow keys step too. Stepping replaces the clip and the text in place, the sheet stays open, and closing returns focus to the tile of the flavor last shown. A flavor with no clip yet shows the egg placeholder in the clip's slot, "Video coming soon", and "The video and description are coming soon." No calorie line is shown for the Sampler.
- **Sampler flavor grid** (`.sampler-grid`, in the Mini Deviled Egg Salad Sampler's modal, replacing the old text tags): two tiles across at every width. Each tile is the clip's still cropped to 4:5 with a 36px Deep Ink play circle at its bottom right, and the flavor name under it in 14px/20px semibold. The section reads "Flavors" over "18 deviled eggs in 16 flavors. Tap one to watch it." Nothing plays in the grid and no clip loads until the sheet opens it (about 51 MB of clips in all); a flavor with no clip (Gyro, BBQ Chicken) shows the egg placeholder centered on Cool Linen. A tile is a button ("Watch the Smoked Salmon video"; "Details for Gyro"), with a 2px Deep Ink focus ring around the picture.
- **The modal underneath:** while the sheet is open it is pushed back (scaled to 94%, 8px down, still anchored to the top), takes the sheet's 16px corners (17px, so they read as 16 once scaled), hides its own close button and goes inert, leaving a 12px rounded strip showing above the sheet. The backdrop is Deep Ink at 60%.
- **Dismissal and focus:** the close button, the backdrop or Escape close only the sheet (the modal under it stays open); focus moves to the sheet's close button and returns to the "i" that opened it. Under reduced motion nothing slides or scales.

### Navigation

**Top nav** — measured against the Figma frame (node `29:18791`), not approximated:

- **Bar:** Pure White background, hairline (`1px #F3F3F3`) bottom border, `8px` vertical padding. Content max-width `1360px`, centered, `12px` horizontal padding on the row itself.
- **Logo:** the wordmark image at `37px` tall, width auto (native ratio ~5:1, renders ~185px wide). This is a deliberate, measured size — Figma's own Link node is `190×37.289px`, and the source logo asset is natively `190×38px`, so the two agree almost exactly. `16px` margin to its right before the link list.
- **Links:** bold (700) `13px` Plus Jakarta Sans, uppercase, Warm Black (`#140F0A`), `10px` padding on each link, centered as a group in the remaining space. No letter-spacing and no gap beyond each link's own padding — Figma's link list has neither; the uppercase weight and padding alone carry the rhythm. `16px` margin between the link list and the cart button.
- **Cart button:** `40px` Deep Ink (`#130D00`) circle, centered `18px` icon. The count badge is `18px` (grows via `min-width` for 2+ digits), Signal Red fill, white bold `11px` text, positioned `4px` above and `6px` right of the button's own edges (i.e. it overhangs the circle on the top-right corner, not flush-inset).
- **A found-and-fixed rhythm bug:** the nav previously stacked a container-level `gap: 16px` *on top of* the logo's own `margin-right: 16px` and the cart button's own `margin-left: 16px`, doubling both side gaps to 32px. The container has no gap of its own — spacing comes entirely from each element's individual margin, matching Figma's own per-element (not per-container) spacing model.
- **Menu button:** the hand-drawn three-line icon from `assets/hamburger-menu.svg` (drawn at 40px, its lines about 26px wide, in Deep Ink), sitting on the bar with no circle behind it (a Cool Linen circle only on hover); open, it becomes the plain X.
- **Compact bar (the hamburger layout, and every phone):** Chipotle's arrangement, in one flex row: the logo, the menu button, the order indicator pushed right against the cart (the free space sits between the menu button and the indicator), then the cart. Up to 640px the logo is the egg submark (`assets/logo-submark.svg`, 40px tall, the gold square with the egg) instead of the wordmark (two logo images, one shown at a time); the checkout bar, which has no links, indicator or cart, keeps the full wordmark at 34px on phones too. The width check that switches to this layout reserves 236px for the indicator.
- **Bar height (a rule, not a side effect):** the top bar is `69px` tall on every page and at every width, and it must stay that way: other things are placed against it (the mobile category bar sticks at `top: 69px`, the full-bleed banners start flush under it). Don't let a page add rows to it, shrink it, or swap in a different bar. Measured at 1024px: Home, location picker, products page, order page (and its group screens), Shipping, Catering and the checkouts are all 69px. On the checkouts it is the same 69px bar with the way out taken away: no menu button, no links, no cart, just a round back-to-cart chevron on the left and the logo centered (`body.is-checkout`).
- **Links (current):** four items: **Order ▾** (Pickup & Delivery, Nationwide Shipping, Catering), **Locations** (a plain link to the location picker page, to become the store locator), **Gifting ▾** (Gift Cards, Corporate Gifting) and **About ▾** (About, Franchise, Contact). The three ▾ items are disclosure buttons that look like the links beside them plus a small hand-drawn chevron (`assets/icon-chevron.svg`, 16px on the wide bar and 20px in the compact menu, flipped when open): a click or Enter opens a white 16px-radius panel under the item (sentence-case 15px semibold rows, a Cool Linen hover; the last group's panel aligns to the right edge), one panel at a time, closing on Esc, an outside click or focus leaving. They never open on hover. "Pickup & Delivery" opens the "where" modal on the tab it was last on. The page being viewed carries a 3px Golden Yolk underline (`aria-current`), and a group is current when one of its pages is open. Gift Cards, Corporate Gifting, About, Franchise and Contact have no pages yet.
- **Mobile (≤640px):** the groups become expandable rows in the drawer (the chevron flips, the items sit indented under the row in 17px semibold; the section with the current page, or Order, is open when the drawer opens). The link list is a left side drawer (80% of the viewport, max 320px) behind a dimmed backdrop with the page inert, opened from a menu button at the left of the header. Its links are the one sanctioned exception to the Two-Voice Rule: Nunito 800 at 20px/28px in sentence case, 24px drawer padding. The owner chose to leave them as they are; this exception covers those links only, never any other navigation or UI text. This replaced the earlier wrap-to-its-own-row layout.

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
Catering and Nationwide Shipping were rebuilt on the location-page skeleton (banner, sidebar, sections of menu cards); see "Nationwide Shipping page" under Components. What is left:
- The newsletter panel at the foot of both pages (`.page-signup`) goes full-bleed with square corners on phones (negative side margins, `border-radius: 0`), which the No-Sharp-Corner rule does not allow. It is shared by both pages and not yet fixed.
- The Distilled | Pair | Grow switcher shows in the 6 Pack modal only, until the owner picks a flavor layout.
- Nunito on non-header text has been moved to Plus Jakarta Sans everywhere except the mobile nav drawer's links (the sanctioned exception); none remain.
