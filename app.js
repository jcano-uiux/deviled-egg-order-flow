(() => {
  const TAX_RATE = 0.0825;
  const PROMO_CODES = { EGGSTRA10: 0.10 };

  const eggThumb = () => {
    const div = document.createElement('div');
    div.className = 'thumb';
    div.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="13" rx="7" ry="8.5" stroke="#D9D1BF" stroke-width="1.5"/><path d="M6 8c1-3 3-5 6-5s5 2 6 5" stroke="#D9D1BF" stroke-width="1.5" stroke-linecap="round"/></svg>';
    return div;
  };

  const DEVILED_EGGS = [
    { id: 'classic', name: 'Classic', price: 14.99 },
    { id: 'bacon', name: 'Bacon Cheddar Ranch', price: 15.99 },
    { id: 'jalapeno', name: 'Jalapeño Popper', price: 15.99 },
    { id: 'salmon', name: 'Smoked Salmon', price: 17.99 },
  ];

  const PROTEIN_BOWLS = [
    { id: 'southwest', name: 'Southwest Power Bowl', price: 14.99 },
    { id: 'mediterranean', name: 'Mediterranean Bowl', price: 15.99 },
    { id: 'ranch', name: 'Protein Ranch Bowl', price: 16.99 },
  ];

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

  const state = {
    cart: [],
    modalSelected: new Set(['classic', 'bacon', 'jalapeno', 'salmon']),
    modalQty: 1,
    promo: null,
    promoAmount: 0,
    location: 'McKinney, TX',
    time: 'asap',
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
    const eggsGrid = document.getElementById('deviled-eggs-grid');
    eggsGrid.innerHTML = '';
    DEVILED_EGGS.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.appendChild(eggThumb());
      const body = document.createElement('div');
      body.className = 'item-card-body';
      body.innerHTML = `
        <span class="item-name">${item.name}</span>
        <span class="item-price">${money(item.price)}</span>
        <button class="add-btn" type="button" aria-label="Add ${item.name} to order">+</button>
      `;
      body.querySelector('.add-btn').addEventListener('click', () => {
        addToCart({ key: 'egg-' + item.id, name: item.name + ' (Dozen)', sub: 'Deviled eggs', price: item.price, qty: 1 });
      });
      card.appendChild(body);
      eggsGrid.appendChild(card);
    });

    const bowlsGrid = document.getElementById('protein-bowls-grid');
    bowlsGrid.innerHTML = '';
    PROTEIN_BOWLS.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'row-card';
      const thumb = eggThumb();
      thumb.style.width = '72px';
      thumb.style.height = '72px';
      card.appendChild(thumb);
      const body = document.createElement('div');
      body.className = 'row-card-body';
      body.innerHTML = `<span class="item-name">${item.name}</span><span class="item-price">${money(item.price)}</span>`;
      card.appendChild(body);
      const btn = document.createElement('button');
      btn.className = 'add-btn';
      btn.type = 'button';
      btn.style.position = 'static';
      btn.setAttribute('aria-label', 'Add ' + item.name + ' to order');
      btn.textContent = '+';
      btn.addEventListener('click', () => {
        addToCart({ key: 'bowl-' + item.id, name: item.name, sub: 'Protein bowl', price: item.price, qty: 1 });
      });
      card.appendChild(btn);
      bowlsGrid.appendChild(card);
    });
  }

  // ---------- Pickup / delivery toggle ----------
  document.getElementById('order-mode').addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    document.querySelectorAll('#order-mode .seg-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
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
      row.className = 'flavor-row' + (selected ? ' selected' : '') + (atLimit ? ' disabled' : '');
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
    state.modalSelected = new Set(['classic', 'bacon', 'jalapeno', 'salmon']);
    state.modalQty = 1;
    document.getElementById('item-note').value = '';
    renderFlavorGrid();
    renderModalFooter();
    modalBackdrop.hidden = false;
    itemModal.hidden = false;
  }

  function closeDozenModal() {
    modalBackdrop.hidden = true;
    itemModal.hidden = true;
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

  // ---------- Cart drawer ----------
  const cartBackdrop = document.getElementById('cart-backdrop');
  const cartDrawer = document.getElementById('cart-drawer');

  function openCart() {
    renderDrawer();
    cartBackdrop.hidden = false;
    cartDrawer.hidden = false;
  }
  function closeCart() {
    cartBackdrop.hidden = true;
    cartDrawer.hidden = true;
  }

  document.getElementById('open-cart').addEventListener('click', openCart);
  document.getElementById('close-cart').addEventListener('click', closeCart);
  cartBackdrop.addEventListener('click', closeCart);

  function computeTotals() {
    const subtotal = cartSubtotal();
    const promoAmount = state.promo ? subtotal * state.promo : 0;
    const taxedBase = subtotal - promoAmount;
    const tax = Math.max(0, taxedBase) * TAX_RATE;
    const total = Math.max(0, taxedBase) + tax;
    return { subtotal, promoAmount, tax, total };
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

    const { subtotal, promoAmount, tax, total } = computeTotals();
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

    const goBtn = document.getElementById('go-to-checkout');
    goBtn.disabled = state.cart.length === 0;
    goBtn.style.opacity = state.cart.length === 0 ? '.5' : '1';
    goBtn.style.pointerEvents = state.cart.length === 0 ? 'none' : 'auto';
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
    const { subtotal, promoAmount, tax, total: preTipTotal } = computeTotals();
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
    document.getElementById('place-order').textContent = `Place order · ${money(total)}`;
    return total;
  }

  document.getElementById('place-order').addEventListener('click', () => {
    if (state.cart.length === 0) return;
    const total = renderCheckoutTotals();

    document.getElementById('order-number').textContent = '#DE-' + Math.floor(10000 + Math.random() * 89999);
    document.getElementById('confirm-location').textContent = state.location;
    document.getElementById('confirm-time').textContent = state.time === 'asap' ? '12:45 PM' : 'your scheduled time';

    const addresses = {
      'McKinney, TX': '111 W Virginia St, McKinney, TX 75069',
      'Denison, TX': '231 W Main St, Denison, TX 75020',
      'Rockwall, TX': '2065 Summer Lee Drive, Rockwall, TX 75032',
      'Coppell, TX': '3001 Olympus Blvd, Suite 100, Coppell, TX 75019',
    };
    document.getElementById('confirm-address').textContent = addresses[state.location] || addresses['McKinney, TX'];

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
