# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Everyday pickup/delivery customers ordering lunch or dinner near one of Deviled Egg Co.'s four Texas storefronts (McKinney, Denison, Rockwall, Coppell). They're choosing food for now or soon, not browsing a catalog — the flow needs to get them from "what am I craving" to a placed order quickly, for either pickup or delivery.

## Product Purpose

Let customers browse the Deviled Egg Co. menu and place a real pickup or delivery order online: pick items, customize a Build Your Own Dozen, manage a cart, check out, and get a confirmed order with a fulfillment estimate.

## Positioning

Freshness and made-to-order customization are the mechanism, not a generic delivery-app menu list. The signature move is Build Your Own Dozen — choose up to 4 flavors from the full lineup — and every screen should sell "made fresh daily, your way" rather than reading like an interchangeable food-delivery clone.

## Operating Context

- Four physical storefronts fulfill orders: McKinney, Denison, Rockwall, and Coppell, TX. Each has a real street address.
- Both Pickup and Delivery are first-class fulfillment modes, not one bolted onto the other as an afterthought.
- Texas sales tax (8.25%) applies to orders.
- Customers already have a mental model from mainstream delivery apps (Uber Eats); the flow intentionally follows that familiar interaction pattern (menu → item customization → cart → checkout → confirmation) rather than inventing a new one, while carrying the Deviled Egg Co. brand identity throughout.

## Capabilities and Constraints

Confirmed and built:
- Menu browsing by category, with a scrollable single-page layout.
- Build Your Own Dozen item customization (choose up to 4 of 8 flavors, quantity, kitchen note).
- Cart with live subtotal/tax/total, quantity edits, and a promo code (`EGGSTRA10`).
- Pickup flow: store selection (one of the 4 locations) and pickup time (ASAP or schedule).
- Delivery flow: address entry, dropoff options (Meet at my door / Hand it to me), delivery instructions, and tiered delivery options (Priority +$3.99, Standard, Schedule) that change the delivery fee.
- Tip selection and order confirmation with a Placed → Preparing → Ready/On the way progress tracker.

Known, explicit constraint (not a gap to fill silently): this is currently a front-end-only prototype. The cart persists via `localStorage`; there is no real payment processor, no backend that routes orders to a store's POS system, and no persistent user accounts. Real payment processing, POS/order-routing integration, and account persistence are known future requirements — future work should treat them as unbuilt, not assume they exist, and should not claim real payment or fulfillment is happening today.

## Brand Commitments

- Name: Deviled Egg Co. "As Seen on Shark Tank" is an established credibility marker from the live site's homepage.
- Voice: warm and quirky (e.g. "eggs-perience," "eggcellent gifts" from deviledeggco.com copy).
- Visual identity is a real, audited design system pulled from the live deviledeggco.com site: one gold accent (`#F7BA17`) as the only saturated color, warm cream/neutral surfaces, near-universal pill/rounded-corner radius, Nunito (weight 800) for headings and prices, Plus Jakarta Sans for body and UI text. This is documented and enforced via the project's design-system reference — new work should pull from it rather than reinventing tokens.

## Evidence on Hand

- Real menu items and prices: deviled egg flavors (Classic $14.99, Bacon Cheddar Ranch $15.99, Jalapeño Popper $15.99, Smoked Salmon $17.99), Build Your Own Dozen ($24.99, up to 4 flavors), protein bowls ($14.99–$16.99).
- Real store addresses for all four locations (used in pickup directions and delivery confirmation copy).
- Real customer review language and a 4.9-star rating claim sourced from the deviledeggco.com homepage.
- No real payment or backend integration exists yet — do not fabricate transaction IDs, POS confirmations, or account data beyond what the prototype already generates client-side (e.g. the mock order number).

## Product Principles

1. Every screen sells freshness and flavor customization as the hero — never just a scrollable item list like a generic delivery app.
2. Pickup and Delivery are equal, fully-built paths; neither is a stub next to the other.
3. Borrow the interaction pattern customers already know from mainstream delivery apps, but never the visual identity — every control stays on the Deviled Egg Co. gold/cream/pill design system.
4. Be honest about what's real: this prototype does not process real payments or route orders to a store today, and nothing in the UI should imply otherwise.
