/* ARCHIVE: the Distilled flavor picker, extracted from app.js on 2026-10-16.
 * Reference only: it is not loaded by the app and will not run on its own. It reads app.js state (activeProduct, state.modalFlavorQty,
 * state.modalExclusions, FLAVOR_MEDIA, escapeHTML, money, ...). To bring it back, see ../README.md; the snapshot/ folder holds the whole
 * app exactly as it was, with this picker in it. Each block notes the line it had in snapshot/app.js. */

// ======================================================================
// Icons used by the rows
// ======================================================================
// (snapshot/app.js line 47)
  // Shared source for every quantity-stepper .mini-step-btn (dozen flavor
  // allocation, bagel spread flavors, cart-drawer qty) — any future +/-
  // control should pull from these two rather than typing "−"/"+" text
  // glyphs again. currentColor so .mini-step-btn's own `color` (and its
  // existing :disabled dimming) still drives the icon exactly like the
  // text characters did.
  const STEP_MINUS_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';

// (snapshot/app.js line 52)
  const STEP_PLUS_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';

// (snapshot/app.js line 49)
  // The flavor thumbnail's corner icon: expand (open the video and description) and, once open, collapse.
  const FLAVOR_EXPAND_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// (snapshot/app.js line 51)
  const FLAVOR_COLLAPSE_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 10h-6V4M4 14h6v6M14 10l7-7M10 14l-7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// (snapshot/app.js line 1617)
  // One flavor's clip can be open at a time, inline in its own row. The <video>
  // element outlives the grid re-renders (every + / - redraws the rows) so the
  // clip keeps playing while the customer adds eggs.
  const PLAY_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg>';

// ======================================================================
// Shared "Customize" / "Remove ingredients" list (used by Distilled, still in app.js for the packs and wraps)
// ======================================================================
// (snapshot/app.js line 1509)
  // Draws it into `box` and wires it: the link calls onToggleOpen, a row calls onToggle(ingredient). The item redraws from its own state.
  function mountCustomize(box, { label, items, excluded, open, onToggleOpen, onToggle }) {
    box.innerHTML = customizeHTML({ label, items, excluded, open });
    box.querySelector('.fd-custom-btn').addEventListener('click', onToggleOpen);
    box.querySelectorAll('.excl').forEach((btn, i) => btn.addEventListener('click', () => onToggle(items[i])));
  }

// ======================================================================
// Pack allocation and the guidance line under the list
// ======================================================================
// (snapshot/app.js line 1539)
  // First-time guidance, kept next to the picker it explains: what the + does
  // (it adds one "step" of eggs, total ÷ max flavors, not one egg), how many
  // flavors are allowed, and how far along the mix is. The meter has one slot
  // per flavor the pack allows, so the distribution is visible, not just stated.
  function renderFlavorGuidance(allocated) {
    const { total, maxFlavors, step } = activeProduct;
    const hint = document.getElementById('flavor-hint');
    const meter = document.getElementById('flavor-meter');
    const complete = allocated === total;
    if (total === 1) {
      meter.hidden = true;
      hint.textContent = 'Pick 1 flavor.';
      return;
    }
    meter.hidden = false;
    hint.textContent = complete
      ? `All ${total} ${eggWord(total)} chosen. Tap − on a flavor to change your mix.${activeProduct.hintTail || ''}`
      : `Pick up to ${maxFlavors} flavors. Each + adds ${step} ${eggWord(step)}.${activeProduct.hintTail || ''}`;
    document.getElementById('flavor-count').textContent = complete
      ? `${total} of ${total} ${eggWord(total)}`
      : `${allocated} of ${total} ${eggWord(total)} · ${total - allocated} to go`;
    const filled = Math.round(allocated / step);
    document.getElementById('flavor-meter-bar').innerHTML = Array.from({ length: maxFlavors }, (_, i) =>
      `<span class="flavor-meter-seg${i < filled ? ' filled' : ''}"></span>`).join('');
  }

// (snapshot/app.js line 1567)
  function dozenAllocated() {
    return Object.values(state.modalFlavorQty).reduce((sum, n) => sum + n, 0);
  }

