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

Typography carries the same discipline in two voices: Nunito at extrabold/bold weight is reserved for headings and prices only, never body copy; Plus Jakarta Sans handles everything else, from paragraph text down to the all-caps 13px navigation labels. The system was audited from the live deviledeggco.com site and cross-checked against the DECo_Order_260920 Figma file — it is a real, evidenced brand system, not an invented one.

**Key Characteristics:**
- One saturated accent (`#F7BA17`), rare and rule-bound to primary actions
- Warm cream surfaces (`#FFF7EA`) as the dominant background, never stark white
- Near-universal pill (`999px`) or soft (`8–16px`) corner radius; nothing sharp
- Two-voice type system: Nunito extrabold/bold for headings & prices, Plus Jakarta Sans for everything else
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
- **Track Gray** (`#E8E8E8`): the pickup/delivery segmented-toggle track.
- **Signal Red** (`#DC2626`): the cart-count badge. Deliberately darkened from the Figma source's `#F04438` — white text on the original only measured 3.8:1 contrast against the 4.5:1 AA floor for its 11px bold size.
- **Sand Border** (`#D9D1BF`) / **Linen Border** (`#E9E1D8`) / **Hairline Gray** (`#F3F3F3`) / **Bronze Border** (`#88754F`): border hairlines, lightest to most saturated — inputs and cards use Sand/Hairline; the active drawer-nav item and focused inputs use Bronze as the one "accented" border.

### Named Rules
**The One Accent Rule.** Golden Yolk is the only saturated color anywhere in the system. It appears on primary buttons, active toggle/chip states, and nowhere else — its rarity is what makes it read as intentional rather than decorative.

## Typography

**Display Font:** Nunito (with sans-serif fallback)
**Body Font:** Plus Jakarta Sans (with sans-serif fallback)

**Character:** A confident, rounded extrabold display face paired with a clean, highly legible grotesque body face — the pairing reads as approachable craft-food rather than corporate delivery-app.

### Hierarchy
- **Display** (800, 28px/32px): page-level and card-level hero moments — store name, feature-card title ("Build Your Own Dozen"), confirmation heading.
- **Headline** (700, 20px/28px): section headings — menu category titles ("Deviled Eggs"), checkout card headings ("Pickup details"), order-summary heading. Bold, not extrabold — this is the one deliberate weight step down from Display.
- **Body** (400, 16px/24px): sidebar drawer-nav items, default paragraph text.
- **Body Small** (400–600, 14px/20px): card prices (semibold), meta text and toggle labels (medium), form copy (regular).
- **Body XS** (400–600, 12px/18px): address lines, sidebar hours, delivery-info copy.
- **Label** (700, 13px, uppercase): the top navigation only — the single place in the system that uses uppercase tracking-free bold caps.

### Named Rules
**The Two-Voice Rule.** Nunito extrabold/bold is reserved for headings and prices — never body copy, never buttons, never labels. Plus Jakarta Sans carries every other voice in the system, including the uppercase nav labels.

## Layout

Centered container, max-width `1280px`, `40px` side padding. The menu view splits into a `276px` sticky left sidebar (store card + category drawer) and a flexible right column holding the hero image, search, pickup/delivery card, feature card, and category sections.

Vertical rhythm is deliberately two-tiered: tight spacing *within* a group (16px between cards in the same category grid, 14px between a section heading and its grid), and generous spacing *between* groups (56px before every new category-section heading, scaled to 40px under 640px). The gap between groups is always larger than any gap inside one — that's what makes categories read as distinct groups rather than one continuous scroll.

Responsive behavior is structural, not cosmetic: at ≤900px the sidebar drops above the content and the category drawer becomes a horizontal wrapping row; the two-column shop-grid collapses to one column. At ≤640px the top nav's link list wraps to its own row below the logo/cart, and multi-column form rows stack.

## Elevation & Depth

Flat by default, with one very restrained ambient shadow system for cards and exactly one colored shadow reserved for the primary CTA. Nothing else in the system casts a colored glow.

### Shadow Vocabulary
- **Card** (`0 3px 9px -1px rgba(17,24,39,.06), 0 1px 2px rgba(17,24,39,.04)`): the default resting shadow for every card — shop cards, feature card, order-mode card.
- **Brand** (`0 10px 12px rgba(247,186,23,.25)`): primary CTAs only — the gold buttons ("Customize →", "Add to order", "Place order").
- **Ambient** (`0 12px 32px rgba(0,0,0,.08)`): larger floating panels — the checkout order-summary panel.
- **Modal** (`0 24px 64px rgba(19,13,0,.32)`): the item-customization modals.
- **Float** (`0 2px 12px rgba(0,0,0,.12)`): small circular controls sitting on top of photo/hero media — the add-to-cart button on a card thumbnail, the hero's "more photos" button.

