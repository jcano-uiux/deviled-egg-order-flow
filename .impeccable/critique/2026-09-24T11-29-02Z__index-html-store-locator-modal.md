---
target: choose a store popup (store locator modal)
total_score: 21
max_score: 32
na_heuristics: 9,10
p0_count: 1
p1_count: 2
target_identity: "file:/Users/joseph/Projects/deviled-egg-order-flow/index.html#store-locator-modal"
timestamp: 2026-09-24T11-29-02Z
slug: index-html-store-locator-modal
---
# Critique: "Choose a store" popup (store locator modal)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Map swaps to the new location silently, ~1-2s lag, no loading indicator |
| 2 | Match System / Real World | 3 | Real Google Maps is the right mental model; docked for the map's own foreign UI chrome |
| 3 | User Control and Freedom | 4 | Staged-selection pattern verified live: select then Cancel correctly discards |
| 4 | Consistency and Standards | 3 | Shares modal chrome + sidebar's active-row token language; missing ARIA parity |
| 5 | Error Prevention | 3 | Two-step select-then-Confirm commit is itself a safeguard |
| 6 | Recognition Rather Than Recall | 2 | Full addresses shown, but nothing helps compare/judge "nearest" |
| 7 | Flexibility and Efficiency | 1 | No nearest-me, no search - fine at 4 stores, no path to scale |
| 8 | Aesthetic and Minimalist Design | 3 | List side is clean; unstyled map iframe is visual noise next to it |
| 9 | Error Recovery | n/a | No error state exists anywhere to score |
| 10 | Help and Documentation | n/a | Not needed for a 4-item picker |
| Total | | 21/32 | Acceptable (65.6%) |

## Design Specificity Verdict

Split verdict - the chrome is authored, the payload is generic. The list side (rows, active-state styling, modal chrome) correctly reuses this project's own tokens. The selected-row treatment reuses the exact same combination as the sidebar category drawer's active state - deliberate system reuse, not an invented one-off.

But the map is a bare output=embed Google Maps iframe with completely unstyled Google chrome, sitting inside the one product whose entire identity is "nothing competes with the yolk." The list half could only be Deviled Egg Co.; the map half could be dropped into any food app unchanged.

Deterministic scan: impeccable detect --json index.html returned zero findings, exit 0 - clean. Doesn't contradict the review findings; they're behavioral issues a token-linter can't see.

Cross-checked evidence: two facts where the two assessments disagreed were independently re-verified in the parent context:
- Assessment B reported focus lands on body (not the trigger) after close. Direct re-test found document.activeElement after Cancel IS #open-store-locator - confirmed working correctly. Treated as a false positive from B's disclosed tooling instability.
- Assessment B measured the mobile map overlapping Confirm/Cancel by 41-47px. Independently reproduced at exact 375x812 - confirmed real. Root cause: .store-locator-body switches to a stacked column at <=900px but keeps overflow-y:visible instead of a scroll container, unlike .drawer-scroll/.pickup-time-scroll elsewhere in the file.

## Overall Impression

The interaction architecture is the best-executed part of this modal - the staged-selection/discard pattern is uniformly wired through every exit path and genuinely reused rather than reinvented. The gaps are all in the parts nobody double-checks after wiring the happy path: assistive tech gets no indication of which store is selected, mobile users get a map that physically collides with the buttons below it, and the payoff moment gives back nothing. The map's un-branded chrome is the most visible "this could be any app" tell in a product that otherwise polices that relentlessly.

## What's Working

1. The staged-selection/discard pattern is textbook-correct and uniformly wired. X, Cancel, Escape, and backdrop-click all funnel through one closeStoreLocator(); only Confirm writes pendingStoreLocation back into state.location. Verified live.
2. The selected-row styling is genuine brand-token reuse - .store-locator-row.active uses the identical gold-tint/border/heading-color combination as the sidebar's .category-item.active.
3. Solid baseline accessibility scaffolding: correct role="dialog"/aria-modal/aria-labelledby, focus sent to close button on open, focus correctly restored to trigger on close (verified), background made inert while open.

## Priority Issues

[P0] Store selection has no accessible state. renderStoreLocatorList() (app.js:702-718) toggles only a CSS class - no aria-pressed, aria-checked, or role="radiogroup" anywhere.
Why it matters: this is the core interaction of the modal - for a screen-reader user it's a functional dead end.
Fix: add aria-pressed="true" (or role="radio" + aria-checked) to the active row, toggled in the same render pass that toggles the class.
Suggested command: /impeccable audit

[P1] On mobile, the map geometrically collides with Confirm/Cancel. Confirmed at exact 375x812: map box (521.6-741.6px) overlaps Confirm (630.4-684.4px) by ~41px and Cancel (694.4-751.4px) by ~47px.
Why it matters: this isn't "the map is small," it's overlapping content and controls on a real supported viewport.
Fix: give .store-locator-body overflow-y:auto at the mobile breakpoint, matching .drawer-scroll/.pickup-time-scroll elsewhere.
Suggested command: /impeccable layout

[P1] The map has no loading or error state. renderStoreLocatorMap() (app.js:697-700) just assigns iframe.src with no onload/onerror, no skeleton, no fallback text.
Why it matters: PRODUCT.md's own honesty principle says nothing should silently imply something works when it doesn't.
Fix: add a brief loading state and an onerror/timeout fallback that surfaces the plain-text address.
Suggested command: /impeccable harden

[P2] The map is the least-branded element in the entire product. Unstyled Google chrome sits directly beside a fully-tokenized store list.
Why it matters: it's the clearest specificity failure found - the one place a competitor's app could be swapped in unchanged.
Fix: apply the Google Maps Styling API with a muted/warm palette pass, or restyle the marker/attribution chip.
Suggested command: /impeccable colorize

[P2] Confirming a store gives no acknowledgment. The modal just closes; the store field updates silently behind it.
Why it matters: flattens the interaction's one legitimate "peak" moment into a non-event.
Fix: a brief highlight/pulse on the updated store field using the existing gold-glow CTA shadow language.
Suggested command: /impeccable delight

## Persona Red Flags

Sam (screen-reader/keyboard-only/200% zoom): the P0 above is the worst failure for this persona - no confirmation of which store is staged before committing.

Casey (distracted, thumb-only mobile): the P1 mobile overlap hits Casey directly - buried address stack collided with the buttons she's trying to tap.

Riley (deliberate stress tester): the missing map error-handling (P1) is exactly what Riley finds by throttling network or blocking google.com.

## Minor Observations

- .store-locator-row has no dedicated hover/focus-visible treatment unlike .close-btn:hover or .shop-card:hover .add-btn elsewhere.
- Address rows wrap unevenly (Coppell/Rockwall two lines, McKinney/Denison one line), giving uneven row heights.
- STORE_ADDRESSES is a flat 4-entry object with no hours-per-store; switching stores doesn't re-validate an already-selected pickup time against the new store's hours.
- Copy ("Choose a store") is the most voice-neutral text in a product whose brand principle is "warm and quirky."

## Questions to Consider

1. Is the unstyled Google Maps embed an accepted, deliberate exception to the One Accent Rule, or just an oversight?
2. The staged-selection pattern is clearly considered - so why does confirming a change get zero on-screen acknowledgment?
3. Given a "Franchise" link in the nav implying real growth, what does this exact modal do the day there are 9 stores instead of 4?