// ======================================================================
// Tap-the-thumbnail clip: the open row's state, the player and the placeholder
// ======================================================================
// (snapshot/app.js line 1618)
  const flavorReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// (snapshot/app.js line 1619)
  let flavorWatch = { id: null, wrap: null, playing: false };

// (snapshot/app.js line 1621)
  function stopFlavorWatch() {
    const video = flavorWatch.wrap && flavorWatch.wrap.querySelector('video');
    if (video) video.pause();
    flavorWatch = { id: null, wrap: null, playing: false };
  }

// (snapshot/app.js line 1629)
  // The expanded panel's stand-in for a flavor that has no clip yet: the same 2:3 slot, labeled.
  // A flavor with a still photo but no clip (catering sandwiches) shows the photo itself, square.
  function flavorWatchPlaceholder(photo) {
    const el = document.createElement('div');
    if (photo) {
      el.className = 'flavor-watch-media flavor-watch-photo';
      el.innerHTML = `<img src="${photo}" alt="" loading="lazy" decoding="async">`;
      return el;
    }
    el.className = 'flavor-watch-media flavor-watch-placeholder';
    el.innerHTML = '<img src="assets/flavors/placeholder.svg" alt="" width="56" height="56"><span>Photo coming soon</span>';
    return el;
  }

// (snapshot/app.js line 1641)
  function flavorWatchMedia(f) {
    if (flavorWatch.wrap) return flavorWatch.wrap;
    const file = `assets/flavors/${FLAVOR_MEDIA[f.id].file}`;
    const wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.className = 'flavor-watch-media';
    wrap.innerHTML = `<video muted loop playsinline preload="auto" poster="${file}.jpg"><source src="${file}.mp4" type="video/mp4"></video><span class="flavor-watch-play" aria-hidden="true">${PLAY_ICON}</span>`;
    const video = wrap.querySelector('video');
    const paint = () => {
      const paused = video.paused;
      wrap.classList.toggle('is-paused', paused);
      wrap.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} the ${f.label} video`);
    };
    video.addEventListener('play', paint);
    video.addEventListener('pause', paint);
    wrap.addEventListener('click', () => {
      flavorWatch.playing = video.paused;
      if (video.paused) video.play().catch(() => {}); else video.pause();
    });
    paint();
    flavorWatch.wrap = wrap;
    return wrap;
  }

// (snapshot/app.js line 1665)
  function toggleFlavorWatch(id) {
    const reopen = flavorWatch.id !== id;
    stopFlavorWatch();
    if (reopen) flavorWatch = { id, wrap: null, playing: !flavorReduceMotion.matches };
    renderFlavorGrid();
    const row = document.querySelector(`#flavor-grid [data-flavor="${id}"]`);
    if (!row) return;
    row.querySelector('.flavor-thumb').focus({ preventScroll: true });
    if (reopen) row.scrollIntoView({ block: 'nearest', behavior: flavorReduceMotion.matches ? 'auto' : 'smooth' });
  }

// ======================================================================
// One row's stat line
// ======================================================================
// (snapshot/app.js line 1691)
  const flavorStat = (f) => { const m = FLAVOR_MEDIA[f.id]; return f.desc || (m && m.cal ? `${m.cal} cal · ${m.protein}g protein each` : ''); };

