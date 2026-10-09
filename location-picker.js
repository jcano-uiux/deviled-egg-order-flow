// Location picker (view-location-picker), the first step of the Pickup funnel. Moved in from the standalone deviled-egg-store-locator project.
// It is its own script so d3 and the map stay out of the order flow's main file; app.js talks to it
// through window.degLocationPicker (sync when the view shows or hides, onPick when a store is chosen).
(function () {
  'use strict';

  const FIPS = {
    '01':['AL','Alabama'],'02':['AK','Alaska'],'04':['AZ','Arizona'],'05':['AR','Arkansas'],'06':['CA','California'],
    '08':['CO','Colorado'],'09':['CT','Connecticut'],'10':['DE','Delaware'],'11':['DC','District of Columbia'],'12':['FL','Florida'],
    '13':['GA','Georgia'],'15':['HI','Hawaii'],'16':['ID','Idaho'],'17':['IL','Illinois'],'18':['IN','Indiana'],'19':['IA','Iowa'],
    '20':['KS','Kansas'],'21':['KY','Kentucky'],'22':['LA','Louisiana'],'23':['ME','Maine'],'24':['MD','Maryland'],
    '25':['MA','Massachusetts'],'26':['MI','Michigan'],'27':['MN','Minnesota'],'28':['MS','Mississippi'],'29':['MO','Missouri'],
    '30':['MT','Montana'],'31':['NE','Nebraska'],'32':['NV','Nevada'],'33':['NH','New Hampshire'],'34':['NJ','New Jersey'],
    '35':['NM','New Mexico'],'36':['NY','New York'],'37':['NC','North Carolina'],'38':['ND','North Dakota'],'39':['OH','Ohio'],
    '40':['OK','Oklahoma'],'41':['OR','Oregon'],'42':['PA','Pennsylvania'],'44':['RI','Rhode Island'],'45':['SC','South Carolina'],
    '46':['SD','South Dakota'],'47':['TN','Tennessee'],'48':['TX','Texas'],'49':['UT','Utah'],'50':['VT','Vermont'],
    '51':['VA','Virginia'],'53':['WA','Washington'],'54':['WV','West Virginia'],'55':['WI','Wisconsin'],'56':['WY','Wyoming'],
  };
  const STATE_NAME = Object.fromEntries(Object.values(FIPS));
  const FULL_VIEW = [0, 0, 975, 610];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Data ----------
  const stores = [];
  REAL_STORES.forEach((s) => stores.push({ ...s, id: `real-${s.city}-${s.state}`.toLowerCase(), kind: 'real' }));
  DEMO_CITIES.forEach(([city, state, lat, lng], i) => {
    if (stores.some((s) => s.kind === 'real' && s.city === city && s.state === state)) return;
    stores.push({ city, state, lat, lng, id: `demo-${city}-${state}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'), kind: i % 9 === 4 ? 'soon' : 'demo' });
  });
  const byId = new Map(stores.map((s) => [s.id, s]));
  const byState = d3.group(stores, (s) => s.state);

  // ---------- Elements ----------
  const $ = (id) => document.getElementById(id);
  const svg = d3.select('#us-map');
  const svgEl = document.getElementById('us-map');
  const EASE = 'cubic-bezier(.16, 1, .3, 1)';
  const canAnimate = () => !reduceMotion && !document.hidden;
  // Phones hide the map, so searches lead into the state directory instead of the map and result cards.
  const phoneQuery = window.matchMedia('(max-width: 600px)');
  const tooltip = $('map-tooltip');
  const stage = $('map-stage');
  const resultsEl = $('results');
  const resultList = $('result-list');
  const zipForm = $('zip-form');
  const zipInput = $('zip-input');
  const zipMsg = $('zip-message');
  const zipSubmit = $('zip-submit');
  const locateBtn = $('locate-btn');
  const resetBtn = $('map-reset');
  const finder = document.querySelector('.finder');

  const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
  const path = d3.geoPath();
  let stateFeatures = new Map();
  let currentView = FULL_VIEW.slice();
  let activeState = null;
  let nearIds = new Set();

  // ---------- Pickup selection ----------
  // The order flow owns the saved pickup choice (store, day and time) and tells the picker about it through
  // setSaved. A store counts as chosen only while that choice is valid, so the picker never marks a store
  // the customer opened and then backed out of.
  let savedId = null;
  let saved = null;
  const viewEl = document.getElementById('view-location-picker');
  // app.js made a stub before this script loaded (see loadLocationPicker): keep the callbacks it already assigned
  // and replay what it queued, once everything below is defined.
  const stub = window.degLocationPicker || { pending: {} };
  const api = window.degLocationPicker = {
    onPick: stub.onPick || null, onOpenStore: stub.onOpenStore || null, onContinue: stub.onContinue || null, onChangeTime: stub.onChangeTime || null, onNavigate: stub.onNavigate || null,
    sync: null, configure: null, setSaved: null, ready: false,
  };

  // The picker serves one order funnel at a time. The funnel supplies the words the picker uses for choosing
  // (app.js owns what choosing does, in FUNNELS); the Pickup funnel is the only one built so far.
  const funnelText = {
    title: 'Our locations', pickLabel: 'Order pickup here', pickedLabel: 'Your pickup store',
    savedTitle: 'Continue your pickup order', continueLabel: 'Continue to menu', changeLabel: 'Change time',
  };

  // Choosing a store hands it to the order flow, which opens its details (day and time); nothing is marked
  // here until the customer confirms there.
  function pickStore(id) {
    const picked = byId.get(id);
    // Only the four real stores take orders.
    if (picked && picked.kind === 'real' && api.onPick) api.onPick({ city: picked.city, state: picked.state, address: picked.address });
  }

  function label(s) { return `${s.city}, ${s.state}`; }

  // One plain status line instead of badges: what the store is, in words.
  function statusFor(s) {
    if (s.kind === 'real') return 'Open for pickup and delivery';
    return 'Coming soon';
  }

  // A real store's card opens that store's own page; the link's box is stretched over the whole card (see the CSS), so
  // the card is the link. Placeholder cities have no page and no link.
  const storeSlug = (s) => s.city.toLowerCase();
  function pickControl(s, cls) {
    if (s.kind !== 'real') return '';
    return `<a class="deg-btn ${cls} store-link" href="#store/${storeSlug(s)}" data-store="${storeSlug(s)}" aria-label="View the ${label(s)} store page">View store</a>`;
  }

  viewEl.addEventListener('click', (e) => {
    const go = e.target.closest('[data-picker-go]');
    if (go) { e.preventDefault(); if (api.onNavigate) api.onNavigate(go.dataset.pickerGo); return; }
    const store = e.target.closest('[data-store]');
    if (store) { e.preventDefault(); if (api.onOpenStore) api.onOpenStore(store.dataset.store); }
  });

  // ---------- Directory ----------
  const stateOrder = [...byState.keys()].sort((a, b) => STATE_NAME[a].localeCompare(STATE_NAME[b]));

  // Collapsible state rows keep the directory short at any store count; a state's list is only built
  // when it is first opened. States sit in fixed alphabetical columns, so opening one never reflows the others.
  const openStates = new Set();
  const CHEVRON = '<svg class="state-chevron" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5.5 7.5 10 12l4.5-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function storeRows(st) {
    const list = byState.get(st).slice().sort((a, b) => (a.kind === 'real' ? -1 : 0) - (b.kind === 'real' ? -1 : 0) || a.city.localeCompare(b.city));
    return `<ul>${list.map((s) => `<li class="dir-store">
      <span class="dir-store-name">${s.city}<small>${s.kind === 'real' ? s.address : 'Coming soon'}</small></span>
      ${pickControl(s, 'deg-btn-text')}
    </li>`).join('')}</ul>`;
  }

  function stateGroup(st) {
    const n = byState.get(st).length;
    const open = openStates.has(st);
    return `<details class="state-group${st === activeState ? ' is-active' : ''}" id="state-${st}"${open ? ' open' : ''}>
      <summary><span class="state-name">${STATE_NAME[st]}</span><span class="count">${n} ${n === 1 ? 'store' : 'stores'}</span>${CHEVRON}</summary>
      ${open ? storeRows(st) : ''}
    </details>`;
  }

  const DIRECTORY_COLUMNS = 3;
  function renderDirectory() {
    const per = Math.ceil(stateOrder.length / DIRECTORY_COLUMNS);
    const cols = [];
    for (let i = 0; i < stateOrder.length; i += per) cols.push(stateOrder.slice(i, i + per));
    $('state-columns').innerHTML = cols.map((c) => `<div class="state-column">${c.map(stateGroup).join('')}</div>`).join('');
  }

  // "toggle" doesn't bubble, so listen in the capture phase.
  $('state-columns').addEventListener('toggle', (e) => {
    const d = e.target;
    if (!(d instanceof HTMLDetailsElement) || !d.classList.contains('state-group')) return;
    const st = d.id.slice('state-'.length);
    if (d.open) {
      openStates.add(st);
      if (!d.querySelector('ul')) d.insertAdjacentHTML('beforeend', storeRows(st));
    } else {
      openStates.delete(st);
    }
  }, true);

  // The count says what is real: the stores that take orders, then that everything else is placeholder data.
  const realStores = stores.filter((s) => s.kind === 'real');
  const realStates = [...new Set(realStores.map((s) => s.state))];
  const renderSummary = () => {
    const where = realStates.length === 1 ? `, all in ${STATE_NAME[realStates[0]]}` : ` in ${realStates.length} states`;
    $('directory-summary').textContent = `${realStores.length} ${realStores.length === 1 ? 'store' : 'stores'}${where}. Everything else listed here is coming soon. Open a state to see it.`;
  };
  renderSummary();

  // ---------- Map ----------
  d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json').then((us) => {
    $('map-loading').remove();
    const features = topojson.feature(us, us.objects.states).features;
    features.forEach((f) => { const meta = FIPS[f.id]; if (meta) stateFeatures.set(meta[0], f); });

    svg.select('#map-states').selectAll('path').data(features).join('path')
      .attr('d', path)
      .attr('class', (f) => {
        const st = FIPS[f.id] && FIPS[f.id][0];
        const list = byState.get(st);
        return 'state' + (list ? ' has-stores' : '') + (list && list.some((s) => s.kind === 'real') ? ' has-real' : '');
      })
      .attr('data-state', (f) => FIPS[f.id] && FIPS[f.id][0])
      .each(function (f) {
        const st = FIPS[f.id] && FIPS[f.id][0];
        if (!byState.get(st)) return;
        this.setAttribute('tabindex', '-1');
        this.setAttribute('role', 'button');
        this.setAttribute('aria-label', `${STATE_NAME[st]}: ${byState.get(st).length} stores`);
      })
      .on('click', function (e, f) { const st = this.dataset.state; if (byState.get(st)) focusState(st, { scrollToGroup: false, stateView: true }); })
      .on('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && byState.get(this.dataset.state)) { e.preventDefault(); focusState(this.dataset.state, { scrollToGroup: false, stateView: true }); return; }
        // The map is one tab stop; arrow keys walk the states that have stores, A–Z (Home/End jump to the ends).
        const order = mapStops();
        const i = order.indexOf(this);
        const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: order.length - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        setMapStop(order[(next + order.length) % order.length], true);
      })
      .on('focus', function () { setMapStop(this, false); })
      .on('mousemove', function (e) {
        const st = this.dataset.state; const list = byState.get(st);
        showTip(e, list ? `${STATE_NAME[st]} · ${list.length} ${list.length === 1 ? 'store' : 'stores'}` : `${STATE_NAME[st] || ''} · no stores yet`);
      })
      .on('mouseenter', function () { d3.select(this).raise(); })
      .on('mouseleave', function () { hideTip(); svg.select('#map-states .state.is-active').raise(); });

    svg.select('#map-borders').append('path')
      .attr('class', 'borders')
      .attr('d', path(topojson.mesh(us, us.objects.states)));

    stores.forEach((s) => { const p = projection([s.lng, s.lat]); s.xy = p; });
    svg.select('#map-dots').selectAll('circle').data(stores.filter((s) => s.xy), (s) => s.id).join('circle')
      .attr('class', (s) => `dot ${s.kind}`)
      .attr('cx', (s) => s.xy[0]).attr('cy', (s) => s.xy[1])
      .on('mousemove', (e, s) => showTip(e, `${label(s)}${s.kind === 'real' ? '' : ' · coming soon'}`))
      .on('mouseleave', hideTip)
      .on('click', (e, s) => { e.stopPropagation(); showStoresNear([s.lng, s.lat], `Stores near ${label(s)}`); });

    setMapStop(mapStops()[0], false);
    sizeDots();
    renderDotStates();
  }).catch(() => {
    $('map-loading').textContent = 'The map could not load. You can still search by ZIP or browse the list below.';
  });

  // Dot radii are set in map units, so derive the factor from the current on-screen scale to keep dots a steady size.
  function dotScale() {
    const vb = (svg.attr('viewBox') || FULL_VIEW.join(' ')).split(' ').map(Number);
    const r = svgEl.getBoundingClientRect();
    if (!r.width || !r.height) return 1;
    const screen = Math.min(r.width / vb[2], r.height / vb[3]);
    return (0.842 * Math.min(1, Math.max(0.6, r.width / 821))) / screen;
  }

  // Roving tab stop for the map's state buttons.
  function mapStops() {
    return [...svgEl.querySelectorAll('.state.has-stores')].sort((a, b) => STATE_NAME[a.dataset.state].localeCompare(STATE_NAME[b.dataset.state]));
  }
  function setMapStop(el, focus) {
    if (!el) return;
    svgEl.querySelectorAll('.state.has-stores[tabindex="0"]').forEach((s) => s.setAttribute('tabindex', '-1'));
    el.setAttribute('tabindex', '0');
    if (focus) el.focus();
  }

  function sizeDots() {
    const k = dotScale();
    svg.selectAll('.dot')
      .attr('r', (s) => (nearIds.has(s.id) ? 7.5 : s.kind === 'real' ? 6 : 4.2) * k)
      .attr('stroke-width', (s) => (s.kind === 'soon' ? 1.8 : 1.4) * k);
    svg.selectAll('.you-ring').attr('r', 16 * k).attr('stroke-width', 1.5 * k);
    svg.selectAll('.you-dot').attr('r', 6 * k).attr('stroke-width', 2 * k);
  }

  function renderDotStates() {
    svg.selectAll('.dot').classed('is-near', (s) => nearIds.has(s.id)).filter((s) => nearIds.has(s.id)).raise();
    svg.selectAll('.state').classed('is-active', function () { return this.dataset.state === activeState; });
    svg.select('#map-states .state.is-active').raise();
    sizeDots();
  }

  function showTip(e, text) {
    const r = stage.getBoundingClientRect();
    tooltip.textContent = text;
    tooltip.hidden = false;
    const x = Math.min(Math.max(e.clientX - r.left, 80), r.width - 80);
    tooltip.style.left = `${x}px`;
    // Kept below the hero's clipped top edge, so a tip over the northernmost states is never cut off.
    tooltip.style.top = `${Math.max(e.clientY - r.top, 46)}px`;
  }
  function hideTip() { tooltip.hidden = true; }

  // The one authored motion: the map is a single camera that glides its viewBox to the chosen region.
  function zoomTo(view, duration = 850) {
    const from = currentView.slice();
    currentView = view;
    resetBtn.hidden = view === FULL_VIEW;
    svg.interrupt();
    // Jump straight to the final view when motion is reduced or the page is hidden (animation frames are paused there).
    if (!canAnimate()) { svg.attr('viewBox', view.join(' ')); sizeDots(); return; }
    const interp = d3.interpolate(from, view);
    svg.transition().duration(duration).ease(d3.easeExpOut).tween('zoom', () => (t) => {
      svg.attr('viewBox', interp(t).join(' '));
      sizeDots();
    });
  }

  // Where the current view sits on screen: scale plus the letterbox offset of the SVG's xMidYMid fit.
  function cameraSnapshot() {
    const vb = svg.attr('viewBox').split(' ').map(Number);
    const r = svgEl.getBoundingClientRect();
    const k = Math.min(r.width / vb[2], r.height / vb[3]);
    if (!(k > 0) || !isFinite(k)) return null; // map hidden (phones) or not laid out yet
    return { vb, k, x: r.left + (r.width - vb[2] * k) / 2, y: r.top + (r.height - vb[3] * k) / 2 };
  }

  // After the map's box moves or reshapes, pick the viewBox that draws the map exactly where it just was,
  // so the following zoom starts from what the visitor is already looking at instead of snapping.
  function holdCamera(before) {
    const r = svgEl.getBoundingClientRect();
    if (!before || !r.width || !r.height) return;
    const view = [before.vb[0] + (r.left - before.x) / before.k, before.vb[1] + (r.top - before.y) / before.k, r.width / before.k, r.height / before.k];
    svg.interrupt();
    svg.attr('viewBox', view.join(' '));
    currentView = view;
    sizeDots();
  }

  let mapAspect = 975 / 610;
  function fitBounds([[x0, y0], [x1, y1]], pad) {
    const w = Math.max(x1 - x0, 120) * pad, h = Math.max(y1 - y0, 75) * pad;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    let vw = Math.max(w, h * mapAspect); let vh = vw / mapAspect;
    if (vw > 975 * 1.6) { vw = 975 * 1.6; vh = vw / mapAspect; }
    return [cx - vw / 2, cy - vh / 2, vw, vh];
  }

  // Slide an element from where it was to where layout now puts it.
  function flip(el, before, duration = 600) {
    const after = el.getBoundingClientRect();
    const dx = before.left - after.left, dy = before.top - after.top;
    if (!canAnimate() || (!dx && !dy)) return;
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration, easing: EASE });
  }

  // State view: a map click collapses the hero to a short, full-width map so the store cards below get the room.
  // Order: the search column steps out, the hero glides to its new height while the camera holds, then zooms.
  const copyEl = document.querySelector('.finder-copy');
  const legendEl = document.querySelector('.map-legend');
  let viewSwap = Promise.resolve();

  function setStateView(on) {
    if (finder.classList.contains('is-state-view') === on) return viewSwap;
    hideTip();
    const animate = canAnimate();
    viewSwap = viewSwap.then(async () => {
      if (on && animate) {
        await copyEl.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-8px)' }],
          { duration: 180, easing: 'cubic-bezier(.4, 0, 1, 1)' }).finished;
      }
      const h0 = finder.offsetHeight;
      const camera = cameraSnapshot();
      const legendBefore = legendEl.getBoundingClientRect();
      finder.classList.toggle('is-state-view', on);
      const svgBox = svgEl.getBoundingClientRect();
      mapAspect = svgBox.width / svgBox.height || 975 / 610;
      if (animate) {
        const h1 = finder.offsetHeight;
        finder.animate([{ height: `${h0}px` }, { height: `${h1}px` }], { duration: 700, easing: EASE });
        flip(legendEl, legendBefore, 700);
        if (!on) {
          copyEl.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
            { duration: 500, delay: 260, easing: EASE, fill: 'backwards' });
        }
      }
      holdCamera(camera);
    });
    return viewSwap;
  }

  async function focusState(st, { scrollToGroup, stateView }) {
    activeState = st;
    if (stateView) {
      // Land with the hero just below the sticky site header, not under it.
      const top = finder.getBoundingClientRect().top + window.scrollY - (document.querySelector('.site-header')?.offsetHeight || 0);
      if (window.scrollY > top) window.scrollTo({ top, behavior: canAnimate() ? 'smooth' : 'instant' });
      renderDotStates();
      await setStateView(true);
      if (activeState !== st) return;
    }
    const f = stateFeatures.get(st);
    if (f) zoomTo(fitBounds(path.bounds(f), 1.35), stateView ? 950 : 850);
    renderDirectory();
    renderDotStates();
    if (scrollToGroup) {
      otherEl.open = true;
      openStates.add(st);
      renderDirectory();
      $('state-' + st).scrollIntoView({ behavior: canAnimate() ? 'smooth' : 'instant', block: 'start' });
    } else {
      const list = byState.get(st);
      showStoreList(list.slice().sort((a, b) => (a.kind === 'real' ? -1 : 0) - (b.kind === 'real' ? -1 : 0) || a.city.localeCompare(b.city)), `Stores in ${STATE_NAME[st]}`, null);
    }
  }

  resetBtn.addEventListener('click', () => closeResults({ keepQuery: true }));
  async function resetMap() {
    activeState = null;
    renderDirectory(); renderDotStates();
    await setStateView(false);
    if (activeState) return;
    mapAspect = 975 / 610;
    zoomTo(FULL_VIEW, 950);
  }

  // ---------- Results ----------
  let lastResults = null;

  function miles([lng1, lat1], [lng2, lat2]) {
    const R = 3958.8, rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  // Pickup is a short drive: a search whose nearest real store is farther than this leads with an honest
  // "no store near you yet" instead of dressing a far-away store (or a demo one) up as "Closest to you".
  const PICKUP_RANGE_MILES = 60;

  // `place` names what was searched ("90210", "you") for the empty state; it is set only for ZIP and location searches.
  function showStoresNear(origin, title, you, place) {
    const phone = phoneQuery.matches;
    const dist = (s) => ({ s, d: miles(origin, [s.lng, s.lat]) });
    const byDistance = (a, b) => a.d - b.d;
    const realRanked = stores.filter((s) => s.kind === 'real').map(dist).sort(byDistance);
    const far = !!(you && place && realRanked[0].d > PICKUP_RANGE_MILES);
    // Phones show only stores that take orders (demo placeholders are for the map); a far-away search shows just the nearest real one.
    const pool = phone || far ? realRanked : stores.map(dist).sort(byDistance);
    const ranked = far ? realRanked.slice(0, 1) : pool.slice(0, phone ? 4 : 6);
    nearIds = new Set(ranked.map((r) => r.s.id));
    activeState = null;
    renderDirectory();
    drawYou(you ? origin : null);
    const pts = ranked.map((r) => r.s.xy).filter(Boolean);
    if (you) { const p = projection(origin); if (p) pts.push(p); }
    if (pts.length) zoomTo(fitBounds([[d3.min(pts, (p) => p[0]), d3.min(pts, (p) => p[1])], [d3.max(pts, (p) => p[0]), d3.max(pts, (p) => p[1])]], 1.5));
    renderDotStates();
    showStoreList(ranked.map((r) => r.s), far ? 'Nearest pickup store' : title, new Map(ranked.map((r) => [r.s.id, r.d])), { far: far ? { place, nearest: realRanked[0] } : null });
    return { far };
  }

  // One outcome for ZIP and location searches on every screen: the nearest stores across all states, as cards.
  function leadToNearest(origin, title, place) {
    const outcome = showStoresNear(origin, title, true, place);
    resultsEl.scrollIntoView({ behavior: canAnimate() ? 'smooth' : 'instant', block: phoneQuery.matches ? 'start' : 'nearest' });
    return outcome;
  }

  function drawYou(origin) {
    const g = svg.select('#map-you');
    g.selectAll('*').remove();
    const p = origin && projection(origin);
    if (!p) return;
    g.append('circle').attr('class', 'you-ring').attr('cx', p[0]).attr('cy', p[1]);
    g.append('circle').attr('class', 'you-dot').attr('cx', p[0]).attr('cy', p[1]);
  }

  function showStoreList(list, title, distances, { animate = true, far = null } = {}) {
    lastResults = { list, title, distances, far };
    const entering = resultsEl.hidden;
    resultsEl.hidden = false;
    syncQuick();
    $('results-title').textContent = title;
    // A state list wasn't a search, so its close button shouldn't say "Clear search".
    $('results-clear').textContent = distances ? 'Clear search' : 'Close';
    // In a ranked search the nearest store you can actually pick leads as a full-width card with the list's only
    // dark button; every other card is the same quiet white card with a text action. No badges, no gold.
    const leadIndex = distances ? list.findIndex((s) => s.kind === 'real') : -1;
    const card = (s) => `<li><article class="loc-card">
      <div class="loc-card-top">
        <h3>${label(s)}</h3>
        ${distances ? `<span class="distance">${formatMiles(distances.get(s.id))}</span>` : ''}
      </div>
      <p class="address">${s.kind === 'real' ? s.address : 'A new location, opening soon'}</p>
      <p class="loc-status">${statusFor(s)}</p>
      ${s.kind === 'real' ? `<div class="card-actions">${pickControl(s, 'deg-btn-text result-pick')}</div>` : ''}
    </article></li>`;
    const leadCard = (s, i) => {
      const d = distances.get(s.id);
      const near = far ? 'Nearest pickup store' : i === 0 ? 'Closest to you' : 'Closest store taking orders';
      return `<li class="result-lead"><article class="loc-card is-lead">
      <div class="lead-main">
        <h3>${label(s)}</h3>
        <p class="lead-meta">${near} · ${d < 0.1 ? 'right here' : `${formatMiles(d)} away`}</p>
        <p class="address">${s.kind === 'real' ? s.address : 'A new location, opening soon'}</p>
        <p class="loc-status">${statusFor(s)}</p>
      </div>
      <div class="lead-side">${pickControl(s, 'deg-btn-dark lead-pick')}</div>
    </article></li>`;
    };
    // Too far to pick up: say so plainly first, then show the nearest real store and the shipping route.
    const emptyState = far ? `<li class="result-empty"><div class="empty-state">
      <h3>We don't have a store near ${far.place === 'you' ? 'you' : far.place} yet.</h3>
      <p>The closest pickup store is ${label(far.nearest.s)}, ${formatMiles(far.nearest.d)} away. Want deviled eggs at home instead? <a href="#shipping" data-picker-go="shipping">Nationwide Shipping</a> goes to all 48 contiguous states.</p>
    </div></li>` : '';
    resultList.innerHTML = emptyState + (leadIndex >= 0 ? leadCard(list[leadIndex], leadIndex) : '')
      + list.filter((_, i) => i !== leadIndex).map(card).join('');
    if (!animate || !canAnimate()) return;
    if (entering) resultsEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    // Cards arrive as a list: a short rise with a capped stagger so the first row settles first.
    [...resultList.children].slice(0, 12).forEach((li, i) => {
      li.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
        { duration: 480, delay: (entering ? 120 : 0) + Math.min(i, 7) * 40, easing: EASE, fill: 'backwards' });
    });
  }

  function renderResultsIfOpen() {
    if (lastResults && !resultsEl.hidden) showStoreList(lastResults.list, lastResults.title, lastResults.distances, { animate: false, far: lastResults.far });
  }

  function formatMiles(d) {
    if (d < 0.1) return 'Here';
    return `${d < 10 ? d.toFixed(1) : Math.round(d).toLocaleString()} mi`;
  }

  // Closing results always returns the whole page to its starting state, so nothing stale is left behind.
  async function closeResults({ keepQuery = false } = {}) {
    if (!resultsEl.hidden && canAnimate()) {
      await resultsEl.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px)' }],
        { duration: 200, easing: 'cubic-bezier(.4, 0, 1, 1)' }).finished;
    }
    resultsEl.hidden = true;
    syncQuick();
    lastResults = null;
    nearIds = new Set();
    drawYou(null);
    if (!keepQuery) zipInput.value = '';
    setMessage('');
    resetMap();
  }
  $('results-clear').addEventListener('click', () => closeResults());

  // ---------- ZIP search ----------
  function setMessage(text, isError) {
    zipMsg.textContent = text;
    zipMsg.classList.toggle('is-error', !!isError);
    zipForm.classList.toggle('has-error', !!isError);
    zipInput.setAttribute('aria-invalid', isError ? 'true' : 'false');
  }

  zipInput.addEventListener('input', () => {
    zipInput.value = zipInput.value.replace(/\D/g, '').slice(0, 5);
    if (zipForm.classList.contains('has-error')) setMessage('');
  });

  zipForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const zip = zipInput.value.trim();
    if (!/^\d{5}$/.test(zip)) { setMessage('Enter a 5-digit ZIP code, like 75069.', true); zipInput.focus(); return; }
    zipSubmit.disabled = true;
    setMessage('Finding stores near ' + zip + '…');
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (res.status === 404) { setMessage(`We couldn't find ZIP ${zip}. Check the digits and try again.`, true); return; }
      if (!res.ok) throw new Error('lookup failed');
      const data = await res.json();
      const place = data.places[0];
      const origin = [parseFloat(place.longitude), parseFloat(place.latitude)];
      const outcome = leadToNearest(origin, `Stores near ${zip}`, zip);
      const where = `${place['place name'].replace(/\bMc (\w)/g, 'Mc$1')}, ${place['state abbreviation']} ${zip}`;
      setMessage(outcome.far ? `No store near ${where} yet. Showing the nearest one.` : `Showing the closest stores to ${where}.`);
    } catch (err) {
      setMessage(`ZIP search is unavailable right now. Try "Use my location" or ${phoneQuery.matches ? 'browse the states below' : 'pick a state on the map'}.`, true);
    } finally {
      zipSubmit.disabled = false;
    }
  });

  // ---------- Geolocation ----------
  locateBtn.addEventListener('click', () => {
    if (!navigator.geolocation) { setMessage('Your browser can’t share its location. Search by ZIP instead.', true); return; }
    locateBtn.disabled = true;
    setMessage('Finding your location…');
    navigator.geolocation.getCurrentPosition((pos) => {
      locateBtn.disabled = false;
      const outcome = leadToNearest([pos.coords.longitude, pos.coords.latitude], 'Stores near you', 'you');
      setMessage(outcome.far ? 'No store near you yet. Showing the nearest one.' : 'Showing the stores closest to you.');
    }, () => {
      locateBtn.disabled = false;
      setMessage('We couldn’t get your location. Allow location access, or search by ZIP.', true);
    }, { timeout: 10000, maximumAge: 600000 });
  });

  // Crossing the phone breakpoint: refresh viewport-specific copy, and leave the map-only state view
  // (phones hide the map, so staying in it would show an empty hero).
  phoneQuery.addEventListener('change', (e) => {
    renderSummary();
    if (e.matches && finder.classList.contains('is-state-view')) closeResults({ keepQuery: true });
  });

  // ---------- Floating search ----------
  // Shown whenever the ZIP field isn't on screen (scrolled away, or hidden by the map's state view).
  const searchFab = $('search-fab');
  function setFabAway(away) {
    searchFab.classList.toggle('is-away', away);
    searchFab.inert = away;
    document.body.classList.toggle('has-dock', !viewEl.hidden && !away);
  }
  function zipFieldVisible() {
    const r = zipForm.getBoundingClientRect();
    return r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
  }
  function syncFab() { setFabAway(viewEl.hidden || zipFieldVisible()); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(syncFab).observe(zipForm);
  }
  window.addEventListener('scroll', syncFab, { passive: true });
  window.addEventListener('resize', syncFab);
  new MutationObserver(syncFab).observe(finder, { attributes: true, attributeFilter: ['class'] });

  async function goToSearch() {
    if (finder.classList.contains('is-state-view')) await closeResults({ keepQuery: true });
    window.scrollTo({ top: 0, behavior: canAnimate() ? 'smooth' : 'instant' });
    zipInput.focus({ preventScroll: true });
    zipInput.select();
  }
  searchFab.addEventListener('click', goToSearch);

  // ---------- Phone first screen: the real stores, then "See other locations" ----------
  const quickEl = $('quick-stores');
  const otherEl = $('other-locations');
  function renderQuick() {
    // Alphabetical until a search ranks them by distance (the results section does that and replaces this list).
    const list = realStores.slice().sort((a, b) => a.city.localeCompare(b.city));
    $('quick-list').innerHTML = list.map((s) => `<li class="quick-card">
      <div class="quick-text"><h3>${label(s)}</h3><p>${s.address}</p></div>
      ${pickControl(s, 'deg-btn-dark quick-pick')}
    </li>`).join('');
  }
  function syncQuick() { quickEl.hidden = !phoneQuery.matches || !resultsEl.hidden; }
  // On phones the by-state list starts closed; elsewhere it stays open as before.
  function syncOther() { otherEl.open = !phoneQuery.matches; }
  phoneQuery.addEventListener('change', () => { syncQuick(); syncOther(); });
  // The skip link targets the list, so it opens it first.
  // Handled here, not left to the browser: following "#directory" would change the page hash, and the app reads the hash as the page to show.
  document.querySelector('#view-location-picker .skip-link').addEventListener('click', (e) => {
    e.preventDefault();
    otherEl.open = true;
    const dir = $('directory');
    dir.scrollIntoView({ behavior: canAnimate() ? 'smooth' : 'instant', block: 'start' });
    dir.focus({ preventScroll: true });
  });

  // ---------- Init ----------
  renderQuick();
  syncOther();
  renderDirectory();
  syncQuick();

  // The map is measured in screen pixels, which it can't be while the view is hidden: size it when shown.
  // Called by the app when a funnel opens the picker: new words in, every list that shows them redrawn.
  api.configure = (cfg) => {
    Object.assign(funnelText, cfg);
    $('finder-title').textContent = funnelText.title;
    renderSaved();
    renderQuick();
    renderDirectory();
    renderResultsIfOpen();
  };

  // ---------- Saved order ----------
  // When the customer already chose a store, day and time, the page opens on that choice with a way to carry on.
  const savedEl = $('saved-order');
  function renderSaved() {
    savedEl.hidden = !saved;
    if (!saved) return;
    $('saved-title').textContent = funnelText.savedTitle;
    $('saved-store').textContent = `${saved.city}, ${saved.state}`;
    $('saved-address').textContent = saved.address;
    $('saved-when').textContent = saved.when;
    $('saved-continue').textContent = funnelText.continueLabel;
    $('saved-change').textContent = funnelText.changeLabel;
  }
  $('saved-continue').addEventListener('click', () => { if (api.onContinue) api.onContinue(); });
  $('saved-change').addEventListener('click', () => { if (api.onChangeTime) api.onChangeTime({ city: saved.city, state: saved.state }); });
  // info is { city, state, address, when } while the choice is valid, otherwise null.
  api.setSaved = (info) => {
    saved = info;
    savedId = info ? `real-${info.city}-${info.state}`.toLowerCase() : null;
    renderSaved();
    renderQuick();
    renderDirectory();
    renderResultsIfOpen();
  };

  api.sync = () => { if (!viewEl.hidden) { sizeDots(); renderDotStates(); } syncFab(); };

  // Loaded while the picker is already on screen: apply what app.js had queued, then size the map.
  api.ready = true;
  if (stub.pending.configure) api.configure(stub.pending.configure);
  if (stub.pending.saved !== undefined) api.setSaved(stub.pending.saved);
  api.sync();
})();