### Named Rules
**The Earned Glow Rule.** The one colored shadow in the system (`--deg-shadow-brand`) is bound to primary CTAs and nothing else. A card, a chip, a hover state — none of them borrow the gold glow. If it isn't the primary action, its shadow is neutral gray.

## Shapes

Nothing in the system is sharp-cornered. Radius scales by role, not by size alone: `999px` (pill) for every button, input, chip, and badge; `8px` for small controls like the search field and an active drawer-nav row; `12px` for the dominant card radius (shop cards, feature card); `14px` for compact selectable rows (radio/option/flavor rows); `16px` for standalone photo/hero containers and the pickup/delivery card; `24px` for large panels and modals.

### Named Rules
**The No-Sharp-Corner Rule.** Every rectangle in the system carries a radius from the scale above. A `border-radius: 0` anywhere is a bug, not a style.

## Components

Soft and confident: near-universal pill/rounded radius, very low-contrast card shadows, and exactly one bold gold CTA per screen — nothing else fights for attention.

### Buttons
- **Shape:** pill (`999px` radius) for every variant.
- **Primary:** Golden Yolk fill, Espresso-on-Gold text, bold (700) 15px, the brand glow shadow. One per screen — the single loudest element in view.
- **Dark:** Deep Ink fill, warm off-white text (`#FBF3E3`), medium (500) weight — secondary actions like "Store info" and the cart drawer's "Apply" promo button.
- **Outline:** transparent fill, 1.5px Deep Ink border, Deep Ink text, no shadow — tertiary/back actions.
- **Icon buttons** (cart, close, quantity steppers, add-to-cart): circular, no border, centered icon; float above photo media use the Float shadow.
- **Icon button hover (dark fill):** Deep Ink lightens to Warm Ember (`#554523`) on hover, a 150ms background transition. Confirmed on the shop-card Quick Add button; apply the same swap anywhere else a Deep Ink icon button is interactive.

### Chips
- **Style:** Cool Linen fill, Warm Black text, pill radius, no border.
- **State:** active swaps to Golden Yolk fill / Espresso-on-Gold text and steps up to bold (700). A `.segmented` wrapper (Pickup/Delivery, tip picker) adds a Track Gray track behind transparent chips.

### Cards / Containers
- **Corner Style:** `12px` (shop cards, feature card) or `16px` (photo/hero and the pickup-delivery card).
- **Background:** Pure White on a Eggshell Cream page — the white-on-cream contrast is the only way cards separate from the page; there's no border-heavy treatment.
- **Shadow Strategy:** the Card shadow — see Elevation & Depth.
- **Border:** 1px Hairline Gray, present but nearly invisible; it reinforces the shadow rather than replacing it.

### Inputs / Fields
- **Style:** pill radius, 1px Sand Border, Pure White fill, generous `14px 22px` padding.
- **Focus:** a two-ring halo — Eggshell Cream ring, then Deep Ink ring — so focus reads against any background, including gold buttons and active chips where a same-hue outline would vanish.

### Navigation
- **Top nav:** Pure White bar, `8px` vertical padding, hairline bottom border. Links are bold (700) 13px Plus Jakarta Sans, uppercase, Warm Black, `10px` padding each, no letter-spacing and no gap beyond that padding. The cart button is a `40px` Deep Ink circle with an 18px icon and a Signal Red count badge.
- **Sidebar category drawer:** Body-weight (500) 16px items, `14px 12px 14px 16px` padding, Warm Taupe text at rest. The active item gets a `4px` Bronze Border left accent, `8px` radius, Golden Wash fill, and steps its text color to Toasted Umber.
- **Mobile:** the top nav's link list wraps to its own full-width row below the logo and cart button; the sidebar drawer becomes a horizontal wrapping row instead of a vertical list.

## Do's and Don'ts

### Do:
- **Do** keep Golden Yolk to primary CTAs and active-selection states only — one per screen is the target.
- **Do** use Nunito extrabold/bold exclusively for headings and prices; everything else is Plus Jakarta Sans.
- **Do** make the gap between content groups larger than the gap within a group — that's the entire grouping mechanism in this system, not borders or dividers.
- **Do** reuse an existing radius/shadow/spacing token before introducing a new value; the scales above already cover buttons, cards, panels, and photo containers.
- **Do** prefer a project token over a raw Figma literal when a source design's color is unbound to a variable — several near-duplicate grays in the Figma file (`#4b4b4b`, `#5e5e5e`, `#6b6155`) are one-off authoring slips a few percent off Warm Taupe (`#635E57`), which is the bound, repeated token and the real source of truth.

### Don't:
- **Don't** add a second saturated color. The system's entire visual identity depends on gold staying rare.
- **Don't** use a colored shadow anywhere except the primary-CTA brand glow — cards, hover states, and chips all stay on the neutral Card shadow or no shadow at all.
- **Don't** introduce a sharp (`0px`) corner anywhere; every rectangle in this system has a radius.
- **Don't** letter-space the nav labels or add extra gap between them — the uppercase weight and each link's own padding already carry the rhythm.