// ======================================================================
// THE DISTILLED PICKER ITSELF: renders the whole list, one row per flavor
// ======================================================================
// (snapshot/app.js line 2166)
  function renderFlavorGrid() {
    const grid = document.getElementById('flavor-grid');
    const single = activeProduct.total === 1;
    grid.classList.toggle('addon-list', single);
    if (single) {
      setDistilledChrome(false);
      document.getElementById('flavor-variant-switch').hidden = true;
      delete grid.dataset.variant;
      delete grid.dataset.big;
      fvDispose();
      fbDispose();
      grid.setAttribute('role', 'radiogroup');
      grid.setAttribute('aria-label', 'Flavor');
      renderSingleFlavorRadios(grid);
      return;
    }
    grid.removeAttribute('role');
    grid.removeAttribute('aria-label');
    const variantOn = flavorVariant === '2' && flavorVariantAvailable();
    const mode = flavorVariantAvailable() ? bigMode() : null;
    // The distilled picker is the picker; Pair and Grow are the layouts still being compared against it.
    const distilled = !(flavorVariant === '2' && flavorVariantAvailable()) && !mode;
    setDistilledChrome(distilled);
    if (!mode) fbDispose();
    document.getElementById('flavor-variant-switch').hidden = !flavorVariantAvailable();
    document.querySelectorAll('#flavor-variant-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === flavorVariant)));
    if (mode) {
      delete grid.dataset.variant;
      fvDispose();
      grid.dataset.big = mode;
      renderBigRows(grid);
      return;
    }
    delete grid.dataset.big;
    if (variantOn) {
      grid.dataset.variant = flavorVariant;
      renderFlavorVariant(grid);
      return;
    }
    delete grid.dataset.variant;
    fvDispose();
    grid.innerHTML = '';
    const allocated = dozenAllocated();
    flavorList().forEach((f) => {
      const qty = state.modalFlavorQty[f.id] || 0;
      const atLimit = qty <= 0 && allocated >= activeProduct.total;
      const showExclusions = qty > 0 && f.exclusions && f.exclusions.length > 0;
      const excluded = state.modalExclusions[f.id] || new Set();

      // Selecting a flavor and excluding an ingredient from it are one
      // continuous card — the exclusion chips live inside the same
      // .flavor-row button, not a separate block stacked below it.
      // A flavor with no photo or clip yet gets a placeholder thumbnail, and its expanded panel a placeholder in the clip's place.
      // A flavor with its own photo (the catering lists) shows that photo, not a pack clip that happens to share its id.
      const media = f.photo ? null : FLAVOR_MEDIA[f.id] || null;
      const watching = flavorWatch.id === f.id;
      const thumbSrc = media ? `assets/flavors/${media.file}.jpg` : f.photo || 'assets/flavors/placeholder.svg';
      const thumbLabel = media ? `${watching ? 'Hide' : 'Watch'} the ${f.label} video` : `${watching ? 'Hide' : 'Show'} details for ${f.label}`;
      const statLine = f.desc || (media && media.cal ? `${media.cal} cal · ${media.protein}g protein each` : '');
      const row = document.createElement('div');
      row.className = 'flavor-row dozen-flavor-row' + (qty > 0 ? ' selected' : '') + (atLimit ? ' at-limit' : '');
      row.dataset.flavor = f.id;
      row.innerHTML = `
        <div class="flavor-row-head">
          <button class="flavor-thumb${watching ? ' open' : ''}" type="button" aria-expanded="${watching}" aria-controls="flavor-watch-${f.id}" aria-label="${escapeHTML(thumbLabel)}"><img src="${thumbSrc}" alt="" width="56" height="56" loading="lazy" decoding="async"><span class="flavor-thumb-badge" aria-hidden="true">${watching ? FLAVOR_COLLAPSE_ICON : FLAVOR_EXPAND_ICON}</span></button>
          <span class="flavor-row-name">${f.label}${statLine ? `<small class="flavor-row-desc">${escapeHTML(statLine)}</small>` : ''}</span>
          <div class="mini-stepper">
            <button class="mini-step-btn" type="button" aria-label="${activeProduct.total === 1 ? 'Remove ' + f.label : 'Remove ' + activeProduct.step + ' ' + f.label + ' ' + eggWord(activeProduct.step)}" ${qty <= 0 ? 'disabled' : ''}>${STEP_MINUS_ICON}</button>
            <span>${qty}</span>
            <button class="mini-step-btn" type="button" aria-label="${activeProduct.total === 1 ? 'Choose ' + f.label : 'Add ' + activeProduct.step + ' ' + f.label + ' ' + eggWord(activeProduct.step)}" ${allocated >= activeProduct.total ? 'disabled' : ''}>${STEP_PLUS_ICON}</button>
          </div>
        </div>
        ${watching ? `
          <div class="flavor-watch" id="flavor-watch-${f.id}">
            <div class="flavor-watch-slot"></div>
            <div class="flavor-watch-copy">
              <p>${escapeHTML(media ? media.desc : f.desc || 'Details coming soon.')}</p>
              <button class="flavor-watch-hide" type="button">${media ? 'Hide video' : 'Hide details'}</button>
            </div>
          </div>
        ` : ''}
        ${showExclusions ? '<div class="fd-custom-box"></div>' : ''}
      `;
      row.querySelector('.flavor-thumb').addEventListener('click', () => toggleFlavorWatch(f.id));
      if (watching) {
        row.querySelector('.flavor-watch-hide').addEventListener('click', () => toggleFlavorWatch(f.id));
        row.querySelector('.flavor-watch-slot').replaceWith(media ? flavorWatchMedia(f) : flavorWatchPlaceholder(f.photo));
      }
      const [decBtn, incBtn] = row.querySelectorAll('.mini-step-btn');
      decBtn.addEventListener('click', () => {
        const current = state.modalFlavorQty[f.id] || 0;
        if (current <= 0) return;
        const next = current - activeProduct.step;
        if (next <= 0) {
          delete state.modalFlavorQty[f.id];
          delete state.modalExclusions[f.id];
        } else {
          state.modalFlavorQty[f.id] = next;
        }
        renderFlavorGrid();
        renderModalFooter();
      });
      incBtn.addEventListener('click', () => {
        if (dozenAllocated() >= activeProduct.total) return;
        state.modalFlavorQty[f.id] = (state.modalFlavorQty[f.id] || 0) + activeProduct.step;
        renderFlavorGrid();
        renderModalFooter();
      });
      if (showExclusions) {
        mountCustomize(row.querySelector('.fd-custom-box'), {
          label: f.label, items: f.exclusions, excluded, open: fd.custom.has(f.id),
          onToggleOpen: () => { if (fd.custom.has(f.id)) fd.custom.delete(f.id); else fd.custom.add(f.id); renderFlavorGrid(); },
          onToggle: (ing) => {
            const set = state.modalExclusions[f.id] || new Set();
            toggleIn(set, ing);
            state.modalExclusions[f.id] = set;
            renderFlavorGrid();
          },
        });
      }

      grid.appendChild(row);
      // The grid redraws on every + / -, which pauses a re-attached video; pick the clip up again unless the customer paused it.
      if (watching && media && flavorWatch.playing) flavorWatch.wrap.querySelector('video').play().catch(() => {});
    });
    renderFlavorGuidance(allocated);
  }

// ======================================================================
// Footer (counter and Add button) that the picker drives
// ======================================================================
// (snapshot/app.js line 2304)
  function renderModalFooter() {
    document.getElementById('qty-select').value = String(state.modalQty);
    const total = activeProduct.price * state.modalQty;
    const allocated = dozenAllocated();
    const btn = document.getElementById('add-to-order');
    const complete = !optionPending() && (activeProduct.fixedFlavors || allocated === activeProduct.total);
    btn.disabled = !complete;
    // total:1 (the egg salads — one flavor for the whole tub) reads oddly
    // through the "Choose N eggs" copy every multi-piece pack uses;
    // singular products get their own natural phrasing instead.
    btn.textContent = complete
      ? `${editingLine ? 'Update order' : `Add ${state.modalQty} to order`} · ${money(total)}`
      : optionPending()
        ? 'Choose how many flavors to continue'
      : activeProduct.total === 1
        ? 'Choose a flavor to continue'
        : `Choose ${activeProduct.total - allocated} ${allocated === 0 ? '' : 'more '}${eggWord(activeProduct.total - allocated)} to continue`;
  }

// ======================================================================
// Toggles the modal chrome that only the Distilled list uses
// ======================================================================
// (snapshot/app.js line 2163)
  function setDistilledChrome(on) {
    itemModal.dataset.distilled = on ? '1' : '';
  }

// ======================================================================
// The Distilled | Pair | Grow switcher (temporary comparison UI)
// ======================================================================
// (snapshot/app.js line 1693)
  (function initFlavorSwitch() {
    const bar = document.createElement('div');
    bar.id = 'flavor-variant-switch';
    bar.className = 'card-variant-switch flavor-variant-switch';
    bar.hidden = true;
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Flavor layout');
    bar.innerHTML = FLAVOR_VARIANTS.map(([k, label]) => `<button type="button" data-v="${k}">${label}</button>`).join('');
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      flavorVariant = b.dataset.v;
      try { localStorage.setItem('deg-flavor-variant', flavorVariant); } catch (err) { /* storage unavailable */ }
      renderFlavorGrid();
    });
    document.getElementById('flavor-grid').before(bar);
  })();
