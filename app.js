(() => {
  const TAX_RATE = 0.0825;

  const ADD_ICON = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M15.8333 8.75H11.25V4.16667H8.75V8.75H4.16667V11.25H8.75V15.8333H11.25V11.25H15.8333V8.75Z" fill="currentColor"/></svg>';
  const LAUNCH_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const DELIVERY_APPS = [
    { id: 'doordash', name: 'DoorDash', url: 'https://www.doordash.com', logo: 'assets/logos/doordash.svg', color: '#FF3008' },
    { id: 'ubereats', name: 'Uber Eats', url: 'https://www.ubereats.com', logo: 'assets/logos/ubereats.svg', color: '#06C167' },
    { id: 'grubhub', name: 'Grubhub', url: 'https://www.grubhub.com', logo: 'assets/logos/grubhub.svg', color: '#FF5500' },
  ];

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
  // pickerConfig (total pieces + max distinct flavors) is verified per-product
  // against each product's own live page — the max-flavor cap and the
  // resulting step size (total ÷ maxFlavors) both vary per pack size and do
  // NOT follow a single formula (e.g. the 24 Count Platter caps at 3 flavors,
  // not 4, with a step of 8). "Try Them All" has no picker on the live site
  // (it's a fixed platter of every flavor), so it carries none here either.
  const DEVILED_EGGS = [
    { id: '2-pack', name: '2 Pack Deviled Egg', price: 4.99, note: '140 Cal.', desc: 'Two of our signature gourmet deviled eggs — perfect for a quick snack or a tasty add-on to any meal.', image: 'assets/products/2-pack.jpg', pickerConfig: { total: 2, maxFlavors: 2 } },
    { id: '6-pack-3-flavors', name: '6 Pack – 3 Flavors', price: 12.99, note: '420 Cal.', desc: 'Six deviled eggs in three delicious flavors — a great way to sample our most popular creations.', image: 'assets/products/6-pack-3-flavors.jpg', pickerConfig: { total: 6, maxFlavors: 3 } },
    { id: '6-pack-6-flavors', name: '6 Pack – 6 Flavors', price: 14.99, note: '420 Cal.', desc: 'Six deviled eggs, each a different flavor — try them all and find your favorite.', image: 'assets/products/6-pack-6-flavors.jpg', pickerConfig: { total: 6, maxFlavors: 6 } },
    { id: '12-pack', name: '12 Pack Deviled Egg', price: 24.99, note: '840 Cal.', desc: 'A dozen of our gourmet deviled eggs — perfect for sharing at parties, picnics, or family gatherings.', image: 'assets/products/12-pack.jpg', pickerConfig: { total: 12, maxFlavors: 4 } },
    { id: '24-count-platter', name: '24 Count Deviled Egg Platter', price: 44.99, note: '1680 Cal.', desc: 'A stunning platter of 24 deviled eggs — the ultimate centerpiece for your next event or celebration.', image: 'assets/products/24-count-platter.jpg', pickerConfig: { total: 24, maxFlavors: 3 } },
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

  // Matches deviledeggco.com's own flavor pickers: pieces are allocated
  // across flavors in fixed steps (total ÷ max flavors) rather than toggled
  // on/off, and Add to order stays disabled until every piece is allocated.
  // The active product's own total/maxFlavors/step (see openDozenModal)
  // replace what used to be one fixed 12/4/3 configuration.
  let activeProduct = null;

  // Exclusion lists sourced verbatim from deviledeggco.com's own 12 Pack
  // flavor picker (each flavor's "NO: ___" ingredient toggles).
  const FLAVORS = [
    { id: 'blte', label: 'BLTE', exclusions: ['Bacon', 'Lettuce', 'Tomato', 'Ranch sauce'] },
    { id: 'backyard-bbq', label: 'Backyard BBQ', exclusions: ['Brisket', 'Pickled Jalapeño', 'Red Onion', 'BBQ Sauce'] },
    { id: 'ballpark-special', label: 'Ballpark Special', exclusions: ['Red Onion', 'Dill Pickle', 'All-beef Frank', 'Lay’s Potato Chips', 'Ketchup', 'Mustard'] },
    { id: 'buffalo-blue-cheese', label: 'Buffalo Blue Cheese', exclusions: ['Blue cheese', 'Buffalo sauce'] },
    { id: 'buffalo-chicken-ranch', label: 'Buffalo Chicken Ranch', exclusions: ['Grilled chicken', 'Red onion', 'Buffalo sauce'] },
    { id: 'cali-roll', label: 'Cali Roll', exclusions: ['Cucumber', 'Black sesame', 'Teriyaki'] },
    { id: 'cheeseburger', label: 'Cheeseburger', exclusions: ['Beef', 'American cheese', 'Pickle', 'Onion', 'Lettuce', 'Ketchup'] },
    { id: 'chicken-bacon-ranch', label: 'Chicken Bacon Ranch', exclusions: ['Grilled chicken', 'Bacon', 'Cheddar', 'Ranch sauce'] },
    { id: 'chicken-caesar', label: 'Chicken Caesar', exclusions: ['Grilled chicken', 'Romaine lettuce', 'Creamy Caesar'] },
    { id: 'chicken-pickle-egg', label: 'Chicken and Pickle Egg', exclusions: ['Grilled chicken', 'Dill pickle', 'Chick sauce'] },
    { id: 'chicken-waffle', label: 'Chicken and Waffle', exclusions: ['Chicken', 'Waffle', 'Syrup'] },
    { id: 'crab-rangoon', label: 'Crab Rangoon', exclusions: ['Sweet & sour crab', 'Wonton', 'Sweet & sour sauce'] },
    { id: 'everything-seasoning', label: 'Everything Seasoning', exclusions: ['Everything bagel seasoning'] },
    { id: 'jalapeno-popper', label: 'Jalapeño Popper', exclusions: ['Fresh jalapeño', 'Bacon', 'Chipotle sauce'] },
    { id: 'smoked-salmon', label: 'Smoked Salmon', exclusions: ['Capers', 'Red onion', 'Smoked salmon', 'Everything bagel seasoning'] },
    { id: 'south-of-the-border', label: 'South of the Border', exclusions: ['Fresh jalapeño', 'Cheddar'] },
    { id: 'sriracha-bacon', label: 'Sriracha Bacon', exclusions: ['Bacon', 'Sriracha sauce'] },
    { id: 'traditional', label: 'Traditional', exclusions: ['Paprika'] },
    { id: 'walking-taco', label: 'Walking Taco', exclusions: ['Refried beans', 'Grilled chicken', 'Cheddar', 'Lettuce', 'Nacho Cheese Doritos', 'Sour cream'] },
  ];

  const state = {
    cart: [],
    modalFlavorQty: {},
    modalExclusions: {},
    modalQty: 1,
    bagelToast: 'Not Toasted',
    bagelType: 'Plain',
    bagelFlavors: {},
    bagelOptions: new Set(),
    bagelQty: 1,
    mode: 'pickup',
    location: 'McKinney, TX',
    pickupDateKey: null,
    pickupTimeId: null,
    pickupTimeLabel: null,
    payment: 'Apple Pay',
    tipPct: 18,
  };

  // Carts saved before product images were wired into the cart/checkout
  // views persisted without an `image` field. Backfill it by name on load
  // so an existing cart self-heals instead of staying stuck on the
  // placeholder icon until the user manually clears it.
  const PRODUCT_IMAGE_BY_NAME = {};
  [...DEVILED_EGGS, ...PROTEIN_BOWLS, ...EGG_SALADS, ...PLATTERS, ...CATERING].forEach((p) => {
    if (p.image) PRODUCT_IMAGE_BY_NAME[p.name] = p.image;
  });
  PRODUCT_IMAGE_BY_NAME['Full Size Bagel'] = BAGEL_IMAGE;

  try {
    const saved = JSON.parse(localStorage.getItem('deg-cart') || 'null');
    if (Array.isArray(saved)) {
      state.cart = saved.map((item) => ({ ...item, image: item.image || PRODUCT_IMAGE_BY_NAME[item.name] }));
    }
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
    renderDeliveryGrid();
  }

  function renderDeliveryGrid() {
    const grid = document.getElementById('delivery-grid');
    grid.innerHTML = '';
    DELIVERY_APPS.forEach((app) => {
      const card = document.createElement('a');
      card.className = 'shop-card';
      card.href = app.url;
      card.target = '_blank';
      card.rel = 'noopener';

      const body = document.createElement('div');
      body.className = 'shop-card-body';
      body.innerHTML = `<span class="shop-card-name">${app.name}</span>`;
      card.appendChild(body);

      const media = document.createElement('div');
      media.className = 'shop-card-media';
      media.style.background = app.color;
      const logo = document.createElement('img');
      logo.className = 'delivery-logo';
      logo.src = app.logo;
      logo.alt = app.name + ' logo';
      media.appendChild(logo);
      const launch = document.createElement('span');
      launch.className = 'add-btn';
      launch.setAttribute('aria-hidden', 'true');
      launch.innerHTML = LAUNCH_ICON;
      media.appendChild(launch);
      card.appendChild(media);

      grid.appendChild(card);
    });
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
      btn.setAttribute('aria-label', item.pickerConfig ? 'Customize ' + item.name : 'Add ' + item.name + ' to order');
      btn.innerHTML = ADD_ICON;
      const activate = () => {
        if (item.pickerConfig) {
          openDozenModal(item);
        } else {
          addToCart({ key: keyPrefix + '-' + item.id, name: item.name, sub: cartCategory, price: item.price, qty: 1, image: item.image });
        }
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
  // Pickup is fulfilled in-house; Delivery hands off to third-party apps
  // (see #delivery-apps), so nothing past this toggle — cart, checkout,
  // confirmation — needs to know about a delivery mode.
  function updateModeUI() {
    const isDelivery = state.mode === 'delivery';
    document.getElementById('pickup-menu-content').hidden = isDelivery;
    document.getElementById('delivery-apps').hidden = !isDelivery;
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
    const anyOpen = !itemModal.hidden || !bagelModal.hidden || !cartDrawer.hidden || !pickupSettingsModal.hidden || !storeLocatorModal.hidden || !addPaymentModal.hidden;
    pageRoot.inert = anyOpen;
    document.body.style.overflow = anyOpen ? 'hidden' : '';
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!itemModal.hidden) closeDozenModal();
    else if (!bagelModal.hidden) closeBagelModal();
    else if (!cartDrawer.hidden) closeCart();
    else if (!pickupSettingsModal.hidden) closePickupSettings();
    else if (!storeLocatorModal.hidden) closeStoreLocator();
    else if (!addPaymentModal.hidden) closeAddPayment();
  });

  // ---------- Item customization modal ----------
  const modalBackdrop = document.getElementById('modal-backdrop');
  const itemModal = document.getElementById('item-modal');

  function dozenAllocated() {
    return Object.values(state.modalFlavorQty).reduce((sum, n) => sum + n, 0);
  }

  function renderFlavorGrid() {
    const grid = document.getElementById('flavor-grid');
    grid.innerHTML = '';
    const allocated = dozenAllocated();
    FLAVORS.forEach((f) => {
      const qty = state.modalFlavorQty[f.id] || 0;
      const atLimit = qty <= 0 && allocated >= activeProduct.total;
      const showExclusions = qty > 0 && f.exclusions && f.exclusions.length > 0;
      const excluded = state.modalExclusions[f.id] || new Set();

      // Selecting a flavor and excluding an ingredient from it are one
      // continuous card — the exclusion chips live inside the same
      // .flavor-row button, not a separate block stacked below it.
      const row = document.createElement('div');
      row.className = 'flavor-row dozen-flavor-row' + (qty > 0 ? ' selected' : '') + (atLimit ? ' at-limit' : '');
      row.innerHTML = `
        <div class="flavor-row-head">
          <span>${f.label}</span>
          <div class="mini-stepper">
            <button class="mini-step-btn" type="button" aria-label="Remove a ${f.label} egg" ${qty <= 0 ? 'disabled' : ''}>−</button>
            <span>${qty}</span>
            <button class="mini-step-btn" type="button" aria-label="Add a ${f.label} egg" ${allocated >= activeProduct.total ? 'disabled' : ''}>+</button>
          </div>
        </div>
        ${showExclusions ? `
          <div class="flavor-exclusions">
            <span class="flavor-exclusions-label">Remove ingredients</span>
            <div class="chip-row">
              ${f.exclusions.map((ing) => `<button class="chip exclude-chip${excluded.has(ing) ? ' active' : ''}" type="button">NO: ${ing}</button>`).join('')}
            </div>
          </div>
        ` : ''}
      `;
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
        row.querySelectorAll('.exclude-chip').forEach((chip, i) => {
          chip.addEventListener('click', () => {
            const ing = f.exclusions[i];
            const set = state.modalExclusions[f.id] || new Set();
            if (set.has(ing)) set.delete(ing); else set.add(ing);
            state.modalExclusions[f.id] = set;
            renderFlavorGrid();
          });
        });
      }

      grid.appendChild(row);
    });
    document.getElementById('flavor-count').textContent = `Allocated: ${allocated}/${activeProduct.total}`;
  }

  function populateQtySelect(select, max = 10) {
    select.innerHTML = '';
    for (let n = 1; n <= max; n++) {
      const opt = document.createElement('option');
      opt.value = String(n);
      opt.textContent = String(n);
      select.appendChild(opt);
    }
  }

  function renderModalFooter() {
    document.getElementById('qty-select').value = String(state.modalQty);
    const total = activeProduct.price * state.modalQty;
    const allocated = dozenAllocated();
    const btn = document.getElementById('add-to-order');
    btn.disabled = allocated !== activeProduct.total;
    btn.textContent = allocated === activeProduct.total
      ? `Add ${state.modalQty} to order · ${money(total)}`
      : `Allocate all ${activeProduct.total} eggs to continue`;
  }

  function openDozenModal(product) {
    lastFocusedEl = document.activeElement;
    activeProduct = {
      ...product,
      total: product.pickerConfig.total,
      maxFlavors: product.pickerConfig.maxFlavors,
      step: product.pickerConfig.total / product.pickerConfig.maxFlavors,
    };
    state.modalFlavorQty = {};
    state.modalExclusions = {};
    state.modalQty = 1;
    document.getElementById('item-note').value = '';
    populateQtySelect(document.getElementById('qty-select'));

    document.getElementById('dozen-modal-title').textContent = activeProduct.name;
    document.getElementById('dozen-modal-price').textContent = money(activeProduct.price);
    document.getElementById('dozen-modal-image').src = activeProduct.image;
    document.getElementById('dozen-modal-desc').textContent =
      `${activeProduct.total} deviled eggs, hand piped fresh daily. Choose up to ${activeProduct.maxFlavors} flavors — use +/− to allocate all ${activeProduct.total} eggs.`;
    itemModal.querySelector('.item-modal-header-title').textContent = activeProduct.name;

    renderFlavorGrid();
    renderModalFooter();
    itemModal.querySelector('.item-modal-scroll').scrollTop = 0;
    itemModal.querySelector('.item-modal-header-title').classList.remove('visible');
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

  document.getElementById('open-dozen-modal').addEventListener('click', () => {
    openDozenModal(DEVILED_EGGS.find((p) => p.id === '12-pack'));
  });
  document.getElementById('close-modal').addEventListener('click', closeDozenModal);
  modalBackdrop.addEventListener('click', closeDozenModal);

  document.getElementById('qty-select').addEventListener('change', (e) => {
    state.modalQty = Number(e.target.value);
    renderModalFooter();
  });

  document.getElementById('add-to-order').addEventListener('click', () => {
    if (dozenAllocated() !== activeProduct.total) return;
    const flavorLabels = FLAVORS.filter((f) => (state.modalFlavorQty[f.id] || 0) > 0).map((f) => {
      const excluded = state.modalExclusions[f.id];
      return excluded && excluded.size ? `${f.label} (no ${[...excluded].join(', ').toLowerCase()})` : f.label;
    });
    const note = document.getElementById('item-note').value.trim();
    addToCart({
      key: activeProduct.id + '-' + flavorLabels.join('-') + (note ? '-' + note : '') + '-' + Date.now(),
      name: activeProduct.name,
      sub: flavorLabels.join(', ') + (note ? ' · Note: ' + note : ''),
      price: activeProduct.price,
      qty: state.modalQty,
      image: activeProduct.image,
    });
    closeDozenModal();
    openCart();
  });

  // ---------- Bagel customization modal ----------
  const bagelModalBackdrop = document.getElementById('bagel-modal-backdrop');
  const bagelModal = document.getElementById('bagel-modal');

  // The product name lives in the scrollable body (next to the photo), so
  // it disappears once scrolled past. Echo it into the fixed header, only
  // once the real title has scrolled out of view, so it isn't shown twice
  // on open.
  function wireHeaderTitleReveal(modalRoot, h1Id) {
    const scrollEl = modalRoot.querySelector('.item-modal-scroll');
    const h1 = document.getElementById(h1Id);
    const headerTitle = modalRoot.querySelector('.item-modal-header-title');
    scrollEl.addEventListener('scroll', () => {
      const revealed = h1.getBoundingClientRect().bottom < scrollEl.getBoundingClientRect().top;
      headerTitle.classList.toggle('visible', revealed);
    });
  }
  wireHeaderTitleReveal(itemModal, 'dozen-modal-title');
  wireHeaderTitleReveal(bagelModal, 'bagel-modal-title');

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
    document.getElementById('bagel-qty-select').value = String(state.bagelQty);
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
    populateQtySelect(document.getElementById('bagel-qty-select'));
    document.querySelectorAll('#bagel-toast-picker .chip').forEach((b) => b.classList.toggle('active', b.dataset.value === state.bagelToast));
    document.querySelectorAll('#bagel-type-picker .chip').forEach((b) => b.classList.toggle('active', b.dataset.value === state.bagelType));
    document.querySelectorAll('#bagel-options-picker .chip').forEach((b) => b.classList.remove('active'));
    renderBagelFlavorSteppers();
    renderBagelModalFooter();
    bagelModal.querySelector('.item-modal-scroll').scrollTop = 0;
    bagelModal.querySelector('.item-modal-header-title').classList.remove('visible');
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

  document.getElementById('bagel-qty-select').addEventListener('change', (e) => {
    state.bagelQty = Number(e.target.value);
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
      image: BAGEL_IMAGE,
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
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    return { subtotal, tax, total };
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
      const thumb = productThumb(item);
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

    const { subtotal, tax, total } = computeTotals();
    document.getElementById('drawer-subtotal').textContent = money(subtotal);
    document.getElementById('drawer-tax').textContent = money(tax);
    document.getElementById('drawer-total').textContent = money(total);

    const pinIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 22s7-7.58 7-12A7 7 0 0 0 5 10c0 4.42 7 12 7 12Z" stroke="#402D00" stroke-width="1.8"/><circle cx="12" cy="10" r="2.5" stroke="#402D00" stroke-width="1.8"/></svg>';
    const chip = document.getElementById('fulfillment-chip');
    chip.innerHTML = `${pinIcon}<span>Pickup at <strong>${state.location}</strong> · ${pickupDateLabel(state.pickupDateKey)} · ${state.pickupTimeLabel}</span>`;

    document.getElementById('go-to-checkout').disabled = state.cart.length === 0;
  }

  // ---------- View switching ----------
  const views = {
    menu: document.getElementById('view-menu'),
    checkout: document.getElementById('view-checkout'),
    confirmation: document.getElementById('view-confirmation'),
  };

  function showView(name) {
    Object.entries(views).forEach(([key, el]) => { el.hidden = key !== name; });
    document.body.classList.toggle('is-checkout', name === 'checkout');
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
  const STORE_ADDRESSES = {
    'McKinney, TX': '111 W Virginia St, McKinney, TX 75069',
    'Denison, TX': '231 W Main St, Denison, TX 75020',
    'Rockwall, TX': '2065 Summer Lee Drive, Rockwall, TX 75032',
    'Coppell, TX': '3001 Olympus Blvd, Suite 100, Coppell, TX 75019',
  };

  // ---------- Store locator modal (store list + map) ----------
  let pendingStoreLocation = null;
  let mapLoadTimer = null;
  const MAP_LOAD_TIMEOUT_MS = 6000;

  function renderStoreLocatorSummary() {
    document.getElementById('store-locator-name').textContent = state.location;
    document.getElementById('store-locator-address').textContent = STORE_ADDRESSES[state.location];
  }

  function showMapStatus(mode, address) {
    const status = document.getElementById('store-locator-map-status');
    const statusText = document.getElementById('store-locator-map-status-text');
    status.hidden = false;
    status.classList.toggle('error', mode === 'error');
    statusText.innerHTML = mode === 'error'
      ? `Map unavailable<span class="store-locator-map-status-address">${address}</span>`
      : 'Loading map…';
  }

  function renderStoreLocatorMap() {
    const address = STORE_ADDRESSES[pendingStoreLocation];
    const iframe = document.getElementById('store-locator-map-frame');

    clearTimeout(mapLoadTimer);
    showMapStatus('loading');

    iframe.onload = () => {
      clearTimeout(mapLoadTimer);
      document.getElementById('store-locator-map-status').hidden = true;
    };
    iframe.onerror = () => showMapStatus('error', address);
    mapLoadTimer = setTimeout(() => showMapStatus('error', address), MAP_LOAD_TIMEOUT_MS);

    iframe.src = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  }

  function renderStoreLocatorList() {
    const list = document.getElementById('store-locator-list');
    list.innerHTML = '';
    Object.keys(STORE_ADDRESSES).forEach((name) => {
      const isActive = name === pendingStoreLocation;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'store-locator-row' + (isActive ? ' active' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(isActive));
      btn.innerHTML = `<span class="store-locator-row-name">${name}</span><span class="store-locator-row-address">${STORE_ADDRESSES[name]}</span>`;
      btn.addEventListener('click', () => {
        if (name === pendingStoreLocation) return;
        pendingStoreLocation = name;
        renderStoreLocatorList();
        renderStoreLocatorMap();
      });
      list.appendChild(btn);
    });
  }

  const storeLocatorBackdrop = document.getElementById('store-locator-backdrop');
  const storeLocatorModal = document.getElementById('store-locator-modal');

  function openStoreLocator() {
    lastFocusedEl = document.activeElement;
    pendingStoreLocation = state.location;
    renderStoreLocatorList();
    renderStoreLocatorMap();
    storeLocatorBackdrop.hidden = false;
    storeLocatorModal.hidden = false;
    updateInert();
    document.getElementById('close-store-locator').focus();
  }

  function closeStoreLocator() {
    storeLocatorBackdrop.hidden = true;
    storeLocatorModal.hidden = true;
    updateInert();
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.getElementById('open-store-locator').addEventListener('click', openStoreLocator);
  document.getElementById('close-store-locator').addEventListener('click', closeStoreLocator);
  document.getElementById('cancel-store-locator').addEventListener('click', closeStoreLocator);
  storeLocatorBackdrop.addEventListener('click', closeStoreLocator);
  document.getElementById('confirm-store-locator').addEventListener('click', () => {
    state.location = pendingStoreLocation;
    renderStoreLocatorSummary();
    renderDrawer();
    closeStoreLocator();
  });

  // ---------- Add payment method modal ----------
  const addPaymentBackdrop = document.getElementById('add-payment-backdrop');
  const addPaymentModal = document.getElementById('add-payment-modal');
  const addPaymentForm = document.getElementById('add-payment-form');
  const addPaymentSubmit = document.getElementById('add-payment-submit');
  const cardNumberInput = document.getElementById('payment-card-number');
  const cardExpInput = document.getElementById('payment-card-exp');
  const cardCvvInput = document.getElementById('payment-card-cvv');
  const cardZipInput = document.getElementById('payment-card-zip');
  const cardNicknameInput = document.getElementById('payment-card-nickname');

  function cardBrand(digits) {
    if (digits.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(digits)) return 'Mastercard';
    if (/^3[47]/.test(digits)) return 'Amex';
    return 'Card';
  }

  function isAddPaymentFormValid() {
    const digits = cardNumberInput.value.replace(/\D/g, '');
    const expValid = /^\d{2}\s?\/\s?\d{2}$/.test(cardExpInput.value.trim());
    const cvvValid = /^\d{3,4}$/.test(cardCvvInput.value.trim());
    return digits.length >= 12 && digits.length <= 19 && expValid && cvvValid && cardZipInput.value.trim().length > 0;
  }

  function refreshAddPaymentSubmit() {
    addPaymentSubmit.disabled = !isAddPaymentFormValid();
  }

  cardNumberInput.addEventListener('input', () => {
    const digits = cardNumberInput.value.replace(/\D/g, '').slice(0, 19);
    cardNumberInput.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    refreshAddPaymentSubmit();
  });
  cardExpInput.addEventListener('input', () => {
    const digits = cardExpInput.value.replace(/\D/g, '').slice(0, 4);
    cardExpInput.value = digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
    refreshAddPaymentSubmit();
  });
  cardCvvInput.addEventListener('input', () => {
    cardCvvInput.value = cardCvvInput.value.replace(/\D/g, '').slice(0, 4);
    refreshAddPaymentSubmit();
  });
  cardZipInput.addEventListener('input', refreshAddPaymentSubmit);

  function openAddPayment() {
    lastFocusedEl = document.activeElement;
    addPaymentForm.reset();
    refreshAddPaymentSubmit();
    addPaymentBackdrop.hidden = false;
    addPaymentModal.hidden = false;
    updateInert();
    cardNumberInput.focus();
  }

  function closeAddPayment() {
    addPaymentBackdrop.hidden = true;
    addPaymentModal.hidden = true;
    updateInert();
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.getElementById('open-add-payment').addEventListener('click', openAddPayment);
  document.getElementById('close-add-payment').addEventListener('click', closeAddPayment);
  addPaymentBackdrop.addEventListener('click', closeAddPayment);

  addPaymentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isAddPaymentFormValid()) return;
    const digits = cardNumberInput.value.replace(/\D/g, '');
    const last4 = digits.slice(-4);
    const nickname = cardNicknameInput.value.trim();
    const label = `${cardBrand(digits)} •••• ${last4}${nickname ? ` (${nickname})` : ''}`;

    const row = document.createElement('button');
    row.className = 'radio-row active';
    row.type = 'button';
    row.dataset.value = label;
    row.innerHTML = `<span class="radio-dot"></span>${label}`;
    document.querySelectorAll('#payment-picker .radio-row').forEach((b) => b.classList.remove('active'));
    document.getElementById('open-add-payment').before(row);

    state.payment = label;
    closeAddPayment();
  });

  // ---------- Pickup settings modal (date + time picker) ----------
  const PICKUP_OPEN_HOUR = 10; // store hours: 10:00 AM – 8:00 PM
  const PICKUP_CLOSE_HOUR = 20;
  let pickupDatesCache = [];

  function pad2(n) { return String(n).padStart(2, '0'); }

  function dateKey(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

  function formatClock(hour, minute) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12}:${pad2(minute)} ${period}`;
  }

  function buildPickupDates(count = 7) {
    const now = new Date();
    const dates = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const tileTop = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const tileSub = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const label = i <= 1 ? tileTop : `${tileTop}, ${tileSub}`;
      dates.push({ key: dateKey(d), label, tileTop, tileSub });
    }
    return dates;
  }

  function nextHalfHour(d) {
    const rounded = new Date(d);
    rounded.setSeconds(0, 0);
    const m = rounded.getMinutes();
    const add = m === 0 ? 0 : m <= 30 ? 30 - m : 60 - m;
    rounded.setMinutes(m + add);
    return rounded;
  }

  function buildTimeSlots(dateKeyValue) {
    const now = new Date();
    const isToday = dateKeyValue === dateKey(now);
    let cursor;
    if (isToday) {
      cursor = nextHalfHour(now);
      const openToday = new Date(now);
      openToday.setHours(PICKUP_OPEN_HOUR, 0, 0, 0);
      if (cursor < openToday) cursor = openToday;
    } else {
      cursor = new Date(now);
      cursor.setHours(PICKUP_OPEN_HOUR, 0, 0, 0);
    }
    const close = new Date(cursor);
    close.setHours(PICKUP_CLOSE_HOUR, 0, 0, 0);
    const slots = [];
    while (cursor.getTime() + 30 * 60000 <= close.getTime()) {
      const start = new Date(cursor);
      const end = new Date(cursor.getTime() + 30 * 60000);
      slots.push({
        id: `${pad2(start.getHours())}${pad2(start.getMinutes())}`,
        label: `${formatClock(start.getHours(), start.getMinutes())} – ${formatClock(end.getHours(), end.getMinutes())}`,
      });
      cursor = end;
    }
    return slots;
  }

  function pickupDateLabel(key) {
    const found = pickupDatesCache.find((d) => d.key === key);
    return found ? found.label : key;
  }

  function initPickupDefaults() {
    pickupDatesCache = buildPickupDates();
    let dateIdx = 0;
    let slots = buildTimeSlots(pickupDatesCache[0].key);
    while (slots.length === 0 && dateIdx < pickupDatesCache.length - 1) {
      dateIdx += 1;
      slots = buildTimeSlots(pickupDatesCache[dateIdx].key);
    }
    state.pickupDateKey = pickupDatesCache[dateIdx].key;
    state.pickupTimeId = slots[0].id;
    state.pickupTimeLabel = slots[0].label;
  }

  function renderPickupSummary() {
    document.getElementById('pickup-time-summary').textContent = `${pickupDateLabel(state.pickupDateKey)} · ${state.pickupTimeLabel}`;
  }

  // Selections apply only to this staging object while the modal is open;
  // Confirm commits it to state, Cancel/X/backdrop just discard it.
  let pendingPickup = null;

  function updatePickupDateFade() {
    const list = document.getElementById('pickup-date-list');
    const wrap = document.getElementById('pickup-date-row-wrap');
    const max = list.scrollWidth - list.clientWidth;
    wrap.classList.toggle('can-scroll-left', list.scrollLeft > 1);
    wrap.classList.toggle('can-scroll-right', list.scrollLeft < max - 1);
  }

  function renderPickupDateList() {
    const list = document.getElementById('pickup-date-list');
    list.innerHTML = '';
    pickupDatesCache.forEach((d) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pickup-date-tile' + (d.key === pendingPickup.dateKey ? ' active' : '');
      btn.innerHTML = `${d.tileTop}<span class="pickup-date-sub">${d.tileSub}</span>`;
      btn.addEventListener('click', () => {
        if (d.key === pendingPickup.dateKey) return;
        const slots = buildTimeSlots(d.key);
        if (slots.length === 0) return; // store isn't open again before closing that day
        pendingPickup = { dateKey: d.key, timeId: slots[0].id, timeLabel: slots[0].label };
        renderPickupDateList();
        renderPickupTimeList();
      });
      list.appendChild(btn);
    });
    updatePickupDateFade();
  }

  function renderPickupTimeList() {
    const list = document.getElementById('pickup-time-list');
    list.innerHTML = '';
    buildTimeSlots(pendingPickup.dateKey).forEach((slot) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'radio-row' + (slot.id === pendingPickup.timeId ? ' active' : '');
      btn.innerHTML = `<span class="radio-dot"></span>${slot.label}`;
      btn.addEventListener('click', () => {
        pendingPickup.timeId = slot.id;
        pendingPickup.timeLabel = slot.label;
        renderPickupTimeList();
      });
      list.appendChild(btn);
    });
  }

  const pickupSettingsBackdrop = document.getElementById('pickup-settings-backdrop');
  const pickupSettingsModal = document.getElementById('pickup-settings-modal');

  function openPickupSettings() {
    lastFocusedEl = document.activeElement;
    pendingPickup = { dateKey: state.pickupDateKey, timeId: state.pickupTimeId, timeLabel: state.pickupTimeLabel };
    renderPickupDateList();
    renderPickupTimeList();
    pickupSettingsBackdrop.hidden = false;
    pickupSettingsModal.hidden = false;
    updateInert();
    updatePickupDateFade();
    document.getElementById('close-pickup-settings').focus();
  }

  function closePickupSettings() {
    pickupSettingsBackdrop.hidden = true;
    pickupSettingsModal.hidden = true;
    updateInert();
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.getElementById('open-pickup-settings').addEventListener('click', openPickupSettings);
  document.getElementById('close-pickup-settings').addEventListener('click', closePickupSettings);
  document.getElementById('cancel-pickup-settings').addEventListener('click', closePickupSettings);
  pickupSettingsBackdrop.addEventListener('click', closePickupSettings);
  document.getElementById('pickup-date-scroll-next').addEventListener('click', () => {
    const list = document.getElementById('pickup-date-list');
    list.scrollBy({ left: list.clientWidth, behavior: 'smooth' });
  });
  document.getElementById('pickup-date-list').addEventListener('scroll', updatePickupDateFade);
  document.getElementById('confirm-pickup-settings').addEventListener('click', () => {
    state.pickupDateKey = pendingPickup.dateKey;
    state.pickupTimeId = pendingPickup.timeId;
    state.pickupTimeLabel = pendingPickup.timeLabel;
    renderPickupSummary();
    renderDrawer();
    closePickupSettings();
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
      const row = document.createElement('div');
      row.className = 'drawer-item';
      const thumb = productThumb(item);
      thumb.style.width = '56px';
      thumb.style.height = '56px';
      row.appendChild(thumb);

      const body = document.createElement('div');
      body.className = 'drawer-item-body';
      body.innerHTML = `
        <span class="drawer-item-name">${item.name} ×${item.qty}</span>
        ${item.sub ? `<span class="drawer-item-sub">${item.sub}</span>` : ''}
        <span class="drawer-item-price">${money(item.price * item.qty)}</span>
      `;
      row.appendChild(body);
      list.appendChild(row);
    });
    const totalQty = state.cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('checkout-item-count').textContent = `(${totalQty} item${totalQty === 1 ? '' : 's'})`;
    renderCheckoutTotals();
  }

  const orderSummaryToggle = document.getElementById('toggle-order-summary');
  const orderSummaryCollapse = document.getElementById('order-summary-collapse');
  orderSummaryToggle.addEventListener('click', () => {
    const expanded = orderSummaryToggle.getAttribute('aria-expanded') === 'true';
    orderSummaryToggle.setAttribute('aria-expanded', String(!expanded));
    orderSummaryCollapse.classList.toggle('collapsed', expanded);
  });

  function renderCheckoutTotals() {
    const { subtotal, tax, total: preTipTotal } = computeTotals();
    const tipAmt = subtotal * (state.tipPct / 100);
    const total = preTipTotal + tipAmt;

    document.getElementById('sum-subtotal').textContent = money(subtotal);
    document.getElementById('sum-tax').textContent = money(tax);
    document.getElementById('sum-tip').textContent = money(tipAmt);
    document.getElementById('sum-total').textContent = money(total);
    document.getElementById('place-order').textContent = 'Place order';
    return total;
  }

  const PIN_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 22s7-7.58 7-12A7 7 0 0 0 5 10c0 4.42 7 12 7 12Z" stroke="#402D00" stroke-width="1.8"/><circle cx="12" cy="10" r="2.5" stroke="#402D00" stroke-width="1.8"/></svg>';

  document.getElementById('place-order').addEventListener('click', () => {
    if (state.cart.length === 0) return;

    const total = renderCheckoutTotals();
    const orderNumber = '#DE-' + Math.floor(10000 + Math.random() * 89999);

    const subEl = document.getElementById('confirm-sub');
    const fulfillmentCard = document.getElementById('fulfillment-card');

    const address = STORE_ADDRESSES[state.location] || STORE_ADDRESSES['McKinney, TX'];
    const dateLabel = pickupDateLabel(state.pickupDateKey);
    const readyBy = state.pickupTimeLabel.split(' – ')[1] || state.pickupTimeLabel;
    const whenPhrase = dateLabel === 'Today' ? `by <strong>${readyBy}</strong>`
      : dateLabel === 'Tomorrow' ? `tomorrow at <strong>${readyBy}</strong>`
      : `on <strong>${dateLabel}</strong> at <strong>${readyBy}</strong>`;

    subEl.innerHTML = `Order <strong>${orderNumber}</strong> · We're preparing it now — ready for pickup at <strong>${state.location}</strong> ${whenPhrase}`;
    fulfillmentCard.innerHTML = `${PIN_ICON}<span>${address}</span><a class="pill-btn outline" id="get-directions" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" target="_blank" rel="noopener">Get directions</a>`;

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
    persistCart();
    renderCartBadge();

    showView('confirmation');
  });

  document.getElementById('back-to-menu').addEventListener('click', () => {
    showView('menu');
  });

  // ---------- Init ----------
  initPickupDefaults();
  renderPickupSummary();
  renderStoreLocatorSummary();
  renderGrids();
  renderCartBadge();
  renderDrawer();
})();
