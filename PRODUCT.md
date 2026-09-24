# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Everyday pickup/delivery customers ordering lunch or dinner near one of Deviled Egg Co.'s four Texas storefronts (McKinney, Denison, Rockwall, Coppell). They're choosing food for now or soon, not browsing a catalog — the flow needs to get them from "what am I craving" to a placed order quickly, for either pickup or delivery.

## Product Purpose

Let customers browse the Deviled Egg Co. menu and place a real pickup order online: pick items, customize a Build Your Own Dozen, manage a cart, check out, and get a confirmed order with a fulfillment estimate. Customers who want delivery are routed to the third-party delivery platform that fulfills it, rather than checking out on this site.

## Positioning

Freshness and made-to-order customization are the mechanism, not a generic delivery-app menu list. The signature move is Build Your Own Dozen — choose up to 4 flavors from the full lineup — and every screen should sell "made fresh daily, your way" rather than reading like an interchangeable food-delivery clone.

## Operating Context

- Four physical storefronts fulfill pickup orders: McKinney, Denison, Rockwall, and Coppell, TX. Each has a real street address.
- Direction change (confirmed): Deviled Egg Co. only fulfills Pickup in-house. Delivery is handled entirely by third-party delivery platforms (DoorDash, Uber Eats, Grubhub) — the site links out to them rather than fulfilling delivery itself.
- Texas sales tax (8.25%) applies to pickup orders placed on this site.
- Customers already have a mental model from mainstream delivery apps (Uber Eats); the flow intentionally follows that familiar interaction pattern (menu → item customization → cart → checkout → confirmation) rather than inventing a new one, while carrying the Deviled Egg Co. brand identity throughout.

## Capabilities and Constraints

Confirmed and built:
- Menu browsing by category, with a scrollable single-page layout.
- Flavor customization across the whole Deviled Eggs lineup, not just the dozen: every packaged size (2 Pack, 6 Pack – 3 Flavors, 6 Pack – 6 Flavors, 12 Pack, 24 Count Platter) opens the same picker, allocating that size's own total piece count across up to that size's own max-flavor cap, in fixed steps (total ÷ max flavors) — verified per size against the live site rather than assumed from a formula, since the max-flavor cap and step size both vary independently per pack (e.g. the 24 Count Platter caps at 3 flavors with a step of 8, not the naive 4/6). Each flavor also exposes its own real "NO: ingredient" exclusion toggles. The Try Them All Platter is the one exception — it has no picker on the live site (a fixed platter of every flavor) and stays a plain one-click add here too.
- Cart with live subtotal/tax/total and quantity edits.
- Pickup flow: store selection (one of the 4 locations) and pickup time (ASAP or schedule).
- Delivery mode on the menu page: toggling "Delivery" replaces the menu content with a "We deliver through" section linking out to DoorDash, Uber Eats, and Grubhub (each opens in a new tab). This site does not take delivery orders itself.
- Tip selection and order confirmation with a Placed → Preparing → Ready/On the way progress tracker (pickup orders only).

Known, explicit constraint (not a gap to fill silently): this is currently a front-end-only prototype. The cart persists via `localStorage`; there is no real payment processor, no backend that routes orders to a store's POS system, and no persistent user accounts. Real payment processing, POS/order-routing integration, and account persistence are known future requirements — future work should treat them as unbuilt, not assume they exist, and should not claim real payment or fulfillment is happening today.

Known inconsistency (pending cleanup, not yet resolved): the checkout page still has a full in-house delivery flow built before the third-party-delivery direction was confirmed — address entry, dropoff options (Meet at my door / Hand it to me), delivery instructions, and tiered delivery fees (Priority +$3.99, Standard, Schedule). It's unreachable from the menu page's new Delivery toggle (which now exits to third-party apps instead), but the code and the Pickup/Delivery segmented control on the checkout page itself still assume in-house delivery is offered. Future work should reconcile or remove this rather than build more on top of it.

## Brand Commitments

- Name: Deviled Egg Co. "As Seen on Shark Tank" is an established credibility marker from the live site's homepage.
- Voice: warm and quirky (e.g. "eggs-perience," "eggcellent gifts" from deviledeggco.com copy).
- Visual identity is a real, audited design system pulled from the live deviledeggco.com site: one gold accent (`#F7BA17`) as the only saturated color, warm cream/neutral surfaces, near-universal pill/rounded-corner radius, Nunito (weight 800) for headings and prices, Plus Jakarta Sans for body and UI text. This is documented and enforced via the project's design-system reference — new work should pull from it rather than reinventing tokens.

## Evidence on Hand

- Real menu items and prices, sourced from deviledeggco.com: packaged deviled egg counts (2 Pack $4.99 up to the 24 Count Platter $44.99), protein bowls (from $14.99).
- The 19-flavor lineup, each flavor's own "NO: ingredient" exclusion list, and every pack size's own flavor-picker limits are copied verbatim from each product's live page: 2 Pack (2 pieces, up to 2 flavors, step 1), 6 Pack – 3 Flavors (6 pieces, up to 3 flavors, step 2), 6 Pack – 6 Flavors (6 pieces, up to 6 flavors, step 1), 12 Pack / Build Your Own Dozen (12 pieces, up to 4 flavors, step 3), 24 Count Platter (24 pieces, up to 3 flavors, step 8).
- Real store addresses for all four locations (used in pickup directions).
- Real customer review language and a 4.9-star rating claim sourced from the deviledeggco.com homepage.
- The three delivery-partner logos (DoorDash, Uber Eats, Grubhub) are real, official brand assets — fine for identifying actual delivery partners, but worth keeping in mind before sharing this prototype outside a design-mockup context.
- No real payment or backend integration exists yet — do not fabricate transaction IDs, POS confirmations, or account data beyond what the prototype already generates client-side (e.g. the mock order number).

## Product Principles

1. Every screen sells freshness and flavor customization as the hero — never just a scrollable item list like a generic delivery app.
2. Pickup is the only in-house fulfillment path. Delivery is intentionally handed off to third-party partners rather than rebuilt here — routing a Delivery customer out to DoorDash/Uber Eats/Grubhub is correct behavior, not a shortcut or a stub.
3. Borrow the interaction pattern customers already know from mainstream delivery apps, but never the visual identity — every control stays on the Deviled Egg Co. gold/cream/pill design system.
4. Be honest about what's real: this prototype does not process real payments or route pickup orders to a store today, and nothing in the UI should imply otherwise.
