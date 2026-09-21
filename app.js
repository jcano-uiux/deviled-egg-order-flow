(() => {
  const TAX_RATE = 0.0825;
  const PROMO_CODES = { EGGSTRA10: 0.10 };

  const ADD_ICON = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M15.8333 8.75H11.25V4.16667H8.75V8.75H4.16667V11.25H8.75V15.8333H11.25V11.25H15.8333V8.75Z" fill="currentColor"/></svg>';

  const eggThumb = () => {
    const div = document.createElement('div');
    div.className = 'thumb';
    div.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="13" rx="7" ry="8.5" stroke="#D9D1BF" stroke-width="1.5"/><path d="M6 8c1-3 3-5 6-5s5 2 6 5" stroke="#D9D1BF" stroke-width="1.5" stroke-linecap="round"/></svg>';
    return div;
  };

  // Real product photo when we have one; the placeholder egg icon otherwise
  // (a few catering bundles have no matching photo in the client asset pack).
  const productThumb = (item) => {
    if (!item.image) return eggThumb();
    const img = document.createElement('img');
    img.className = 'shop-card-photo';
    img.src = item.image;
    img.alt = item.name;
    img.loading = 'lazy';
    return img;
  };

  // Menu data extracted from the live ordering widget at deviledeggco.com/mckinney-tx/
  const DEVILED_EGGS = [
    { id: '2-pack', name: '2 Pack Deviled Egg', price: 4.99, note: '140 Cal.', desc: 'Two of our signature gourmet deviled eggs — perfect for a quick snack or a tasty add-on to any meal.', image: 'assets/products/2-pack.jpg' },
    { id: '6-pack-3-flavors', name: '6 Pack – 3 Flavors', price: 12.99, note: '420 Cal.', desc: 'Six deviled eggs in three delicious flavors — a great way to sample our most popular creations.', image: 'assets/products/6-pack-3-flavors.jpg' },
    { id: '6-pack-6-flavors', name: '6 Pack – 6 Flavors', price: 14.99, note: '420 Cal.', desc: 'Six deviled eggs, each a different flavor — try them all and find your favorite.', image: 'assets/products/6-pack-6-flavors.jpg' },
    { id: '12-pack', name: '12 Pack Deviled Egg', price: 24.99, note: '840 Cal.', desc: 'A dozen of our gourmet deviled eggs — perfect for sharing at parties, picnics, or family gatherings.', image: 'assets/products/12-pack.jpg' },
    { id: '24-count-platter', name: '24 Count Deviled Egg Platter', price: 44.99, note: '1680 Cal.', desc: 'A stunning platter of 24 deviled eggs — the ultimate centerpiece for your next event or celebration.', image: 'assets/products/24-count-platter.jpg' },
    { id: 'try-them-all-platter', name: 'Try Them All Deviled Egg Platter', price: 54.99, note: '1800 Cal.', desc: 'Every flavor we offer on one beautiful platter — the complete Deviled Egg Co. experience.', image: 'assets/products/try-them-all-platter.jpg' },
  ];

  const PROTEIN_BOWLS = [
    { id: 'avo-chick-blt', name: 'Avo Chick-BLT Eggceptional Bowl', price: 14.99, note: '79g Protein', desc: 'Avocado, grilled chicken, crispy bacon, lettuce, tomato, and our signature deviled eggs.', image: 'assets/products/avo-chick-blt-bowl.jpg' },
    { id: 'cheeseburger', name: 'Cheeseburger Eggceptional Bowl', price: 14.99, note: '47g Protein', desc: 'Seasoned beef, cheese, pickles, and our famous deviled eggs in bowl form.', image: 'assets/products/cheeseburger-bowl.jpg' },
    { id: 'caesar', name: 'The Caesar Eggceptional Bowl', price: 14.99, note: '70g Protein', desc: 'Crisp romaine, parmesan, croutons, and our signature deviled eggs.', image: 'assets/products/caesar-bowl.jpg' },
    { id: 'buffalo', name: 'Buffalo Eggceptional Bowl', price: 14.99, desc: 'Bold buffalo flavors paired with cool ranch and our signature deviled eggs.', image: 'assets/products/buffalo-bowl.jpg' },
    { id: 'walking-taco', name: 'Walking Taco Eggceptional Bowl', price: 14.99, note: '70g Protein', desc: 'Seasoned meat, crunchy chips, cheese, salsa, and deviled eggs in one bowl.', image: 'assets/products/walking-taco-bowl.jpg' },
    { id: 'bangin-brisket', name: 'Bangin’ Brisket Eggceptional Bowl', price: 14.99, note: '57g Protein', desc: 'Slow-smoked brisket paired with our deviled eggs for bold Texas flavor.', image: 'assets/products/bangin-brisket-bowl.jpg' },
    { id: 'pok-egg', name: 'Pok-Egg Eggceptional Bowl', price: 14.99, note: '32g Protein', desc: 'Hawaiian-inspired poke-style bowl with crisp vegetables and deviled eggs.', image: 'assets/products/pok-egg-bowl.jpg' },
  ];

  const EGG_SALADS = [
    { id: 'half-pint', name: '1/2 Pint Deviled Egg Salad – 8oz', price: 8.99, note: '320 Cal.', desc: 'Our creamy, tangy deviled egg salad in a convenient half-pint portion.', image: 'assets/products/egg-salad-half-pint.jpg' },
    { id: 'whole-pint', name: 'Whole Pint Deviled Egg Salad – 16oz', price: 12.99, note: '640 Cal.', desc: 'A full pint of our signature deviled egg salad — perfect for sharing.', image: 'assets/products/egg-salad-pint.jpg' },
  ];

  const PLATTERS = [
    { id: '24-count', name: '24 Count Deviled Egg Platter', price: 44.99, note: '1680 Cal.', desc: 'A stunning platter of 24 deviled eggs — the ultimate centerpiece for your next event or celebration.', image: 'assets/products/24-count-platter.jpg' },
    { id: 'try-them-all', name: 'Try Them All Deviled Egg Platter', price: 54.99, note: '1800 Cal.', desc: 'Every flavor we offer on one beautiful platter — the complete Deviled Egg Co. experience.', image: 'assets/products/try-them-all-platter.jpg' },
  ];

  const CATERING = [
    { id: 'classic-choice', name: 'The Classic Choice', price: 10, note: 'Per person · min 10 boxes', desc: 'A crowd-pleasing catering option with our classic deviled egg selection.' },
    { id: 'all-in-power-lunch', name: 'The “All In” Power Lunch', price: 12.50, note: 'Per person · min 10 boxes', desc: 'The complete lunch experience — deviled eggs, sides, and drinks for your team.', image: 'assets/products/all-in-power-lunch.jpg' },
    { id: 'coffee-bar', name: 'Catering Coffee Bar', price: 24.99, note: 'Per service · serves 10–12', desc: 'A full coffee bar service to complement your catering order.' },
    { id: 'power-pair', name: 'Power Pair Bundle', price: 59.99, note: 'Per bundle · serves 10', desc: 'Two of our most popular items bundled together for easy group ordering.' },
    { id: 'bagel-brew', name: 'Bagel & Brew Bundle', price: 69.99, note: 'Per bundle · serves 10', desc: 'Fresh bagels with deviled egg salad plus our coffee bar — perfect for morning meetings.' },
    { id: 'hungry-team', name: 'The “Hungry Team”', price: 99.99, note: 'Per bundle · serves 10', desc: 'Our biggest catering bundle — feeds a hungry team with all the favorites.' },
    { id: 'light-lunch', name: 'The “Light Lunch”', price: 69.99, note: 'Per bundle · serves 10', desc: 'A lighter catering option that still packs all the deviled egg flavor.' },
  ];

  const BAGEL_FLAVORS = [
    'Traditional', 'Buffalo Chicken', 'Buffalo Blue Cheese', 'Walking Taco', 'South of the Border',
    'Bacon Wrapped Jalapeño Popper', 'Everything Bagel', 'Smoked Salmon', 'Crab Rangoon', 'Cali Roll',
    'Cheeseburger', 'Bangin’ Brisket', 'Chicken ’n a Pickle', 'Chicken Bacon Ranch', 'BLTE',
    'Chicken Caesar Salad', 'Ball Park', 'Sriracha Bacon', 'Chicken and Waffle',
  ];
  const BAGEL_PRICE = 7.49;
  const BAGEL_IMAGE = 'assets/products/full-size-bagel.jpg';
  const BAGEL_NOTE = '350 Cal.';
  const BAGEL_DESC = 'A fresh bagel loaded with our signature deviled egg salad — the perfect quick bite.';

  const FLAVORS = [
    { id: 'classic', label: 'Classic' },
    { id: 'bacon', label: 'Bacon Cheddar Ranch' },
    { id: 'jalapeno', label: 'Jalapeño Popper' },
    { id: 'buffalo', label: 'Buffalo Chicken' },
    { id: 'salmon', label: 'Smoked Salmon' },
    { id: 'everything', label: 'Everything Bagel' },
    { id: 'greek', label: 'Greek' },
    { id: 'walkingtaco', label: 'Walking Taco' },
  ];

  const DELIVERY_FEES = { priority: 3.99, standard: 0, schedule: 0 };

  const state = {
    cart: [],
    modalSelected: new Set(['classic', 'bacon', 'jalapeno', 'salmon']),
    modalQty: 1,
    bagelToast: 'Not Toasted',
    bagelType: 'Plain',
    bagelFlavors: {},
    bagelOptions: new Set(),
    bagelQty: 1,
    promo: null,
    promoAmount: 0,
    mode: 'pickup',
    location: 'McKinney, TX',
    time: 'asap',
    deliveryOption: 'standard',
    dropoff: 'Meet at my door',
    payment: 'Apple Pay',
    tipPct: 18,
  };

  try {
    const saved = JSON.parse(localStorage.getItem('deg-cart') || 'null');
    if (Array.isArray(saved)) state.cart = saved;
  } catch (e) { /* ignore corrupt storage */ }

  function persistCart() {
    localStorage.setItem('deg-cart', JSON.stringify(state.cart));
  }

  function money(n) { return '$' + n.toFixed(2); }

  function cartCount() {
    return state.cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function cartSubtotal() {
    return state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function addToCart(entry) {
    const existing = state.cart.find((c) => c.key === entry.key);
    if (existing) {
      existing.qty += entry.qty;
    } else {
      state.cart.push(entry);
    }
    persistCart();
    renderCartBadge();
    renderDrawer();
  }

  // ---------- Header / cart badge ----------
  function renderCartBadge() {
    document.getElementById('cart-badge').textContent = String(cartCount());
  }

  // ---------- Menu grids ----------
  function renderGrids() {
    renderShopGrid('deviled-eggs-grid', DEVILED_EGGS, 'egg', 'Deviled eggs');
    renderShopGrid('protein-bowls-grid', PROTEIN_BOWLS, 'bowl', 'Protein bowl');
    renderShopGrid('egg-salads-grid', EGG_SALADS, 'saladcup', 'Egg salad');
    renderShopGrid('platters-grid', PLATTERS, 'platter', 'Party platter');
    renderShopGrid('catering-grid', CATERING, 'catering', 'Catering');
    renderBagelCard();
  }

  function renderShopGrid(gridId, items, keyPrefix, cartCategory) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    items.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'shop-card';

      const body = document.createElement('div');
      body.className = 'shop-card-body';
      body.innerHTML = `
        <span class="shop-card-name">${item.name}</span>
        <span class="shop-card-meta">
          <span class="shop-card-price">${money(item.price)}</span>
          ${item.note ? `<span aria-hidden="true">•</span><span class="shop-card-note">${item.note}</span>` : ''}
        </span>
        ${item.desc ? `<span class="shop-card-desc">${item.desc}</span>` : ''}
      `;
      card.appendChild(body);

      const media = document.createElement('div');
      media.className = 'shop-card-media';
      media.appendChild(productThumb(item));
      const btn = document.createElement('button');
      btn.className = 'add-btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Add ' + item.name + ' to order');
      btn.innerHTML = ADD_ICON;
      const activate = () => {
        addToCart({ key: keyPrefix + '-' + item.id, name: item.name, sub: cartCategory, price: item.price, qty: 1 });
      };
      btn.addEventListener('click', activate);
      media.appendChild(btn);
      card.appendChild(media);

      // The whole card is one clickable target (matches the Figma shop_list_item
      // component, where the Quick Add button sits inside a single card-wide Link).
      // The button keeps its own listener for keyboard/focus; this only handles
      // clicks elsewhere on the card, so the action never fires twice.
      card.addEventListener('click', (e) => {
        if (e.target.closest('.add-btn')) return;
        activate();
      });

      grid.appendChild(card);
    });
  }

  function renderBagelCard() {
    const grid = document.getElementById('bagels-grid');
    grid.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'shop-card';

    const body = document.createElement('div');
    body.className = 'shop-card-body';
    body.innerHTML = `<span class="shop-card-name">Full Size Bagel</span><span class="shop-card-meta"><span class="shop-card-price">${money(BAGEL_PRICE)}</span><span aria-hidden="true">•</span><span class="shop-card-note">${BAGEL_NOTE}</span></span><span class="shop-card-desc">${BAGEL_DESC}</span>`;
    card.appendChild(body);

    const media = document.createElement('div');
    media.className = 'shop-card-media';
    media.appendChild(productThumb({ image: BAGEL_IMAGE, name: 'Full Size Bagel' }));
    const btn = document.createElement('button');
    btn.className = 'add-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Customize Full Size Bagel');
    btn.innerHTML = ADD_ICON;
    btn.addEventListener('click', openBagelModal);
    media.appendChild(btn);
    card.appendChild(media);

    card.addEventListener('click', (e) => {
      if (e.target.closest('.add-btn')) return;
      openBagelModal();
    });

    grid.appendChild(card);
  }

  // ---------- Category navigation ----------
  document.querySelectorAll('.category-item[data-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-item').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ---------- Pickup / delivery toggle ----------
  function updateModeUI() {
    const isDelivery = state.mode === 'delivery';
    document.getElementById('pickup-details-card').hidden = isDelivery;
    document.getElementById('delivery-details-card').hidden = !isDelivery;
    renderDrawer();
  }

  document.getElementById('order-mode').addEventListener('click', (e) => {
    const btn = e.target.closest('.order-mode-option');
    if (!btn) return;
    document.querySelectorAll('#order-mode .order-mode-option').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.mode = btn.dataset.mode;
    updateModeUI();
  });

  // ---------- Overlay focus management ----------
  const pageRoot = document.getElementById('page-root');
  let lastFocusedEl = null;

  function updateInert() {
    const anyOpen = !itemModal.hidden || !bagelModal.hidden || !cartDrawer.hidden;
    pageRoot.inert = anyOpen;
    document.body.style.overflow = anyOpen ? 'hidden' : '';
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!itemModal.hidden) closeDozenModal();
    else if (!bagelModal.hidden) closeBagelModal();
    else if (!cartDrawer.hidden) closeCart();
  });

  // ---------- Item customization modal ----------
  const modalBackdrop = document.getElementById('modal-backdrop');
  const itemModal = document.getElementById('item-modal');

  function renderFlavorGrid() {
    const grid = document.getElementById('flavor-grid');
    grid.innerHTML = '';
    FLAVORS.forEach((f) => {
      const selected = state.modalSelected.has(f.id);
      const atLimit = state.modalSelected.size >= 4 && !selected;
      const row = document.createElement('button');
      row.type = 'button';
      row.disabled = atLimit;
      row.className = 'flavor-row' + (selected ? ' selected' : '');
      row.innerHTML = `<span class="flavor-box">${selected ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#261A00" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</span><span>${f.label}</span>`;
      row.addEventListener('click', () => {
        if (selected) {
          state.modalSelected.delete(f.id);
        } else if (state.modalSelected.size < 4) {
          state.modalSelected.add(f.id);
        }
        renderFlavorGrid();
        renderModalFooter();
      });
      grid.appendChild(row);
    });
    document.getElementById('flavor-count').textContent = `${state.modalSelected.size}/4 selected`;
  }

  function renderModalFooter() {
    document.getElementById('qty-value').textContent = String(state.modalQty);
    const total = 24.99 * state.modalQty;
    document.getElementById('add-to-order').textContent = `Add ${state.modalQty} to order · ${money(total)}`;
  }

  function openDozenModal() {
    lastFocusedEl = document.activeElement;
    state.modalSelected = new Set(['classic', 'bacon', 'jalapeno', 'salmon']);
    state.modalQty = 1;
    document.getElementById('item-note').value = '';
    renderFlavorGrid();
    renderModalFooter();
    modalBackdrop.hidden = false;
    itemModal.hidden = false;
    updateInert();
    document.getElementById('close-modal').focus();
  }

  function closeDozenModal() {
    modalBackdrop.hidden = true;
    itemModal.hidden = true;
    updateInert();
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.getElementById('open-dozen-modal').addEventListener('click', openDozenModal);
  document.getElementById('close-modal').addEventListener('click', closeDozenModal);
  modalBackdrop.addEventListener('click', closeDozenModal);

  document.getElementById('qty-dec').addEventListener('click', () => {
    state.modalQty = Math.max(1, state.modalQty - 1);
    renderModalFooter();
  });
  document.getElementById('qty-inc').addEventListener('click', () => {
    state.modalQty += 1;
    renderModalFooter();
  });

  document.getElementById('add-to-order').addEventListener('click', () => {
    const flavorLabels = FLAVORS.filter((f) => state.modalSelected.has(f.id)).map((f) => f.label);
    const note = document.getElementById('item-note').value.trim();
    addToCart({
      key: 'dozen-' + flavorLabels.join('-') + (note ? '-' + note : '') + '-' + Date.now(),
      name: 'Build Your Own Dozen',
      sub: flavorLabels.join(', ') + (note ? ' · Note: ' + note : ''),
      price: 24.99,
      qty: state.modalQty,
    });
    closeDozenModal();
    openCart();
  });

  // ---------- Bagel customization modal ----------
  const bagelModalBackdrop = document.getElementById('bagel-modal-backdrop');
  const bagelModal = document.getElementById('bagel-modal');

  function renderBagelFlavorSteppers() {
    const container = document.getElementById('bagel-flavor-steppers');
    container.innerHTML = '';
    BAGEL_FLAVORS.forEach((flavor) => {
      const qty = state.bagelFlavors[flavor] || 0;
      const row = document.createElement('div');
      row.className = 'flavor-row' + (qty > 0 ? ' selected' : '');
      row.style.justifyContent = 'space-between';
      row.innerHTML = `
        <span>${flavor}</span>
        <div class="mini-stepper">
          <button class="mini-step-btn" type="button" aria-label="Decrease ${flavor}">−</button>
          <span>${qty}</span>
          <button class="mini-step-btn" type="button" aria-label="Increase ${flavor}">+</button>
        </div>
      `;
      const [decBtn, incBtn] = row.querySelectorAll('.mini-step-btn');
      decBtn.addEventListener('click', () => {
        const current = state.bagelFlavors[flavor] || 0;
        if (current <= 1) delete state.bagelFlavors[flavor];
        else state.bagelFlavors[flavor] = current - 1;
        renderBagelFlavorSteppers();
      });
      incBtn.addEventListener('click', () => {
        state.bagelFlavors[flavor] = (state.bagelFlavors[flavor] || 0) + 1;
        renderBagelFlavorSteppers();
      });
      container.appendChild(row);
    });
    const total = Object.values(state.bagelFlavors).reduce((sum, n) => sum + n, 0);
    document.getElementById('bagel-spread-count').textContent = `${total} added`;
  }

  function renderBagelModalFooter() {
    document.getElementById('bagel-qty-value').textContent = String(state.bagelQty);
    const total = BAGEL_PRICE * state.bagelQty;
    document.getElementById('add-bagel-to-order').textContent = `Add ${state.bagelQty} to order · ${money(total)}`;
  }

  function openBagelModal() {
    lastFocusedEl = document.activeElement;
    state.bagelToast = 'Not Toasted';
    state.bagelType = 'Plain';
    state.bagelFlavors = {};
    state.bagelOptions = new Set();
    state.bagelQty = 1;
    document.querySelectorAll('#bagel-toast-picker .chip').forEach((b) => b.classList.toggle('active', b.dataset.value === state.bagelToast));
    document.querySelectorAll('#bagel-type-picker .chip').forEach((b) => b.classList.toggle('active', b.dataset.value === state.bagelType));
    document.querySelectorAll('#bagel-options-picker .chip').forEach((b) => b.classList.remove('active'));
    renderBagelFlavorSteppers();
    renderBagelModalFooter();
    bagelModalBackdrop.hidden = false;
    bagelModal.hidden = false;
    updateInert();
    document.getElementById('close-bagel-modal').focus();
  }

  function closeBagelModal() {
    bagelModalBackdrop.hidden = true;
    bagelModal.hidden = true;
    updateInert();
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.getElementById('close-bagel-modal').addEventListener('click', closeBagelModal);
  bagelModalBackdrop.addEventListener('click', closeBagelModal);

  document.getElementById('bagel-toast-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    document.querySelectorAll('#bagel-toast-picker .chip').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.bagelToast = btn.dataset.value;
  });

  document.getElementById('bagel-type-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    document.querySelectorAll('#bagel-type-picker .chip').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.bagelType = btn.dataset.value;
  });

  document.getElementById('bagel-options-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    const value = btn.dataset.value;
    if (state.bagelOptions.has(value)) {
      state.bagelOptions.delete(value);
      btn.classList.remove('active');
    } else {
      state.bagelOptions.add(value);
      btn.classList.add('active');
    }
  });

  document.getElementById('bagel-qty-dec').addEventListener('click', () => {
    state.bagelQty = Math.max(1, state.bagelQty - 1);
    renderBagelModalFooter();
  });
  document.getElementById('bagel-qty-inc').addEventListener('click', () => {
    state.bagelQty += 1;
    renderBagelModalFooter();
  });

  document.getElementById('add-bagel-to-order').addEventListener('click', () => {
    const flavorParts = Object.entries(state.bagelFlavors)
      .filter(([, qty]) => qty > 0)
      .map(([flavor, qty]) => (qty > 1 ? `${qty}x ${flavor}` : flavor));
    const parts = [state.bagelType, state.bagelToast];
    if (flavorParts.length) parts.push(flavorParts.join(', '));
    if (state.bagelOptions.size) parts.push(Array.from(state.bagelOptions).join(', '));
    addToCart({
      key: 'bagel-' + JSON.stringify({ t: state.bagelType, toast: state.bagelToast, f: state.bagelFlavors, o: Array.from(state.bagelOptions) }) + '-' + Date.now(),
      name: 'Full Size Bagel',
      sub: parts.join(' · '),
      price: BAGEL_PRICE,
      qty: state.bagelQty,
    });
    closeBagelModal();
    openCart();
  });

  // ---------- Cart drawer ----------
  const cartBackdrop = document.getElementById('cart-backdrop');
  const cartDrawer = document.getElementById('cart-drawer');
  let cartCloseTimer = null;

  function openCart() {
    if (cartCloseTimer) { window.clearTimeout(cartCloseTimer); cartCloseTimer = null; }
    lastFocusedEl = document.activeElement;
    renderDrawer();
    cartBackdrop.hidden = false;
    cartDrawer.hidden = false;
    updateInert();
    // Force layout so the browser commits the off-screen/transparent
    // starting state before the class below changes it — otherwise the
    // transition has no "from" to animate away from and just snaps in.
    cartDrawer.getBoundingClientRect();
    cartBackdrop.classList.add('is-open');
    cartDrawer.classList.add('is-open');
    document.getElementById('close-cart').focus();
  }
  function closeCart() {
    if (cartDrawer.hidden) return;
    cartBackdrop.classList.remove('is-open');
    cartDrawer.classList.remove('is-open');
    if (lastFocusedEl) lastFocusedEl.focus();
    if (cartCloseTimer) window.clearTimeout(cartCloseTimer);
    cartCloseTimer = window.setTimeout(() => {
      cartBackdrop.hidden = true;
      cartDrawer.hidden = true;
      updateInert();
      cartCloseTimer = null;
    }, 220);
  }

  document.getElementById('open-cart').addEventListener('click', openCart);
  document.getElementById('close-cart').addEventListener('click', closeCart);
  cartBackdrop.addEventListener('click', closeCart);

  function computeTotals() {
    const subtotal = cartSubtotal();
    const promoAmount = state.promo ? subtotal * state.promo : 0;
    const taxedBase = Math.max(0, subtotal - promoAmount);
    const tax = taxedBase * TAX_RATE;
    const deliveryFee = state.mode === 'delivery' ? (DELIVERY_FEES[state.deliveryOption] || 0) : 0;
    const total = taxedBase + tax + deliveryFee;
    return { subtotal, promoAmount, tax, deliveryFee, total };
  }

  function renderDrawer() {
    const list = document.getElementById('drawer-items');
    list.innerHTML = '';

    if (state.cart.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-cart';
      empty.textContent = 'Your cart is empty. Add something delicious from the menu.';
      list.appendChild(empty);
    }

    state.cart.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'drawer-item';
      const thumb = eggThumb();
      thumb.style.width = '56px';
      thumb.style.height = '56px';
      row.appendChild(thumb);

      const body = document.createElement('div');
      body.className = 'drawer-item-body';
      body.innerHTML = `<span class="drawer-item-name">${item.name}</span><span class="drawer-item-sub">${item.sub}</span>`;
      row.appendChild(body);

      const actions = document.createElement('div');
      actions.className = 'drawer-item-actions';
      actions.innerHTML = `
        <span class="item-price">${money(item.price * item.qty)}</span>
        <div class="mini-stepper">
          <button class="mini-step-btn" type="button" aria-label="Decrease quantity">−</button>
          <span>${item.qty}</span>
          <button class="mini-step-btn" type="button" aria-label="Increase quantity">+</button>
        </div>
      `;
      const [decBtn, , incBtn] = actions.querySelectorAll('.mini-step-btn, span');
      actions.querySelectorAll('.mini-step-btn')[0].addEventListener('click', () => {
        if (item.qty <= 1) {
          state.cart.splice(index, 1);
        } else {
          item.qty -= 1;
        }
        persistCart();
        renderCartBadge();
        renderDrawer();
      });
      actions.querySelectorAll('.mini-step-btn')[1].addEventListener('click', () => {
        item.qty += 1;
        persistCart();
        renderCartBadge();
        renderDrawer();
      });
      row.appendChild(actions);
      list.appendChild(row);
    });

    const { subtotal, promoAmount, tax, deliveryFee, total } = computeTotals();
    document.getElementById('drawer-subtotal').textContent = money(subtotal);
    document.getElementById('drawer-tax').textContent = money(tax);
    document.getElementById('drawer-total').textContent = money(total);
    const promoLine = document.getElementById('drawer-promo-line');
    if (promoAmount > 0) {
      promoLine.hidden = false;
      document.getElementById('drawer-promo').textContent = '−' + money(promoAmount);
    } else {
      promoLine.hidden = true;
    }
    const deliveryFeeLine = document.getElementById('drawer-delivery-fee-line');
    if (state.mode === 'delivery') {
      deliveryFeeLine.hidden = false;
      document.getElementById('drawer-delivery-fee').textContent = money(deliveryFee);
    } else {
      deliveryFeeLine.hidden = true;
    }

    const pinIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 22s7-7.58 7-12A7 7 0 0 0 5 10c0 4.42 7 12 7 12Z" stroke="#402D00" stroke-width="1.8"/><circle cx="12" cy="10" r="2.5" stroke="#402D00" stroke-width="1.8"/></svg>';
    const chip = document.getElementById('fulfillment-chip');
    chip.innerHTML = state.mode === 'delivery'
      ? `${pinIcon}<span>Delivery · Today, ${state.deliveryOption === 'priority' ? '10–20' : '25–40'} min</span>`
      : `${pinIcon}<span>Pickup at <strong>${state.location}</strong> · Today, ASAP (15–20 min)</span>`;

    document.getElementById('go-to-checkout').disabled = state.cart.length === 0;
  }

  document.getElementById('apply-promo').addEventListener('click', () => {
    const code = document.getElementById('promo-input').value.trim().toUpperCase();
    const msg = document.getElementById('promo-msg');
    if (!code) return;
    if (PROMO_CODES[code]) {
      state.promo = PROMO_CODES[code];
      msg.textContent = `Promo applied — ${Math.round(state.promo * 100)}% off your order.`;
      msg.classList.remove('error');
    } else {
      state.promo = null;
      msg.textContent = 'That code isn’t valid. Try EGGSTRA10.';
      msg.classList.add('error');
    }
    renderDrawer();
  });

  // ---------- View switching ----------
  const views = {
    menu: document.getElementById('view-menu'),
    checkout: document.getElementById('view-checkout'),
    confirmation: document.getElementById('view-confirmation'),
  };

  function showView(name) {
    Object.entries(views).forEach(([key, el]) => { el.hidden = key !== name; });
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  document.getElementById('go-to-checkout').addEventListener('click', () => {
    if (state.cart.length === 0) return;
    closeCart();
    renderCheckout();
    showView('checkout');
  });

  document.getElementById('back-to-cart').addEventListener('click', () => {
    showView('menu');
    openCart();
  });

  // ---------- Checkout view ----------
  function bindChipGroup(containerId, stateKey, onChange) {
    const container = document.getElementById(containerId);
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-value]');
      if (!btn) return;
      container.querySelectorAll('[data-value]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state[stateKey] = btn.dataset.value;
      if (onChange) onChange();
    });
  }

  bindChipGroup('location-picker', 'location');
  bindChipGroup('time-picker', 'time');
  bindChipGroup('dropoff-picker', 'dropoff');

  document.getElementById('delivery-option-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('.option-row');
    if (!btn) return;
    document.querySelectorAll('#delivery-option-picker .option-row').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.deliveryOption = btn.dataset.value;
    renderCheckoutTotals();
  });

  document.getElementById('payment-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-value]');
    if (!btn) return;
    document.querySelectorAll('#payment-picker .radio-row').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.payment = btn.dataset.value;
  });

  document.getElementById('tip-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-value]');
    if (!btn) return;
    document.querySelectorAll('#tip-picker .chip').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.tipPct = Number(btn.dataset.value);
    renderCheckoutTotals();
  });

  function renderCheckout() {
    const list = document.getElementById('checkout-items');
    list.innerHTML = '';
    state.cart.forEach((item) => {
      const line = document.createElement('div');
      line.className = 'summary-line';
      line.innerHTML = `<span>${item.name} ×${item.qty}</span><span>${money(item.price * item.qty)}</span>`;
      list.appendChild(line);
    });
    renderCheckoutTotals();
  }

  function renderCheckoutTotals() {
    const { subtotal, promoAmount, tax, deliveryFee, total: preTipTotal } = computeTotals();
    const tipAmt = (subtotal - promoAmount) * (state.tipPct / 100);
    const total = preTipTotal + tipAmt;

    document.getElementById('sum-subtotal').textContent = money(subtotal);
    document.getElementById('sum-tax').textContent = money(tax);
    document.getElementById('sum-tip').textContent = money(tipAmt);
    document.getElementById('sum-total').textContent = money(total);
    const promoLine = document.getElementById('promo-line');
    if (promoAmount > 0) {
      promoLine.hidden = false;
      document.getElementById('sum-promo').textContent = '−' + money(promoAmount);
    } else {
      promoLine.hidden = true;
    }
    const deliveryFeeLine = document.getElementById('sum-delivery-fee-line');
    if (state.mode === 'delivery') {
      deliveryFeeLine.hidden = false;
      document.getElementById('sum-delivery-fee').textContent = money(deliveryFee);
    } else {
      deliveryFeeLine.hidden = true;
    }
    document.getElementById('place-order').textContent = `Place order · ${money(total)}`;
    return total;
  }

  const STORE_ADDRESSES = {
    'McKinney, TX': '111 W Virginia St, McKinney, TX 75069',
    'Denison, TX': '231 W Main St, Denison, TX 75020',
    'Rockwall, TX': '2065 Summer Lee Drive, Rockwall, TX 75032',
    'Coppell, TX': '3001 Olympus Blvd, Suite 100, Coppell, TX 75019',
  };

  const PIN_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 22s7-7.58 7-12A7 7 0 0 0 5 10c0 4.42 7 12 7 12Z" stroke="#402D00" stroke-width="1.8"/><circle cx="12" cy="10" r="2.5" stroke="#402D00" stroke-width="1.8"/></svg>';

  document.getElementById('place-order').addEventListener('click', () => {
    if (state.cart.length === 0) return;

    if (state.mode === 'delivery') {
      const addr = document.getElementById('delivery-address').value.trim();
      const errEl = document.getElementById('delivery-address-error');
      if (!addr) {
        errEl.hidden = false;
        document.getElementById('delivery-address').focus();
        return;
      }
      errEl.hidden = true;
    }

    const total = renderCheckoutTotals();
    const orderNumber = '#DE-' + Math.floor(10000 + Math.random() * 89999);

    const subEl = document.getElementById('confirm-sub');
    const stepLabelEl = document.getElementById('progress-step3-label');
    const fulfillmentCard = document.getElementById('fulfillment-card');

    if (state.mode === 'delivery') {
      const addr = document.getElementById('delivery-address').value.trim();
      const apt = document.getElementById('delivery-apt').value.trim();
      const fullAddress = apt ? `${addr}, ${apt}` : addr;
      const eta = state.deliveryOption === 'priority' ? '10–20 min'
        : state.deliveryOption === 'schedule' ? 'your scheduled time'
        : '25–40 min';

      subEl.innerHTML = `Order <strong>${orderNumber}</strong> · On its way to <strong>${fullAddress}</strong> — arriving in <strong>${eta}</strong>`;
      stepLabelEl.textContent = 'On the way';
      fulfillmentCard.innerHTML = `${PIN_ICON}<span>${fullAddress} · ${state.dropoff}</span>`;
    } else {
      const address = STORE_ADDRESSES[state.location] || STORE_ADDRESSES['McKinney, TX'];
      const readyBy = state.time === 'asap' ? '12:45 PM' : 'your scheduled time';

      subEl.innerHTML = `Order <strong>${orderNumber}</strong> · We're preparing it now — ready for pickup at <strong>${state.location}</strong> by <strong>${readyBy}</strong>`;
      stepLabelEl.textContent = 'Ready';
      fulfillmentCard.innerHTML = `${PIN_ICON}<span>${address}</span><a class="pill-btn outline" id="get-directions" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" target="_blank" rel="noopener">Get directions</a>`;
    }

    const confirmItems = document.getElementById('confirm-items');
    confirmItems.innerHTML = '';
    state.cart.forEach((item) => {
      const line = document.createElement('div');
      line.className = 'summary-line';
      line.innerHTML = `<span>${item.name} ×${item.qty}</span><span>${money(item.price * item.qty)}</span>`;
      confirmItems.appendChild(line);
    });
    document.getElementById('confirm-total').textContent = money(total);

    state.cart = [];
    state.promo = null;
    persistCart();
    renderCartBadge();

    showView('confirmation');
  });

  document.getElementById('back-to-menu').addEventListener('click', () => {
    showView('menu');
  });

  // ---------- Init ----------
  renderGrids();
  renderCartBadge();
  renderDrawer();
})();
