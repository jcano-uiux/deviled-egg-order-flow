# Archive: the Distilled flavor picker

Saved on 2026-10-16, before Pair becomes the only flavor picker, in case Distilled is wanted again. Nothing here is loaded by the app.

## What Distilled is
The pack picker's list: one Cool Linen row per flavor, with a 56px still of the flavor's clip at the left (tap it to open the clip and description inline, one at a time), the name over a line of calories and protein, and a − / + stepper at the right. A flavor in the pack turns the row white with a 2px Deep Ink edge and shows its "Customize" link, which opens the "Remove ingredients" list. A full pack disables only the + buttons; rows are never dimmed. It is the default for the 6 Pack, and the only layout for the 12 Pack, the platters, the egg salads and the catering bundles' flavor lists. Only the 6 Pack offers the Distilled | Pair | Grow switcher.

## What is in this folder
| Path | What it is |
|---|---|
| `distilled-picker.js` | The picker's code pulled out of `app.js`: `renderFlavorGrid()` (the whole list), the clip player and placeholder, the Customize list, the pack guidance line, the footer, the icons, the switcher. Each block names the line it had in `snapshot/app.js`. Reference only; it will not run alone. |
| `distilled-picker.css` | The rules from `styles.css` that style it (picked by class name, so it can include a few shared with Pair or Grow). |
| `distilled-picker.html` | The markup around it: the "Choose your flavors" block and the counter in the modal footer. |
| `snapshot/` | The whole front end exactly as it stood when this was saved: `app.js`, `styles.css`, `design-system.css`, `ship-variants.css`, `index.html`, `DESIGN.md`, `PRODUCT.md`. This is the dependable copy. |
| `screenshots/` | The picker on a phone (6 Pack, with a flavor customized) and on desktop (12 Pack, with a clip open). |

The flavor clips and stills stay where they are, in `assets/flavors/`; they are not copied here.

## State when saved
- Git: the last commit is `d60205a`. It already contains Distilled, working. The snapshot is a little newer: it also has that day's uncommitted work (Pair's refinement, bagels, delivery pricing, the Home featured sections).
- `git show d60205a:app.js` and `git show d60205a:styles.css` print the committed versions.

## To bring it back
1. **The simple way, if Pair has not been touched since:** nothing to do; Distilled is still in `app.js`. (When Pair becomes the only picker, Distilled is removed from the live files, and this folder is the record.)
2. **From the code in this folder:** put the blocks of `distilled-picker.js` back in `app.js` in the order they appear (icons, Customize, guidance, clip player, stat line, `renderFlavorGrid`, footer, the switcher), the CSS back in `styles.css`, and the markup in `index.html`. `renderFlavorGrid()` expects `activeProduct`, `state.modalFlavorQty`, `state.modalExclusions`, `FLAVOR_MEDIA`, `FLAVORS` and the helpers `escapeHTML` and `money`, which stay in `app.js`.
3. **To restore everything exactly as it was:** copy the files in `snapshot/` over the project's. This replaces anything changed since, so use it only to go back in time.
