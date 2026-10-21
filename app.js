(() => {
  const TAX_RATE = 0.0825;

  // ---------- Location picker, loaded on demand ----------
  // d3, topojson, the US map data and location-picker.js are only needed on the picker, so they load the first time
  // it opens (or when the Home "Order pickup" tile is pointed at). Until then this stub holds what app.js tells the
  // picker (the funnel's words, the saved order) and the callbacks it assigns; location-picker.js picks them all up.
  window.degLocationPicker = {
    onPick: null, onContinue: null, onChangeTime: null, onNavigate: null, ready: false, pending: {},
    configure(cfg) { this.pending.configure = cfg; },
    setSaved(info) { this.pending.saved = info; },
    sync() {},
  };
  const PICKER_SCRIPTS = [
    'https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js',
    'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js',
    'location-picker-stores.js',
    'location-picker.js',
  ];
  let pickerLoad = null;
  function loadLocationPicker() {
    if (pickerLoad) return pickerLoad;
    pickerLoad = PICKER_SCRIPTS.reduce((chain, src) => chain.then(() => new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.onload = resolve;
      el.onerror = () => reject(new Error('Could not load ' + src));
      document.head.appendChild(el);
    })), Promise.resolve()).catch((err) => {
      pickerLoad = null;
      console.error(err);
      const msg = document.getElementById('zip-message');
      if (msg) msg.textContent = 'The store search could not load. Check your connection and try again.';
    });
    return pickerLoad;
  }
  // A ZIP search sent before the picker has loaded must not reload the page.
  document.getElementById('zip-form').addEventListener('submit', (e) => { if (!window.degLocationPicker.ready) e.preventDefault(); });

  const ADD_ICON = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M15.8333 8.75H11.25V4.16667H8.75V8.75H4.16667V11.25H8.75V15.8333H11.25V11.25H15.8333V8.75Z" fill="currentColor"/></svg>';
  // Shared source for every quantity-stepper .mini-step-btn (dozen flavor
  // allocation, bagel spread flavors, cart-drawer qty) — any future +/-
  // control should pull from these two rather than typing "−"/"+" text
  // glyphs again. currentColor so .mini-step-btn's own `color` (and its
  // existing :disabled dimming) still drives the icon exactly like the
  // text characters did.
  const STEP_MINUS_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
  // The flavor thumbnail's corner icon: expand (open the video and description) and, once open, collapse.
  const FLAVOR_EXPAND_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const FLAVOR_INFO_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 11v6.500" stroke="currentColor" stroke-width="2.400" stroke-linecap="round"/><circle cx="12" cy="6.800" r="1.500" fill="currentColor"/></svg>';
  const FLAVOR_COLLAPSE_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 10h-6V4M4 14h6v6M14 10l7-7M10 14l-7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const STEP_PLUS_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';

  const eggThumb = () => {
    const div = document.createElement('div');
    div.className = 'thumb';
    div.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="13" rx="7" ry="8.5" stroke="#D9D1BF" stroke-width="1.5"/><path d="M6 8c1-3 3-5 6-5s5 2 6 5" stroke="#D9D1BF" stroke-width="1.5" stroke-linecap="round"/></svg>';
    return div;
  };

  // The coffee bar has no photo: an authored cup, so its modal and cart line aren't an empty square.
  const coffeeThumb = () => {
    const div = document.createElement('div');
    div.className = 'thumb thumb-coffee';
    div.innerHTML = '<svg width="44%" height="44%" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9Z" stroke="#88754F" stroke-width="1.6" stroke-linejoin="round"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" stroke="#88754F" stroke-width="1.6" stroke-linecap="round"/><path d="M8 3.5c0 1.2 1 1.3 1 2.5M11.5 3.5c0 1.2 1 1.3 1 2.5" stroke="#88754F" stroke-width="1.6" stroke-linecap="round"/></svg>';
    return div;
  };

  // Real product photo when we have one; the placeholder egg icon otherwise
  // (a few catering bundles have no matching photo in the client asset pack).
  const productThumb = (item) => {
    if (item.icon === 'coffee') return coffeeThumb();
    if (!item.image) return eggThumb();
    const img = document.createElement('img');
    img.className = 'shop-card-photo';
    // `loading` goes on before `src`: set after it, the browser has already started the download.
    img.loading = 'lazy';
    // The first card photo of a Shipping page version is upgraded to eager once that page is on screen (see setShipVersion).
    if (item.thumb && item.thumb.eager) img.dataset.eager = '';
    img.decoding = 'async';
    img.alt = item.name;
    // A card photo with sized sources (srcset, width and height) loads only the size it shows, and reserves its space.
    if (item.thumb) {
      img.srcset = item.thumb.srcset;
      img.sizes = item.thumb.sizes;
      img.width = item.thumb.width;
      img.height = item.thumb.height;
    }
    // A photo that fails to load falls back to the placeholder instead of showing a broken image.
    img.addEventListener('error', () => img.replaceWith(eggThumb()), { once: true });
    img.src = item.image;
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
    // One card for both 6 Packs: the modal asks 3 flavors or 6 (a different price, photo and number of flavors, the
    // same six eggs). The card shows the entry price; `pickerConfig` here only marks it as a flavor picker.
    {
      id: '6-pack', name: '6 Pack Deviled Egg', price: 12.99, note: '420 Cal.', image: 'assets/products/6-pack-6-flavors.jpg',
      desc: 'Six deviled eggs, in three flavors or all six. A great way to sample our most popular creations.',
      pickerConfig: { total: 6, maxFlavors: 3 }, optionsTitle: 'How many flavors?', optionsHint: 'Six deviled eggs either way.',
      options: [
        { id: '3-flavors', label: '3 flavors', name: '6 Pack Deviled Egg – 3 Flavors', price: 12.99, image: 'assets/products/6-pack-3-flavors.jpg',
          desc: 'Six deviled eggs in three delicious flavors — a great way to sample our most popular creations.', pickerConfig: { total: 6, maxFlavors: 3 } },
        { id: '6-flavors', label: '6 flavors', name: '6 Pack Deviled Egg – 6 Flavors', price: 14.99, image: 'assets/products/6-pack-6-flavors.jpg',
          desc: 'Six deviled eggs, each a different flavor — try them all and find your favorite.', pickerConfig: { total: 6, maxFlavors: 6 } },
      ],
    },
    { id: '12-pack', name: '12 Pack Deviled Egg', price: 24.99, note: '840 Cal.', desc: 'A dozen of our gourmet deviled eggs — perfect for sharing at parties, picnics, or family gatherings.', image: 'assets/products/12-pack.jpg', pickerConfig: { total: 12, maxFlavors: 4 } },
    { id: '24-count-platter', name: '24 Count Deviled Egg Platter', price: 44.99, note: '1680 Cal.', desc: 'A stunning platter of 24 deviled eggs — the ultimate centerpiece for your next event or celebration.', image: 'assets/products/24-count-platter.jpg', pickerConfig: { total: 24, maxFlavors: 3 } },
    { id: 'try-them-all-platter', name: 'Try Them All Deviled Egg Platter', price: 54.99, note: '1800 Cal.', desc: 'Every flavor we offer on one beautiful platter — the complete Deviled Egg Co. experience.', image: 'assets/products/try-them-all-platter.jpg' },
  ];

  // Every Eggceptional Bowl is a WooCommerce "variable" product on the live
  // site (unlike Egg Salads/Platters, which are simple products) — each has
  // its own Add-Ons (paid, priced per item)
  // and "No" exclusions matching that bowl's own ingredients. Sourced verbatim
  // per bowl from deviledeggco.com rather than assumed to share one list —
  // the add-on prices and exclusion lists both vary bowl to bowl. "Options"
  // (Lite Sauce / Sauce on Side) is the one section identical across all
  // seven, so it's a shared constant rather than repeated per bowl.
  const BOWL_OPTIONS = ['Lite Sauce', 'Sauce on Side'];

  const PROTEIN_BOWLS = [
    { id: 'avo-chick-blt', name: 'Avo Chick-BLT Eggceptional Bowl', price: 14.99, note: '79g Protein', desc: 'Avocado, grilled chicken, crispy bacon, lettuce, tomato, and our signature deviled eggs.', image: 'assets/products/avo-chick-blt-bowl.jpg',
      addOns: [
        { label: 'Double Meat', price: 3.00, note: '+4oz meat' },
        { label: 'Smashed Avocado', price: 2.00, note: '½ whole fresh avocado' },
        { label: 'Eggstra Egg', price: 3.00, note: '+3oz egg whites' },
      ],
      exclusions: ['Chicken', 'Bacon', 'Avo-Smash', 'Cheddar', 'Lettuce', 'Tomato', 'Ranch'],
    },
    { id: 'cheeseburger', name: 'Cheeseburger Eggceptional Bowl', price: 14.99, note: '47g Protein', desc: 'Seasoned beef, cheese, pickles, and our famous deviled eggs in bowl form.', image: 'assets/products/cheeseburger-bowl.jpg',
      addOns: [
        { label: 'Double Meat', price: 3.00, note: '+4oz meat' },
        { label: 'Smashed Avocado', price: 2.00, note: '½ whole fresh avocado' },
        { label: 'Eggstra Egg', price: 2.00, note: '+3oz egg whites' },
      ],
      exclusions: ['Hamburger', 'Cheese', 'Red Onion', 'Lettuce', 'Pickles', 'Ketchup'],
    },
    { id: 'caesar', name: 'The Caesar Eggceptional Bowl', price: 14.99, note: '70g Protein', desc: 'Crisp romaine, parmesan, croutons, and our signature deviled eggs.', image: 'assets/products/caesar-bowl.jpg',
      addOns: [
        { label: 'Substitute Salmon', price: 3.00 },
        { label: 'Double Meat', price: 3.00, note: '+4oz meat' },
        { label: 'Avocado Smash', price: 2.00, note: '½ whole fresh avocado' },
        { label: 'Eggstra Eggs', price: 3.00, note: '+3oz egg whites' },
      ],
      exclusions: ['Egg Whites', 'Grilled Chicken', 'Capers', 'Diced Red Onion', 'Shredded Romaine Lettuce', 'Creamy Caesar Dressing', 'Parmesan Cheese'],
    },
    { id: 'buffalo', name: 'Buffalo Eggceptional Bowl', price: 14.99, desc: 'Bold buffalo flavors paired with cool ranch and our signature deviled eggs.', image: 'assets/products/buffalo-bowl.jpg',
      addOns: [
        { label: 'Double Meat', price: 3.00, note: '+4oz meat' },
        { label: 'Smashed Avocado', price: 2.00, note: '½ whole fresh avocado' },
        { label: 'Eggstra Egg', price: 2.00, note: '+3oz egg whites' },
      ],
      exclusions: ['Grilled Chicken', 'Red Onion', 'Lettuce', 'Buffalo Sauce', 'Homemade Ranch', 'Cheddar', 'Egg White'],
    },
    { id: 'walking-taco', name: 'Walking Taco Eggceptional Bowl', price: 14.99, note: '70g Protein', desc: 'Seasoned meat, crunchy chips, cheese, salsa, and deviled eggs in one bowl.', image: 'assets/products/walking-taco-bowl.jpg',
      addOns: [
        { label: 'Double Meat', price: 3.00, note: '+4oz meat' },
        { label: 'Smashed Avocado', price: 2.00, note: '½ whole fresh avocado' },
        { label: 'Eggstra Egg', price: 3.00, note: '+3oz egg whites' },
      ],
      exclusions: ['Refried Beans', 'Sharp Cheddar Cheese', 'Cholula', 'Lettuce', 'Sour Cream', 'Doritos', 'Chicken', 'Egg White'],
    },
    { id: 'bangin-brisket', name: 'Bangin’ Brisket Eggceptional Bowl', price: 14.99, note: '57g Protein', desc: 'Slow-smoked brisket paired with our deviled eggs for bold Texas flavor.', image: 'assets/products/bangin-brisket-bowl.jpg',
      addOns: [
        { label: 'Double Meat', price: 5.00, note: '+4oz meat' },
        { label: 'Smashed Avocado', price: 2.00, note: '½ whole fresh avocado' },
        { label: 'Eggstra Egg', price: 2.00, note: '+3oz egg whites' },
      ],
      exclusions: ['Brisket', 'Pickled Jalapeño', 'Red Onion', 'BBQ Sauce', 'Cheese', 'Lettuce'],
    },
    { id: 'pok-egg', name: 'Pok-Egg Eggceptional Bowl', price: 14.99, note: '32g Protein', desc: 'Hawaiian-inspired poke-style bowl with crisp vegetables and deviled eggs.', image: 'assets/products/pok-egg-bowl.jpg',
      addOns: [
        { label: 'Double Meat', price: 4.00, note: '+4oz meat' },
        { label: 'Avocado Smash', price: 2.00, note: '½ whole fresh avocado' },
        { label: 'Eggstra Eggs', price: 3.00, note: '+3oz egg whites' },
      ],
      exclusions: ['Egg Whites', 'Imitation Crab', 'Sriracha Aioli', 'Avocado Smash', 'Cucumber', 'Teriyaki', 'Black Sesame Seeds'],
    },
  ];

  // Both sizes are "pick one flavor for the whole tub" on the live site —
  // a real picker (same +/- allocation widget and per-flavor exclusions as
  // the deviled egg packs), not a plain add as first assumed. total:1/
  // maxFlavors:1 means the picker's own generic "choose N eggs" copy needs
  // a singular-safe path (see openDozenModal/renderModalFooter) since every
  // pack size before this had total > 1.
  const EGG_SALADS = [
    { id: 'half-pint', name: '1/2 Pint Deviled Egg Salad – 8oz', price: 8.99, note: '320 Cal.', desc: 'Our creamy, tangy deviled egg salad in a convenient half-pint portion.', image: 'assets/products/egg-salad-half-pint.jpg', pickerConfig: { total: 1, maxFlavors: 1 } },
    { id: 'whole-pint', name: 'Whole Pint Deviled Egg Salad – 16oz', price: 12.99, note: '640 Cal.', desc: 'A full pint of our signature deviled egg salad — perfect for sharing.', image: 'assets/products/egg-salad-pint.jpg', pickerConfig: { total: 1, maxFlavors: 1 } },
  ];

  const PLATTERS = [
    // Same product as DEVILED_EGGS' '24-count-platter' — carries the same
    // pickerConfig so it customizes here too instead of the plain add this
    // card silently fell back to before (a real bug: this card and its
    // Deviled Eggs twin used to behave differently for the identical item).
    { id: '24-count', name: '24 Count Deviled Egg Platter', price: 44.99, note: '1680 Cal.', desc: 'A stunning platter of 24 deviled eggs — the ultimate centerpiece for your next event or celebration.', image: 'assets/products/24-count-platter.jpg', pickerConfig: { total: 24, maxFlavors: 3 } },
    { id: 'try-them-all', name: 'Try Them All Deviled Egg Platter', price: 54.99, note: '1800 Cal.', desc: 'Every flavor we offer on one beautiful platter — the complete Deviled Egg Co. experience.', image: 'assets/products/try-them-all-platter.jpg' },
  ];

  const CATERING = [
    { id: 'all-in-power-lunch', name: 'The “All In” Power Lunch', price: 15, note: 'Per person · min 10 boxes', desc: 'The complete lunch experience — a sandwich or bowl, chips, a pickle and a drink for your team.', image: 'assets/products/all-in-power-lunch.jpg' },
    { id: 'coffee-bar', name: 'Catering Coffee Bar', price: 24.99, note: 'Per service · serves 10–12', desc: 'A full coffee bar service to complement your catering order.' },
    { id: 'power-pair', name: 'Power Pair Bundle', price: 59.99, note: 'Per bundle · serves 10', desc: 'Two of our most popular items bundled together for easy group ordering.' },
    { id: 'bagel-brew', name: 'Bagel & Brew Bundle', price: 69.99, note: 'Per bundle · serves 10', desc: 'Fresh bagels with deviled egg salad plus our coffee bar — perfect for morning meetings.' },
    { id: 'hungry-team', name: 'The “Hungry Team”', price: 99.99, note: 'Per bundle · serves 10', desc: 'Our biggest catering bundle — feeds a hungry team with all the favorites.' },
    { id: 'light-lunch', name: 'The “Light Lunch”', price: 69.99, note: 'Per bundle · serves 10', desc: 'A lighter catering option that still packs all the deviled egg flavor.' },
  ];

  const WRAP_PRICE = 9.99;
  const WRAP_IMAGE = 'assets/products/eggceptional-wraps.jpg';
  const WRAP_DESC = 'Fresh-pressed flatbread wraps built from our signature deviled egg flavors — pick your filling, then add sides.';
  // Sourced verbatim from deviledeggco.com/product/eggceptional-wraps: each flavor's own ingredient line.
  // `photo` is the sandwich's own photo (assets/sandwiches) where the owner has supplied one (BLTE, The Caesar, Buffalo Chicken);
  // Cali Roll still uses the matching deviled egg flavor's still until its photo arrives.
  // `exclusions` are the ingredients a customer can leave out, read off that line; the yolk or crab mix is the
  // base of the filling and stays (the live page lists no "NO:" toggles for this product, so confirm these).
  const WRAP_FLAVORS = [
    { id: 'blte', label: 'BLTE', photo: 'assets/sandwiches/blte.jpg', ingredients: 'Ranch Yolk Mix, Bacon, Cheddar Cheese, Lettuce, Tomato & House-Made Creamy Ranch',
      exclusions: ['Bacon', 'Cheddar cheese', 'Lettuce', 'Tomato', 'Creamy ranch'] },
    { id: 'cali-roll', label: 'Cali Roll', photo: 'assets/catering/flavors/cali-roll-square-img.jpg', ingredients: 'Imitation Crab Mix, Sriracha Aioli, Fresh Avocado, Cucumber, Teriyaki & Black Sesame',
      exclusions: ['Sriracha aioli', 'Avocado', 'Cucumber', 'Teriyaki', 'Black sesame'] },
    { id: 'the-caesar', label: 'The Caesar', photo: 'assets/sandwiches/caesar.jpg', ingredients: 'Caesar Yolk Mix, Grilled Chicken, Bacon, Parmesan Cheese, Lettuce, Tomato & House-Made Creamy Ranch',
      exclusions: ['Grilled chicken', 'Bacon', 'Parmesan cheese', 'Lettuce', 'Tomato', 'Creamy ranch'] },
    { id: 'buffalo-chicken', label: 'Buffalo Chicken', photo: 'assets/sandwiches/buffalo-chicken.jpg', ingredients: 'Buffalo Yolk Mix, Grilled Chicken, Red Onion, Buffalo Sauce, Lettuce & House-Made Creamy Ranch',
      exclusions: ['Grilled chicken', 'Red onion', 'Buffalo sauce', 'Lettuce', 'Creamy ranch'] },
  ];
  // "Make it a Meal" is its own highlighted toggle on the live site, but it
  // shares the exact {label, price, note} shape the bowl modal's own addOns
  // already use, so it gets Add-Ons' existing chip UI for free as the first
  // entry here instead of a one-off toggle component built for one row.
  // "Make it a Meal" is its own choice in the modal (wrap or meal), not one of the add-ons.
  const WRAP_MEAL = { label: 'Make it a meal', price: 3.49, note: 'Chips & a bottled drink' };
  const WRAP_ADDONS = [
    { label: 'Cookie', price: 2.00 },
    { label: 'Gourmet 2-Pack of Deviled Eggs', price: 2.00 },
    { label: '4oz House-Made Egg Salad', price: 2.00 },
    { label: 'Bag of Chips', price: 2.00 },
  ];

  // Replaces "The All In Power Lunch" (a catering item that never actually
  // belonged in this section — see CATERING above, which keeps it) with the
  // real Sandwich/Wrap product from deviledeggco.com: a single flavor pick
  // (up to 1) plus paid Add-Ons. That shape is closer to the bowl modal's
  // (flavor choice + add-ons together) than the dozen picker's multi-flavor
  // allocation across a shared 19-flavor list, so rather than bend either
  // existing modal to fit, this gets its own small dedicated one
  // (openWrapModal) — see "Wrap customization modal" below.
  // The one product the modal builds (its photo, price, meal and add-ons); the menu shows it as one card per sandwich.
  const WRAP_PRODUCT = { id: 'eggceptional-wraps', name: 'Eggceptional Wraps', price: WRAP_PRICE, desc: WRAP_DESC, image: WRAP_IMAGE, wrapFlavors: WRAP_FLAVORS, meal: WRAP_MEAL, addOns: WRAP_ADDONS };
  // Sandwich/Wrap in the menu is a grid of the four sandwiches. Each card opens the wrap modal with its flavor already chosen
  // (the flavor can still be changed there). The photo is the sandwich's own where supplied, else the matching deviled egg flavor's still.
  const SANDWICH_WRAP = WRAP_FLAVORS.map((f) => ({
    id: 'wrap-' + f.id, name: f.label, price: WRAP_PRICE, note: 'Wrap', desc: f.ingredients,
    image: f.photo, wrapFlavors: WRAP_FLAVORS, wrapProduct: WRAP_PRODUCT, wrapFlavorId: f.id,
  }));

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

  // Each flavor's own clip, poster and copy, taken from the live 12 Pack page
  // (assets/flavors/<file>.mp4 and .jpg; the live page's descriptions verbatim,
  // calories and protein are per egg). Chicken and Waffle's live description is
  // just its three parts and the page lists no nutrition for it.
  const FLAVOR_MEDIA = {
    'blte': { file: 'BTLE', desc: "This brunch-inspired egg stacks all the best parts of a BLT—loaded with bacon, juicy cherry tomato, shredded romaine lettuce—on top of our ranch-spiked yolk filling. One bite, and you’ll understand why we added the “E” for egg.", cal: 85, protein: '5' },
    'backyard-bbq': { file: 'Backyard-BBQ', desc: "Get ready for a backyard classic, reinvented. Savory yolk mix piled high with Texas beef brisket, a pickled jalapeño, sweet BBQ sauce, and red onion. It’s like your favorite summer cookout, packed into one bold, bite-sized egg.", cal: 75, protein: '3.5' },
    'ballpark-special': { file: 'Ballpark', desc: "Think of this as your stadium snack—elevated. Creamy dijon and mayo deviled egg centers get the all-star treatment with an all beef hot dog slice, zesty mustard, ketchup, red onion, crunchy dill pickle, and crushed potato chips on top. It’s a home run of flavor.", cal: 85, protein: '3' },
    'buffalo-blue-cheese': { file: 'Buffalo-Blue', desc: "For fans of bold heat and creamy cheese, this one’s for you. Spicy hot sauce yolk filling meets tangy blue cheese crumbles, all finished with a drizzle of hot buffalo sauce. Fiery, rich, and perfect for heat-seekers.", cal: 60, protein: '6.5' },
    'buffalo-chicken-ranch': { file: 'Buffalo-Chicken', desc: "Spice and comfort collide in this creamy, tangy delight. Tender grilled chicken perches atop a ranch-kissed yolk filling, finished with a cool drizzle of ranch, buffalo sauce and a dash of chopped red onion.", cal: 50, protein: '4.5' },
    'cali-roll': { file: 'Cali-Roll', desc: "All the California roll flavor—none of the chopsticks. This sushi-inspired egg is filled with our house-made spicy crab mix, cucumber slivers, black sesame, and a sweet teriyaki drizzle. It’s bright, cool, and sure to blow your mind.", cal: 45, protein: '3' },
    'cheeseburger': { file: 'Cheeseburger', desc: "Think of this as your favorite burger… minus the bun. Creamy flavor packed yolk filling, hot seasoned ground beef patty, melted american cheese, dill pickle and onion. Topped with romaine lettuce and a ketchup drizzle on top.", cal: 70, protein: '4.5' },
    'chicken-bacon-ranch': { file: 'Chicken-Bacon-Ranch', desc: "What happens when grilled chicken, bacon, and ranch come together? Deviled egg magic. This savory bite is topped with shredded cheddar for even more creamy indulgence.", cal: 77, protein: '5.5' },
    'chicken-caesar': { file: 'The-Caesar', desc: "Salad meets snack. Our Caesar-inspired yolk filling gets crowned with grilled chicken, crunchy lettuce, parmesan, and bits. Finished with a drizzle of creamy Caesar dressing, it’s got all the richness of your favorite salad in one savory scoop.", cal: 85, protein: '5.5' },
    'chicken-pickle-egg': { file: 'Chicken-Pickle', desc: "Simple, satisfying, and wildly craveable. Juicy grilled chicken and a crisp pickle ride atop a lightly sweet yolk blend for a salty-sweet punch that brings classic deli vibes in every bite.", cal: 60, protein: '4.5' },
    'chicken-waffle': { file: 'Chicken-Waffle', desc: "Chicken, Waffle and Syrup" },
    'crab-rangoon': { file: 'Crab-Rangoon', desc: "Cream cheese, krab, and a crispy wonton topper—this egg takes its cue from a beloved takeout favorite. Drizzled with sweet & sour sauce, it’s the perfect sweet-savory bite.", cal: 70, protein: '3.5' },
    'everything-seasoning': { file: 'Everything', desc: "Inspired by your favorite bagel. A creamy cream cheese yolk mix gets topped with a hearty sprinkle of everything bagel seasoning—think sesame, garlic, poppy, and sea salt. Brunch just got better.", cal: 55, protein: '3.5' },
    'jalapeno-popper': { file: 'Popper', desc: "Cheesy. Spicy. Bacon-y. This egg hits all the popper notes with a smooth cream cheese yolk, topped with crispy bacon, fresh jalapeño, and a chipotle drizzle for a good smoky measure.", cal: 70, protein: '4.5' },
    'smoked-salmon': { file: 'Smoked-Salmon', desc: "Elegant and rich, these deviled eggs bring together silky cream cheese, flakes of fully cooked wild caught smoked salmon, capers, and red onion. Perfect for brunch spreads or any excuse to feel fancy.", cal: 65, protein: '4' },
    'south-of-the-border': { file: 'South-Of-The-Border', desc: "Add a little fiesta to your plate. These eggs feature a spicy cholula yolk filling, jalapeño slices, and sharp cheddar crumbles. It’s bold, bright, and made for the salsa lovers.", cal: 50, protein: '4' },
    'sriracha-bacon': { file: 'Sriracha-Bacon', desc: "These eggs are here to bring the heat. Creamy yolk meets fiery sriracha, then gets topped with a hearty helping of bacon and another splash of sriracha to turn things up a notch.", cal: 65, protein: '4.5' },
    'traditional': { file: 'Traditional', desc: "Classic for a reason. Smooth, velvety yolk mix with a touch of dijon and mayo, finished with a dusting of paprika. Sometimes, you just want the original.", cal: 60, protein: '2.5' },
    'walking-taco': { file: 'Walking-Taco', desc: "Part taco, part deviled egg, fully addictive. Creamy yolk meets seasoned grilled chicken, refried beans, cheese, lettuce, and crushed nacho Doritos. Topped with sour cream, it’s flavor in every crunchy-creamy bite.", cal: 65, protein: '5' },
  };

  // The bagels: one product per clip (the fast-motion videos in assets/bagels, cut from the originals to 540px wide). [menu name, clip file,
  // the pack flavor whose "Remove ingredients" list it shares]. The still is the clip's last moments, the finished bagel.
  const BAGEL_DEFS = [
    ['Traditional', 'traditional', 'traditional'], ['Buffalo Chicken', 'buffalo-chicken', 'buffalo-chicken-ranch'],
    ['Buffalo Blue Cheese', 'buffalo-blue', 'buffalo-blue-cheese'], ['Walking Taco', 'walking-taco', 'walking-taco'],
    ['South of the Border', 'south-of-the-border', 'south-of-the-border'], ['Bacon Wrapped Jalapeño Popper', 'popper', 'jalapeno-popper'],
    ['Everything Bagel', 'everything', 'everything-seasoning'], ['Smoked Salmon', 'smoked-salmon', 'smoked-salmon'],
    ['Crab Rangoon', 'crab-rangoon', 'crab-rangoon'], ['Cali Roll', 'cali-roll', 'cali-roll'], ['Cheeseburger', 'cheeseburger', 'cheeseburger'],
    ['Bangin’ Brisket', 'backyard-bbq', 'backyard-bbq'], ['Chicken ’n a Pickle', 'chicken-pickle', 'chicken-pickle-egg'],
    ['Chicken Bacon Ranch', 'chicken-bacon-ranch', 'chicken-bacon-ranch'], ['BLTE', 'blte', 'blte'],
    ['Chicken Caesar Salad', 'caesar', 'chicken-caesar'], ['Ball Park', 'ball-park', 'ballpark-special'],
    ['Sriracha Bacon', 'sriracha-bacon', 'sriracha-bacon'], ['Chicken and Waffle', 'chicken-waffle', 'chicken-waffle'],
  ];
  // The line under a bagel's name is made from what is on it (its "Remove ingredients" list), so it never describes a deviled egg.
  function bagelDesc(label, flavor) {
    // The lists are capitalized unevenly, so each item is lowercased and the names that keep a capital get it back.
    const proper = [[/\bdoritos\b/g, 'Doritos'], [/\blay’s\b/g, 'Lay’s'], [/\bcaesar\b/g, 'Caesar'], [/\bamerican\b/g, 'American'], [/\bbbq\b/g, 'BBQ']];
    const on = flavor ? flavor.exclusions.map((x) => proper.reduce((t, [re, to]) => t.replace(re, to), x.toLowerCase())) : [];
    if (!on.length) return BAGEL_DESC;
    const list = on.length === 1 ? on[0] : `${on.slice(0, -1).join(', ')} and ${on[on.length - 1]}`;
    return `A fresh bagel with our ${label} yolk spread, with ${list}.`;
  }
  const BAGEL_ITEMS = BAGEL_DEFS.map(([label, slug, flavorId]) => {
    const flavor = FLAVORS.find((f) => f.id === flavorId);
    return {
      id: 'bagel-' + slug, bagel: true, label, name: /Bagel$/.test(label) ? label : `${label} Bagel`,
      price: BAGEL_PRICE, note: BAGEL_NOTE, desc: bagelDesc(label, flavor),
      image: `assets/bagels/${slug}.jpg`, video: `assets/bagels/${slug}.mp4`, exclusions: flavor ? flavor.exclusions : [],
    };
  });

  // Nationwide shipping kits (Nationwide Shipping page). Contents are the live
  // product pages' own: the kit copy, the 12 flavors those pages offer (each
  // with the same "NO:" ingredient toggles as FLAVORS above) and the shipping
  // and storage note. They open the same dozen-style modal as the menu's packs
  // and add to the in-app bag — never an outside page.
  const SHIPPING_NOTICE = 'Our eggs are never frozen. They ship in coolers on ice. Once they arrive, refrigerate them (they cannot be frozen) and eat within 3 days.';
  const KIT_FLAVOR_IDS = ['backyard-bbq', 'buffalo-blue-cheese', 'buffalo-chicken-ranch', 'cali-roll', 'chicken-bacon-ranch', 'chicken-pickle-egg', 'everything-seasoning', 'jalapeno-popper', 'smoked-salmon', 'south-of-the-border', 'sriracha-bacon', 'traditional'];
  const SHIPPING_KITS = [
    {
      id: 'kit-sampler', name: 'Mini Deviled Egg Salad Sampler', price: 74.99, note: 'Try them all', image: 'assets/shipping/kit-sampler.png', ships: true, cart: 'shipping',
      desc: 'Try all of our top sellers- shipped right to your door. This is a great gift for birthdays, anniversaries or just because.',
      detailsLabel: 'This kit includes:',
      details: ['(18) 2oz deviled egg salads perfect for eggsploring our options before your next big event.'],
      fixedFlavors: ['Traditional', 'Everything Seasoning', 'Smoked Salmon', 'South of the Border', 'Sriracha Bacon', 'Jalapeño Popper', 'Crab Rangoon', 'Chicken Bacon Ranch', 'Cali Roll', 'Buffalo Blue Cheese', 'Buffalo Chicken', 'Chicken and Pickle Egg', 'Chicken Caesar', 'Gyro', 'Cheeseburger', 'BBQ Chicken'],
      notice: SHIPPING_NOTICE,
    },
    {
      id: 'kit-24', name: '24 Count Kit', price: 64.99, note: '2 flavors', image: 'assets/shipping/kit-24.png', ships: true, cart: 'shipping',
      desc: 'Twenty-four deviled eggs in two flavors of your choice, packed cold with the yolk filling in piping bags and the toppings, ready to assemble.',
      details: ['24 egg white halves conveniently packaged into egg trays with lids perfect for transporting or storing.', '2 flavors of yolk filling in piping bags for the perfect presentation.', 'Toppings for your deviled egg flavors of choice.'],
      flavorIds: KIT_FLAVOR_IDS, pickerConfig: { total: 24, maxFlavors: 2 },
      notice: SHIPPING_NOTICE,
    },
    {
      id: 'kit-36', name: '36 Count Kit', price: 99.99, note: '3 flavors', image: 'assets/shipping/kit-36-placeholder.svg', ships: true, cart: 'shipping',
      desc: 'Thirty-six deviled eggs in three flavors of your choice, packed cold with the yolk filling in piping bags and the toppings, ready to assemble.',
      details: ['36 egg white halves conveniently packaged into egg trays with lids perfect for transporting or storing.', '3 flavors of yolk filling in piping bags for the perfect presentation.', 'Toppings for your deviled egg flavors of choice.'],
      flavorIds: KIT_FLAVOR_IDS, pickerConfig: { total: 36, maxFlavors: 3 },
      notice: SHIPPING_NOTICE,
    },
  ];

  // Three carts, one per fulfillment path: Pickup (the location menus), Delivery (the same menu, brought to an
  // address) and Shipping (Nationwide Shipping kits). Catering is not a cart of its own: a catering item goes into
  // the Pickup or Delivery bag, next to everything else in it. Each cart checks out on its own page.
  const CART_KINDS = ['pickup', 'delivery', 'shipping'];
  const CART_LABELS = { pickup: 'Pickup', delivery: 'Delivery', shipping: 'Shipping' };
  // Catering's figures, applied to a delivery bag that has a catering item in it: a flat fee, free over a threshold.
  const CATERING_DELIVERY_FEE = 20;
  const CATERING_FREE_DELIVERY_AT = 200;
  // Delivery's placeholder rules, until real ones are approved: one flat fee, a minimum subtotal, and the ASAP estimate.
  const DELIVERY_FEE = 1.99;
  // Delivery menu prices are the pickup prices plus 30% (a $12.99 item is $16.89), each unit rounded to the cent. Catering is priced on its own
  // (its flat fee, free over a threshold) and is not marked up.
  const DELIVERY_MARKUP = 1.3;
  const DELIVERY_MINIMUM = 15;
  const DELIVERY_ASAP_LABEL = 'ASAP (35–50 min)';

  // The nav indicator draws only once the rest of the app is set up (see Init at the end).
  let navWhereReady = false;

  // Set when the customer starts from Home's "Order catering" tile: the "where" modal then offers only times catering
  // can meet (see cateringLead), and the funnel ends on the order page's Catering group. It lasts for that pickup or
  // delivery session; starting a regular funnel, cancelling the modal or placing an order clears it.
  let cateringIntent = false;
  try { cateringIntent = localStorage.getItem('deg-catering-intent') === '1'; } catch (e) { /* ignore */ }
  // What the flag was before a funnel from Home changed it, so cancelling that funnel puts it back.
  let intentBeforeFunnel = null;
  // True only for the funnel that Home's "Order catering" tile started: that one ends on the Catering group, no other does. The flag
  // above can outlive a cancelled funnel; this one cannot, so a later "Continue to menu" always goes to the menu.
  let funnelForCatering = false;
  // True from a card tap on the Catering page until that tap's "where" or time step is finished or cancelled: the steps then offer only
  // times catering can meet, as if the bag already held catering. Unlike `cateringIntent` it is never saved, and cancelling clears it.
  let cateringTap = false;
  // Set when "Change time" was tapped on the nav's saved order: the time modal then returns to the where modal, not to the page.
  let ldBackToWhere = null;
  function setCateringIntent(on) {
    cateringIntent = !!on;
    try { if (on) localStorage.setItem('deg-catering-intent', '1'); else localStorage.removeItem('deg-catering-intent'); } catch (e) { /* ignore */ }
  }

  const state = {
    carts: { pickup: [], delivery: [], shipping: [] },
    drawerCart: 'pickup',
    // Which funnel the order page is serving: 'pickup' or 'delivery'. A product added there goes to that cart.
    orderMode: 'pickup',
    // The store whose own page (#store/<id>) is showing, or null.
    viewStore: null,
    modalFlavorQty: {},
    modalExclusions: {},
    modalQty: 1,
    bagelToast: 'Not Toasted',
    bagelType: 'Plain',
    bagelOptions: new Set(),
    bagelQty: 1,
    bowlAddOns: new Set(),
    bowlExclusions: new Set(),
    bowlOptions: new Set(),
    bowlQty: 1,
    location: 'McKinney, TX',
    pickupDateKey: null,
    pickupTimeId: null,
    pickupTimeLabel: null,
    payment: 'Apple Pay',
    tipPct: 18, // a percentage, or 'custom' to use tipCustom (dollars)
    tipCustom: 0,
  };

  // Carts saved before product images were wired into the cart/checkout
  // views persisted without an `image` field. Backfill it by name on load
  // so an existing cart self-heals instead of staying stuck on the
  // placeholder icon until the user manually clears it.
  const PRODUCT_IMAGE_BY_NAME = {};
  [...DEVILED_EGGS, ...PROTEIN_BOWLS, ...EGG_SALADS, ...PLATTERS, ...CATERING, WRAP_PRODUCT, ...WRAP_FLAVORS.map((f) => ({ name: `${f.label} Eggceptional Wrap`, image: f.photo }))].forEach((p) => {
    if (p.image) PRODUCT_IMAGE_BY_NAME[p.name] = p.image;
  });
  // A product with options (the 6 Pack) is saved in the bag under the chosen option's own name.
  [...DEVILED_EGGS].forEach((p) => (p.options || []).forEach((o) => { PRODUCT_IMAGE_BY_NAME[o.name] = o.image; }));
  PRODUCT_IMAGE_BY_NAME['Full Size Bagel'] = BAGEL_IMAGE;
  BAGEL_ITEMS.forEach((b) => { PRODUCT_IMAGE_BY_NAME[b.name] = b.image; });
  // The product with the options picked: its name, price, photo, description and picker become the option's.
  const resolveOption = (product, optionId) => {
    if (!product.options) return product;
    const o = product.options.find((x) => x.id === optionId) || product.options[0];
    return { ...product, ...o, id: product.id, optionId: o.id };
  };
  // Lines saved before the two 6 Packs became one remember which one they were by their old ids.
  const LEGACY_OPTION = { '6-pack-3-flavors': ['6-pack', '3-flavors'], '6-pack-6-flavors': ['6-pack', '6-flavors'] };
  const round2 = (n) => Math.round(n * 100) / 100;
  const forDelivery = (n) => round2(n * DELIVERY_MARKUP);
  // Menu prices shown while ordering delivery; a catering item keeps its own.
  const shownPrice = (item) => (!item.catering && orderKind() === 'delivery' ? forDelivery(item.price) : item.price);
  const priceLabel = (item) => (item.options ? 'From ' : '') + money(shownPrice(item));
  // A copy of an item with every price in it marked up (its options, add-ons, meal), so the modal that opens works in delivery prices throughout.
  function deliveryPriced(v) {
    if (Array.isArray(v)) return v.map(deliveryPriced);
    if (v && typeof v === 'object') {
      const o = {};
      Object.keys(v).forEach((k) => { o[k] = k === 'price' && typeof v[k] === 'number' ? forDelivery(v[k]) : deliveryPriced(v[k]); });
      return o;
    }
    return v;
  }
  SHIPPING_KITS.forEach((k) => { PRODUCT_IMAGE_BY_NAME[k.name] = k.image; });
  // The Distilled and Custom Shipping pages' card photos: WebP cut to the 161px they show (and twice that), with the size set up front.
  const SHIPPING_KITS_OPT = SHIPPING_KITS.map((k) => {
    const sized = { 'kit-sampler': 'kit-sampler', 'kit-24': 'kit-24' }[k.id];
    // The photo's average color, shown behind it while it loads, so the card has its color before the picture arrives.
    const bg = { 'kit-sampler': '#B06A3D', 'kit-24': '#A18357' }[k.id];
    if (!sized) return k;
    const base = `assets/shipping/opt/${sized}`;
    return { ...k, thumb: { srcset: `${base}-240.webp 240w, ${base}-480.webp 480w`, sizes: '(max-width: 640px) 128px, 200px', width: 200, height: 200, bg, eager: k.id === 'kit-sampler' } };
  });

  // Saved carts: the current per-path shape, or the older single list, whose
  // shipping kits (tagged `ships`) move to the Shipping cart.
  const withImage = (item) => ({ ...item, image: item.image || PRODUCT_IMAGE_BY_NAME[item.name] });
  let savedCatering = [];
  try {
    const saved = JSON.parse(localStorage.getItem('deg-carts') || 'null');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      // (A gift card used to sit in these bags; it has its own checkout now, so any left from an earlier visit are dropped.)
      CART_KINDS.forEach((kind) => { if (Array.isArray(saved[kind])) state.carts[kind] = saved[kind].filter((item) => !item.giftCard).map(withImage); });
      // A Catering cart saved before catering joined the Pickup and Delivery bags moves into the one in use.
      if (Array.isArray(saved.catering)) savedCatering = saved.catering.map(withImage);
    } else {
      const legacy = JSON.parse(localStorage.getItem('deg-cart') || 'null');
      if (Array.isArray(legacy)) {
        legacy.forEach((item) => state.carts[item.ships ? 'shipping' : 'pickup'].push(withImage(item)));
      }
    }
  } catch (e) { /* ignore corrupt storage */ }

  // The path the customer is on survives a reload, so the nav indicator names the same one afterwards.
  function setOrderMode(mode) {
    state.orderMode = mode;
    try { localStorage.setItem('deg-order-mode', mode); } catch (e) { /* storage unavailable */ }
  }
  try { if (localStorage.getItem('deg-order-mode') === 'delivery') state.orderMode = 'delivery'; } catch (e) { /* ignore */ }
  savedCatering.forEach((line) => state.carts[state.orderMode].push({ ...line, catering: true, cart: state.orderMode }));

  function persistCart() {
    localStorage.setItem('deg-carts', JSON.stringify(state.carts));
    localStorage.removeItem('deg-cart');
  }

  function money(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  // Items across every cart (the header badge), or one cart's.
  // Catering counts lines, not boxes: 200 boxes is one order line, and "211 items" on two lines was misleading.
  const unitsIn = (kind, items) => items.reduce((n, item) => n + (item.catering ? 1 : item.qty), 0);
  function cartCount(kind) {
    const kinds = kind ? [kind] : CART_KINDS;
    return kinds.reduce((sum, k) => sum + unitsIn(k, state.carts[k]), 0);
  }

  // A line's price × qty, plus anything charged once per line (a catering box's drinks).
  const lineTotal = (item) => item.price * item.qty + (item.extra || 0);
  // A line's detail text: a box meal's is rebuilt from its saved choices, so it can never disagree with them.
  const lineSub = (item) => (item.config ? boxLineSub(item) : escapeHTML(item.sub || ''));

  function cartSubtotal(kind) {
    return state.carts[kind].reduce((sum, item) => sum + lineTotal(item), 0);
  }

  // Which cart an entry belongs to travels with it (`entry.cart`). Otherwise it follows the page it was added on:
  // the delivery order page fills the Delivery cart, every other menu the Pickup cart.
  const orderKind = () => (state.orderMode === 'delivery' && (!views.order.hidden || !views.menu.hidden) ? 'delivery' : 'pickup');
  // How much the last add moved the badge, so the add flight can hold the old count until it lands.
  let lastAddDelta = 0;
  // A cart line can be reopened in the modal that built it. `editingLine` is the line that modal is
  // changing (null while it is adding a new one) and `editingKind` the cart to go back to afterwards.
  let editingLine = null;
  let editingKind = null;
  // Closing a modal ends the edit. A line that had no saved choices (it predates Edit) was given a blank spec
  // just to open the modal; if the customer cancels, it goes back to how it was.
  function endLineEdit() {
    if (editingLine && editingLine.edit && editingLine.edit.blank) delete editingLine.edit;
    editingLine = null;
  }
  // Saving an edit replaces the line where it sits, closes the modal and returns to the drawer.
  function commitLineEdit(fields, closeModal) {
    Object.assign(editingLine, fields);
    if (!editingLine.catering && typeof fields.price === 'number') editingLine.basePrice = editingKind === 'delivery' ? round2(fields.price / DELIVERY_MARKUP) : fields.price;
    persistCart();
    renderCartBadge();
    closeModal();
    openCart(editingKind);
  }

  function addToCart(entry) {
    // The pickup price travels with the line, so moving the bag between pickup and delivery reprices it exactly.
    if (!entry.catering) entry.basePrice = (entry.cart || orderKind()) === 'delivery' ? round2(entry.price / DELIVERY_MARKUP) : entry.price;
    const cart = state.carts[entry.cart || orderKind()];
    const before = cartCount();
    const existing = cart.find((c) => c.key === entry.key);
    if (existing) {
      existing.qty += entry.qty;
    } else {
      cart.push(entry);
    }
    lastAddDelta = cartCount() - before;
    persistCart();
    renderCartBadge();
    renderDrawer();
  }

  // ---------- Add-to-order moment ----------
  // Tapping Add closes the modal and the customer stays on the menu: the product
  // condenses into a token, arcs to the cart button, the button wobbles like a
  // nudged egg as it lands, the count ticks up (held at its old value until
  // then), and phones that can buzz do. The cart drawer is not opened; the
  // customer opens it when they choose. Reduced motion skips the flight and
  // keeps a calm opacity pulse.
  const CART_FLIGHT_MS = 640;
  const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);

  function flyThumb(image, origin, target) {
    const t = target.getBoundingClientRect();
    const x1 = t.left + t.width / 2;
    const y1 = t.top + t.height / 2;
    const size = 112;
    const endScale = 28 / size;
    const startScale = Math.min(3.2, Math.max(1, origin.size / size));
    const dx = x1 - origin.x;
    const dy = y1 - origin.y;
    const lift = Math.min(150, Math.max(70, Math.abs(dy) * 0.35));
    const el = document.createElement('div');
    el.className = 'fly-thumb';
    el.style.cssText = `left:${origin.x - size / 2}px;top:${origin.y - size / 2}px;width:${size}px;height:${size}px;`;
    if (image) el.style.backgroundImage = `url("${image}")`;
    document.body.appendChild(el);
    const steps = 18;
    const frames = Array.from({ length: steps + 1 }, (_, i) => {
      const p = i / steps;
      const e = easeInOutCubic(p);
      const x = dx * e;
      const y = dy * e - lift * 4 * e * (1 - e);
      // photo condenses to token size over the first fifth, then shrinks into the cart
      const scale = p < 0.2
        ? startScale + (1 - startScale) * easeOutCubic(p / 0.2)
        : 1 + (endScale - 1) * easeInOutCubic((p - 0.2) / 0.8);
      return { transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${-16 * e}deg)` };
    });
    const anim = el.animate(frames, { duration: CART_FLIGHT_MS, easing: 'linear', fill: 'forwards' });
    return anim.finished.catch(() => {}).then(() => el.remove());
  }

  function landCartPop(target, badge) {
    [target, badge].forEach((el) => { el.classList.remove('is-pop', 'is-bump'); void el.offsetWidth; });
    target.classList.add('is-pop');
    badge.classList.add('is-bump');
    window.setTimeout(() => { target.classList.remove('is-pop'); badge.classList.remove('is-bump'); }, 650);
    if (navigator.vibrate) navigator.vibrate(12);
  }

  function celebrateAdd(modal, closeModalFn, image, qty) {
    const target = document.getElementById('open-cart');
    const badge = document.getElementById('cart-badge');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Origin: the product photo if its centre is on screen, else the Add button
    // (always visible in the modal footer).
    let origin = null;
    const photo = modal.querySelector('.item-modal-media');
    if (photo) {
      const r = photo.getBoundingClientRect();
      const cy = r.top + r.height / 2;
      if (r.height > 0 && cy > 0 && cy < window.innerHeight) origin = { x: r.left + r.width / 2, y: cy, size: Math.min(r.width, r.height) };
    }
    if (!origin) {
      const addBtn = modal.querySelector('.item-modal-footer .pill-btn');
      if (addBtn) { const r = addBtn.getBoundingClientRect(); origin = { x: r.left + r.width / 2, y: r.top + r.height / 2, size: 0 }; }
    }
    closeModalFn();
    const land = () => {
      cartCountHeld = null;
      renderCartBadge();
      landCartPop(target, badge);
    };
    if (reduce || !origin || !target.animate || target.getBoundingClientRect().width === 0) { land(); return; }
    cartCountHeld = cartCount() - lastAddDelta;
    renderCartBadge();
    flyThumb(image, origin, target).then(land);
  }

  // ---------- Header / cart badge ----------
  // While an add-to-order flight is in the air, the badge and the mobile cart
  // bar keep showing the previous count (see celebrateAdd); null = show the truth.
  let cartCountHeld = null;
  function renderCartBadge() {
    // An empty cart has no badge at all, not a 0.
    const shown = cartCountHeld ?? cartCount();
    const badge = document.getElementById('cart-badge');
    badge.textContent = String(shown);
    badge.hidden = shown === 0;
    updateCartBar();
    renderNavWhere();
  }

  // ---------- Floating cart bar (mobile) ----------
  // Reacts only to the cart itself and to leaving/entering the menu view
  // (see showView() below), never to scroll position — unlike the category
  // pill bar, the brief calls for this one to stay up the entire time the
  // customer keeps browsing with items in the cart.
  const cartBar = document.getElementById('cart-bar');
  let cartBarHideTimer = null;
  function updateCartBar() {
    // The bar belongs to the menu, so it counts the pickup cart only; a count
    // held for a flight in progress is taken off the same way.
    const pending = cartCountHeld === null ? 0 : cartCount() - cartCountHeld;
    const count = cartCount(orderKind()) - pending;
    const show = count > 0 && (!views.menu.hidden || !views.order.hidden);
    if (show) {
      if (cartBarHideTimer) { window.clearTimeout(cartBarHideTimer); cartBarHideTimer = null; }
      document.getElementById('cart-bar-count').textContent = `(${count})`;
      cartBar.hidden = false;
      // Force layout so the fade/rise-in has a starting state to animate
      // from — same trick as openCart()'s own getBoundingClientRect() call.
      cartBar.getBoundingClientRect();
      cartBar.classList.add('is-visible');
    } else {
      cartBar.classList.remove('is-visible');
      cartBarHideTimer = window.setTimeout(() => { cartBar.hidden = true; cartBarHideTimer = null; }, 240);
    }
  }
  cartBar.addEventListener('click', openCart);

  // ---------- Menu grids ----------
  function renderGrids() {
    renderShopGrid('deviled-eggs-grid', DEVILED_EGGS, 'egg', 'Deviled eggs');
    renderShopGrid('protein-bowls-grid', PROTEIN_BOWLS, 'bowl', 'Protein bowl');
    renderShopGrid('egg-salads-grid', EGG_SALADS, 'saladcup', 'Egg salad');
    renderShopGrid('platters-grid', PLATTERS, 'platter', 'Party platter');
    renderShopGrid('sandwich-wrap-grid', SANDWICH_WRAP, 'wrap', 'Sandwich/Wrap');
    renderShopGrid('ship-kits-grid', SHIPPING_KITS, 'kit', 'Shipping kit');
    renderShipKits('ship-kits-grid-d', SHIPPING_KITS_OPT);
    renderShopGrid('ship-kits-grid-c', SHIPPING_KITS_OPT, 'kit', 'Shipping kit');
    renderShipHoliday();
    renderShopGrid('bagels-grid', BAGEL_ITEMS, 'bagel', 'Bagel');
    renderHomeFeatured();
    renderFeatured();
  }

  // Every product opens its modal first (never an instant add); which modal depends on what it can customize.
  function openMenuItem(item, keyPrefix, cartCategory) {
    if (gateFulfillment(() => openMenuItem(item, keyPrefix, cartCategory), orderTargetFor(item, keyPrefix))) return;
    // While ordering delivery the modal is opened on a copy with delivery prices.
    const priced = !item.catering && orderKind() === 'delivery' ? deliveryPriced(item) : item;
    if (priced.bagel) {
      openBagelModal(priced);
    } else if (priced.wrapFlavors) {
      openWrapModal(priced.wrapProduct, null, priced.wrapFlavorId);
    } else if (priced.pickerConfig || priced.fixedFlavors) {
      openDozenModal(priced);
    } else if (priced.addOns) {
      openBowlModal(priced);
    } else {
      openQuickviewModal(priced, { keyPrefix, cartCategory });
    }
  }

  // Featured row: real menu items only, each opening the same modal as its grid twin.
  // Figma annotation (DECo_Order_260920, node 231:7203): "remove this badge
  // both on mobile and desktop" — the eyebrow/kicker is gone; .featured-badge
  // stays as reusable infrastructure for a real future trait, just unused
  // by any current entry below.
  const FEATURED = [
    { from: DEVILED_EGGS, id: '12-pack', keyPrefix: 'egg', cartCategory: 'Deviled eggs' },
    { from: DEVILED_EGGS, id: '2-pack', keyPrefix: 'egg', cartCategory: 'Deviled eggs' },
    { from: DEVILED_EGGS, id: '6-pack', keyPrefix: 'egg', cartCategory: 'Deviled eggs' },
    { from: PLATTERS, id: '24-count', keyPrefix: 'platter', cartCategory: 'Party platter' },
    { from: EGG_SALADS, id: 'whole-pint', keyPrefix: 'saladcup', cartCategory: 'Egg salad' },
    { from: PROTEIN_BOWLS, id: 'avo-chick-blt', keyPrefix: 'bowl', cartCategory: 'Protein bowl' },
    { from: PROTEIN_BOWLS, id: 'bangin-brisket', keyPrefix: 'bowl', cartCategory: 'Protein bowl' },
  ];

  function renderFeatured() {
    const track = document.getElementById('featured-track');
    if (!track) return;
    track.innerHTML = '';
    FEATURED.forEach((f) => {
      const item = f.from.find((p) => p.id === f.id);
      if (!item) return;
      const li = document.createElement('li');
      li.className = 'featured-card';

      const media = document.createElement('div');
      media.className = 'featured-media';
      if (f.badge) media.insertAdjacentHTML('beforeend', `<span class="featured-badge">${f.badge}</span>`);
      media.appendChild(productThumb(item));
      const btn = document.createElement('button');
      btn.className = 'add-btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', (item.pickerConfig || item.addOns || item.wrapFlavors) ? 'Customize ' + item.name : 'View ' + item.name);
      btn.innerHTML = ADD_ICON;
      media.appendChild(btn);
      li.appendChild(media);

      li.insertAdjacentHTML('beforeend', `
        <span class="featured-name">${item.name}</span>
        <span class="featured-meta"><span class="featured-price">${priceLabel(item)}</span>${item.note ? `<span aria-hidden="true">•</span><span>${item.note}</span>` : ''}</span>`);

      const activate = () => openMenuItem(item, f.keyPrefix, f.cartCategory);
      btn.addEventListener('click', activate);
      li.addEventListener('click', (e) => { if (!e.target.closest('.add-btn')) activate(); });
      track.appendChild(li);
    });
    wireFeaturedArrows(track);
  }

  // Arrows page the row by roughly one visible width and disable themselves at either end.
  function wireFeaturedArrows(track) {
    const arrows = document.querySelectorAll('.featured-arrow');
    const sync = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      arrows.forEach((a) => { a.disabled = a.dataset.dir === '-1' ? track.scrollLeft <= 2 : track.scrollLeft >= max; });
    };
    arrows.forEach((a) => {
      a.onclick = () => {
        // Smooth paging, except when motion is reduced or the tab is hidden (smooth scrolling stalls there).
        const still = document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        track.scrollBy({ left: Number(a.dataset.dir) * track.clientWidth * 0.85, behavior: still ? 'instant' : 'smooth' });
      };
    });
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  // ---------- Home page: featured sections (the client's picks) ----------
  // To change what Home features, edit HOME_FEATURED. A section has a title, a line under it, and either a row of items or one spotlight.
  // An item is named by where it lives:
  //   { group: 'protein-bowls', id: 'avo-chick-blt' }   an item on the order page (Pickup or Delivery, whichever the customer last used)
  //   { catering: 'power-pair' }                          a catering item (opens on the Catering page)
  //   { shipping: 'kit-24' }                              a shipping kit (opens on the Nationwide Shipping page)
  // `see` is the link at the end of a section: { group, label } for an order page group, { page: 'catering' | 'shipping', label } for those pages.
  // A spotlight shows one flavor (a key of FLAVOR_MEDIA) with its still and description, and the item its button opens. Nothing here adds a
  // fifth way to order: every card goes into Pickup, Delivery, Catering or Nationwide Shipping.
  const HOME_FEATURED = [
    {
      title: 'Featured bowls', sub: 'High-protein bowls built on egg whites.',
      see: { group: 'protein-bowls', label: 'See all bowls' },
      items: [{ group: 'protein-bowls', id: 'avo-chick-blt' }, { group: 'protein-bowls', id: 'bangin-brisket' }, { group: 'protein-bowls', id: 'buffalo' }, { group: 'protein-bowls', id: 'cheeseburger' }],
    },
    {
      title: 'New: Bagels', sub: 'Fresh bagels piled with our yolk spreads. Pick toasted or not.',
      see: { group: 'bagels', label: 'See all 19 bagels' },
      items: [{ group: 'bagels', id: 'bagel-blte' }, { group: 'bagels', id: 'bagel-cali-roll' }, { group: 'bagels', id: 'bagel-sriracha-bacon' }, { group: 'bagels', id: 'bagel-buffalo-chicken' }],
    },
    {
      title: 'Flavor of the month', sub: 'This month\'s pick, ready in a 6 Pack.',
      spotlight: { flavor: 'chicken-waffle', name: 'Chicken and Waffle', cta: 'Order a 6 Pack', item: { group: 'deviled-eggs', id: '6-pack' } },
    },
  ];

  // Resolves one HOME_FEATURED reference to what the card needs: the product, its order page group, and how it opens.
  function homeResolve(ref) {
    if (ref.group) {
      const group = ORDER_GROUPS.find((g) => g.id === ref.group);
      const item = group && group.items.find((i) => i.id === ref.id);
      return item ? { item, group, open: () => homeOpenOrder({ group, item }) } : null;
    }
    if (ref.catering) {
      const item = ORDER_GROUPS.find((g) => g.catering).items.find((i) => i.id === ref.catering);
      return item ? { item, open: () => { pushPage('#catering'); showView('catering'); openCateringItem(item.id); } } : null;
    }
    if (ref.shipping) {
      const item = SHIPPING_KITS.find((k) => k.id === ref.shipping);
      return item ? { item, open: () => { pushPage('#shipping'); showView('shipping'); openMenuItem(item, 'kit', 'Shipping kit'); } } : null;
    }
    return null;
  }
  // A card (or "see all") on Home goes into Pickup or Delivery: with a valid order for the path last used it lands on the order page at once,
  // otherwise the "where" modal comes first. Cancelling it forgets the tap, like a store page's.
  function homeOpenOrder(target) {
    const delivery = state.orderMode === 'delivery';
    if (delivery ? deliverySessionValid() : pickupSessionValid()) { openOnOrderPage(target); return; }
    pendingStoreOpen = () => openOnOrderPage(target);
    openWhere(delivery ? 'delivery' : 'pickup', { returnTo: 'store' });
  }

  function renderHomeFeatured() {
    const root = document.getElementById('home-featured');
    if (!root) return;
    root.innerHTML = '';
    HOME_FEATURED.forEach((sec, i) => {
      const section = document.createElement('section');
      section.className = 'home-feat';
      section.setAttribute('aria-labelledby', `home-feat-${i}`);
      let seeHTML = '';
      if (sec.see) seeHTML = `<button class="home-feat-see" type="button">${escapeHTML(sec.see.label)}${SHIP_KIT_ARROW}</button>`;
      section.innerHTML = `<div class="home-feat-head"><div><h2 id="home-feat-${i}">${escapeHTML(sec.title)}</h2><p>${escapeHTML(sec.sub)}</p></div>${seeHTML}</div>`;
      if (sec.see) {
        section.querySelector('.home-feat-see').addEventListener('click', () => {
          if (sec.see.group) homeOpenOrder({ group: ORDER_GROUPS.find((g) => g.id === sec.see.group), item: null });
          else if (sec.see.page) { pushPage('#' + sec.see.page); showView(sec.see.page); }
        });
      }
      if (sec.spotlight) {
        const sp = sec.spotlight;
        const media = FLAVOR_MEDIA[sp.flavor];
        const target = homeResolve(sp.item);
        const card = document.createElement('div');
        card.className = 'home-spot';
        card.innerHTML = `
          <div class="home-spot-media"><img src="${media ? `assets/flavors/${media.file}.jpg` : 'assets/flavors/placeholder.svg'}" alt="" width="360" height="540" loading="lazy" decoding="async"></div>
          <div class="home-spot-copy">
            <h3>${escapeHTML(sp.name)}</h3>
            ${media && media.desc ? `<p>${escapeHTML(media.desc)}</p>` : ''}
            <button class="pill-btn dark" type="button">${escapeHTML(sp.cta)}</button>
          </div>`;
        if (target) card.querySelector('button').addEventListener('click', target.open);
        section.appendChild(card);
      } else {
        const track = document.createElement('ul');
        track.className = 'home-feat-track';
        sec.items.forEach((ref) => {
          const r = homeResolve(ref);
          if (!r) return;
          const { item } = r;
          const li = document.createElement('li');
          li.className = 'featured-card';
          const media = document.createElement('div');
          media.className = 'featured-media';
          media.appendChild(productThumb(item));
          const btn = document.createElement('button');
          btn.className = 'add-btn';
          btn.type = 'button';
          btn.setAttribute('aria-label', `${(item.pickerConfig || item.addOns || item.wrapFlavors || item.bagel) ? 'Customize' : 'View'} ${item.name}`);
          btn.innerHTML = ADD_ICON;
          media.appendChild(btn);
          li.appendChild(media);
          li.insertAdjacentHTML('beforeend', `<span class="featured-name">${escapeHTML(item.name)}</span><span class="featured-meta"><span class="featured-price">${priceLabel(item)}</span>${item.note ? `<span aria-hidden="true">•</span><span>${escapeHTML(item.note)}</span>` : ''}</span>`);
          btn.addEventListener('click', r.open);
          li.addEventListener('click', (e) => { if (!e.target.closest('.add-btn')) r.open(); });
          track.appendChild(li);
        });
        section.appendChild(track);
      }
      root.appendChild(section);
    });
  }

  // `open` replaces the menu's own modal choice (the catering cards open the catering modal); such items always customize.
  function renderShopGrid(gridId, items, keyPrefix, cartCategory, open = null) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    items.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'shop-card' + (open ? ' shop-card-cater' : '');

      const body = document.createElement('div');
      body.className = 'shop-card-body';
      body.innerHTML = `
        <span class="shop-card-name">${item.name}</span>
        <span class="shop-card-meta">
          <span class="shop-card-price">${priceLabel(item)}</span>
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
      btn.setAttribute('aria-label', (open || item.pickerConfig || item.addOns || item.wrapFlavors) ? 'Customize ' + item.name : 'View ' + item.name);
      btn.innerHTML = ADD_ICON;
      const activate = open ? () => open(item) : () => openMenuItem(item, keyPrefix, cartCategory);
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

  // The kit card of the three new Shipping page versions (see index.html): the photo, the name, the price with what the kit is, a short
  // description and one plain action. The whole card opens the kit's modal; the button is the keyboard and screen-reader way in.
  const SHIP_KIT_ARROW = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  function renderShipKits(gridId, items) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    items.forEach((item) => {
      const open = () => openMenuItem(item, 'kit', 'Shipping kit');
      const action = item.fixedFlavors ? 'View kit' : 'Choose flavors';
      const card = document.createElement('article');
      card.className = 'ship-kit';
      const media = document.createElement('div');
      media.className = 'ship-kit-media';
      if (item.thumb && item.thumb.bg) media.style.backgroundColor = item.thumb.bg;
      media.appendChild(productThumb(item));
      const body = document.createElement('div');
      body.className = 'ship-kit-body';
      body.innerHTML = `
        <h3 class="ship-kit-name">${item.name}</h3>
        <p class="ship-kit-meta"><span class="ship-kit-price">${priceLabel(item)}</span>${item.note ? `<span class="ship-kit-chip">${item.note}</span>` : ''}</p>
        <p class="ship-kit-desc">${item.desc}</p>
        <button class="ship-kit-cta" type="button" aria-label="${action} for ${escapeHTML(item.name)}">${action}${SHIP_KIT_ARROW}</button>`;
      body.querySelector('.ship-kit-cta').addEventListener('click', open);
      card.addEventListener('click', (e) => { if (!e.target.closest('.ship-kit-cta')) open(); });
      card.append(media, body);
      grid.appendChild(card);
    });
  }

  // ---------- Pickup order page (#order) ----------
  // The Pickup funnel's third step, laid out like Chipotle's mobile ordering: a list of category tiles, and a tile
  // that stands for several products (the pack sizes, the egg salad sizes, the bowls) opens a screen of rows.
  // A tile for a single product opens its modal straight away. Every row opens the same modal as its card on #menu.
  const ORDER_GROUPS = [
    { id: 'deviled-eggs', name: 'Deviled Eggs', image: 'assets/products/12-pack.jpg', items: DEVILED_EGGS, keyPrefix: 'egg', cartCategory: 'Deviled eggs' },
    { id: 'egg-salads', name: 'Egg Salads', image: 'assets/products/egg-salad-pint.jpg', items: EGG_SALADS, keyPrefix: 'saladcup', cartCategory: 'Egg salad' },
    { id: 'protein-bowls', name: 'Protein Bowls', image: 'assets/products/avo-chick-blt-bowl.jpg', items: PROTEIN_BOWLS, keyPrefix: 'bowl', cartCategory: 'Protein bowl' },
    { id: 'bagels', name: 'Bagels', image: BAGEL_IMAGE, items: BAGEL_ITEMS, keyPrefix: 'bagel', cartCategory: 'Bagel' },
    { id: 'sandwich-wrap', name: 'Sandwich/Wrap', image: WRAP_IMAGE, items: SANDWICH_WRAP, keyPrefix: 'wrap', cartCategory: 'Sandwich/Wrap' },
  ];
  const orderGroupSingle = (g) => g.open || (g.items.length === 1 ? () => openMenuItem(g.items[0], g.keyPrefix, g.cartCategory) : null);

  // Where a menu card's item lives on the order page. The order page has no Platters group: the two platters are the
  // same products as the Deviled Eggs group's last two, under other ids, so they open there.
  const ORDER_GROUP_OF = { egg: 'deviled-eggs', platter: 'deviled-eggs', saladcup: 'egg-salads', bowl: 'protein-bowls', wrap: 'sandwich-wrap', bagel: 'bagels' };
  const PLATTER_TWINS = { '24-count': '24-count-platter', 'try-them-all': 'try-them-all-platter' };
  function orderTargetFor(item, keyPrefix) {
    const group = ORDER_GROUPS.find((g) => g.id === ORDER_GROUP_OF[keyPrefix]);
    const id = keyPrefix === 'platter' ? PLATTER_TWINS[item.id] : item.id;
    const found = group && group.items.find((i) => i.id === id);
    return found ? { group, item: found } : null;
  }
  const ORDER_CHEVRON = '<svg class="order-tile-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const orderTilesScreen = document.getElementById('order-tiles-screen');
  const orderGroupScreen = document.getElementById('order-group-screen');

  function renderOrderTiles() {
    document.getElementById('order-tiles').innerHTML = ORDER_GROUPS.map((g) => {
      const single = !!orderGroupSingle(g);
      const from = g.items ? Math.min(...g.items.map((i) => shownPrice(i))) : g.price;
      const sub = single ? money(from) : `${g.items.length} options · from ${money(from)}`;
      return `<li><button class="order-tile" type="button" data-group="${g.id}">
        <span class="order-tile-media"><img src="${g.image}" alt="" loading="lazy"></span>
        <span class="order-tile-text"><span class="order-tile-name">${g.name}</span><span class="order-tile-sub">${sub}</span></span>
        ${ORDER_CHEVRON}
      </button></li>`;
    }).join('');
  }

  const orderPageTitle = () => (state.orderMode === 'delivery' ? `Order delivery — ${SITE_NAME}` : PAGE_TITLES.order);

  function showOrderTiles() {
    renderOrderTiles();
    orderTilesScreen.hidden = false;
    orderGroupScreen.hidden = true;
    document.title = orderPageTitle();
  }

  function renderOrderRows(g) {
    const list = document.getElementById('order-rows');
    list.innerHTML = '';
    g.items.forEach((item) => {
      const li = document.createElement('li');
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'order-row';
      row.dataset.item = item.id;
      row.setAttribute('aria-label', `${(g.catering || item.pickerConfig || item.addOns || item.wrapFlavors) ? 'Customize' : 'View'} ${item.name}`);
      row.innerHTML = `
        <span class="order-row-media"></span>
        <span class="order-row-text">
          <span class="order-row-name">${item.name}</span>
          <span class="order-row-meta"><span class="order-row-price">${priceLabel(item)}</span>${item.note ? `<span aria-hidden="true">•</span><span>${item.note}</span>` : ''}</span>
          ${item.desc ? `<span class="order-row-desc">${item.desc}</span>` : ''}
        </span>
        <span class="order-row-add" aria-hidden="true">${ADD_ICON}</span>`;
      row.querySelector('.order-row-media').appendChild(productThumb(item));
      // A catering row opens the catering modal, adding to the pickup or delivery bag the customer is on.
      row.addEventListener('click', () => (g.catering ? openCateringItem(item.id) : openMenuItem(item, g.keyPrefix, g.cartCategory)));
      li.appendChild(row);
      list.appendChild(li);
    });
  }

  // `push` is false when the URL already names the group (a reload, a shared link, the browser's Back button).
  function openOrderGroup(id, { push = true } = {}) {
    const g = ORDER_GROUPS.find((x) => x.id === id);
    if (!g) return;
    const single = orderGroupSingle(g);
    if (single) { single(); return; }
    document.getElementById('order-group-title').textContent = g.name;
    renderOrderRows(g);
    orderTilesScreen.hidden = true;
    orderGroupScreen.hidden = false;
    document.title = `${g.name} — ${state.orderMode === 'delivery' ? 'Order delivery' : 'Order pickup'} — ${SITE_NAME}`;
    if (push) history.pushState({ orderGroup: id }, '', '#order/' + id);
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    document.getElementById('order-group-title').focus({ preventScroll: true });
  }

  document.getElementById('order-tiles').addEventListener('click', (e) => {
    const tile = e.target.closest('.order-tile');
    if (tile) openOrderGroup(tile.dataset.group);
  });
  document.getElementById('order-back').addEventListener('click', () => {
    // Back out of a screen this visit pushed; a group opened by a link has nothing behind it, so just show the tiles.
    if (history.state && history.state.orderGroup) { history.back(); return; }
    history.replaceState(null, '', '#order');
    showOrderTiles();
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  });

  // ---------- Nav menu toggle (tablet/mobile) ----------
  // A lightweight disclosure, not a modal: no backdrop dim or inert
  // background, since the page content is unrelated to picking a nav
  // link. Closes on toggle, link click, outside click, or Escape.
  const navToggle = document.getElementById('nav-toggle');
  const navLinksEl = document.getElementById('nav-links');
  const navInnerEl = document.querySelector('.nav-inner');
  const navLogoEl = document.querySelector('.logo');
  const navCartEl = document.getElementById('open-cart');

  // Under 640px the open menu is a full-screen panel (see the CSS), so it is
  // modal in practice: the page and the header's own buttons go inert behind
  // it and the body stops scrolling. Tablet keeps the lightweight dropdown.
  const navPanelMq = window.matchMedia('(max-width: 640px)');
  const navCloseBtn = document.getElementById('close-nav');
  const navBackdropEl = document.getElementById('nav-backdrop');
  const navBehindEls = () => [...document.querySelectorAll('#page-root > :not(.site-header)'), ...document.querySelectorAll('.site-header .logo'), navToggle, navCartEl];

  function setNavOpen(open) {
    const wasOpen = navLinksEl.classList.contains('open');
    navLinksEl.classList.toggle('open', open);
    navBackdropEl.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open === wasOpen) return;
    if (open && navInnerEl.classList.contains('nav-compact')) {
      const current = navGroupBtns.find((b) => b.getAttribute('aria-current') === 'page') || navGroupBtns[0];
      closeNavGroups({ except: current });
      setNavGroup(current, true);
    }
    if (open) {
      if (!navPanelMq.matches) return;
      navBehindEls().forEach((el) => { el.inert = true; });
      document.body.style.overflow = 'hidden';
      navCloseBtn.focus();
    } else {
      navBehindEls().forEach((el) => { el.inert = false; });
      document.body.style.overflow = '';
      if (navPanelMq.matches) navToggle.focus();
    }
  }
  navCloseBtn.addEventListener('click', () => setNavOpen(false));
  navPanelMq.addEventListener('change', () => setNavOpen(false));

  // Compact (hamburger) nav is content-driven, not tied to a viewport
  // breakpoint: an always-present, off-screen, single-line clone of the
  // link list (.nav-links-probe) reports the width the full set actually
  // needs, compared against the space actually available between the
  // logo and cart button — the moment the real links would wrap to a
  // second line, .nav-compact switches on, whatever width that happens
  // to be at (a phone, a squeezed desktop window, page zoom).
  const navProbe = document.createElement('div');
  navProbe.className = 'nav-links-probe';
  navProbe.setAttribute('aria-hidden', 'true');
  navProbe.inert = true;
  navProbe.innerHTML = navLinksEl.querySelector('.nav-links-inner').innerHTML;
  // Only the bar's own items are measured: the dropdown menus are not part of the row, and the clone must not repeat ids.
  navProbe.querySelectorAll('.nav-menu').forEach((menu) => menu.remove());
  navProbe.querySelectorAll('[id], [aria-controls]').forEach((el) => { el.removeAttribute('id'); el.removeAttribute('aria-controls'); });
  // Appended to <body>, not navInnerEl: the probe must always measure the
  // full/inline rendering, but .nav-compact .nav-link overrides padding
  // (16px 4px for the dropdown rows, vs the base 10px) — as a descendant
  // of .nav-inner, the probe's cloned links would inherit that override
  // too the moment .nav-compact switches on, understating its own width
  // by exactly that padding delta. That made compact mode look like it no
  // longer needed to be compact right after switching to it — the actual
  // flicker loop, not just sub-pixel jitter. Living outside .nav-inner
  // keeps it immune to any current or future .nav-compact-scoped rule.
  document.body.appendChild(navProbe);

  // .nav-compact zeroes the logo/cart margins on purpose (needed to keep
  // them precisely centered/edge-aligned in the compact grid) — but that
  // means the moment the class switches on, a margin read live from
  // getComputedStyle suddenly reports 32px (16+16) more "available" space
  // than an instant before, for a width that hasn't actually changed. That
  // false extra room could immediately qualify for switching straight back
  // to full, which is worse than the plain sub-pixel jitter below and was
  // the main driver of the flicker. The full-mode gap is a fixed design
  // constant, not something to re-read per mode, so it's hardcoded here
  // instead — "would this fit laid out inline" shouldn't depend on
  // whichever mode happens to be live when we ask.
  const NAV_LOGO_GAP_PX = 16;
  const NAV_CART_GAP_PX = 16;
  const NAV_WHERE_SPACE_PX = 236; // the indicator's 220px cap plus its 16px margin

  // A live window drag also settles right on top of the real crossover
  // width for a while (measured: available and needed came out 954.21px
  // vs 954px — under a quarter-pixel apart), and sub-pixel layout/rounding
  // jitters above and below that by fractions of a pixel from one reflow
  // to the next. Comparing with a single threshold flips .nav-compact on
  // and off rapidly while dragging through that width. A hysteresis gap
  // fixes it: once compact, require a clear margin of extra room before
  // switching back, instead of the same knife-edge in both directions.
  const NAV_HYSTERESIS_PX = 32;

  function navLinksWouldWrap() {
    const innerStyle = getComputedStyle(navInnerEl);
    const paddingX = parseFloat(innerStyle.paddingLeft) + parseFloat(innerStyle.paddingRight);
    const logoSpace = navLogoEl.getBoundingClientRect().width + NAV_LOGO_GAP_PX;
    const cartSpace = navCartEl.getBoundingClientRect().width + NAV_CART_GAP_PX;
    // The order indicator is as wide as its text up to its 220px cap; in the compact bar it stretches to fill, so its
    // width there says nothing about what it needs. Reserve the cap instead.
    const available = navInnerEl.clientWidth - paddingX - logoSpace - cartSpace - NAV_WHERE_SPACE_PX;
    const needed = navProbe.scrollWidth;
    const isCompact = navInnerEl.classList.contains('nav-compact');
    return isCompact ? needed > available - NAV_HYSTERESIS_PX : needed > available;
  }

  function updateNavMode() {
    const compact = navLinksWouldWrap();
    navInnerEl.classList.toggle('nav-compact', compact);
    if (!compact) setNavOpen(false);
  }

  updateNavMode();
  // A plain 'resize' listener (plus document.fonts.ready) isn't enough on
  // its own: with font-display:swap, the nav-link text can still be
  // rendering in the fallback font — narrower than the real webfont —
  // when this script's first synchronous call runs, and neither resize
  // nor fonts.ready reliably fires again afterward to correct it.
  // ResizeObserver sidesteps the guessing entirely, on both sides of the
  // comparison: watching the probe catches the content width changing
  // (font swap, zoom, anything), and watching nav-inner itself catches
  // the available space changing — including from devtools/emulator
  // viewport overrides, which don't always dispatch a real window
  // 'resize' event. Both also fire once immediately on observe(), which
  // doubles as a correcting re-check shortly after first paint.
  const navResizeObserver = new ResizeObserver(updateNavMode);
  navResizeObserver.observe(navProbe);
  navResizeObserver.observe(navInnerEl);
  // Belt-and-suspenders for a slow/uncached font load where even the
  // above hasn't settled yet by the time the page is otherwise ready.
  window.addEventListener('load', updateNavMode);
  setTimeout(updateNavMode, 300);

  navToggle.addEventListener('click', () => {
    setNavOpen(navToggle.getAttribute('aria-expanded') !== 'true');
  });

  // ----- The bar's groups (Order, Gifting, About): disclosure buttons, one open at a time -----
  // On the wide bar a group opens a small panel under it; in the compact menu it opens inline, like an accordion. It
  // opens on click or Enter, never on hover, so touch, keyboard and mouse behave alike.
  const navGroupBtns = [...document.querySelectorAll('#nav-links .nav-group-btn')];
  function setNavGroup(btn, open) {
    btn.setAttribute('aria-expanded', String(open));
    document.getElementById(btn.getAttribute('aria-controls')).hidden = !open;
  }
  function closeNavGroups({ except = null } = {}) {
    navGroupBtns.forEach((b) => { if (b !== except && b.getAttribute('aria-expanded') === 'true') setNavGroup(b, false); });
  }
  navGroupBtns.forEach((btn) => btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    closeNavGroups({ except: btn });
    setNavGroup(btn, open);
  }));
  // Outside the bar, or focus leaving a group, closes the wide bar's panel (the compact menu keeps its sections as set).
  document.addEventListener('click', (e) => {
    if (!navInnerEl.classList.contains('nav-compact') && !e.target.closest('.nav-group')) closeNavGroups();
  });
  document.querySelectorAll('#nav-links .nav-group').forEach((group) => group.addEventListener('focusout', (e) => {
    if (!navInnerEl.classList.contains('nav-compact') && !group.contains(e.relatedTarget)) closeNavGroups();
  }));

  // A link or a menu item ends the menu's work; a group button only opens its section.
  navLinksEl.addEventListener('click', (e) => {
    if (!e.target.closest('a')) return;
    closeNavGroups();
    setNavOpen(false);
  });

  document.addEventListener('click', (e) => {
    if (navToggle.getAttribute('aria-expanded') !== 'true') return;
    if (e.target.closest('#nav-links') || e.target.closest('#nav-toggle')) return;
    setNavOpen(false);
  });

  // ---------- Category navigation ----------
  // Two markup copies share this class (the desktop/tablet list nested in
  // .store-sidebar, and .drawer-nav-mobile's sticky horizontal twin — see
  // the comment in index.html for why). Activating by matching
  // data-target, not just the clicked element, keeps both copies in sync
  // regardless of which one the click came from.
  document.querySelectorAll('.category-item[data-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      // Each page (the menu, Catering) has its own category lists; only that page's pills change.
      const page = btn.closest('main.view');
      page.querySelectorAll('.category-item').forEach((b) => {
        b.classList.toggle('active', b.dataset.target === targetId);
      });

      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Keep the newly active pill visible within the mobile horizontal
      // scroller — block:'nearest' keeps this from also nudging the
      // page's own vertical scroll.
      const mobileTwin = page.querySelector(`.drawer-nav-mobile .category-item[data-target="${targetId}"]`);
      if (mobileTwin) mobileTwin.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  });

  // Native overflow-x:auto already gives touch users free momentum
  // scrolling; this adds the same "grab and drag" affordance for mouse
  // pointers, which have no native equivalent. Gated to pointerType
  // 'mouse' so it never fights a real touchscreen's own scrolling.
  document.querySelectorAll('.drawer-nav-mobile').forEach((scroller) => {
    let mouseIsDown = false;
    let dragging = false;
    let startX = 0;
    let startScrollLeft = 0;
    // Tracks whether THIS interaction actually moved, rather than
    // comparing scrollLeft against a value that could be stale from a
    // previous drag if a later plain click never re-fires pointerdown —
    // that comparison suppressed legitimate clicks that followed a drag
    // elsewhere on the row.
    let moved = false;

    scroller.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      startScrollLeft = scroller.scrollLeft;
      moved = false;
      if (e.pointerType !== 'mouse') return;
      mouseIsDown = true;
    });
    scroller.addEventListener('pointermove', (e) => {
      if (!mouseIsDown) return;
      const dx = e.clientX - startX;
      // Engage capture only once the pointer actually moves past the
      // threshold — calling setPointerCapture on every mousedown (even a
      // stationary click) retargets that click's event to the scroller
      // instead of whatever button is under the cursor, silently
      // swallowing every plain tap/click on the row.
      if (!dragging) {
        if (Math.abs(dx) <= 5) return;
        dragging = true;
        moved = true;
        scroller.classList.add('dragging');
        scroller.setPointerCapture(e.pointerId);
      }
      scroller.scrollLeft = startScrollLeft - dx;
    });
    function endDrag(e) {
      mouseIsDown = false;
      if (!dragging) return;
      dragging = false;
      scroller.classList.remove('dragging');
      if (e.pointerId != null) scroller.releasePointerCapture(e.pointerId);
    }
    scroller.addEventListener('pointerup', endDrag);
    scroller.addEventListener('pointercancel', endDrag);
    scroller.addEventListener('lostpointercapture', endDrag);
    // Backstop: if a pointerup ever fires outside the scroller without
    // the drag state clearing first (capture lost some other way), a
    // stuck `dragging`/captured pointer would swallow every click on the
    // row afterward, not just the one that ended the drag.
    window.addEventListener('pointerup', endDrag);
    // A drag ending on a .category-item would otherwise also fire its
    // click — suppress just that one click when this interaction actually
    // moved, without touching real (non-drag) taps.
    scroller.addEventListener('click', (e) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    }, true);
  });

  // Mobile-only: the category pill bar stays hidden (see the ≤640px CSS — position:fixed, opacity:0) until the
  // user has scrolled about halfway down the featured-item card, then fades in as a floating bar. A no-op on
  // wider screens: the bar is display:none there regardless, so toggling a class on it does nothing visible.
  // One bar per page that has one: the menu (revealed past its featured card) and Catering (past its first section).
  const REVEAL_BARS = [
    { view: document.getElementById('view-menu'), bar: document.querySelector('#view-menu .drawer-nav-mobile'), anchor: document.getElementById('featured-items') },
    { view: document.getElementById('view-catering'), bar: document.querySelector('#view-catering .drawer-nav-mobile'), anchor: document.getElementById('cater-section-boxes') },
    { view: document.getElementById('view-shipping'), bar: document.querySelector('#view-shipping .drawer-nav-mobile'), anchor: document.getElementById('ship-section-kits') },
    // Shipping, Custom: the bar is there from the moment the Shipping Kits section reaches the header until the Holiday Windows section has gone past.
    { view: document.getElementById('view-shipping'), bar: document.querySelector('#view-shipping .ship-c .drawer-nav-mobile'), anchor: document.getElementById('ship-section-kits-c'), from: 'top', until: document.getElementById('ship-section-holiday-c') },
  ];
  const REVEAL_LINE_PX = 69;
  let revealTicking = false;
  function updateBarReveal() {
    revealTicking = false;
    REVEAL_BARS.forEach(({ view, bar, anchor, from, until }) => {
      if (!bar || !anchor) return;
      // A hidden page has no layout (its rect is all zeros), which would read as "scrolled past the anchor".
      if (view.hidden) { bar.classList.remove('is-revealed'); return; }
      const rect = anchor.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      let on = (from === 'top' ? rect.top : midpoint) <= REVEAL_LINE_PX + (from === 'top' ? 24 : 0);
      if (on && until) on = until.getBoundingClientRect().bottom > REVEAL_LINE_PX + 80;
      bar.classList.toggle('is-revealed', on);
    });
  }
  function onScrollForReveal() {
    if (revealTicking) return;
    revealTicking = true;
    requestAnimationFrame(updateBarReveal);
  }
  window.addEventListener('scroll', onScrollForReveal, { passive: true });
  window.addEventListener('resize', onScrollForReveal);
  updateBarReveal();

  // ---------- Overlay focus management ----------
  const pageRoot = document.getElementById('page-root');
  let lastFocusedEl = null;

  function updateInert() {
    const anyOpen = !itemModal.hidden || !bagelModal.hidden || !bowlModal.hidden || !wrapModal.hidden || !quickviewModal.hidden || !cartDrawer.hidden || !addPaymentModal.hidden || !paymentMethodsModal.hidden || !boxModal.hidden || !ldModal.hidden || !ddModal.hidden || !daModal.hidden || !siModal.hidden;
    pageRoot.inert = anyOpen;
    document.body.style.overflow = anyOpen ? 'hidden' : '';
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openGroup = navGroupBtns.find((b) => b.getAttribute('aria-expanded') === 'true');
    if (openGroup && !navInnerEl.classList.contains('nav-compact')) { setNavGroup(openGroup, false); openGroup.focus(); return; }
    if (navToggle.getAttribute('aria-expanded') === 'true') setNavOpen(false);
    else if (!itemModal.hidden) closeDozenModal();
    else if (!bagelModal.hidden) closeBagelModal();
    else if (!bowlModal.hidden) closeBowlModal();
    else if (!wrapModal.hidden) closeWrapModal();
    else if (!quickviewModal.hidden) closeQuickviewModal();
    else if (!cartDrawer.hidden) closeCart();
    else if (!addPaymentModal.hidden) closeAddPayment();
    else if (!paymentMethodsModal.hidden) closePaymentMethods();
    else if (!boxModal.hidden) closeBoxModal();
    else if (!ldModal.hidden) cancelLocationDetails();
    else if (!ddModal.hidden) cancelDeliveryDetails();
    else if (!daModal.hidden) closeWhere();
    else if (!siModal.hidden) closeStoreInfo();
  });

  // ---------- Item customization modal ----------
  const modalBackdrop = document.getElementById('modal-backdrop');
  const itemModal = document.getElementById('item-modal');

  // One row of a single-choice (radio) list, shared by every one-flavor picker.
  // The native radio sits inside the label; anything extra for the selected row
  // (e.g. "Remove ingredients" chips) goes in the sibling .radio-choice-extra,
  // because interactive controls can't live inside a label.
  const escapeHTML = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  // A small line glyph for each ingredient a customer can leave out (wraps and packs), drawn on a 24px grid in the current text color.
  const WRAP_ICON_SVG = (body) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const WRAP_ICONS = {
    bacon: WRAP_ICON_SVG('<path d="M3 8c3-3 5 3 9 0s6 3 9 0v8c-3 3-6-3-9 0s-6 3-9 0z"/><path d="M3 12c3-3 5 3 9 0s6 3 9 0"/>'),
    cheese: WRAP_ICON_SVG('<path d="M3 11 13 5l8 3v10H3z"/><path d="M3 11l10 3 8-6M13 14v4"/><circle cx="7.500" cy="15.500" r=".9"/><circle cx="17" cy="14.500" r=".9"/>'),
    lettuce: WRAP_ICON_SVG('<path d="M5 19C4 11 9 5 19 5c0 10-6 15-14 14z"/><path d="M5 19 14 10"/>'),
    tomato: WRAP_ICON_SVG('<circle cx="12" cy="13.500" r="7.500"/><path d="M12 6.500 9.500 4M12 6.500 14.500 4M12 6.500 8 7.500M12 6.500 16 7.500"/><path d="M7.500 14a4.500 4.500 0 0 1 2.500-4"/>'),
    sauce: WRAP_ICON_SVG('<path d="M12 3.500c3.500 4.500 6 7.200 6 10.300a6 6 0 0 1-12 0c0-3.100 2.500-5.800 6-10.300z"/><path d="M9.500 14a2.500 2.500 0 0 0 2 2.500"/>'),
    flame: WRAP_ICON_SVG('<path d="M12 3c1 3.500 5.500 5.500 5.500 11a5.500 5.500 0 0 1-11 0c0-2.500 1-4 2.500-5.500.2 1.700.8 2.700 2 3 .1-3 .2-5.500 1-8.500z"/>'),
    avocado: WRAP_ICON_SVG('<path d="M12 3c3.500 0 5 3.500 5.500 7 .6 4 2 6.500-1 9.200a7.500 7.500 0 0 1-9 0C4.500 16.500 6 14 6.500 10 7 6.500 8.500 3 12 3z"/><circle cx="12" cy="14" r="2.800"/>'),
    cucumber: WRAP_ICON_SVG('<circle cx="12" cy="12" r="8.500"/><circle cx="12" cy="12" r="5"/><path d="M12 9v.01M9.500 13v.01M14.500 13v.01"/>'),
    sesame: WRAP_ICON_SVG('<ellipse cx="8" cy="8.500" rx="2.200" ry="1.200" transform="rotate(-35 8 8.500)"/><ellipse cx="16" cy="9" rx="2.200" ry="1.200" transform="rotate(35 16 9)"/><ellipse cx="12" cy="14" rx="2.200" ry="1.200" transform="rotate(-10 12 14)"/><ellipse cx="7.500" cy="17" rx="2.200" ry="1.200" transform="rotate(30 7.500 17)"/><ellipse cx="16.500" cy="17" rx="2.200" ry="1.200" transform="rotate(-30 16.500 17)"/>'),
    chicken: WRAP_ICON_SVG('<ellipse cx="15" cy="9" rx="6" ry="5" transform="rotate(-40 15 9)"/><path d="M11.500 12.500 6.500 17.500"/><circle cx="5.200" cy="16.800" r="1.600"/><circle cx="7.200" cy="19" r="1.600"/>'),
    meat: WRAP_ICON_SVG('<path d="M5 9c0-3 4-4.500 8-4.500S20 6 20 10c0 5-3 9-8 9s-7-3-7-5.500c0-1.800.5-3 .5-4.500z"/><circle cx="11" cy="11" r="1.600"/>'),
    pickle: WRAP_ICON_SVG('<rect x="8" y="3" width="8" height="18" rx="4" transform="rotate(25 12 12)"/><path d="M10 9v.01M13 11.500v.01M11 14.500v.01"/>'),
    pepper: WRAP_ICON_SVG('<path d="M14 6c1-2 2.500-2.500 4-2.500M14 6c-5 0-9 4-9 9 0 2.500 2 4.500 4 4.500 5 0 8-5 8-10 0-1.500-1.500-2.500-3-3.500z"/>'),
    fish: WRAP_ICON_SVG('<path d="M3 12c3-4.500 8-6 12-3.500l5-2.500v12l-5-2.500C11 18 6 16.500 3 12z"/><circle cx="8" cy="11" r=".9"/>'),
    chips: WRAP_ICON_SVG('<path d="M12 4 21 19H3z"/><path d="M9 14v.01M13 15v.01M12 10.500v.01"/>'),
    waffle: WRAP_ICON_SVG('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9.300 4v16M14.700 4v16M4 9.300h16M4 14.700h16"/>'),
    egg: WRAP_ICON_SVG('<ellipse cx="12" cy="12" rx="6.500" ry="8"/><circle cx="12" cy="13" r="2.500"/>'),
    bean: WRAP_ICON_SVG('<path d="M7 7c3-3 9-2 10 3s-3 11-8 10-5-10-2-13z"/><path d="M10 10c1 0 2 1 2 3"/>'),
    plain: WRAP_ICON_SVG('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.500"/>'),
    onion: WRAP_ICON_SVG('<path d="M12 3c0 3 5.500 5 5.500 10.500a5.500 5.500 0 0 1-11 0C6.500 8 12 6 12 3z"/><path d="M12 8c-1.800 3.500-1.800 8.500 0 12M12 8c1.800 3.500 1.800 8.500 0 12"/>'),
  };
  // The glyph is picked from the ingredient's own words, first match wins.
  const ING_ICON_RULES = [
    [/bacon/, 'bacon'], [/egg white/, 'egg'], [/cheese|cheddar|parmesan/, 'cheese'], [/lettuce|romaine/, 'lettuce'], [/tomato/, 'tomato'],
    [/avocado|avo-/, 'avocado'], [/cucumber/, 'cucumber'], [/pickled jal|jalape|pepper|paprika/, 'pepper'], [/pickle/, 'pickle'],
    [/onion/, 'onion'], [/sesame|seasoning|caper/, 'sesame'], [/chicken(?! sauce)/, 'chicken'],
    [/brisket|beef|hamburger|frank|patty/, 'meat'], [/crab|salmon/, 'fish'], [/chips|doritos|wonton/, 'chips'], [/waffle/, 'waffle'],
    [/bean/, 'bean'], [/buffalo|sriracha|chipotle|cholula/, 'flame'],
    [/sauce|dressing|ranch|ketchup|mustard|aioli|teriyaki|syrup|caesar|sour cream/, 'sauce'],
  ];
  const ingredientIcon = (name) => {
    const n = name.toLowerCase();
    const hit = ING_ICON_RULES.find(([re]) => re.test(n));
    return WRAP_ICONS[hit ? hit[1] : 'plain'];
  };
  // The "leave it out" mark at the right of each row: a circle with a slash, grey until chosen, then red.
  const WRAP_NO_SVG = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M5.600 5.600l12.800 12.800"/></svg>';

  // "Remove ingredients" as a list: one row per ingredient, the whole row a toggle button. `excluded` is the Set of names left out.
  const exclusionListHTML = (items, excluded) => `<ul class="excl-list">${items.map((ing) => `<li><button class="excl${excluded.has(ing) ? ' active' : ''}" type="button" aria-pressed="${excluded.has(ing)}" aria-label="No ${escapeHTML(ing.toLowerCase())}"><span class="excl-icon">${ingredientIcon(ing)}</span><span class="excl-name">${escapeHTML(ing)}</span><span class="excl-no">${WRAP_NO_SVG}</span></button></li>`).join('')}</ul>`;
  const paintExclusionList = (box, items, excluded) => box.querySelectorAll('.excl').forEach((b, i) => {
    b.classList.toggle('active', excluded.has(items[i]));
    b.setAttribute('aria-pressed', String(excluded.has(items[i])));
  });

  // The "Customize" control every customizable item shares (packs, wraps, bagel, bowls): a link named for the item, a one-line summary of what has
  // been left out, and, once the link is open, the "Remove ingredients" list. `excluded` is the Set of names left out; the item keeps the state.
  const customizeHTML = ({ label, items, excluded, open }) => `
    <div class="fd-custom">
      <button class="fd-custom-btn" type="button" aria-expanded="${open}" aria-label="Customize ${escapeHTML(label)}">Customize</button>
      ${excluded.size ? `<span class="fd-custom-sum">No ${escapeHTML([...excluded].join(', ').toLowerCase())}</span>` : ''}
    </div>
    ${open ? `<div class="flavor-exclusions"><span class="flavor-exclusions-label">Remove ingredients</span>${exclusionListHTML(items, excluded)}</div>` : ''}`;
  // Draws it into `box` and wires it: the link calls onToggleOpen, a row calls onToggle(ingredient). The item redraws from its own state.
  function mountCustomize(box, { label, items, excluded, open, onToggleOpen, onToggle }) {
    box.innerHTML = customizeHTML({ label, items, excluded, open });
    box.querySelector('.fd-custom-btn').addEventListener('click', onToggleOpen);
    box.querySelectorAll('.excl').forEach((btn, i) => btn.addEventListener('click', () => onToggle(items[i])));
  }
  const toggleIn = (set, value) => { if (set.has(value)) set.delete(value); else set.add(value); };

  const radioChoiceHTML = ({ group, value, label, note, selected }) => `
    <div class="radio-choice${selected ? ' selected' : ''}">
      <label class="radio-choice-row">
        <input class="radio-choice-input" type="radio" name="${group}" value="${value}"${selected ? ' checked' : ''}>
        <span class="radio-choice-text">
          <span class="radio-choice-name">${escapeHTML(label)}</span>
          ${note ? `<span class="radio-choice-note">${escapeHTML(note)}</span>` : ''}
        </span>
        <span class="radio-choice-ind" aria-hidden="true"></span>
      </label>
      <div class="radio-choice-extra"></div>
    </div>`;

  // What one allocated piece is called: eggs by default, a catering bundle's own unit otherwise.
  const eggWord = (n) => {
    const unit = activeProduct && activeProduct.unit;
    return unit ? unit[n === 1 ? 0 : 1] : (n === 1 ? 'egg' : 'eggs');
  };

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

  // The flavors the open product offers: the full menu list, or a kit's own subset.
  function flavorList() {
    if (activeProduct.flavors) return activeProduct.flavors;
    return activeProduct.flavorIds ? FLAVORS.filter((f) => activeProduct.flavorIds.includes(f.id)) : FLAVORS;
  }

  function dozenAllocated() {
    return Object.values(state.modalFlavorQty).reduce((sum, n) => sum + n, 0);
  }

  // The clip's play mark, and whether the visitor asked for less motion (no clip starts by itself then).
  const PLAY_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg>';
  const flavorReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ---------- The flavor picker: Pair ----------
  // Two tiles across, each a clip (or a still, for a flavor with a photo and no clip), the name, one line, and a − / + stepper. It is the only flavor
  // picker; the Distilled list and the Grow layout were retired on 2026-10-16 (a copy is in archive/distilled-flavor-picker/).
  const fv = { key: null, root: null, tiles: {}, observer: null };
  const FV_MINUS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 12h12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  const FV_PLUS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 12h12M12 6v12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

  const flavorStat = (f) => { const m = FLAVOR_MEDIA[f.id]; return f.desc || (m && m.cal ? `${m.cal} cal · ${m.protein}g protein each` : ''); };

  function fvDispose() {
    if (fv.observer) fv.observer.disconnect();
    if (fv.root) fv.root.querySelectorAll('video').forEach((v) => v.pause());
    Object.assign(fv, { key: null, root: null, tiles: {}, observer: null });
  }

  // A clip starts only while it is on screen (and never for someone who asked for less motion), and is fetched the
  // first time it does; the poster stands in until then.
  function fvPlay(video) {
    if (video.dataset.userPaused === '1') return;
    if (flavorReduceMotion.matches && video.dataset.userPlayed !== '1') return;
    if (!video.querySelector('source')) {
      const src = document.createElement('source');
      src.src = video.dataset.src;
      src.type = 'video/mp4';
      video.appendChild(src);
      video.load();
    }
    video.play().catch(() => {});
  }

  // A tile's picture: the flavor's clip (a poster until it plays), or a still when it has none: its own photo (the catering lists), or the
  // placeholder egg. The "i" in the corner opens the flavor sheet either way.
  function fvMedia(f, infoOpts = {}) {
    const clip = !f.photo && FLAVOR_MEDIA[f.id];
    const wrap = document.createElement('div');
    wrap.dataset.label = f.label;
    if (clip) {
      const file = `assets/flavors/${clip.file}`;
      wrap.className = 'fv-media is-paused';
      wrap.innerHTML = `<video muted loop playsinline preload="none" poster="${file}.jpg" data-src="${file}.mp4" aria-hidden="true" tabindex="-1"></video>
        <button class="fv-play" type="button" aria-label="Play the ${escapeHTML(f.label)} video"><span class="fv-play-icon" aria-hidden="true">${PLAY_ICON}</span></button>`;
      const video = wrap.querySelector('video');
      const button = wrap.querySelector('.fv-play');
      const paint = () => {
        wrap.classList.toggle('is-paused', video.paused);
        button.setAttribute('aria-label', `${video.paused ? 'Play' : 'Pause'} the ${wrap.dataset.label} video`);
      };
      // A clip the visitor paused stays paused: whatever starts it (the observer, a late-loading source, the sheet closing) is undone here.
      video.addEventListener('play', () => { if (video.dataset.userPaused === '1') video.pause(); else paint(); });
      video.addEventListener('pause', paint);
      button.addEventListener('click', () => {
        if (video.paused) { video.dataset.userPaused = '0'; video.dataset.userPlayed = '1'; fvPlay(video); } else { video.dataset.userPaused = '1'; video.pause(); }
      });
    } else {
      wrap.className = 'fv-media is-still' + (f.photo ? '' : ' is-empty');
      wrap.innerHTML = `<img src="${f.photo || 'assets/flavors/placeholder.svg'}" alt="" width="${f.photo ? 320 : 56}" height="${f.photo ? 320 : 56}" loading="lazy" decoding="async">`;
    }
    // The corner "i": the whole clip (or the photo), uncropped, with the flavor's description, in a sheet of its own.
    const info = document.createElement('button');
    info.type = 'button';
    info.className = 'fv-info';
    info.setAttribute('aria-label', `About ${f.label}: ${clip ? 'watch the full video and ' : ''}read the description`);
    info.setAttribute('aria-haspopup', 'dialog');
    info.innerHTML = FLAVOR_INFO_ICON;
    info.addEventListener('click', (e) => { e.stopPropagation(); openFlavorInfo(f, info, infoOpts); });
    wrap.appendChild(info);
    if (clip && fv.observer) fv.observer.observe(wrap);
    return wrap;
  }


  // ----- Flavor info sheet: the full clip and the description over the open modal. -----
  // Pair opens it for one flavor. The Sampler's flavor grid opens it on a flavor and passes the whole list, so the customer can step
  // through every flavor without closing it; a flavor with no clip yet shows the placeholder panel instead of a video.
  let flavorInfo = null;
  const FLAVOR_INFO_PREV = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
  const FLAVOR_INFO_NEXT = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  // On a wide screen the flavor page takes over the open modal's own panel (no second layer to stack): the clip runs the full height on the left, the
  // words and the controls are on the right. Below this width it stays the bottom sheet.
  const flavorDesktop = window.matchMedia('(min-width: 901px)');
  flavorDesktop.addEventListener('change', () => closeFlavorInfo(false));

  function openFlavorInfo(f, opener, opts = {}) {
    closeFlavorInfo(false);
    const list = opts.list || [f];
    let index = opts.index || 0;
    const takeover = flavorDesktop.matches;
    const root = document.createElement('div');
    root.className = takeover ? 'flavor-info is-takeover' : 'flavor-info';
    root.innerHTML = `
      ${takeover ? '' : '<div class="flavor-info-backdrop"></div>'}
      <div class="flavor-info-sheet" role="dialog" aria-modal="true" aria-labelledby="flavor-info-title">
        <button class="close-btn flavor-info-close" type="button" aria-label="${takeover ? 'Back to all flavors' : 'Close'}">${document.getElementById('close-modal').innerHTML}</button>
        <div class="flavor-info-stage"></div>
      </div>`;
    let inertEls = [];
    if (takeover) {
      // It lives inside the modal's panel, which stays open (and keeps its scroll place) underneath; only what is behind it goes inert.
      const inner = itemModal.querySelector('.item-modal-inner');
      inner.appendChild(root);
      inertEls = [...inner.children].filter((el) => el !== root);
      inertEls.forEach((el) => { el.inert = true; });
    } else {
      document.body.appendChild(root);
      itemModal.inert = true;
      itemModal.classList.add('is-under');
    }
    const stage = root.querySelector('.flavor-info-stage');
    const info = { root, video: null, takeover, inertEls, getOpener: () => (opts.openerFor ? opts.openerFor(index) : opener), step: null };
    flavorInfo = info;

    // One flavor's media and copy; stepping replaces both.
    const show = (i) => {
      index = i;
      const cur = list[i];
      const media = cur.photo ? null : FLAVOR_MEDIA[cur.id] || null;
      const file = media ? `assets/flavors/${media.file}` : '';
      // A flavor that carries its own description (the catering lists) shows it once, as the text; the rest show calories above theirs.
      const stat = opts.noStat || cur.desc ? '' : flavorStat(cur);
      if (info.video) info.video.pause();
      const mediaHTML = media
        ? `<button class="flavor-watch-media flavor-info-media" type="button"><video muted loop playsinline preload="auto" poster="${file}.jpg"><source src="${file}.mp4" type="video/mp4"></video><span class="flavor-watch-play" aria-hidden="true">${PLAY_ICON}</span></button>`
        : cur.photo
          ? `<div class="flavor-watch-media flavor-info-media flavor-watch-photo"><img src="${cur.photo}" alt="" decoding="async"></div>`
          : '<div class="flavor-watch-media flavor-info-media flavor-watch-placeholder"><img src="assets/flavors/placeholder.svg" alt="" width="56" height="56"><span>Video coming soon</span></div>';
      const nameHTML = `<h2 id="flavor-info-title">${escapeHTML(cur.label)}</h2>${stat ? `<span class="flavor-info-stat">${escapeHTML(stat)}</span>` : ''}<p>${escapeHTML(media ? media.desc : cur.desc || 'The video and description are coming soon.')}</p>`;
      const navHTML = list.length > 1 ? `
          <div class="flavor-info-nav">
            <button class="flavor-info-step" type="button" data-step="-1"${i === 0 ? ' disabled' : ''}>${FLAVOR_INFO_PREV}Previous</button>
            <span class="flavor-info-count" aria-live="polite">${i + 1} of ${list.length}</span>
            <button class="flavor-info-step" type="button" data-step="1"${i === list.length - 1 ? ' disabled' : ''}>Next${FLAVOR_INFO_NEXT}</button>
          </div>` : '';
      stage.innerHTML = takeover ? `
        ${mediaHTML}
        <div class="flavor-info-copy">
          <div class="flavor-info-body">
            <button class="flavor-info-back" type="button">${FLAVOR_INFO_PREV}All flavors</button>
            ${nameHTML}
            ${opts.customize ? `
            <div class="flavor-info-custom">
              <p class="flavor-info-custom-note" hidden>Add this flavor to your pack to customize it.</p>
              <div class="flavor-exclusions" hidden></div>
            </div>` : ''}
          </div>
          <div class="flavor-info-foot">
            ${navHTML}
            <button class="pill-btn dark flavor-info-done" type="button">Done</button>
          </div>
        </div>` : `
        ${mediaHTML}
        <div class="flavor-info-copy">
          ${nameHTML}
          ${opts.customize ? `
          <div class="flavor-info-custom">
            <p class="flavor-info-custom-note" hidden>Add this flavor to your pack to customize it.</p>
            <div class="flavor-exclusions" hidden></div>
            <button class="pill-btn dark full flavor-info-done" type="button">Done</button>
          </div>` : ''}
          ${navHTML}
        </div>`;
      stage.querySelectorAll('.flavor-info-step').forEach((btn) => btn.addEventListener('click', () => info.step(Number(btn.dataset.step))));
      if (opts.customize) {
        const box = stage.querySelector('.flavor-info-custom .flavor-exclusions');
        const has = cur.exclusions && cur.exclusions.length > 0;
        const qty = state.modalFlavorQty[cur.id] || 0;
        if (has && qty > 0) fvSyncExclusions(box, cur, qty, () => updateFlavorVariant());
        else if (has) stage.querySelector('.flavor-info-custom-note').hidden = false;
      }
      const done = stage.querySelector('.flavor-info-done');
      if (done) done.addEventListener('click', () => closeFlavorInfo());
      const back = stage.querySelector('.flavor-info-back');
      if (back) back.addEventListener('click', () => closeFlavorInfo());
      const player = stage.querySelector('button.flavor-info-media');
      info.video = player ? player.querySelector('video') : null;
      if (player) {
        const video = info.video;
        const paint = () => {
          player.classList.toggle('is-paused', video.paused);
          player.setAttribute('aria-label', `${video.paused ? 'Play' : 'Pause'} the ${cur.label} video`);
        };
        video.addEventListener('play', paint);
        video.addEventListener('pause', paint);
        player.addEventListener('click', () => { if (video.paused) video.play().catch(() => {}); else video.pause(); });
        paint();
        if (!flavorReduceMotion.matches) video.play().catch(() => {});
      }
    };
    info.step = (d) => {
      const next = index + d;
      if (next < 0 || next >= list.length) return;
      const hadFocus = stage.contains(document.activeElement);
      show(next);
      // Stepping on a wide screen is a short crossfade; the sheet just scrolls back to its top.
      if (takeover && !flavorReduceMotion.matches) { stage.classList.remove('is-swap'); void stage.offsetWidth; stage.classList.add('is-swap'); }
      stage.parentElement.scrollTop = 0;
      const body = stage.querySelector('.flavor-info-body');
      if (body) body.scrollTop = 0;
      // The button that was pressed is replaced, so focus goes to the same direction's button (or the other one at an end).
      if (hadFocus) (stage.querySelector(`.flavor-info-step[data-step="${d}"]:not([disabled])`) || stage.querySelector('.flavor-info-step:not([disabled])') || root.querySelector('.flavor-info-close')).focus();
    };
    show(index);
    // Opened from the tile's chip: the ingredient list is the point, so it is brought into view.
    if (opts.scrollToCustom) { const box = stage.querySelector('.flavor-info-custom'); if (box) box.scrollIntoView({ block: 'center' }); }
    const backdrop = root.querySelector('.flavor-info-backdrop');
    if (backdrop) backdrop.addEventListener('click', () => closeFlavorInfo());
    root.querySelector('.flavor-info-close').addEventListener('click', () => closeFlavorInfo());
    root.querySelector('.flavor-info-close').focus();
  }

  function closeFlavorInfo(restoreFocus = true) {
    if (!flavorInfo) return;
    const { root, video, getOpener, takeover, inertEls } = flavorInfo;
    flavorInfo = null;
    if (video) video.pause();
    if (takeover) inertEls.forEach((el) => { el.inert = false; });
    else {
      itemModal.inert = false;
      itemModal.classList.remove('is-under');
    }
    // It slides back down, or fades out on a wide screen (at once when the modal itself is closing or motion is reduced).
    if (restoreFocus && !flavorReduceMotion.matches) { root.classList.add('is-closing'); window.setTimeout(() => root.remove(), takeover ? 180 : 220); } else root.remove();
    const opener = getOpener();
    if (restoreFocus && opener && opener.isConnected) opener.focus();
  }
  // Escape closes the sheet and nothing under it; the arrow keys step through a list of flavors.
  document.addEventListener('keydown', (e) => {
    if (!flavorInfo) return;
    if (e.key === 'Escape') { e.stopPropagation(); closeFlavorInfo(); }
    else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && flavorInfo.step) flavorInfo.step(e.key === 'ArrowLeft' ? -1 : 1);
  }, true);

  // The observer only reports a clip when it crosses the line, so a clip already on screen when the layout is built
  // is started by hand, once the browser has laid it out.
  function fvKick() {
    requestAnimationFrame(() => {
      const scroller = document.querySelector('#item-modal .item-modal-scroll');
      if (!fv.root || !scroller) return;
      const box = scroller.getBoundingClientRect();
      fv.root.querySelectorAll('.fv-media').forEach((m) => {
        const r = m.getBoundingClientRect();
        const seen = Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top);
        const clip = m.querySelector('video');
        if (clip && r.height > 0 && seen / r.height >= 0.55) fvPlay(clip);
      });
    });
  }

  // What every layout does when a stepper is pressed: change the mix, then redraw whatever shows it.
  function fvChange(f, dir) {
    const step = activeProduct.step;
    const current = state.modalFlavorQty[f.id] || 0;
    if (dir < 0) {
      if (current <= 0) return;
      const next = current - step;
      if (next <= 0) { delete state.modalFlavorQty[f.id]; delete state.modalExclusions[f.id]; } else state.modalFlavorQty[f.id] = next;
    } else if (activeProduct.total === 1) {
      // One flavor for the whole tub: choosing another replaces it, and the ingredients removed from the old one go with it.
      if (current >= 1) return;
      state.modalFlavorQty = { [f.id]: 1 };
      state.modalExclusions = {};
    } else {
      if (dozenAllocated() >= activeProduct.total) return;
      state.modalFlavorQty[f.id] = current + step;
    }
    if (fv.root) updateFlavorVariant(); else renderFlavorGrid();
    renderModalFooter();
  }

  function fvStepper(getFlavor) {
    const el = document.createElement('div');
    el.className = 'fv-stepper';
    el.innerHTML = `<button class="fv-step" type="button" data-d="-1">${FV_MINUS}</button><span class="fv-qty">0</span><button class="fv-step" type="button" data-d="1">${FV_PLUS}</button>`;
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.fv-step');
      if (b) fvChange(getFlavor(), Number(b.dataset.d));
    });
    return el;
  }

  function fvSyncStepper(el, f, qty, allocated) {
    const { step, total } = activeProduct;
    const [minus, plus] = el.querySelectorAll('.fv-step');
    el.querySelector('.fv-qty').textContent = String(qty);
    const single = total === 1;
    minus.disabled = qty <= 0;
    plus.disabled = single ? qty >= 1 : allocated >= total;
    minus.setAttribute('aria-label', single ? `Remove ${f.label}` : `Remove ${step} ${f.label} ${eggWord(step)}`);
    plus.setAttribute('aria-label', single ? `Choose ${f.label}` : `Add ${step} ${f.label} ${eggWord(step)}`);
  }

  // "Remove ingredients" chips for a flavor that has some, shown once it is in the mix.
  function fvSyncExclusions(box, f, qty, onChange = null) {
    const show = qty > 0 && f.exclusions && f.exclusions.length > 0;
    box.hidden = !show;
    if (!show) { box.innerHTML = ''; box.dataset.for = ''; return; }
    if (box.dataset.for !== f.id) {
      box.dataset.for = f.id;
      box.innerHTML = `<span class="flavor-exclusions-label">Remove ingredients</span>${exclusionListHTML(f.exclusions, state.modalExclusions[f.id] || new Set())}`;
      box.querySelectorAll('.excl').forEach((btn, i) => btn.addEventListener('click', () => {
        const ing = f.exclusions[i];
        const set = state.modalExclusions[f.id] || new Set();
        if (set.has(ing)) set.delete(ing); else set.add(ing);
        state.modalExclusions[f.id] = set;
        paintExclusionList(box, f.exclusions, set);
        if (onChange) onChange();
      }));
    }
    paintExclusionList(box, f.exclusions, state.modalExclusions[f.id] || new Set());
  }

  // Pair: one square clip per flavor, two across, the stepper under the name. Built once, updated in place.
  // Pair's tile has four fixed regions, so every tile is the same height whatever it holds: the clip (a square), the name (two lines
  // reserved), one line for calories (or, once ingredients are removed, what was removed), and the stepper. Customize is not on the tile:
  // a chip on the clip opens the flavor sheet, where the "Remove ingredients" list is.
  function fvBuildTile(f) {
    const el = document.createElement('div');
    el.className = 'fv-tile';
    el.dataset.flavor = f.id;
    const media = fvMedia(f);
    const stepper = fvStepper(() => f);
    const body = document.createElement('div');
    body.className = 'fv-body';
    body.innerHTML = '<span class="fv-name"></span><span class="fv-stat"></span>';
    body.querySelector('.fv-name').textContent = f.label;
    body.appendChild(stepper);
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'fv-chip';
    chip.hidden = true;
    chip.setAttribute('aria-haspopup', 'dialog');
    chip.addEventListener('click', (e) => { e.stopPropagation(); openFlavorInfo(f, chip, { customize: true, scrollToCustom: true }); });
    media.appendChild(chip);
    el.append(media, body);
    fv.tiles[f.id] = { el, stepper, chip, stat: body.querySelector('.fv-stat') };
    return el;
  }

  // Calories and protein, short enough for one line on a 144px tile ("each" is dropped; the clip's sheet has the rest).
  function pairStat(f) {
    const m = FLAVOR_MEDIA[f.id];
    return !f.photo && m && m.cal ? `${m.cal} cal · ${m.protein}g protein` : (f.desc || '');
  }

  // "No bacon, tomato +2": the first two removed, then how many more. The whole list is in the sheet.
  function removedSummary(set) {
    const list = [...set];
    return `No ${list.slice(0, 2).join(', ').toLowerCase()}${list.length > 2 ? ` +${list.length - 2}` : ''}`;
  }

  function updateFlavorVariant() {
    const allocated = dozenAllocated();
    flavorList().forEach((f) => {
      const qty = state.modalFlavorQty[f.id] || 0;
      const t = fv.tiles[f.id];
      t.el.classList.toggle('selected', qty > 0);
      fvSyncStepper(t.stepper, f, qty, allocated);
      const removed = qty > 0 ? state.modalExclusions[f.id] : null;
      const changed = !!(removed && removed.size);
      // The calorie line gives way to what was removed; calories are in the sheet.
      t.stat.textContent = changed ? removedSummary(removed) : pairStat(f);
      t.stat.title = changed ? `No ${[...removed].join(', ').toLowerCase()}` : '';
      t.stat.classList.toggle('is-changed', changed);
      const customizable = qty > 0 && f.exclusions && f.exclusions.length > 0;
      t.chip.hidden = !customizable;
      t.chip.textContent = changed ? 'Customized' : 'Customize';
      t.chip.setAttribute('aria-label', changed ? `Customize ${f.label}, ${removed.size} removed` : `Customize ${f.label}`);
    });
    renderFlavorGuidance(allocated);
  }

  function renderFlavorVariant(grid) {
    const key = `${activeProduct.id}|${activeProduct.optionId || ''}`;
    if (!(fv.root && fv.key === key && grid.contains(fv.root))) {
      fvDispose();
      grid.innerHTML = '';
      fv.key = key;
      fv.root = grid;
      fv.observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        const video = entry.target.querySelector('video');
        if (!video) return;
        if (entry.intersectionRatio >= 0.55) fvPlay(video); else video.pause();
      }), { root: document.querySelector('#item-modal .item-modal-scroll'), threshold: [0, 0.55] });
      flavorList().forEach((f) => grid.appendChild(fvBuildTile(f)));
      updateFlavorVariant();
      fvKick();
      return;
    }
    updateFlavorVariant();
  }

  // Draws (or updates) the picker for the open product.
  function renderFlavorGrid() {
    const grid = document.getElementById('flavor-grid');
    grid.classList.remove('addon-list');
    grid.removeAttribute('role');
    grid.removeAttribute('aria-label');
    grid.dataset.variant = '2';
    renderFlavorVariant(grid);
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

  // The product as the modal uses it: with the chosen option applied, and the picker's size worked out.
  function buildActiveProduct(product, optionId) {
    // A product with options opens with none chosen (optionId null): the customer picks 3 or 6 flavors before anything else.
    const resolved = product.options && !optionId ? { ...product, optionId: null } : resolveOption(product, optionId);
    // A fixed-flavor kit (the sampler) has nothing to allocate: no picker config.
    const picker = resolved.pickerConfig || { total: 0, maxFlavors: 1 };
    return { ...resolved, total: picker.total, maxFlavors: picker.maxFlavors, step: picker.total / picker.maxFlavors };
  }
  let activeBase = null;
  const optionPending = () => !!(activeBase && activeBase.options && !activeProduct.optionId);
  // Until the option is chosen the flavors below cannot be used: they are dimmed and out of the tab order.
  function paintOptionPending() {
    const block = document.getElementById('flavor-block');
    const pending = optionPending();
    block.classList.toggle('is-pending', pending);
    block.inert = pending;
    if (pending) document.getElementById('flavor-meter').hidden = true;
    if (pending) document.getElementById('flavor-hint').textContent = `Choose how many flavors above, then pick your ${activeBase.pickerConfig.total} eggs here.`;
  }

  // The parts of the modal that follow the chosen option (the 6 Pack's 3 or 6 flavors).
  function paintOption() {
    document.getElementById('dozen-modal-price').textContent = money(activeProduct.price);
    document.getElementById('dozen-modal-image').src = activeProduct.image;
    document.getElementById('dozen-modal-desc').textContent = activeProduct.desc || '';
    document.getElementById('flavor-section-title').textContent = activeProduct.maxFlavors === 1 ? 'Choose your flavor' : 'Choose your flavors';
  }

  function renderOptionPicker(note = '') {
    const block = document.getElementById('option-block');
    block.hidden = !activeBase.options;
    if (!activeBase.options) return;
    document.getElementById('option-title').textContent = activeBase.optionsTitle || 'Choose one';
    document.getElementById('option-hint').textContent = note || activeBase.optionsHint || '';
    const grid = document.getElementById('option-grid');
    grid.innerHTML = activeBase.options.map((o) => radioChoiceHTML({
      group: 'product-option', value: o.id, label: o.label, note: money(o.price), selected: o.id === activeProduct.optionId,
    })).join('');
    grid.querySelectorAll('.radio-choice-input').forEach((input) => {
      input.addEventListener('change', () => setOption(input.value));
    });
  }

  // Changing the option changes how many flavors the mix may use. Picks that still fit stay; if they do not fit the
  // new size, they are cleared and the line under the title says so.
  function setOption(optionId) {
    if (optionId === activeProduct.optionId) return;
    activeProduct = buildActiveProduct(activeBase, optionId);
    const picked = Object.entries(state.modalFlavorQty).filter(([, n]) => n > 0);
    const fits = picked.length <= activeProduct.maxFlavors && picked.every(([, n]) => n % activeProduct.step === 0);
    let note = '';
    if (!fits) {
      state.modalFlavorQty = {};
      state.modalExclusions = {};
      note = `Your flavors were cleared. Pick up to ${activeProduct.maxFlavors}.`;
    }
    paintOption();
    renderOptionPicker(note);
    renderFlavorGrid();
    paintOptionPending();
    renderModalFooter();
    document.querySelector(`#option-grid .radio-choice-input[value="${optionId}"]`).focus({ preventScroll: true });
    // The next thing to do is pick the flavors: bring that section to the top.
    document.getElementById('flavor-block').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  function openDozenModal(product, line = null) {
    lastFocusedEl = document.activeElement;
    activeBase = product;
    activeProduct = buildActiveProduct(product, line && line.edit.optionId);
    state.modalFlavorQty = {};
    state.modalExclusions = {};
    state.modalQty = 1;
    document.getElementById('item-note').value = '';
    populateQtySelect(document.getElementById('qty-select'));
    editingLine = line;
    if (line) {
      // Editing: every choice comes back filled in from the line.
      const e = line.edit;
      state.modalFlavorQty = { ...e.flavorQty };
      state.modalExclusions = Object.fromEntries(Object.entries(e.exclusions || {}).map(([id, list]) => [id, new Set(list)]));
      state.modalQty = line.qty;
      document.getElementById('item-note').value = e.note || '';
    }

    document.getElementById('dozen-modal-title').textContent = activeBase.name;
    renderOptionPicker();
    // The item's own authored description, not a generated sentence — this
    // modal now also serves the egg salads (a tub, not "deviled eggs"), so
    // a hardcoded "N deviled eggs, hand piped fresh daily" no longer fits
    // every product that opens it.
    paintOption();
    itemModal.querySelector('.item-modal-header-title').textContent = activeBase.name;

    // Kit extras: what's in the box, the fixed flavor lineup, the shipping note.
    document.getElementById('dozen-modal-desc').hidden = !activeProduct.desc;
    const info = document.getElementById('dozen-modal-info');
    info.hidden = !(activeProduct.details && activeProduct.details.length);
    document.getElementById('dozen-modal-info-label').textContent = activeProduct.detailsLabel || "What's included";
    document.getElementById('dozen-modal-details').innerHTML = (activeProduct.details || []).map((d) => `<li>${escapeHTML(d)}</li>`).join('');
    document.getElementById('flavor-block').hidden = !!activeProduct.fixedFlavors;
    // The count of eggs chosen lives in the footer, above the button; a fixed kit has nothing to count.
    document.getElementById('flavor-meter').hidden = !!activeProduct.fixedFlavors;
    document.getElementById('fixed-flavors').hidden = !activeProduct.fixedFlavors;
    renderFixedFlavors(activeProduct.fixedFlavors || []);
    const notice = document.getElementById('dozen-modal-notice');
    notice.hidden = !activeProduct.notice;
    notice.textContent = activeProduct.notice || '';

    state.bagelPreset = (line && line.edit.bagelPreset) || 'mixed';
    document.getElementById('bagel-preset-block').hidden = !activeProduct.bagelPresets;
    if (activeProduct.bagelPresets) renderBagelPresets();

    if (!activeProduct.fixedFlavors) renderFlavorGrid();
    paintOptionPending();
    renderModalFooter();
    itemModal.querySelector('.item-modal-header-title').classList.remove('visible');
    modalBackdrop.hidden = false;
    itemModal.hidden = false;
    // After un-hiding: a hidden element ignores scrollTop, so the long kit modal
    // would otherwise reopen where the last one was scrolled to.
    itemModal.querySelector('.item-modal-scroll').scrollTop = 0;
    updateInert();
    document.getElementById('close-modal').focus();
  }

  // The Sampler's flavors, in the flavor picker's cards: the clip playing by itself while it is on screen, the name and the calories under it, the "i"
  // opening the flavor info with Previous and Next through all of them. No stepper: the kit's flavors are fixed. A flavor with no clip yet (Gyro,
  // BBQ Chicken) shows the placeholder egg and the sheet says its video is coming.
  const SAMPLER_CLIPS = {
    'Traditional': 'traditional', 'Everything Seasoning': 'everything-seasoning', 'Smoked Salmon': 'smoked-salmon',
    'South of the Border': 'south-of-the-border', 'Sriracha Bacon': 'sriracha-bacon', 'Jalapeño Popper': 'jalapeno-popper',
    'Crab Rangoon': 'crab-rangoon', 'Chicken Bacon Ranch': 'chicken-bacon-ranch', 'Cali Roll': 'cali-roll',
    'Buffalo Blue Cheese': 'buffalo-blue-cheese', 'Buffalo Chicken': 'buffalo-chicken-ranch', 'Chicken and Pickle Egg': 'chicken-pickle-egg',
    'Chicken Caesar': 'chicken-caesar', 'Cheeseburger': 'cheeseburger',
  };
  function renderFixedFlavors(names) {
    const list = document.getElementById('fixed-flavors-list');
    if (!names.length) { list.innerHTML = ''; return; }
    const flavors = names.map((label) => ({ id: SAMPLER_CLIPS[label] || null, label }));
    document.getElementById('fixed-flavors-sub').textContent = `18 deviled eggs in ${names.length} flavors.`;
    fvDispose();
    list.innerHTML = '';
    fv.root = list;
    fv.observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      const video = entry.target.querySelector('video');
      if (!video) return;
      if (entry.intersectionRatio >= 0.55) fvPlay(video); else video.pause();
    }), { root: document.querySelector('#item-modal .item-modal-scroll'), threshold: [0, 0.55] });
    const tiles = [];
    flavors.forEach((f, i) => {
      const el = document.createElement('div');
      el.className = 'fv-tile';
      const body = document.createElement('div');
      body.className = 'fv-body';
      body.innerHTML = '<span class="fv-name"></span><span class="fv-stat"></span>';
      body.querySelector('.fv-name').textContent = f.label;
      body.querySelector('.fv-stat').textContent = pairStat(f);
      el.append(fvMedia(f, { list: flavors, index: i, noStat: true, openerFor: (j) => tiles[j].querySelector('.fv-info') }), body);
      tiles.push(el);
      list.appendChild(el);
    });
    fvKick();
  }

  function closeDozenModal() {
    endLineEdit();
    closeFlavorInfo(false);
    fvDispose();
    modalBackdrop.hidden = true;
    itemModal.hidden = true;
    updateInert();
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.getElementById('close-modal').addEventListener('click', closeDozenModal);
  modalBackdrop.addEventListener('click', closeDozenModal);

  document.getElementById('qty-select').addEventListener('change', (e) => {
    state.modalQty = Number(e.target.value);
    renderModalFooter();
  });

  document.getElementById('add-to-order').addEventListener('click', () => {
    if (!activeProduct.fixedFlavors && dozenAllocated() !== activeProduct.total) return;
    const flavorLabels = flavorList().filter((f) => (state.modalFlavorQty[f.id] || 0) > 0).map((f) => {
      const excluded = state.modalExclusions[f.id];
      const label = excluded && excluded.size ? `${f.label} (no ${[...excluded].join(', ').toLowerCase()})` : f.label;
      return `${label} ×${state.modalFlavorQty[f.id]}`;
    });
    const note = document.getElementById('item-note').value.trim();
    // Shipping kits say so on their bag line; the sampler has no flavors to list.
    const parts = [activeProduct.fixedFlavors ? '18 mini egg salads' : flavorLabels.join(', ')];
    if (activeProduct.bagelPresets) parts.unshift(activeProduct.bagelPresets.find((p) => p.id === state.bagelPreset).label);
    if (activeProduct.ships) parts.push('Ships nationwide');
    const entry = {
      name: activeProduct.name,
      sub: parts.join(' · ') + (note ? ' · Note: ' + note : ''),
      price: activeProduct.price,
      qty: state.modalQty,
      image: activeProduct.image,
    };
    // What Edit needs to reopen this line: the choices themselves, not the sentence above. A fixed-kit has none.
    if (!activeProduct.fixedFlavors) {
      entry.edit = {
        type: 'dozen', productId: activeProduct.id, optionId: activeProduct.optionId, flavorQty: { ...state.modalFlavorQty },
        exclusions: Object.fromEntries(Object.entries(state.modalExclusions).map(([id, set]) => [id, [...set]])),
        note, bagelPreset: activeProduct.bagelPresets ? state.bagelPreset : undefined,
      };
    }
    if (editingLine) { commitLineEdit(entry, closeDozenModal); return; }
    if (activeProduct.catering && cateringAddBlocked(itemModal)) return;
    addToCart({
      ...entry,
      cart: activeProduct.cart || orderKind(),
      ...(activeProduct.catering ? { catering: true } : {}),
      key: activeProduct.id + '-' + flavorLabels.join('-') + (note ? '-' + note : '') + '-' + Date.now(),
    });
    celebrateAdd(itemModal, closeDozenModal, activeProduct.image, state.modalQty);
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

  // One bagel per card, like the bowls and sandwiches: its own name, its clip playing at the top of the modal, Toasted or not, the bagel
  // type, the same "Remove ingredients" Customize list as the other items, and the options. There is no flavor to pick inside.
  let activeBagel = null;
  let bagelExcl = new Set();
  let bagelCustomOpen = false;

  function renderBagelCustomize() {
    mountCustomize(document.getElementById('bagel-customize'), {
      label: activeBagel.label, items: activeBagel.exclusions, excluded: bagelExcl, open: bagelCustomOpen,
      onToggleOpen: () => { bagelCustomOpen = !bagelCustomOpen; renderBagelCustomize(); },
      onToggle: (ing) => { toggleIn(bagelExcl, ing); renderBagelCustomize(); },
    });
  }

  // Toast and bagel type: two pick-one rows each, the packs' radio rows, updated in place so keyboard focus survives.
  function renderBagelRadios(gridId, group, choices, current, onPick) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = choices.map((c) => radioChoiceHTML({ group, value: c, label: c, selected: c === current })).join('');
    grid.querySelectorAll('.radio-choice-input').forEach((input) => {
      input.addEventListener('change', () => {
        onPick(input.value);
        grid.querySelectorAll('.radio-choice').forEach((row) => row.classList.toggle('selected', row.querySelector('.radio-choice-input').checked));
      });
    });
  }

  // Options can be combined, so these are the checkbox rows the wrap's add-ons use (no price here).
  const BAGEL_OPTIONS = ['Sauce on Side', 'Light Yolk Spread'];
  function renderBagelOptions() {
    const grid = document.getElementById('bagel-options-picker');
    grid.innerHTML = BAGEL_OPTIONS.map((label, i) => {
      const on = state.bagelOptions.has(label);
      return `<button class="addon-row${on ? ' selected' : ''}" type="button" role="checkbox" aria-checked="${on}" data-index="${i}">
        <span class="addon-row-text"><span class="addon-row-name">${label}</span></span>
        <span class="addon-row-box" aria-hidden="true">${on ? ADDON_CHECK_ICON : ''}</span>
      </button>`;
    }).join('');
    grid.querySelectorAll('.addon-row').forEach((row) => row.addEventListener('click', () => {
      const label = BAGEL_OPTIONS[Number(row.dataset.index)];
      if (state.bagelOptions.has(label)) state.bagelOptions.delete(label); else state.bagelOptions.add(label);
      renderBagelOptions();
      grid.querySelector(`.addon-row[data-index="${row.dataset.index}"]`).focus();
    }));
  }

  function renderBagelModalFooter() {
    document.getElementById('bagel-qty-select').value = String(state.bagelQty);
    const total = activeBagel.price * state.bagelQty;
    const btn = document.getElementById('add-bagel-to-order');
    btn.disabled = false;
    btn.textContent = `${editingLine ? 'Update order' : `Add ${state.bagelQty} to order`} · ${money(total)}`;
  }

  // A bagel line saved before bagels were separate products named "Full Size Bagel" and kept its flavor by menu name in `flavor`.
  const bagelFor = (line) => BAGEL_ITEMS.find((b) => line.edit.bagelId === b.id || (line.edit.flavor && line.edit.flavor === b.label)) || BAGEL_ITEMS[0];

  function openBagelModal(item, line = null) {
    if (item && item.edit) { line = item; item = bagelFor(item); }
    lastFocusedEl = document.activeElement;
    editingLine = line;
    activeBagel = item;
    document.getElementById('bagel-modal-title').textContent = item.name;
    document.getElementById('bagel-modal-header-title').textContent = item.name;
    document.getElementById('bagel-modal-price').textContent = money(item.price);
    document.getElementById('bagel-modal-desc').textContent = item.desc;
    // The clip plays muted and looped over its still; under reduced motion it waits, paused, for a tap.
    const video = document.getElementById('bagel-modal-video');
    video.poster = item.image;
    video.src = item.video;
    const still = document.getElementById('bagel-modal-image');
    still.src = item.image;
    state.bagelToast = 'Not Toasted';
    state.bagelType = 'Plain';
    state.bagelOptions = new Set();
    state.bagelQty = 1;
    bagelExcl = new Set();
    if (line) {
      const e = line.edit;
      Object.assign(state, { bagelToast: e.toast, bagelType: e.bagelType, bagelOptions: new Set(e.options), bagelQty: line.qty });
      bagelExcl = new Set(e.excl || []);
    }
    bagelCustomOpen = bagelExcl.size > 0;
    populateQtySelect(document.getElementById('bagel-qty-select'));
    renderBagelCustomize();
    renderBagelRadios('bagel-toast-picker', 'bagel-toast', ['Not Toasted', 'Toasted'], state.bagelToast, (v) => { state.bagelToast = v; });
    renderBagelRadios('bagel-type-picker', 'bagel-type', ['Plain', 'Everything'], state.bagelType, (v) => { state.bagelType = v; });
    renderBagelOptions();
    renderBagelModalFooter();
    bagelModal.querySelector('.item-modal-scroll').scrollTop = 0;
    bagelModal.querySelector('.item-modal-header-title').classList.remove('visible');
    bagelModalBackdrop.hidden = false;
    bagelModal.hidden = false;
    updateInert();
    if (!flavorReduceMotion.matches) video.play().catch(() => {});
    document.getElementById('close-bagel-modal').focus();
  }

  function closeBagelModal() {
    endLineEdit();
    const video = document.getElementById('bagel-modal-video');
    video.pause();
    video.removeAttribute('src');
    video.load();
    bagelModalBackdrop.hidden = true;
    bagelModal.hidden = true;
    updateInert();
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.getElementById('close-bagel-modal').addEventListener('click', closeBagelModal);
  bagelModalBackdrop.addEventListener('click', closeBagelModal);

  // Tapping the clip plays or pauses it.
  document.getElementById('bagel-modal-video').addEventListener('click', (e) => {
    const video = e.currentTarget;
    if (video.paused) video.play().catch(() => {}); else video.pause();
  });

  document.getElementById('bagel-qty-select').addEventListener('change', (e) => {
    state.bagelQty = Number(e.target.value);
    renderBagelModalFooter();
  });

  document.getElementById('add-bagel-to-order').addEventListener('click', () => {
    // The name carries the bagel; the detail line carries the choices made.
    const parts = [state.bagelType, state.bagelToast];
    if (bagelExcl.size) parts.push(`No ${[...bagelExcl].join(', ').toLowerCase()}`);
    if (state.bagelOptions.size) parts.push(Array.from(state.bagelOptions).join(', '));
    const entry = {
      name: activeBagel.name,
      sub: parts.join(' · '),
      price: activeBagel.price,
      qty: state.bagelQty,
      image: activeBagel.image,
      edit: { type: 'bagel', bagelId: activeBagel.id, toast: state.bagelToast, bagelType: state.bagelType, excl: [...bagelExcl], options: Array.from(state.bagelOptions) },
    };
    if (editingLine) { commitLineEdit(entry, closeBagelModal); return; }
    addToCart({
      ...entry,
      key: 'bagel-' + JSON.stringify({ b: activeBagel.id, t: state.bagelType, toast: state.bagelToast, x: [...bagelExcl], o: Array.from(state.bagelOptions) }) + '-' + Date.now(),
    });
    celebrateAdd(bagelModal, closeBagelModal, activeBagel.image, state.bagelQty);
  });

  // ---------- Bowl customization modal ----------
  // Add-Ons are paid (priced per item) and multi-select, like the exclusion
  // list — none of the sections are mutually
  // exclusive or required, so unlike the dozen/bagel modals there is no
  // allocation gate: Add to order is always enabled.
  const bowlModalBackdrop = document.getElementById('bowl-modal-backdrop');
  const bowlModal = document.getElementById('bowl-modal');
  let activeBowl = null;
  wireHeaderTitleReveal(bowlModal, 'bowl-modal-title');

  // Shared by the bowl and wrap modals: priced add-ons as full-width checkbox
  // rows (Figma "Add-Ons" spec). Re-renders on toggle, so keyboard focus is
  // handed back to the same row afterwards.
  const ADDON_CHECK_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 7L9 19L3.5 13.5L4.91 12.09L9 16.17L19.59 5.59L21 7Z" fill="currentColor"/></svg>';

  function renderAddOnRows(container, addOns, selected, onChange) {
    container.innerHTML = addOns.map((addOn, i) => {
      const on = selected.has(i);
      return `
      <button class="addon-row${on ? ' selected' : ''}" type="button" role="checkbox" aria-checked="${on}" data-index="${i}">
        <span class="addon-row-text">
          <span class="addon-row-name">${addOn.label}</span>
          <span class="addon-row-note">+${money(addOn.price)}${addOn.note ? ' · ' + addOn.note : ''}</span>
        </span>
        <span class="addon-row-box" aria-hidden="true">${on ? ADDON_CHECK_ICON : ''}</span>
      </button>`;
    }).join('');
    container.querySelectorAll('.addon-row').forEach((row) => {
      row.addEventListener('click', () => {
        const i = Number(row.dataset.index);
        if (selected.has(i)) selected.delete(i);
        else selected.add(i);
        renderAddOnRows(container, addOns, selected, onChange);
        container.querySelector(`.addon-row[data-index="${i}"]`).focus();
        onChange();
      });
    });
  }

  function renderBowlAddOns() {
    renderAddOnRows(document.getElementById('bowl-addons-picker'), activeBowl.addOns, state.bowlAddOns, renderBowlModalFooter);
  }

  // Ingredients to leave out: the same Customize link and list as the packs, wraps and bagel.
  let bowlCustomOpen = false;
  function renderBowlExclusions() {
    mountCustomize(document.getElementById('bowl-no-picker'), {
      label: activeBowl.name, items: activeBowl.exclusions, excluded: state.bowlExclusions, open: bowlCustomOpen,
      onToggleOpen: () => { bowlCustomOpen = !bowlCustomOpen; renderBowlExclusions(); },
      onToggle: (ing) => { toggleIn(state.bowlExclusions, ing); renderBowlExclusions(); },
    });
  }

  function bowlAddOnsTotal() {
    let sum = 0;
    state.bowlAddOns.forEach((i) => { sum += activeBowl.addOns[i].price; });
    return sum;
  }

  function renderBowlModalFooter() {
    document.getElementById('bowl-qty-select').value = String(state.bowlQty);
    const unitPrice = activeBowl.price + bowlAddOnsTotal();
    const total = unitPrice * state.bowlQty;
    document.getElementById('add-bowl-to-order').textContent = `${editingLine ? 'Update order' : `Add ${state.bowlQty} to order`} · ${money(total)}`;
  }

  function openBowlModal(bowl, line = null) {
    lastFocusedEl = document.activeElement;
    activeBowl = bowl;
    editingLine = line;
    state.bowlAddOns = new Set(line ? line.edit.addOns : []);
    state.bowlExclusions = new Set(line ? line.edit.exclusions : []);
    bowlCustomOpen = state.bowlExclusions.size > 0;
    state.bowlOptions = new Set(line ? line.edit.options : []);
    state.bowlQty = line ? line.qty : 1;
    populateQtySelect(document.getElementById('bowl-qty-select'));

    document.getElementById('bowl-modal-title').textContent = bowl.name;
    document.getElementById('bowl-modal-price').textContent = money(bowl.price);
    document.getElementById('bowl-modal-image').src = bowl.image;
    document.getElementById('bowl-modal-desc').textContent = bowl.desc;
    document.getElementById('bowl-modal-header-title').textContent = bowl.name;
    document.querySelectorAll('#bowl-options-picker .chip').forEach((b) => b.classList.toggle('active', state.bowlOptions.has(b.dataset.value)));

    renderBowlAddOns();
    renderBowlExclusions();
    renderBowlModalFooter();
    bowlModal.querySelector('.item-modal-scroll').scrollTop = 0;
    bowlModal.querySelector('.item-modal-header-title').classList.remove('visible');
    bowlModalBackdrop.hidden = false;
    bowlModal.hidden = false;
    updateInert();
    document.getElementById('close-bowl-modal').focus();
  }

  function closeBowlModal() {
    endLineEdit();
    bowlModalBackdrop.hidden = true;
    bowlModal.hidden = true;
    updateInert();
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.getElementById('close-bowl-modal').addEventListener('click', closeBowlModal);
  bowlModalBackdrop.addEventListener('click', closeBowlModal);

  document.getElementById('bowl-options-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    const value = btn.dataset.value;
    if (state.bowlOptions.has(value)) {
      state.bowlOptions.delete(value);
      btn.classList.remove('active');
    } else {
      state.bowlOptions.add(value);
      btn.classList.add('active');
    }
  });

  document.getElementById('bowl-qty-select').addEventListener('change', (e) => {
    state.bowlQty = Number(e.target.value);
    renderBowlModalFooter();
  });

  document.getElementById('add-bowl-to-order').addEventListener('click', () => {
    const addOnLabels = Array.from(state.bowlAddOns).map((i) => activeBowl.addOns[i].label);
    const parts = [];
    if (addOnLabels.length) parts.push(addOnLabels.join(', '));
    if (state.bowlExclusions.size) parts.push('No ' + Array.from(state.bowlExclusions).join(', ').toLowerCase());
    if (state.bowlOptions.size) parts.push(Array.from(state.bowlOptions).join(', '));
    const unitPrice = activeBowl.price + bowlAddOnsTotal();
    const entry = {
      name: activeBowl.name,
      sub: parts.length ? parts.join(' · ') : activeBowl.note || '',
      price: unitPrice,
      qty: state.bowlQty,
      image: activeBowl.image,
      edit: {
        type: 'bowl', productId: activeBowl.id, addOns: Array.from(state.bowlAddOns),
        exclusions: Array.from(state.bowlExclusions), options: Array.from(state.bowlOptions),
      },
    };
    if (editingLine) { commitLineEdit(entry, closeBowlModal); return; }
    addToCart({
      ...entry,
      key: 'bowl-' + activeBowl.id + '-' + JSON.stringify({
        a: Array.from(state.bowlAddOns),
        x: Array.from(state.bowlExclusions), o: Array.from(state.bowlOptions),
      }) + '-' + Date.now(),
    });
    celebrateAdd(bowlModal, closeBowlModal, activeBowl.image, state.bowlQty);
  });

  // ---------- Wrap customization modal ----------
  // Shape is "dozen picker" (allocate a flavor, up to a cap) crossed with
  // "bowl modal" (paid Add-Ons) — rather than bend either shared modal to
  // fit a shape neither owns, this is its own small one, built the same
  // way as the others (own activeWrap/state fields, own open/close).
  const wrapModalBackdrop = document.getElementById('wrap-modal-backdrop');
  const wrapModal = document.getElementById('wrap-modal');
  let activeWrap = null;
  wireHeaderTitleReveal(wrapModal, 'wrap-modal-title');

  // The sandwich this modal is for (each card opens its own; there is no switching sandwiches inside the modal): its "Customize" link
  // opens the "Remove ingredients" list under the ingredient line.
  let wrapExcl = new Set();
  let wrapCustomOpen = false;
  const wrapFlavor = () => activeWrap.wrapFlavors.find((f) => f.id === state.wrapFlavor) || activeWrap.wrapFlavors[0];
  const wrapFullName = (f) => `${f.label} Eggceptional Wrap`;

  function renderWrapCustomize() {
    const f = wrapFlavor();
    mountCustomize(document.getElementById('wrap-customize'), {
      label: f.label, items: f.exclusions, excluded: wrapExcl, open: wrapCustomOpen,
      onToggleOpen: () => { wrapCustomOpen = !wrapCustomOpen; renderWrapCustomize(); },
      onToggle: (ing) => { toggleIn(wrapExcl, ing); renderWrapCustomize(); renderWrapModalFooter(); },
    });
  }

  // Regular wrap or a meal, as two radio rows with what each costs; updated in place, like the flavor rows.
  function renderWrapMealPicker() {
    const grid = document.getElementById('wrap-meal-picker');
    const options = [
      { value: 'wrap', label: 'Regular wrap', note: money(activeWrap.price) },
      { value: 'meal', label: activeWrap.meal.label, note: `${money(activeWrap.price + activeWrap.meal.price)} · ${activeWrap.meal.note}` },
    ];
    grid.innerHTML = options.map((o) => radioChoiceHTML({ group: 'wrap-meal', value: o.value, label: o.label, note: o.note, selected: (o.value === 'meal') === state.wrapMeal })).join('');
    grid.querySelectorAll('.radio-choice-input').forEach((input) => {
      input.addEventListener('change', () => {
        state.wrapMeal = input.value === 'meal';
        grid.querySelectorAll('.radio-choice').forEach((row) => {
          row.classList.toggle('selected', row.querySelector('.radio-choice-input').checked);
        });
        renderWrapModalFooter();
      });
    });
  }

  function renderWrapAddOns() {
    renderAddOnRows(document.getElementById('wrap-addons-picker'), activeWrap.addOns, state.wrapAddOns, renderWrapModalFooter);
  }

  function wrapAddOnsTotal() {
    let sum = state.wrapMeal ? activeWrap.meal.price : 0;
    state.wrapAddOns.forEach((i) => { sum += activeWrap.addOns[i].price; });
    return sum;
  }

  function renderWrapModalFooter() {
    document.getElementById('wrap-qty-select').value = String(state.wrapQty);
    const unitPrice = activeWrap.price + wrapAddOnsTotal();
    const total = unitPrice * state.wrapQty;
    const btn = document.getElementById('add-wrap-to-order');
    btn.disabled = false;
    btn.textContent = `${editingLine ? 'Update order' : `Add ${state.wrapQty} to order`} · ${money(total)}`;
  }

  function openWrapModal(item, line = null, presetFlavor = null) {
    lastFocusedEl = document.activeElement;
    activeWrap = item;
    editingLine = line;
    state.wrapFlavor = (line ? line.edit.flavor : presetFlavor) || item.wrapFlavors[0].id;
    wrapExcl = new Set(line && line.edit.excl ? line.edit.excl : []);
    wrapCustomOpen = wrapExcl.size > 0;
    // A line saved before the meal became its own choice kept it as add-on 0 ("Make it a Meal"), with the others after it.
    const legacy = !!line && line.edit.v !== 2;
    state.wrapMeal = line ? (legacy ? line.edit.addOns.includes(0) : !!line.edit.meal) : false;
    state.wrapAddOns = new Set(line ? (legacy ? line.edit.addOns.filter((i) => i > 0).map((i) => i - 1) : line.edit.addOns) : []);
    state.wrapQty = line ? line.qty : 1;
    populateQtySelect(document.getElementById('wrap-qty-select'));

    const flavor = wrapFlavor();
    document.getElementById('wrap-modal-title').textContent = wrapFullName(flavor);
    document.getElementById('wrap-modal-price').textContent = money(item.price);
    document.getElementById('wrap-modal-image').src = flavor.photo;
    document.getElementById('wrap-modal-desc').textContent = flavor.ingredients;
    document.getElementById('wrap-modal-header-title').textContent = wrapFullName(flavor);

    renderWrapCustomize();
    renderWrapMealPicker();
    renderWrapAddOns();
    renderWrapModalFooter();
    wrapModal.querySelector('.item-modal-scroll').scrollTop = 0;
    wrapModal.querySelector('.item-modal-header-title').classList.remove('visible');
    wrapModalBackdrop.hidden = false;
    wrapModal.hidden = false;
    updateInert();
    document.getElementById('close-wrap-modal').focus();
  }

  function closeWrapModal() {
    endLineEdit();
    wrapModalBackdrop.hidden = true;
    wrapModal.hidden = true;
    updateInert();
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.getElementById('close-wrap-modal').addEventListener('click', closeWrapModal);
  wrapModalBackdrop.addEventListener('click', closeWrapModal);

  document.getElementById('wrap-qty-select').addEventListener('change', (e) => {
    state.wrapQty = Number(e.target.value);
    renderWrapModalFooter();
  });

  document.getElementById('add-wrap-to-order').addEventListener('click', () => {
    const flavor = wrapFlavor();
    const addOnLabels = Array.from(state.wrapAddOns).map((i) => activeWrap.addOns[i].label);
    // The name carries the sandwich; the detail line carries only what was changed or added.
    const parts = [];
    if (wrapExcl.size) parts.push(`No ${[...wrapExcl].join(', ').toLowerCase()}`);
    if (state.wrapMeal) parts.push(activeWrap.meal.label);
    if (addOnLabels.length) parts.push(addOnLabels.join(', '));
    const unitPrice = activeWrap.price + wrapAddOnsTotal();
    const entry = {
      name: wrapFullName(flavor),
      sub: parts.join(' · '),
      price: unitPrice,
      qty: state.wrapQty,
      image: activeWrap.image,
      edit: { type: 'wrap', productId: activeWrap.id, flavor: flavor.id, excl: [...wrapExcl], meal: state.wrapMeal, addOns: Array.from(state.wrapAddOns), v: 2 },
    };
    if (editingLine) { commitLineEdit(entry, closeWrapModal); return; }
    addToCart({
      ...entry,
      key: 'wrap-' + activeWrap.id + '-' + flavor.id + '-' + (state.wrapMeal ? 'meal-' : '') + JSON.stringify(Array.from(state.wrapAddOns)) + '-' + Date.now(),
    });
    celebrateAdd(wrapModal, closeWrapModal, activeWrap.image, state.wrapQty);
  });

  // ---------- Quick view modal (no customization — qty + a bigger photo) ----------
  // For any product with neither a flavor picker nor bowl-style add-ons:
  // still worth its own modal rather than an instant one-click add, so the
  // customer sees the full photo and description and picks a quantity
  // before it lands in the cart.
  const quickviewModalBackdrop = document.getElementById('quickview-modal-backdrop');
  const quickviewModal = document.getElementById('quickview-modal');
  let activeQuickview = null;
  wireHeaderTitleReveal(quickviewModal, 'quickview-modal-title');

  function renderQuickviewFooter() {
    const qty = Number(document.getElementById('quickview-qty-select').value);
    const total = activeQuickview.price * qty;
    document.getElementById('add-quickview-to-order').textContent = `Add ${qty} to order · ${money(total)}`;
  }

  function openQuickviewModal(item, cartMeta) {
    lastFocusedEl = document.activeElement;
    activeQuickview = { ...item, cartMeta };
    const qtySelect = document.getElementById('quickview-qty-select');
    populateQtySelect(qtySelect);
    qtySelect.value = '1';

    document.getElementById('quickview-modal-title').textContent = item.name;
    document.getElementById('quickview-modal-price').textContent = money(item.price);
    document.getElementById('quickview-modal-desc').textContent = item.desc || '';
    document.getElementById('quickview-modal-header-title').textContent = item.name;
    const media = document.getElementById('quickview-modal-media');
    media.innerHTML = '';
    media.appendChild(productThumb(item));

    renderQuickviewFooter();
    quickviewModal.querySelector('.item-modal-scroll').scrollTop = 0;
    quickviewModal.querySelector('.item-modal-header-title').classList.remove('visible');
    quickviewModalBackdrop.hidden = false;
    quickviewModal.hidden = false;
    updateInert();
    document.getElementById('close-quickview-modal').focus();
  }

  function closeQuickviewModal() {
    quickviewModalBackdrop.hidden = true;
    quickviewModal.hidden = true;
    updateInert();
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.getElementById('close-quickview-modal').addEventListener('click', closeQuickviewModal);
  quickviewModalBackdrop.addEventListener('click', closeQuickviewModal);
  document.getElementById('quickview-qty-select').addEventListener('change', renderQuickviewFooter);

  document.getElementById('add-quickview-to-order').addEventListener('click', () => {
    const qty = Number(document.getElementById('quickview-qty-select').value);
    const { keyPrefix, cartCategory } = activeQuickview.cartMeta;
    if (activeQuickview.cartMeta.catering && cateringAddBlocked(quickviewModal)) return;
    addToCart({
      cart: activeQuickview.cartMeta.cart || orderKind(),
      ...(activeQuickview.cartMeta.catering ? { catering: true } : {}),
      key: keyPrefix + '-' + activeQuickview.id,
      name: activeQuickview.name,
      sub: cartCategory,
      price: activeQuickview.price,
      qty,
      image: activeQuickview.image,
      icon: activeQuickview.icon,
    });
    celebrateAdd(quickviewModal, closeQuickviewModal, activeQuickview.image, qty);
  });

  // ---------- Catering items ----------
  // Every catering "Order Now" opens its own modal and adds to the Catering
  // cart. Contents are the live catering order form's own (flavor lists with
  // descriptions, sides and prices, drinks, minimums).
  const CATERING_SANDWICHES = [{"id": "blte-sw", "photo": "assets/sandwiches/blte.jpg", "label": "BLTE", "desc": "Ranch Yolk Mix, Bacon, Cheddar Cheese, Lettuce, Tomato & House-Made Creamy Ranch"}, {"id": "cali-sw", "photo": "assets/catering/flavors/cali-roll-square-img.jpg", "label": "Cali Roll", "desc": "Imitation Crab Mix, Sriracha Aioli, Fresh Avocado, Cucumber, Teriyaki & Black Sesame"}, {"id": "veggie-sw", "label": "Vegetarian", "desc": "Cream Cheese, Cucumbers, Tomato & Everything Seasoning"}, {"id": "caesar-sw", "photo": "assets/sandwiches/caesar.jpg", "label": "The Caesar", "desc": "Caesar Yolk Mix, Grilled Chicken, Bacon, Parmean Cheese, Lettuce, Tomato & House-Made Creamy Ranch"}, {"id": "bbq-sw", "photo": "assets/catering/flavors/backyard-bbq-square-img.jpg", "label": "Backyard BBQ", "desc": "Traditional Yolk Mix, BBQ Brisket, Lettuce, Pickled Jalapeno, Red Onion, BBQ Sauce, Cheddar Cheese"}, {"id": "buffalo-sw", "photo": "assets/sandwiches/buffalo-chicken.jpg", "label": "Buffalo Chicken", "desc": "Buffalo Yolk Mix, Grilled Chicken, Red Onion, Buffalo Sauce, Lettuce & House-Made Creamy Ranch"}];
  const CATERING_BOWLS = [{"id": "avo-blt-bowl", "label": "Avocado Chicken BLT", "desc": "Egg Whites, Grilled Chicken, Bacon, Fresh Avocado, Cheddar Cheese, Lettuce, Tomato & House-Made Creamy Ranch"}, {"id": "buffalo-bowl", "label": "Buffalo Chicken Bowl", "desc": "Egg Whites, Lettuce, Grilled Chicken, Red Onion, Buffalo Sauce, Cheddar Cheese & House-Made Creamy Ranch"}, {"id": "caesar-bowl", "label": "The Caesar Bowl", "desc": "Egg Whites, Grilled Chicken, Capers, Romaine Lettuce, Red Onion, Creamy Caesar & Parmesan Cheese"}, {"id": "brisket-bowl", "label": "Banging Brisket Bowl", "desc": "Egg Whites, BBQ Brisket, Lettuce, Pickled Jalapeño, Red Onion, BBQ Sauce & Cheddar Cheese"}, {"id": "poke-bowl", "label": "Poke-Egg-Bowl", "desc": "Egg Whites, Imitation Crab, Sriracha Aioli, Fresh Avocado, Cucumber, Teriyaki Sauce & Black Sesame Seeds"}, {"id": "walking-taco-bowl", "label": "Walking Taco Bowl", "desc": "Egg Whites, Refried Beans, Grilled Chicken, Lettuce, Cheddar Cheese, Cholula Hot Sauce, Sour Cream & Doritos"}];
  const CATERING_EGGS = [{"id": "buffalo-blue", "photo": "assets/catering/flavors/buffalo-blue-square-img.jpg", "label": "Buffalo Blue", "desc": "Hot Sauce Yolk Mix, Blue Cheese Crumbles & A Hot Sauce Drizzle"}, {"id": "buffalo-chicken", "photo": "assets/catering/flavors/Buffalo-chicken-square-img.png", "label": "Buffalo Chicken Egg", "desc": "Buffalo Sauce Infused Yolk Mix, Grilled Chicken, Red Onion & A Buffalo Sauce Drizzle"}, {"id": "walking-taco", "photo": "assets/catering/flavors/walking-taco-square-img.jpg", "label": "Walking Taco Egg", "desc": "Cholula Infused Yolk Mix, Grilled Chicken, Refried Beans, Lettuce, Sour Cream, Cheddar Cheese & Crumbled Doritos"}, {"id": "jalapeno-popper", "photo": "assets/catering/flavors/popper-square-img.png", "label": "Jalapeño Popper", "desc": "Cream Cheese Yolk Mix, Bacon Crumbles, Fresh Jalapeño Slice & A Chipotle Sauce Drizzle"}, {"id": "chicken-pickle", "photo": "assets/catering/flavors/chicken-a-pickle-square-img.jpg", "label": "Chicken N A Pickle", "desc": "Sweet Chicken Sauce Yolk Mix, Grilled Chicken, A Dill Pickle Slice & A Sweet Chicken Sauce Drizzle"}, {"id": "smoked-salmon", "photo": "assets/catering/flavors/smoked-salmon-square-img.png", "label": "Smoked Salmon", "desc": "Cream Cheese Infused Yolk Mix, Capers, Red Onion & Fully Cooked Wild Caught Smoked Salmon"}, {"id": "crab-rangoon", "photo": "assets/catering/flavors/crab-rangoon-square-img.png", "label": "Crab Rangoon", "desc": "Sweet Crab Mix, Cream Cheese Infused Yolk Mix, Crispy Wontons & A Sweet & Sour Sauce Drizzle"}, {"id": "cali-roll", "photo": "assets/catering/flavors/cali-roll-square-img.jpg", "label": "Cali Roll Egg", "desc": "Spicy Mayo Crab Mix, Fresh Cucumber Slice, Black Sesame Seeds & A Teriyaki Sauce Drizzle"}, {"id": "sriracha-bacon", "photo": "assets/catering/flavors/srircha-bacon-square-img.png", "label": "Sriracha Bacon", "desc": "Sriracha Yolk Mix, Bacon Crumbles & A Sriracha Drizzle"}, {"id": "blte", "photo": "assets/catering/flavors/blte-square-img.jpg", "label": "BLTE Egg", "desc": "Ranch Yolk Mix, Bacon Crumbles, Lettuce, Cherry Tomato Slice & A Ranch Sauce Drizzle"}, {"id": "south-border", "photo": "assets/catering/flavors/south-of-the-border-square-img.jpg", "label": "South of the Border", "desc": "Cholula Infused Yolk Mix, Cheddar Cheese & Fresh Jalapeño Slice"}, {"id": "chicken-caesar", "photo": "assets/catering/flavors/caesar-square-img.png", "label": "Chicken Caesar", "desc": "Caesar Infused Yolk Mix, Grilled Chicken, Lettuce, Parmesan Cheese & A Caesar Drizzle"}, {"id": "backyard-bbq", "photo": "assets/catering/flavors/backyard-bbq-square-img.jpg", "label": "Backyard BBQ Egg", "desc": "Smokey BBQ In The Base, Traditional Yolk Mix, Dill Pickle Slice & A BBQ Sauce Drizzle"}, {"id": "chicken-bacon-ranch", "photo": "assets/catering/flavors/chicken-bacon-ranch-square-img.jpg", "label": "Chicken Bacon Ranch", "desc": "Ranch Yolk Mix, Grilled Chicken, Bacon Crumbles, Cheddar Cheese & A Ranch Sauce Drizzle"}, {"id": "traditional", "photo": "assets/catering/flavors/traditional-square-img.jpg", "label": "Traditional", "desc": "Mayo & Dijon Infused Yolk Mix, Paprika Seasoning"}, {"id": "everything", "photo": "assets/catering/flavors/everything-square-img.jpg", "label": "Everything Seasoning", "desc": "Cream Cheese Infused Yolk Mix, Everything Seasoning"}];
  const CATERING_COFFEE_NOTE = 'The Coffee Bar Included';
  // One bottled drink per box is included; RedBull is +$1 each.
  const CATERING_DRINKS = { choices: [{ name: 'Fiji Water' }, { name: 'Coke' }, { name: 'Coke Zero' }, { name: 'Dr Pepper' }, { name: 'Sweet Tea' }, { name: 'Unsweet Tea' }, { name: 'RedBull', price: 1 }] };
  const drinkUpcharge = (name) => (CATERING_DRINKS.choices.find((c) => c.name === name) || {}).price || 0;
  // Sides a box can add. `flavor` ones ask which deviled egg flavor goes in them.
  const SIDE_COOKIE = { id: 'cookie', label: 'Cookie', price: 2 };
  const SIDE_PICKLE = { id: 'pickle', label: 'Kosher Dill Pickle', price: 1 };
  const SIDE_EGG_SALAD = { id: 'egg-salad', label: '4oz House-Made Egg Salad', price: 2, flavor: true };
  const BAGEL_PRESETS = [
    { id: 'mixed', label: '5 Plain, 5 Everything', note: 'Our usual mix' },
    { id: 'all-everything', label: '10 Everything', note: 'All Everything bagels' },
    { id: 'all-plain', label: '10 Plain', note: 'All Plain bagels' },
  ];

  const CATERING_ITEMS = {
    // Retired from the menu (2026-10-16): kept only so a bag saved before then still shows and edits its line.
    classic: {
      retired: true,
      kind: 'box', id: 'classic', name: 'The Classic Choice', price: 10, minQty: 10, image: 'assets/catering/classic.jpg',
      desc: 'Choose sandwich or bowl, up to 2 flavors, then a side.',
      included: ['Kettle Cooked Chips'],
      sides: [SIDE_COOKIE, SIDE_PICKLE, { id: 'eggs-2pack', label: '2-Pack of Gourmet Deviled Eggs', price: 4, flavor: true }, SIDE_EGG_SALAD],
    },
    allin: {
      kind: 'box', id: 'allin', name: 'The "All In" Power Lunch', price: 15, minQty: 10, image: 'assets/catering/allin.jpg',
      desc: 'Choose sandwich or bowl, up to 2 flavors, then a drink for every box and any extra sides.',
      included: ['Signature Full Sandwich or ½ Lunch Size Bowl', 'Kettle Cooked Chips', '½ Kosher Dill Pickle', 'Bottled Beverage'],
      sides: [{ id: 'eggs-2pack', label: 'Gourmet 2-Pack of Deviled Eggs', price: 4, flavor: true }, { ...SIDE_EGG_SALAD, label: '4oz Side of House-Made Egg Salad' }],
      drinks: CATERING_DRINKS,
    },
    'power-pair': {
      kind: 'bundle', id: 'power-pair', name: 'Power Pair Bundle', price: 59.99, image: 'assets/catering/power-pair.jpg',
      desc: 'Serves 10 People',
      details: ['10 Signature 2-Pack Gourmet Deviled Eggs (20 eggs total)', CATERING_COFFEE_NOTE],
      flavors: CATERING_EGGS, unit: ['two-pack', 'two-packs'],
    },
    'bagel-brew': {
      kind: 'bundle', id: 'bagel-brew', name: 'Bagel & Brew Bundle', price: 69.99, image: 'assets/catering/bagel-brew.jpg',
      desc: 'Serves 10 People',
      details: ['Bagel Box: 5 Plain Bagels | 5 Everything Bagels', 'Choice of 2 Signature Egg Spreads, Toppings, or Cream Cheese', CATERING_COFFEE_NOTE],
      flavors: CATERING_EGGS, unit: ['spread', 'spreads'], bagelPresets: BAGEL_PRESETS,
    },
    'hungry-team': {
      kind: 'bundle', id: 'hungry-team', name: 'The "Hungry Team"', price: 99.99, image: 'assets/catering/light-lunch.jpg',
      desc: 'Serves 10 People: Best Value For a Full Meal',
      details: ['10 Signature Full-Sandwiches | Choose Up To 2 Flavors', CATERING_COFFEE_NOTE],
      flavors: CATERING_SANDWICHES, unit: ['sandwich', 'sandwiches'],
    },
    'light-lunch': {
      kind: 'bundle', id: 'light-lunch', name: 'The "Light Lunch"', price: 69.99, image: 'assets/catering/light-lunch.jpg',
      desc: 'Serves 10 People',
      details: ['10 Signature Half-Sandwiches | Choose Up To 2 Flavors', CATERING_COFFEE_NOTE],
      flavors: CATERING_SANDWICHES, unit: ['sandwich', 'sandwiches'],
    },
    'coffee-bar': {
      kind: 'simple', id: 'coffee-bar', name: 'Catering Coffee Bar', price: 24.99, image: 'assets/catering/coffee-bar.jpg',
      desc: 'Serves 10-12 People: 96oz Hardy Coffee, Cream, Sugar & Sweeteners, and setup: Cups, Lids & Stirrers.',
    },
  };

  // A catering item goes into the bag the customer is ordering on, Pickup or Delivery, with its notice and fee rules
  // (see cateringLead). That is the same whether it is added from the order page or from the Catering page, where
  // orderKind() cannot tell (neither order view is showing), so the mode decides.
  const cateringCart = () => (state.orderMode === 'delivery' ? 'delivery' : 'pickup');
  // A catering line saved earlier keeps the photo path it was added with, which breaks when a photo is renamed or
  // replaced: point every saved catering line at its item's current photo.
  CART_KINDS.forEach((kind) => state.carts[kind].forEach((line) => {
    const item = line.catering && (CATERING_ITEMS[line.config && line.config.itemId] || Object.values(CATERING_ITEMS).find((i) => i.name === line.name));
    if (item && item.image) line.image = item.image;
  }));
  // The catering items also have a tile on the pickup and delivery order page. (Added here because the catering data is
  // defined here; the tiles are drawn again once it is in.)
  const CATERING_ORDER_IDS = ['allin', 'power-pair', 'bagel-brew', 'hungry-team', 'light-lunch', 'coffee-bar'];
  ORDER_GROUPS.push({
    id: 'catering', name: 'Catering', image: 'assets/catering/power-pair.jpg', catering: true,
    items: CATERING_ORDER_IDS.map((id) => {
      const c = CATERING_ITEMS[id];
      return {
        id, name: c.name, price: c.price, image: c.image, icon: c.icon, catering: true,
        note: c.kind === 'box' ? 'per box · 10-box minimum' : c.kind === 'bundle' ? 'Serves 10' : 'Serves 10–12',
        desc: c.kind === 'bundle' ? (c.details && c.details[0]) || '' : c.desc,
      };
    }),
  });

  // The Catering page's cards: the same cards as the menu, each opening the catering modal.
  const CATERING_PAGE_SECTIONS = {
    'cater-boxes-grid': ['allin'],
    'cater-mornings-grid': ['power-pair', 'bagel-brew'],
    'cater-brunch-grid': ['hungry-team', 'light-lunch'],
    'cater-coffee-grid': ['coffee-bar'],
  };
  function renderCateringPage() {
    const items = Object.fromEntries(ORDER_GROUPS.find((g) => g.id === 'catering').items.map((i) => [i.id, i]));
    Object.entries(CATERING_PAGE_SECTIONS).forEach(([gridId, ids]) => {
      renderShopGrid(gridId, ids.map((id) => items[id]), 'catering', 'Catering', (item) => openCateringItem(item.id));
    });
  }
  renderCateringPage();

  function openCateringItem(id) {
    // From the Catering page with no pickup or delivery chosen yet, ask where first, then open the item.
    if (gateCatering(() => openCateringItem(id))) return;
    const item = CATERING_ITEMS[id];
    if (item.kind === 'box') { openBoxModal(item); return; }
    if (item.kind === 'simple') { openQuickviewModal(item, { keyPrefix: 'catering', cartCategory: 'Catering · Add-on station · Serves 10-12', cart: cateringCart(), catering: true }); return; }
    openDozenModal(cateringBundleProduct(item));
  }

  // A bundle is one dozen-style picker: its 10 pieces go out in steps of 5
  // across up to 2 flavors, and every bundle ordered gets the same mix.
  function cateringBundleProduct(item) {
    return {
      ...item,
      cart: cateringCart(),
      catering: true,
      pickerConfig: { total: 10, maxFlavors: 2 },
      hintTail: ' Every bundle gets the same mix.',
    };
  }

  function renderBagelPresets() {
    const grid = document.getElementById('bagel-preset-grid');
    grid.innerHTML = BAGEL_PRESETS.map((p) => radioChoiceHTML({
      group: 'bagel-preset', value: p.id, label: p.label, note: p.note, selected: p.id === state.bagelPreset,
    })).join('');
    grid.querySelectorAll('.radio-choice-input').forEach((input) => {
      input.addEventListener('change', () => {
        state.bagelPreset = input.value;
        grid.querySelectorAll('.radio-choice').forEach((row) => {
          row.classList.toggle('selected', row.querySelector('.radio-choice-input').checked);
        });
      });
    });
  }

  // ---------- Catering box meal modal ----------
  // protein (sandwich or bowl) → up to 2 flavors, split evenly across the
  // boxes → included sides → optional paid sides (some ask for an egg flavor)
  // → drinks (The "All In" only) → how many boxes (10 minimum).
  const boxModalBackdrop = document.getElementById('box-modal-backdrop');
  const boxModal = document.getElementById('box-modal');
  const box = { item: null, editing: null, protein: null, flavors: [], sides: new Set(), sideFlavor: {}, drinks: {}, qty: 10 };
  wireHeaderTitleReveal(boxModal, 'box-modal-title');

  const BOX_PROTEINS = [
    { id: 'sandwich', label: 'Signature Full Sandwich', note: '', flavors: CATERING_SANDWICHES },
    { id: 'bowl', label: '½ Lunch Size Bowl', note: 'High protein', flavors: CATERING_BOWLS },
  ];
  // 10 to 40 one at a time, then bigger steps up to a 200-box event.
  const BOX_QTY_OPTIONS = [...Array.from({ length: 31 }, (_, i) => 10 + i), 45, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200];
  const boxProtein = () => BOX_PROTEINS.find((p) => p.id === box.protein);
  const boxDrinkCount = () => Object.values(box.drinks).reduce((a, n) => a + n, 0);
  const boxSides = () => box.item.sides.filter((side) => box.sides.has(side.id));
  const boxUnitPrice = () => box.item.price + boxSides().reduce((sum, side) => sum + side.price, 0);
  const boxDrinkCost = () => Object.entries(box.drinks).reduce((sum, [name, n]) => sum + n * drinkUpcharge(name), 0);

  // The boxes split as evenly as they can between the chosen flavors, the extra one going to the first.
  function boxSplit() {
    const n = box.flavors.length;
    if (!n) return [];
    return box.flavors.map((id, i) => ({ id, qty: Math.floor(box.qty / n) + (i < box.qty % n ? 1 : 0) }));
  }

  function renderBoxProteins() {
    const grid = document.getElementById('box-protein-grid');
    grid.innerHTML = BOX_PROTEINS.map((p) => radioChoiceHTML({
      group: 'box-protein', value: p.id, label: p.label, note: p.note, selected: p.id === box.protein,
    })).join('');
    grid.querySelectorAll('.radio-choice-input').forEach((input) => {
      input.addEventListener('change', () => {
        box.protein = input.value;
        box.flavors = [];
        grid.querySelectorAll('.radio-choice').forEach((row) => {
          row.classList.toggle('selected', row.querySelector('.radio-choice-input').checked);
        });
        renderBoxFlavors();
        renderBoxFooter();
      });
    });
  }

  // Up to two flavors, as the same rows as the wraps and the pack pickers (a photo, the name, what is on it), with a checkbox in place
  // of the radio or stepper. Built once per protein and updated in place, so the focused box keeps focus. A full pick never dims a
  // row: a third tap bounces back and the hint says what to do.
  function renderBoxFlavors() {
    const grid = document.getElementById('box-flavor-grid');
    const hint = document.getElementById('box-flavor-hint');
    if (!box.protein) {
      grid.innerHTML = '';
      hint.textContent = 'Choose sandwich or bowl first.';
      return;
    }
    grid.innerHTML = boxProtein().flavors.map((f) => `
      <div class="flavor-row dozen-flavor-row wrap-flavor-row box-flavor-row" data-flavor="${f.id}">
        <label class="flavor-row-head wrap-flavor-label">
          <input class="radio-choice-input" type="checkbox" name="box-flavor" value="${f.id}">
          <span class="flavor-thumb" aria-hidden="true"><img src="${f.photo || 'assets/flavors/placeholder.svg'}" alt="" width="56" height="56" loading="lazy" decoding="async"></span>
          <span class="flavor-row-name">${escapeHTML(f.label)}<small class="flavor-row-desc">${escapeHTML(f.desc)}</small></span>
          <span class="addon-row-box" aria-hidden="true">${ADDON_CHECK_ICON}</span>
        </label>
      </div>`).join('');
    grid.querySelectorAll('.radio-choice-input').forEach((input) => {
      input.addEventListener('change', () => {
        const id = input.value;
        const at = box.flavors.indexOf(id);
        if (input.checked && at < 0) {
          if (box.flavors.length >= 2) { input.checked = false; syncBoxFlavorHint(true); return; }
          box.flavors.push(id);
        } else if (!input.checked && at >= 0) box.flavors.splice(at, 1);
        syncBoxFlavorRows();
        renderBoxFooter();
      });
    });
    syncBoxFlavorRows();
  }

  function syncBoxFlavorHint(bounced) {
    const hint = document.getElementById('box-flavor-hint');
    hint.textContent = bounced ? 'Two flavors is the most. Untick one to pick another.'
      : box.flavors.length === 2 ? 'Two flavors chosen. Your boxes split evenly between them.'
      : 'Pick up to 2 flavors. Two flavors split your boxes evenly.';
  }

  function syncBoxFlavorRows() {
    document.querySelectorAll('#box-flavor-grid .box-flavor-row').forEach((row) => {
      const on = box.flavors.includes(row.dataset.flavor);
      row.classList.toggle('selected', on);
      row.querySelector('.radio-choice-input').checked = on;
    });
    syncBoxFlavorHint(false);
  }

  function renderBoxSides() {
    const grid = document.getElementById('box-sides-grid');
    grid.innerHTML = box.item.sides.map((side) => {
      const on = box.sides.has(side.id);
      const flavorPick = on && side.flavor ? `
        <label class="side-flavor">
          <span class="side-flavor-label">${side.id === 'egg-salad' ? 'Egg salad flavor' : 'Deviled egg flavor'}</span>
          <select data-side="${side.id}"><option value="">Choose a flavor</option>${CATERING_EGGS.map((f) => `<option value="${f.id}"${box.sideFlavor[side.id] === f.id ? ' selected' : ''}>${escapeHTML(f.label)}</option>`).join('')}</select>
        </label>` : '';
      return `
      <div class="side-option${flavorPick ? ' has-flavor' : ''}">
        <button class="addon-row${on ? ' selected' : ''}" type="button" role="checkbox" aria-checked="${on}" data-side="${side.id}">
          <span class="addon-row-text">
            <span class="addon-row-name">${escapeHTML(side.label)}</span>
            <span class="addon-row-note">+${money(side.price)} per box</span>
          </span>
          <span class="addon-row-box" aria-hidden="true">${on ? ADDON_CHECK_ICON : ''}</span>
        </button>${flavorPick}
      </div>`;
    }).join('');
    grid.querySelectorAll('button.addon-row').forEach((row) => {
      row.addEventListener('click', () => {
        const id = row.dataset.side;
        if (box.sides.has(id)) { box.sides.delete(id); delete box.sideFlavor[id]; } else box.sides.add(id);
        renderBoxSides();
        grid.querySelector(`button.addon-row[data-side="${id}"]`).focus();
        renderBoxFooter();
      });
    });
    grid.querySelectorAll('select[data-side]').forEach((select) => {
      select.addEventListener('change', () => {
        box.sideFlavor[select.dataset.side] = select.value;
        renderBoxFooter();
      });
    });
  }

  // The included drink: one per box, any mix, so the count has to reach the box count (RedBull is +$1 each).
  function renderBoxDrinks() {
    const block = document.getElementById('box-drinks-block');
    block.hidden = !box.item.drinks;
    if (!box.item.drinks) return;
    const have = boxDrinkCount();
    const left = box.qty - have;
    document.getElementById('box-drinks-sub').textContent = left > 0
      ? `One bottled drink per box is included. Choose ${left} more. RedBull is +${money(1)} each.`
      : `All ${box.qty} drinks chosen. Tap − to change the mix.`;
    const grid = document.getElementById('box-drinks-grid');
    grid.innerHTML = '';
    CATERING_DRINKS.choices.forEach(({ name, price }) => {
      const qty = box.drinks[name] || 0;
      const row = document.createElement('div');
      row.className = 'flavor-row dozen-flavor-row' + (qty > 0 ? ' selected' : '');
      row.innerHTML = `
        <div class="flavor-row-head">
          <span class="flavor-row-name">${escapeHTML(name)}${price ? `<small class="flavor-row-desc">+${money(price)} each</small>` : ''}</span>
          <div class="mini-stepper">
            <button class="mini-step-btn" type="button" aria-label="Remove one ${escapeHTML(name)}"${qty <= 0 ? ' disabled' : ''}>${STEP_MINUS_ICON}</button>
            <span>${qty}</span>
            <button class="mini-step-btn" type="button" aria-label="Add one ${escapeHTML(name)}"${left <= 0 ? ' disabled' : ''}>${STEP_PLUS_ICON}</button>
          </div>
        </div>`;
      const [dec, inc] = row.querySelectorAll('.mini-step-btn');
      dec.addEventListener('click', () => { box.drinks[name] = Math.max(0, qty - 1); if (!box.drinks[name]) delete box.drinks[name]; renderBoxDrinks(); renderBoxFooter(); });
      inc.addEventListener('click', () => { box.drinks[name] = qty + 1; renderBoxDrinks(); renderBoxFooter(); });
      grid.appendChild(row);
    });
  }

  // A smaller box count can leave more drinks than boxes: take the extras off the end.
  function trimBoxDrinks() {
    let over = boxDrinkCount() - box.qty;
    Object.keys(box.drinks).reverse().forEach((name) => {
      if (over <= 0) return;
      const cut = Math.min(over, box.drinks[name]);
      box.drinks[name] -= cut; over -= cut;
      if (!box.drinks[name]) delete box.drinks[name];
    });
  }

  // What still has to be chosen before the box can go in the cart, or null.
  function boxMissing() {
    if (!box.protein) return 'Choose a protein to continue';
    if (!box.flavors.length) return 'Pick a flavor to continue';
    const needFlavor = boxSides().find((side) => side.flavor && !box.sideFlavor[side.id]);
    if (needFlavor) return `Choose a flavor for your ${needFlavor.id === 'egg-salad' ? 'egg salad' : 'deviled eggs'} to continue`;
    if (box.item.drinks && boxDrinkCount() < box.qty) { const n = box.qty - boxDrinkCount(); return `Choose ${n} more drink${n === 1 ? '' : 's'} to continue`; }
    return null;
  }

  // The "Your box" panel beside the form: what's been chosen so far, in plain words.
  function renderBoxSummary() {
    const rows = [];
    if (box.protein) {
      const flavors = boxProtein().flavors;
      const split = boxSplit().map(({ id, qty }) => `${flavors.find((f) => f.id === id).label} ×${qty}`);
      rows.push([boxProtein().label.replace('Signature ', ''), split.join(', ') || 'Pick a flavor']);
    }
    rows.push(['Included', box.item.included.join(', ')]);
    const sides = boxSides();
    if (sides.length) rows.push(['Added sides', sides.map((side) => side.label).join(', ')]);
    const drinks = Object.entries(box.drinks).map(([name, n]) => `${n} ${name}`);
    if (drinks.length) rows.push(['Drinks (included)', drinks.join(', ')]);
    document.getElementById('box-summary').innerHTML = `
      <p class="box-summary-title">Your order</p>
      <dl class="box-summary-list">${rows.map(([k, v]) => `<div><dt>${escapeHTML(k)}</dt><dd>${escapeHTML(v)}</dd></div>`).join('')}</dl>
      <p class="box-summary-total"><span>${box.qty} boxes</span><strong>${money(boxUnitPrice() * box.qty + boxDrinkCost())}</strong></p>`;
  }

  function renderBoxFooter() {
    const total = boxUnitPrice() * box.qty + boxDrinkCost();
    document.getElementById('box-qty-select').value = String(box.qty);
    document.querySelectorAll('#box-qty-presets .chip').forEach((chip) => {
      const on = Number(chip.dataset.qty) === box.qty;
      chip.classList.toggle('active', on);
      chip.setAttribute('aria-checked', String(on));
    });
    document.getElementById('box-count-total').textContent = `${money(total)} total`;
    const btn = document.getElementById('add-box-to-order');
    const missing = boxMissing();
    btn.disabled = !!missing;
    btn.textContent = missing || `${box.editing ? 'Update order' : `Add ${box.qty} to order`} · ${money(total)}`;
    document.getElementById('box-modal-price').textContent = `${money(boxUnitPrice())} / box`;
    renderBoxSummary();
  }

  function openBoxModal(item, line) {
    lastFocusedEl = document.activeElement;
    // Editing refills every choice from the line's saved config; a new box starts blank at the minimum.
    const cfg = line && line.config;
    Object.assign(box, {
      item, editing: line || null,
      protein: cfg ? cfg.protein : null,
      flavors: cfg ? [...cfg.flavors] : [],
      sides: new Set(cfg ? cfg.sides : []),
      sideFlavor: cfg ? { ...cfg.sideFlavor } : {},
      drinks: cfg ? Object.fromEntries(Object.entries(cfg.drinks).filter(([name]) => CATERING_DRINKS.choices.some((c) => c.name === name))) : {},
      qty: line ? line.qty : item.minQty,
    });
    document.getElementById('box-modal-title').textContent = item.name;
    document.getElementById('box-modal-header-title').textContent = item.name;
    document.getElementById('box-modal-desc').textContent = item.desc;
    const image = document.getElementById('box-modal-image');
    image.src = item.image;
    image.alt = item.name;
    document.getElementById('box-included').innerHTML = item.included.map((i) => `<li>${escapeHTML(i)}</li>`).join('');
    document.getElementById('box-qty-help').textContent = `Minimum ${item.minQty} boxes · ${money(item.minQty * item.price)}`;
    const qtySelect = document.getElementById('box-qty-select');
    // Any count is allowed up to 200; an edited line's own count is always an option.
    const options = [...new Set([...BOX_QTY_OPTIONS, box.qty])].sort((x, y) => x - y);
    qtySelect.innerHTML = options.map((n) => `<option value="${n}">${n}</option>`).join('');

    renderBoxProteins();
    renderBoxFlavors();
    renderBoxSides();
    renderBoxDrinks();
    document.getElementById('box-note').value = cfg ? cfg.note : '';
    renderBoxFooter();
    boxModal.querySelector('.item-modal-header-title').classList.remove('visible');
    boxModalBackdrop.hidden = false;
    boxModal.hidden = false;
    boxModal.querySelector('.item-modal-scroll').scrollTop = 0;
    updateInert();
    document.getElementById('close-box-modal').focus();
  }

  function closeBoxModal() {
    boxModalBackdrop.hidden = true;
    boxModal.hidden = true;
    updateInert();
    // Cancelling an edit returns to the drawer it came from.
    if (box.editing) { box.editing = null; openCart(editingKind); return; }
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.getElementById('close-box-modal').addEventListener('click', closeBoxModal);
  boxModalBackdrop.addEventListener('click', closeBoxModal);
  document.getElementById('box-qty-select').addEventListener('change', (e) => {
    box.qty = Number(e.target.value);
    trimBoxDrinks();
    renderBoxFlavors();
    renderBoxDrinks();
    renderBoxFooter();
  });
  document.getElementById('box-qty-presets').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    box.qty = Number(chip.dataset.qty);
    trimBoxDrinks();
    renderBoxDrinks();
    renderBoxFooter();
  });

  // A box line's detail text, from its saved choices alone.
  function boxLineSub(line) {
    const cfg = line.config;
    const item = CATERING_ITEMS[cfg.itemId];
    const protein = BOX_PROTEINS.find((p) => p.id === cfg.protein);
    const n = cfg.flavors.length;
    const split = cfg.flavors.map((id, i) => `${escapeHTML(protein.flavors.find((f) => f.id === id).label)} ×${Math.floor(line.qty / n) + (i < line.qty % n ? 1 : 0)}`);
    const sides = item.sides.filter((side) => cfg.sides.includes(side.id))
      .map((side) => `+ ${escapeHTML(side.label)}${side.flavor ? ` (${escapeHTML(CATERING_EGGS.find((f) => f.id === cfg.sideFlavor[side.id]).label)})` : ''}`);
    const drinks = Object.entries(cfg.drinks).map(([name, count]) => `${count} ${escapeHTML(name)}`);
    const parts = [`${escapeHTML(protein.label.replace('Signature ', ''))}: ${split.join(', ')}`, ...sides];
    if (drinks.length) parts.push('Drinks: ' + drinks.join(', '));
    if (cfg.note) parts.push('Note: ' + escapeHTML(cfg.note));
    return parts.join(' · ');
  }

  function editCateringLine(line) {
    openBoxModal(CATERING_ITEMS[line.config.itemId], line);
  }

  // Edit reopens the modal that built the line, filled in from what the line saved.
  function findDozenProduct(id) {
    const bundle = CATERING_ITEMS[id];
    if (bundle && bundle.kind === 'bundle') return cateringBundleProduct(bundle);
    return [...DEVILED_EGGS, ...EGG_SALADS, ...PLATTERS, ...SHIPPING_KITS].find((p) => p.id === (LEGACY_OPTION[id] ? LEGACY_OPTION[id][0] : id));
  }
  // A line added before Edit existed saved only a sentence. If its product can be customized, Edit still
  // reopens that product's modal, starting blank, and saving replaces the line.
  function blankEditSpec(line) {
    const dozen = [...DEVILED_EGGS, ...EGG_SALADS, ...PLATTERS, ...SHIPPING_KITS, ...Object.values(CATERING_ITEMS).filter((i) => i.kind === 'bundle')]
      .find((p) => (p.name === line.name || (p.options || []).some((o) => o.name === line.name)) && !p.fixedFlavors && (p.pickerConfig || p.kind === 'bundle'));
    if (dozen) {
      const option = (dozen.options || []).find((o) => o.name === line.name);
      return { type: 'dozen', productId: dozen.id, optionId: option && option.id, flavorQty: {}, exclusions: {}, note: '', blank: true };
    }
    const bowl = PROTEIN_BOWLS.find((b) => b.name === line.name);
    if (bowl) return { type: 'bowl', productId: bowl.id, addOns: [], exclusions: [], options: [], blank: true };
    const bagel = BAGEL_ITEMS.find((b) => b.name === line.name);
    if (bagel || line.name === 'Full Size Bagel') return { type: 'bagel', bagelId: bagel && bagel.id, toast: 'Not Toasted', bagelType: 'Plain', flavor: null, options: [], blank: true };
    if (line.name === WRAP_PRODUCT.name || / Eggceptional Wrap$/.test(line.name)) {
      const f = WRAP_FLAVORS.find((w) => line.name.startsWith(w.label));
      return { type: 'wrap', productId: WRAP_PRODUCT.id, flavor: f ? f.id : null, addOns: [], blank: true };
    }
    return null;
  }
  const canEditLine = (line) => !!(line.config || line.edit || blankEditSpec(line));
  function editCartLine(kind, line) {
    if (!canEditLine(line)) return;
    closeCart();
    editingKind = kind;
    if (line.config) { editCateringLine(line); return; }
    if (!line.edit) line.edit = blankEditSpec(line);
    const e = line.edit;
    if (LEGACY_OPTION[e.productId] && !e.optionId) e.optionId = LEGACY_OPTION[e.productId][1];
    const priced = (p) => (kind === 'delivery' && !line.catering ? deliveryPriced(p) : p);
    if (e.type === 'dozen') openDozenModal(priced(findDozenProduct(e.productId)), line);
    else if (e.type === 'bowl') openBowlModal(priced(PROTEIN_BOWLS.find((b) => b.id === e.productId)), line);
    else if (e.type === 'bagel') openBagelModal(priced(bagelFor(line)), line);
    else if (e.type === 'wrap') openWrapModal(priced(WRAP_PRODUCT), line);
  }

  // Duplicate puts a copy right under the original, same choices, as its own line so one copy can be changed.
  // A box meal keeps its box count (there is a ten-box minimum); everything else starts at one.
  let freshLineKey = null;
  function duplicateCartLine(kind, index) {
    const copy = JSON.parse(JSON.stringify(state.carts[kind][index]));
    copy.key = `${copy.key}-copy-${Date.now()}`;
    if (!copy.config) copy.qty = 1;
    state.carts[kind].splice(index + 1, 0, copy);
    freshLineKey = copy.key;
    persistCart();
    renderCartBadge();
    renderDrawer();
    const row = document.querySelector(`#drawer-items .drawer-line[data-key="${CSS.escape(copy.key)}"]`);
    if (row) { row.scrollIntoView({ block: 'nearest' }); row.querySelector('.drawer-link').focus({ preventScroll: true }); }
  }

  document.getElementById('add-box-to-order').addEventListener('click', () => {
    if (boxMissing()) return;
    const config = {
      type: 'box', itemId: box.item.id, protein: box.protein, flavors: [...box.flavors],
      sides: [...box.sides], sideFlavor: { ...box.sideFlavor }, drinks: { ...box.drinks },
      note: document.getElementById('box-note').value.trim(),
    };
    const fields = { price: boxUnitPrice(), extra: boxDrinkCost(), qty: box.qty, config };
    if (box.editing) {
      // Update the line where it sits; no add flight, back to the drawer.
      Object.assign(box.editing, fields);
      persistCart();
      renderCartBadge();
      closeBoxModal();
      return;
    }
    if (cateringAddBlocked(boxModal)) return;
    addToCart({
      cart: cateringCart(),
      catering: true,
      key: `box-${box.item.id}-${Date.now()}`,
      name: box.item.name,
      minQty: box.item.minQty,
      image: box.item.image,
      ...fields,
    });
    celebrateAdd(boxModal, closeBoxModal, box.item.image, box.qty);
  });

  // ---------- Cart drawer ----------
  const cartBackdrop = document.getElementById('cart-backdrop');
  const cartDrawer = document.getElementById('cart-drawer');
  let cartCloseTimer = null;

  // The drawer opens on the cart that belongs to the page the customer is on
  // (or the one a checkout's back link names); if that one is empty it opens
  // on the first cart that has something in it.
  function defaultDrawerCart() {
    const here = !views.shipping.hidden ? 'shipping' : !views.catering.hidden ? cateringCart() : orderKind();
    if (state.carts[here].length) return here;
    return CART_KINDS.find((k) => state.carts[k].length) || here;
  }

  function openCart(kind) {
    if (cartCloseTimer) { window.clearTimeout(cartCloseTimer); cartCloseTimer = null; }
    lastFocusedEl = document.activeElement;
    state.drawerCart = CART_KINDS.includes(kind) ? kind : defaultDrawerCart();
    hideDrawerUndo();
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

  const taxableSubtotal = (kind) => state.carts[kind].reduce((sum, item) => sum + lineTotal(item), 0);

  function computeTotals() {
    const subtotal = cartSubtotal('pickup');
    const tax = taxableSubtotal('pickup') * TAX_RATE;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }

  const DRAWER_EMPTY = {
    pickup: 'Your cart is empty. Add something delicious from the menu.',
    shipping: 'No shipping kits yet. Add one from Nationwide Shipping.',
    delivery: 'Your cart is empty. Add something delicious from the menu.',
  };
  const DRAWER_NOTE = {
    shipping: 'Shipping and handling are worked out from your address at checkout.',
    delivery: 'Delivery fee, tip and tax are added at checkout.',
  };

  function drawerContextHTML(kind) {
    if (kind === 'shipping') return 'Ships nationwide · you choose a holiday window at checkout';
    if (kind === 'delivery') return state.delivery && state.delivery.street ? `Delivering to <strong>${escapeHTML(deliveryLabel())}</strong>` : 'Delivery';
    return `Pickup at <strong>${state.location}</strong>`;
  }

  // One tab per cart that has something in it (plus the one being viewed).
  // With only one such cart there is nothing to switch between, so the tabs
  // disappear and the drawer looks as it always did.
  function renderCartTabs() {
    const tabs = document.getElementById('cart-tabs');
    const kinds = CART_KINDS.filter((k) => state.carts[k].length || k === state.drawerCart);
    tabs.hidden = kinds.length < 2;
    tabs.innerHTML = kinds.map((k) => `
      <button class="chip cart-tab${k === state.drawerCart ? ' active' : ''}" id="cart-tab-${k}" type="button" role="tab" data-cart="${k}"
        aria-selected="${k === state.drawerCart}" aria-controls="drawer-items" tabindex="${k === state.drawerCart ? 0 : -1}">
        ${CART_LABELS[k]}<span class="cart-tab-count" aria-label="${cartCount(k)} items">${cartCount(k)}</span>
      </button>`).join('');
  }

  document.getElementById('cart-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.cart-tab');
    if (!tab) return;
    state.drawerCart = tab.dataset.cart;
    renderDrawer();
    document.getElementById('cart-tab-' + state.drawerCart).focus();
  });

  document.getElementById('cart-tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = [...document.querySelectorAll('#cart-tabs .cart-tab')];
    const i = tabs.findIndex((t) => t.dataset.cart === state.drawerCart);
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    e.preventDefault();
    next.click();
  });


  // Removing a line is undoable for a few seconds: the drawer says so, and puts the line back where it was.
  let drawerUndo = null;
  let drawerUndoTimer = null;
  function hideDrawerUndo() {
    window.clearTimeout(drawerUndoTimer);
    drawerUndo = null;
    document.getElementById('drawer-undo').hidden = true;
  }
  function removeCartLine(kind, index) {
    const [item] = state.carts[kind].splice(index, 1);
    persistCart();
    renderCartBadge();
    drawerUndo = { kind, index, item };
    window.clearTimeout(drawerUndoTimer);
    drawerUndoTimer = window.setTimeout(hideDrawerUndo, 8000);
    renderDrawer();
    const bar = document.getElementById('drawer-undo');
    document.getElementById('drawer-undo-text').textContent = `Removed ${item.name}.`;
    bar.hidden = false;
  }
  document.getElementById('drawer-undo-btn').addEventListener('click', () => {
    if (!drawerUndo) return;
    const { kind, index, item } = drawerUndo;
    state.carts[kind].splice(Math.min(index, state.carts[kind].length), 0, item);
    state.drawerCart = kind;
    hideDrawerUndo();
    persistCart();
    renderCartBadge();
    renderDrawer();
  });

  const MAX_LINE_QTY = 100;

  function renderDrawer() {
    // Emptying the cart being viewed moves on to the next one that has items.
    if (!state.carts[state.drawerCart].length) {
      const other = CART_KINDS.find((k) => state.carts[k].length);
      if (other) state.drawerCart = other;
    }
    const kind = state.drawerCart;
    const items = state.carts[kind];
    const list = document.getElementById('drawer-items');
    list.innerHTML = '';
    list.setAttribute('aria-labelledby', 'cart-tab-' + kind);
    list.setAttribute('role', 'tabpanel');
    renderCartTabs();

    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-cart';
      empty.textContent = DRAWER_EMPTY[kind];
      list.appendChild(empty);
    }

    items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'drawer-item drawer-line' + (item.key === freshLineKey ? ' is-fresh' : '');
      row.dataset.key = item.key;
      const thumb = productThumb(item);
      thumb.style.width = '56px';
      thumb.style.height = '56px';
      row.appendChild(thumb);

      const name = escapeHTML(item.name);
      const main = document.createElement('div');
      main.className = 'drawer-line-main';
      // Quantity is a dropdown from 1 to 100. Box meals keep a plain count instead (their flavor split depends on
      // the box count, so it changes in Edit, with the ten-box minimum).
      const qtyControl = item.config
        ? `<span class="drawer-item-qty">${item.qty} ${item.qty === 1 ? 'box' : 'boxes'}</span>`
        : `<label class="drawer-qty"><span>Qty</span><select class="drawer-qty-select" aria-label="Quantity of ${name}">${
            Array.from({ length: MAX_LINE_QTY }, (_, i) => `<option value="${i + 1}"${i + 1 === item.qty ? ' selected' : ''}>${i + 1}</option>`).join('')
          }</select></label>`;
      main.innerHTML = `
        <div class="drawer-line-top"><span class="drawer-item-name">${name}</span><span class="item-price">${money(lineTotal(item))}</span></div>
        ${lineSub(item) ? `<span class="drawer-item-sub">${lineSub(item)}</span>` : ''}
        <div class="drawer-line-qty">${qtyControl}</div>
        <div class="drawer-line-foot">
          <div class="drawer-line-links">
            ${canEditLine(item) ? `<button class="drawer-link" type="button" data-act="edit" aria-label="Edit ${name}">Edit</button>` : ''}
            <button class="drawer-link" type="button" data-act="duplicate" aria-label="Duplicate ${name}">Duplicate</button>
            <button class="drawer-link" type="button" data-act="remove" aria-label="Remove ${name}">Remove</button>
          </div>
        </div>`;
      main.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        if (btn.dataset.act === 'edit') editCartLine(kind, item);
        else if (btn.dataset.act === 'duplicate') duplicateCartLine(kind, index);
        else if (btn.dataset.act === 'remove') removeCartLine(kind, index);
      });
      main.addEventListener('change', (e) => {
        const select = e.target.closest('.drawer-qty-select');
        if (!select) return;
        item.qty = Number(select.value);
        persistCart();
        renderCartBadge();
        renderDrawer();
        // The drawer redraws on every change; keep the customer on the control they just used.
        const again = document.querySelector(`#drawer-items .drawer-line[data-key="${CSS.escape(item.key)}"] .drawer-qty-select`);
        if (again) again.focus({ preventScroll: true });
      });
      row.appendChild(main);
      list.appendChild(row);
    });
    freshLineKey = null;

    // Every cart shows a subtotal here and says what checkout adds (tax and tip, plus a delivery fee or shipping): a "Total" that
    // left out the tip would not match the one at checkout.
    document.getElementById('drawer-total-label').textContent = 'Subtotal';
    document.getElementById('drawer-total').textContent = money(cartSubtotal(kind));
    const note = document.getElementById('drawer-total-note');
    // Delivery has a minimum: below it the note says how much is missing, and checkout waits.
    const short = kind === 'delivery' ? Math.max(0, DELIVERY_MINIMUM - cartSubtotal('delivery')) : 0;
    const cateringNote = kind === 'pickup' || kind === 'delivery' ? cateringBagNote(kind) : '';
    note.hidden = items.length === 0;
    note.textContent = short > 0 ? `Add ${money(short)} to reach the ${money(DELIVERY_MINIMUM)} delivery minimum.` : cateringNote || DRAWER_NOTE[kind] || '';

    const totalQty = cartCount(kind);
    document.getElementById('drawer-item-count').textContent = `(${totalQty} item${totalQty === 1 ? '' : 's'})`;

    document.getElementById('fulfillment-chip').innerHTML = drawerContextHTML(kind);

    document.getElementById('go-to-checkout').disabled = items.length === 0 || short > 0;
  }

  // ---------- View switching ----------
  const views = {
    home: document.getElementById('view-home'),
    'location-picker': document.getElementById('view-location-picker'),
    menu: document.getElementById('view-menu'),
    order: document.getElementById('view-order'),
    checkout: document.getElementById('view-checkout'),
    confirmation: document.getElementById('view-confirmation'),
    shipping: document.getElementById('view-shipping'),
    catering: document.getElementById('view-catering'),
    contact: document.getElementById('view-contact'),
    flavors: document.getElementById('view-flavors'),
    'gift-cards': document.getElementById('view-gift-cards'),
    about: document.getElementById('view-about'),
    franchise: document.getElementById('view-franchise'),
    'egg-bar': document.getElementById('view-egg-bar'),
    'corporate-gifting': document.getElementById('view-corporate-gifting'),
    'corporate-gift-order': document.getElementById('view-corporate-gift-order'),
    'shipping-returns': document.getElementById('view-shipping-returns'),
    privacy: document.getElementById('view-privacy'),
    terms: document.getElementById('view-terms'),
    'ship-checkout': document.getElementById('view-ship-checkout'),
    'delivery-checkout': document.getElementById('view-delivery-checkout'),
    'gift-checkout': document.getElementById('view-gift-checkout'),
  };
  // Each cart checks out on its own page; all of them swap the site header for the checkout header.
  const CHECKOUT_VIEWS = ['checkout', 'ship-checkout', 'delivery-checkout', 'gift-checkout'];
  const CHECKOUT_VIEW_FOR = { pickup: 'checkout', delivery: 'delivery-checkout', shipping: 'ship-checkout' };
  const PAGE_FOR_CART = { pickup: 'order', delivery: 'order', shipping: 'shipping' };

  // Each page names itself in the browser tab (and to screen readers when the page changes).
  const SITE_NAME = 'Deviled Egg Co.';
  const PAGE_TITLES = {
    home: 'Deviled Egg Co. — Order Online',
    'location-picker': `Our locations — ${SITE_NAME}`,
    menu: `Menu — ${SITE_NAME}`,
    order: `Order pickup — ${SITE_NAME}`,
    shipping: `Nationwide Shipping — ${SITE_NAME}`,
    catering: `Catering — ${SITE_NAME}`,
    contact: `Contact us — ${SITE_NAME}`,
    flavors: `Flavors — ${SITE_NAME}`,
    'gift-cards': `Gift cards — ${SITE_NAME}`,
    about: `About us — ${SITE_NAME}`,
    franchise: `Franchise — ${SITE_NAME}`,
    'egg-bar': `Deviled egg bar request — ${SITE_NAME}`,
    'corporate-gifting': `Corporate gifting — ${SITE_NAME}`,
    'corporate-gift-order': `Corporate gift order — ${SITE_NAME}`,
    'shipping-returns': `Shipping & returns — ${SITE_NAME}`,
    privacy: `Privacy policy — ${SITE_NAME}`,
    terms: `Terms & conditions — ${SITE_NAME}`,
    'delivery-checkout': `Secure Checkout, Delivery — ${SITE_NAME}`,
    checkout: `Secure Checkout — ${SITE_NAME}`,
    'ship-checkout': `Secure Checkout, Nationwide Shipping — ${SITE_NAME}`,
    'gift-checkout': `Secure Checkout, Gift card — ${SITE_NAME}`,
    confirmation: `Order confirmed — ${SITE_NAME}`,
  };

  // The menu cards show delivery prices while delivery is being ordered; they are drawn again when that changes.
  let gridsPricedFor = 'pickup';
  function refreshGridPrices() {
    const kind = orderKind();
    if (kind === gridsPricedFor) return;
    gridsPricedFor = kind;
    renderGrids();
  }
  function showView(name) {
    // The pickup order page is the Pickup funnel's third step: without a chosen store, day and time, start the funnel
    // instead. The products page (#menu) stays open to everyone.
    // The Delivery funnel's order page asks the same of its own session.
    if (name === 'order') {
      if (state.orderMode === 'delivery') { if (!deliverySessionValid()) { startDelivery(); return; } }
      else if (!pickupSessionValid()) { startFunnel('pickup'); return; }
    }
    Object.entries(views).forEach(([key, el]) => { el.hidden = key !== name; });
    document.title = PAGE_TITLES[name] || PAGE_TITLES.home;
    // The menu page is also each store's own page (#store/<id>): then it is about that store.
    if (name === 'menu') {
      if (!location.hash.startsWith('#store/')) state.viewStore = null;
      renderStoreHeadings();
      if (state.viewStore) document.title = `${storeName(storeById(state.viewStore))} — ${SITE_NAME}`;
    }
    if (name === 'order') { renderNavWhere(); showOrderTiles(); }
    if (name === 'shipping') setShipVersion(shipVersion);
    if (name === 'flavors') renderFlavorsPage();
    if (name === 'about') renderAboutFlavors();
    if (name === 'about') { initAboutHero(); initAboutValues(); }
    if (name === 'gift-cards') replayGiftStrip();
    if (name === 'gift-cards') syncGiftCard();
    if (name === 'shipping-returns' || name === 'privacy' || name === 'terms') views[name].dispatchEvent(new Event('pol:shown'));
    if (name === 'delivery-checkout') setSummaryOpen(document.getElementById('dc-toggle-summary'), true);
    if (name === 'gift-checkout') setSummaryOpen(document.getElementById('gk-toggle-summary'), true);
    if (name === 'checkout') renderCheckoutMap('pickup');
    if (name === 'delivery-checkout') renderCheckoutMap('delivery');
    document.body.classList.toggle('is-checkout', CHECKOUT_VIEWS.includes(name));
    syncSiteFooter(name);
    renderNavWhere();
    // The order summary opens expanded at every width; the customer can fold it.
    if (name === 'checkout') setOrderSummaryOpen(true);
    if (name === 'location-picker') { syncPickerSaved(); loadLocationPicker(); }
    // The two top-level pages the header links to; checkout/confirmation
    // aren't reachable from the nav so they leave it unmarked.
    document.querySelectorAll('#nav-links a[data-view]').forEach((link) => {
      if (link.dataset.view === (name === 'menu' && state.viewStore ? 'location-picker' : name)) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    // A group is current when one of its pages is open.
    document.querySelectorAll('#nav-links .nav-group').forEach((group) => {
      const btn = group.querySelector('.nav-group-btn');
      if (group.querySelector('a[aria-current="page"]')) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    updateCartBar();
    syncHeroVideos();
    updateBarReveal();
    syncPageHash(name);
    refreshGridPrices();
    if (window.degLocationPicker && window.degLocationPicker.sync) window.degLocationPicker.sync();
  }

  // The URL names the page on screen (#shipping, #menu, …), so a reload or a shared link lands where the
  // customer is. Checkout and confirmation keep the page they came from. Home is the bare URL.
  const PAGE_VIEWS = ['home', 'location-picker', 'menu', 'order', 'shipping', 'catering', 'contact', 'flavors', 'gift-cards', 'about', 'franchise', 'egg-bar', 'corporate-gifting', 'corporate-gift-order', 'shipping-returns', 'privacy', 'terms', 'checkout', 'ship-checkout', 'delivery-checkout', 'gift-checkout', 'confirmation'];
  // Checkout and confirmation have addresses of their own: reached from a page they are pushed onto the history, so
  // Back returns to that page; a link to one with nothing to check out goes back to the page its cart belongs to.
  const PAGE_HASH_OF = { checkout: '#checkout', 'ship-checkout': '#checkout/shipping', 'delivery-checkout': '#checkout/delivery', 'gift-checkout': '#checkout/gift', confirmation: '#confirmation' };
  // Going to a page on purpose adds a history entry, so Back returns to the page the customer came from (Home, a store page, the
  // menu). Replacing is only for tidying the address while the app starts up, or after a redirect.
  let pageHistoryReady = false;
  function pushPage(hash) {
    if ((location.hash || '') === (hash || '')) return;
    history.pushState(null, '', location.pathname + location.search + hash);
  }
  function syncPageHash(name) {
    if (!PAGE_VIEWS.includes(name)) return;
    // #order/<group> is the order page too (see openOrderGroup).
    if (name === 'order' && location.hash.startsWith('#order')) return;
    if (name === 'menu' && location.hash.startsWith('#store/')) return;
    const want = name === 'home' ? '' : (PAGE_HASH_OF[name] || '#' + name);
    if (location.hash === want || (name === 'home' && (location.hash === '' || location.hash === '#home'))) return;
    const url = location.pathname + location.search + want;
    if (CHECKOUT_VIEWS.includes(name) || pageHistoryReady) history.pushState(null, '', url);
    else history.replaceState(null, '', url);
  }

  // ---------- Hero videos ----------
  // Each hero video (Home's, and the products page's) downloads and plays only while its own page is showing,
  // and not at all under reduced motion, where the first frame stays still.
  const heroVideos = [...document.querySelectorAll('video[data-hero-src]')];
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function syncHeroVideos() {
    heroVideos.forEach((video) => {
      const shown = !views[video.dataset.view].hidden;
      if (shown && !video.getAttribute('src')) video.src = video.dataset.heroSrc;
      if (shown && !reduceMotionQuery.matches) video.play().catch(() => {});
      else video.pause();
    });
  }
  reduceMotionQuery.addEventListener('change', syncHeroVideos);
  // Pointing at either tile starts loading the map the "where" modal shows.
  document.querySelectorAll('[data-home-go="pickup"], [data-home-go="delivery"]').forEach((tile) => {
    ['pointerenter', 'touchstart', 'focus'].forEach((type) => tile.addEventListener(type, () => loadLeaflet().catch(() => {}), { once: true, passive: true }));
  });

  // The logo is the way home; the tiles are the front doors to each order path.
  const goHome = () => {
    pushPage('');
    showView('home');
  };
  // Two logos, one shown at a time: the wordmark, and on phones the egg submark (the checkout bar keeps the wordmark).
  document.querySelectorAll('.site-header .logo').forEach((siteLogo) => {
    siteLogo.addEventListener('click', goHome);
    siteLogo.addEventListener('keydown', (e) => { if (e.key === 'Enter') goHome(); });
  });

  // ---------- A store's own page ----------
  // The menu page, with its banner, store card and menu, is every real store's page: #store/<id>. The finder's cards
  // open it. Browsing is open to everyone; a tapped card does not open there but on the order page (see gateFulfillment).
  function showStorePage(id) {
    if (!storeById(id)) { history.replaceState(null, '', '#location-picker'); showView('location-picker'); return; }
    state.viewStore = id;
    showView('menu');
  }
  document.getElementById('store-back').addEventListener('click', (e) => {
    e.preventDefault();
    history.pushState(null, '', '#location-picker');
    showView('location-picker');
  });
  let pendingStoreOpen = null;
  // A card tapped on a store page (or the products page) leads to the order page, with that item open there. With no
  // valid pickup or delivery yet, the "where" modal comes first, on the path last used, with this store selected. A
  // pickup set for another store asks there before switching; a valid order for this store goes straight on.
  // `target` is the item's place on the order page (orderTargetFor); without one the item opens where it was tapped.
  function gateFulfillment(resume, target) {
    if (views.menu.hidden) return false;
    const delivery = state.orderMode === 'delivery';
    const go = target ? () => openOnOrderPage(target) : resume;
    if (delivery ? deliverySessionValid() : pickupSessionValid()) {
      const otherStore = !delivery && state.viewStore && state.viewStore !== currentStoreId();
      if (!otherStore) {
        if (!target) return false;
        go();
        return true;
      }
    }
    pendingStoreOpen = go;
    openWhere(delivery ? 'delivery' : 'pickup', { returnTo: 'store', store: state.viewStore || currentStoreId() });
    return true;
  }
  // The end of a store page tap: the order page on the item's group, with the item open and its row behind it to come
  // back to. It is pushed, so Back returns to the store page. `null` lands on the order page's tiles.
  function openOnOrderPage(target) {
    intentBeforeFunnel = null;
    funnelForCatering = false;
    if (cateringIntent) setCateringIntent(false);
    const g = target && target.group;
    const single = g && orderGroupSingle(g);
    history.pushState(null, '', g && !single ? '#order/' + g.id : '#order');
    showView('order');
    if (views.order.hidden || !g) return;
    if (!single) openOrderGroup(g.id, { push: false });
    if (!target.item) { window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' }); return; }
    requestAnimationFrame(() => {
      const opener = single ? document.querySelector(`.order-tile[data-group="${g.id}"]`) : document.querySelector(`#order-rows .order-row[data-item="${target.item.id}"]`);
      if (opener) { opener.scrollIntoView({ block: 'center' }); opener.focus({ preventScroll: true }); }
      if (single) single(); else openMenuItem(target.item, g.keyPrefix, g.cartCategory);
    });
  }
  // Walking away from a funnel step (its close button, the backdrop, Escape) drops the store page tap waiting on it, so
  // it never opens later when some other funnel finishes.
  function dropStoreIntent() {
    pendingStoreOpen = null;
    cateringTap = false;
    if (funnelReturn === 'store') funnelReturn = null;
    if (deliveryReturn === 'store') deliveryReturn = null;
  }
  // The Catering page is open to everyone, but its items go into the pickup or delivery bag: with none chosen yet, the
  // "where" modal opens first and the item opens once it is done.
  // Catering needs notice (see CATERING_NOTICE_MIN), so from the tap on, the steps offer only times that meet it. With no valid
  // session the "where" modal comes first; with one whose time is too soon only the day and time are asked again, for the same store
  // or address. A valid session that meets the notice opens the item at once. The customer stays on the Catering page.
  function gateCatering(resume) {
    // On the Catering page, and on the order page's Catering group (where a session always exists, so only a too-soon time can arise).
    if (views.catering.hidden && views.order.hidden) return false;
    const delivery = state.orderMode === 'delivery';
    const kind = delivery ? 'delivery' : 'pickup';
    const chosen = delivery ? deliverySessionValid() : pickupSessionValid();
    if (chosen && slotMeetsLead(kind, CATERING_NOTICE_MIN[kind])) return false;
    cateringTap = true;
    pendingStoreOpen = resume;
    if (!chosen) { openWhere(kind, { returnTo: 'store' }); return true; }
    // Too soon: the same modal as "Change time", finishing on the item instead of staying put.
    funnelReturn = 'store';
    deliveryReturn = 'store';
    if (delivery) { openLocationDetails(null, { edit: true, kind: 'delivery', thenOrder: true }); return true; }
    const st = PICKUP_STORES.find((x) => storeName(x) === state.location);
    if (st) openLocationDetails(st, { edit: true, thenOrder: true }); else openWhere('pickup', { returnTo: 'store' });
    return true;
  }
  function resumeStorePage() {
    const resume = pendingStoreOpen;
    pendingStoreOpen = null;
    cateringTap = false;
    if (resume) resume();
  }
  // The time chosen can pass, or be too soon for catering, while an item is open. The add then stops with a line in the modal's footer
  // and a button that opens the time step on top of it; once a time is saved the line goes and Add works again.
  function clearCateringTimeNotes() {
    document.querySelectorAll('.catering-time-note').forEach((n) => { n.hidden = true; });
  }
  function cateringAddBlocked(modal) {
    const kind = cateringCart();
    const valid = kind === 'delivery' ? deliverySessionValid() : pickupSessionValid();
    const footer = modal.querySelector('.item-modal-footer');
    let note = footer.querySelector('.catering-time-note');
    if (valid && slotMeetsLead(kind, CATERING_NOTICE_MIN[kind])) { if (note) note.hidden = true; return false; }
    if (!note) {
      note = document.createElement('div');
      note.className = 'catering-time-note';
      note.setAttribute('role', 'alert');
      note.innerHTML = '<span></span><button class="text-btn" type="button">Choose a new time</button>';
      note.querySelector('button').addEventListener('click', () => {
        cateringTap = true;
        if (kind === 'delivery') { openLocationDetails(null, { edit: true, kind: 'delivery' }); return; }
        const st = PICKUP_STORES.find((x) => storeName(x) === state.location);
        if (st) openLocationDetails(st, { edit: true });
      });
      footer.prepend(note);
    }
    note.querySelector('span').textContent = valid ? `That time is too soon for catering. It needs ${cateringNoticeText(kind)}.` : 'That time has passed.';
    note.hidden = false;
    return true;
  }

  // ----- Store info: a card with the store on a map, its address, hours, delivery terms and directions -----
  const siBackdrop = document.getElementById('si-backdrop');
  const siModal = document.getElementById('si-modal');
  const infoStore = () => (state.viewStore ? storeById(state.viewStore) : PICKUP_STORES.find((st) => storeName(st) === state.location)) || PICKUP_STORES[0];
  function openStoreInfo() {
    const st = infoStore();
    const name = storeName(st);
    const address = STORE_ADDRESSES[name];
    lastFocusedEl = document.activeElement;
    document.getElementById('si-title').textContent = name;
    document.getElementById('si-address').textContent = address;
    document.getElementById('si-copy').dataset.address = address;
    document.getElementById('si-hours').textContent = storeHoursText().text;
    document.getElementById('si-delivery').textContent = `${money(DELIVERY_FEE)} delivery fee · ${money(DELIVERY_MINIMUM)} minimum`;
    document.getElementById('si-directions').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    const toggle = document.getElementById('si-hours-toggle');
    toggle.setAttribute('aria-expanded', 'false');
    document.getElementById('si-hours-detail').hidden = true;
    siBackdrop.hidden = false;
    siModal.hidden = false;
    updateInert();
    document.getElementById('si-close').focus();
    placePinMap('store-info', document.getElementById('si-map'), { lat: st.lat, lng: st.lng, html: storePinHTML(false, false), size: [36, 44] }, 0);
  }
  function closeStoreInfo() {
    siBackdrop.hidden = true;
    siModal.hidden = true;
    updateInert();
    if (lastFocusedEl) lastFocusedEl.focus();
  }
  document.querySelector('.store-info-btn').addEventListener('click', openStoreInfo);
  document.getElementById('si-close').addEventListener('click', closeStoreInfo);
  siBackdrop.addEventListener('click', closeStoreInfo);
  document.getElementById('si-hours-toggle').addEventListener('click', (e) => {
    const open = e.currentTarget.getAttribute('aria-expanded') !== 'true';
    e.currentTarget.setAttribute('aria-expanded', String(open));
    document.getElementById('si-hours-detail').hidden = !open;
  });
  document.getElementById('si-copy').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    try { await navigator.clipboard.writeText(btn.dataset.address); } catch (err) { /* clipboard unavailable: the address is on screen to select */ }
    const status = document.getElementById('si-copy-status');
    status.textContent = 'Address copied';
    window.setTimeout(() => { status.textContent = ''; }, 2000);
  });
  // Delivery from this store: the row opens the "where" modal on its Delivery tab, and the order page once it is done.
  document.getElementById('si-delivery-btn').addEventListener('click', () => {
    closeStoreInfo();
    pendingStoreOpen = () => openOnOrderPage(null);
    openWhere('delivery', { returnTo: 'store', store: state.viewStore });
  });

  // ---------- Order funnels ----------
  // A funnel is one way of ordering, start to finish. Each one names the words the location picker uses while
  // it serves that funnel, and what choosing a store does next. Only Pickup exists so far; Delivery, Shipping and
  // Catering have their own entry points and do not use the picker yet.
  const FUNNELS = {
    pickup: {
      title: 'Where will you pick up?',
      pickLabel: 'Pick up here',
      pickedLabel: 'Your pickup store',
      savedTitle: 'Continue your pickup order',
      continueLabel: 'Continue to menu',
      changeLabel: 'Change time',
      // Choosing a store opens its details (day and time); the order starts from there, not from the pick.
      onPick: (store) => openLocationDetails(store),
    },
  };
  let activeFunnel = null;

  // `returnTo` is the page to go back to once the funnel finishes (checkout, when it was opened from there);
  // without it the funnel ends on the pickup order page.
  let funnelReturn = null;
  function startFunnel(name, { returnTo = null } = {}) {
    activeFunnel = name;
    // Pickup now starts in the "where" modal (the Pickup tab), over whatever page the customer is on. The old
    // location picker page is no longer part of the funnel.
    openWhere('pickup', { returnTo });
  }

  // The picker's work is done: back to checkout if the customer came from there, otherwise on to the order page.
  function finishPickerFunnel() {
    const back = funnelReturn;
    funnelReturn = null;
    setOrderMode('pickup');
    if (back === 'store') { resumeStorePage(); return; }
    if (back === 'nav') {
      // Changed from the nav: stay on the page; an order that was on delivery comes along.
      const moved = wm.origin === 'delivery' ? moveCart('delivery', 'pickup') : 0;
      renderNavWhere();
      announceNav(moved ? 'Your order moved to pickup.' : 'Pickup updated.');
      return;
    }
    if (back === 'checkout') {
      // Switching from the delivery checkout: the order comes along.
      const moved = checkoutCart === 'delivery' ? moveCart('delivery', 'pickup') : 0;
      checkoutCart = 'pickup';
      renderCheckout();
      showView('checkout');
      if (moved) announceCheckout('Your order moved to pickup.');
      return;
    }
    landOnOrderPage();
  }

  // The funnel's last step: the order page, opened on the Catering group for a customer who came in to order catering.
  function landOnOrderPage() {
    intentBeforeFunnel = null;
    const toCatering = cateringIntent && funnelForCatering;
    funnelForCatering = false;
    // A catering flag left over from a funnel that never finished must not send this customer to Catering.
    if (cateringIntent && !toCatering) setCateringIntent(false);
    if (toCatering) {
      pushPage('#order/catering');
      showView('order');
      openOrderGroup('catering', { push: false });
      return;
    }
    pushPage('#order');
    showView('order');
  }

  // "Continue" on the picker's saved order: carry on with the store, day and time already chosen.
  if (window.degLocationPicker) {
    window.degLocationPicker.onContinue = finishPickerFunnel;
    window.degLocationPicker.onChangeTime = (store) => openLocationDetails(store, { edit: true, thenOrder: true });
  }

  // A store chosen in the picker goes to whichever funnel opened it. A picker opened by a link (#location-picker)
  // with no funnel started belongs to Pickup, the only funnel there is.
  if (window.degLocationPicker) {
    window.degLocationPicker.onPick = (store) => FUNNELS[activeFunnel || 'pickup'].onPick(store);
    // A real store's card opens that store's own page.
    window.degLocationPicker.onOpenStore = (id) => { history.pushState(null, '', '#store/' + id); showStorePage(id); };
  }

  function goFromHome(path) {
    // Catering starts the same funnel as Pickup (the "where" modal), with catering's notice applied; it ends on the
    // order page's Catering group.
    intentBeforeFunnel = cateringIntent;
    if (path === 'catering') { setCateringIntent(true); startFunnel('pickup'); funnelForCatering = true; return; }
    setCateringIntent(false);
    if (path === 'shipping') {
      pushPage('#' + path);
      showView(path);
      return;
    }
    // "Order delivery" opens the Delivery funnel's address step; "Order pickup" the Pickup funnel's store picker.
    if (path === 'delivery') { startDelivery(); return; }
    startFunnel(path);
  }

  // The location picker's "Nationwide Shipping" link for searches with no store nearby.
  if (window.degLocationPicker) {
    window.degLocationPicker.onNavigate = (page) => {
      pushPage('#' + page);
      showView(page);
    };
  }

  document.getElementById('view-home').addEventListener('click', (e) => {
    const go = e.target.closest('[data-home-go]');
    if (!go) return;
    e.preventDefault();
    goFromHome(go.dataset.homeGo);
  });

  // ---------- Content pages (Nationwide Shipping, Catering) ----------
  // Header links with a data-view switch pages; the hash (#shipping,
  // #catering) makes each page deep-linkable and keeps the browser's back
  // button honest.
  // The page a bare URL opens is Home; the menu has its own address now.
  const PAGE_HASHES = { '#home': 'home', '#location-picker': 'location-picker', '#menu': 'menu', '#order': 'order', '#shipping': 'shipping', '#catering': 'catering', '#contact': 'contact', '#flavors': 'flavors', '#gift-cards': 'gift-cards', '#about': 'about', '#franchise': 'franchise', '#egg-bar': 'egg-bar', '#corporate-gifting': 'corporate-gifting', '#corporate-gift-order': 'corporate-gift-order', '#shipping-returns': 'shipping-returns', '#privacy': 'privacy', '#terms': 'terms', '#checkout': 'checkout', '#confirmation': 'order' };
  navLinksEl.addEventListener('click', (e) => {
    // "Pickup & Delivery" links nowhere for now (like the Home "Order delivery" tile): the click does nothing.
    // "Pickup & Delivery" opens the "where" modal, like the Home tiles, on the tab it was last on.
    if (e.target.closest('[data-open-where]')) { e.preventDefault(); intentBeforeFunnel = cateringIntent; setCateringIntent(false); openWhere(wm.tab); return; }
    const link = e.target.closest('a[data-view]');
    if (!link) return;
    e.preventDefault();
    const name = link.dataset.view;
    pushPage(name === 'home' ? '' : '#' + name);
    showView(name);
  });
  // Refreshing always starts over at Home. A link opened fresh (a bookmark, a shared #shipping) still goes
  // where it points, but a reload must not strand the customer on whichever page they last visited.
  // The first page is chosen at the very end of the script, once the saved pickup choice has been read back
  // (the pickup menu needs it), so that `#menu` links and refreshes behave.
  function openFirstPage() {
    const navEntry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (navEntry && navEntry.type === 'reload' && location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    routeFromHash();
  }
  // "#order/deviled-eggs" is the order page opened on that group's screen.
  function routeFromHash() {
    // Back with an item open (on the order page after a store page tap, say) closes it with the page it belonged to.
    if (!itemModal.hidden) closeDozenModal();
    if (!bagelModal.hidden) closeBagelModal();
    if (!bowlModal.hidden) closeBowlModal();
    if (!wrapModal.hidden) closeWrapModal();
    if (!quickviewModal.hidden) closeQuickviewModal();
    const [base, group] = location.hash.split('/');
    // The address checker is a modal: a link to #delivery opens it over Home.
    if (base === '#delivery') { showView('home'); startDelivery(); return; }
    if (base === '#store') { showStorePage(group); return; }
    let view = PAGE_HASHES[base] || 'home';
    if (base === '#checkout') view = group === 'shipping' ? 'ship-checkout' : group === 'delivery' ? 'delivery-checkout' : group === 'gift' ? 'gift-checkout' : 'checkout';
    if (CHECKOUT_VIEWS.includes(view)) { openCheckoutFromLink(view); return; }
    showView(view);
    if (view === 'shipping' && group) setShipVersion(group);
    if (view === 'order' && group) openOrderGroup(group, { push: false });
  }
  window.addEventListener('hashchange', routeFromHash);

  document.querySelectorAll('[data-scroll]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(a.dataset.scroll);
      target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
  });

  // Email/SMS signup form shared by both pages. Front-end only: validates the
  // email, then swaps the form for its confirmation line.
  document.querySelectorAll('.page-form').forEach((form) => {
    const email = form.querySelector('input[type="email"]');
    const error = form.querySelector('.field-error');
    email.addEventListener('input', () => {
      error.hidden = true;
      email.removeAttribute('aria-invalid');
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      error.hidden = ok;
      if (!ok) {
        email.setAttribute('aria-invalid', 'true');
        email.focus();
        return;
      }
      form.querySelector('.page-success').hidden = false;
      form.querySelectorAll('input, button').forEach((el) => { el.disabled = true; });
    });
  });

  // ---------- Site footer ----------
  // One footer under every page. Browsing pages get the full one, checkout and Confirmation the slim line, and
  // Nationwide Shipping leaves out the sign-up (it has its own).
  const siteFooter = document.getElementById('site-footer');
  function syncSiteFooter(name) {
    siteFooter.dataset.mode = CHECKOUT_VIEWS.includes(name) || name === 'confirmation' ? 'slim' : 'full';
    siteFooter.dataset.view = name;
  }
  siteFooter.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-where]')) { e.preventDefault(); intentBeforeFunnel = cateringIntent; setCateringIntent(false); openWhere(wm.tab); return; }
    const store = e.target.closest('[data-store]');
    if (store) { e.preventDefault(); pushPage('#store/' + store.dataset.store); showStorePage(store.dataset.store); return; }
    const link = e.target.closest('a[data-view]');
    if (!link) return;
    e.preventDefault();
    const name = link.dataset.view;
    pushPage(name === 'home' ? '' : '#' + name);
    showView(name);
  });

  // ---------- Information pages: Contact, Flavors, Gift Cards, About, Franchise ----------
  // The buttons and links on these pages do what the header's and the footer's do.
  Object.keys(views).filter((name) => views[name].classList.contains('ip-view')).forEach((name) => {
    views[name].addEventListener('click', (e) => {
      if (e.target.closest('[data-open-where]')) { e.preventDefault(); intentBeforeFunnel = cateringIntent; setCateringIntent(false); openWhere(wm.tab); return; }
      const store = e.target.closest('[data-store]');
      if (store) { e.preventDefault(); pushPage('#store/' + store.dataset.store); showStorePage(store.dataset.store); return; }
      const link = e.target.closest('a[data-view]');
      if (!link) return;
      e.preventDefault();
      pushPage('#' + link.dataset.view);
      showView(link.dataset.view);
    });
  });

  // Policy pages (Shipping & returns, Privacy, Terms): the "On this page" list jumps to a section without touching the address (a hash change would read as a
  // page), the section being read is marked as the page scrolls, and on a phone the list is one row that opens and closes. It is always open on a wide window.
  const polPages = ['shipping-returns', 'privacy', 'terms'].map((n) => views[n]);
  const polWide = window.matchMedia('(min-width: 901px)');
  // On a wide window the list is always open (its label is just a label: not clickable, not a tab stop); on a phone it is a row that opens and closes.
  function syncPolContents() { polPages.forEach((v) => { const d = v.querySelector('.pol-contents'); if (!d) return; d.open = polWide.matches; d.querySelector('summary').tabIndex = polWide.matches ? -1 : 0; }); }
  polPages.forEach((v) => v.querySelector('.pol-contents summary').addEventListener('click', (e) => { if (polWide.matches) e.preventDefault(); }));
  syncPolContents();
  polWide.addEventListener('change', syncPolContents);
  polPages.forEach((view) => {
    const links = [...view.querySelectorAll('[data-pol-jump]')];
    view.querySelector('.pol-toc').addEventListener('click', (e) => {
      const link = e.target.closest('[data-pol-jump]');
      if (!link) return;
      e.preventDefault();
      const target = document.getElementById(link.dataset.polJump);
      if (!target) return;
      target.scrollIntoView({ behavior: motionReduced() ? 'auto' : 'smooth', block: 'start' });
      target.focus({ preventScroll: true });
      if (!polWide.matches) view.querySelector('.pol-contents').open = false;
    });
    const heads = links.map((l) => document.getElementById(l.dataset.polJump));
    const mark = () => {
      let current = heads[0];
      heads.forEach((h) => { if (h.getBoundingClientRect().top <= 140) current = h; });
      links.forEach((l) => { if (document.getElementById(l.dataset.polJump) === current) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
    };
    window.addEventListener('scroll', () => { if (!view.hidden) mark(); }, { passive: true });
    view.addEventListener('pol:shown', mark);
  });

  // Flavors: every flavor's clip as a tile, and a tap opens the same sheet the Sampler uses (the clip, its description and what is in it,
  // with Previous and Next through the whole list). Drawn the first time the page is shown.
  let flavorsDrawn = false;
  function renderFlavorsPage() {
    if (flavorsDrawn) return;
    flavorsDrawn = true;
    const flavors = FLAVORS.map((f) => ({ id: f.id, label: f.label }));
    const grid = document.getElementById('flavors-grid');
    grid.innerHTML = flavors.map((f, i) => {
      const media = FLAVOR_MEDIA[f.id];
      return `<li><button class="sampler-tile${media ? '' : ' is-empty'}" type="button" data-i="${i}" aria-haspopup="dialog" aria-label="${media ? 'Watch the ' : 'Details for '}${escapeHTML(f.label)}${media ? ' video' : ''}">
        <span class="sampler-tile-media"><img src="${media ? `assets/flavors/${media.file}.jpg` : 'assets/flavors/placeholder.svg'}" alt="" width="${media ? 360 : 56}" height="${media ? 540 : 56}" loading="lazy" decoding="async">${media ? `<span class="sampler-tile-play" aria-hidden="true">${PLAY_ICON}</span>` : ''}</span>
        <span class="sampler-tile-name">${escapeHTML(f.label)}</span>
      </button></li>`;
    }).join('');
    const tiles = [...grid.querySelectorAll('.sampler-tile')];
    tiles.forEach((tile, i) => tile.addEventListener('click', () => openFlavorInfo(flavors[i], tile, { list: flavors, index: i, openerFor: (j) => tiles[j] })));
  }

  // About: every flavor (the owner's favorite, Chicken Caesar, first) in a strip that scrolls by itself, edge to edge (see "About, the flavors" in
  // styles.css). The tiles are drawn twice so the loop has no seam; the second set is hidden from screen readers and from the Tab key. A tap on a tile
  // opens the same video sheet, which steps through all 19; the pause button is for anyone who wants it still.
  let aboutFlavorsDrawn = false;
  function renderAboutFlavors() {
    if (aboutFlavorsDrawn) return;
    aboutFlavorsDrawn = true;
    const flavors = [...FLAVORS].sort((x, y) => (y.id === 'chicken-caesar') - (x.id === 'chicken-caesar')).map((f) => ({ id: f.id, label: f.label }));
    const group = (copy) => `<ul class="ab-marquee-group"${copy ? ' aria-hidden="true"' : ''}>${flavors.map((f, i) => {
      const media = FLAVOR_MEDIA[f.id];
      return `<li><button class="sampler-tile" type="button" data-i="${i}"${copy ? ' tabindex="-1"' : ''} aria-haspopup="dialog" aria-label="Watch the ${escapeHTML(f.label)} video${i === 0 ? ", Raechel's favorite" : ''}">
        <span class="sampler-tile-media"><img src="assets/flavors/${media.file}.jpg" alt="" width="360" height="540" loading="lazy" decoding="async" draggable="false"><span class="sampler-tile-play" aria-hidden="true">${PLAY_ICON}</span></span>
        <span class="sampler-tile-name">${escapeHTML(f.label)}</span>${i === 0 ? '<span class="ab-fav">Raechel’s favorite</span>' : ''}
      </button></li>`;
    }).join('')}</ul>`;
    const track = document.getElementById('about-flavors');
    track.innerHTML = group(false) + group(true);
    const tiles = [...track.querySelectorAll('.sampler-tile')];
    tiles.forEach((tile) => {
      const i = Number(tile.dataset.i);
      tile.addEventListener('click', () => openFlavorInfo(flavors[i], tile, { list: flavors, index: i, openerFor: (j) => tiles.filter((t) => Number(t.dataset.i) === j && !t.closest('[aria-hidden]'))[0] || tile }));
    });
    const pause = document.getElementById('ab-pause');
    const strip = document.getElementById('about-marquee');
    pause.addEventListener('click', () => {
      const on = strip.classList.toggle('is-paused');
      pause.setAttribute('aria-pressed', String(on));
      pause.setAttribute('aria-label', on ? 'Play the flavor strip' : 'Pause the flavor strip');
    });
  }

  // About, hero badge: the sticker unrolls like a sheet of rolled tissue paper, from its top edge down, in 3D. The badge is cut into thin horizontal strips
  // in a perspective scene. Strips the roll has passed lie flat; the rest are wound on a coil that curls up toward the viewer. The coil is a spiral (each turn
  // a paper's thickness smaller than the last), so its size follows the paper left on it and it shrinks to nothing at the bottom edge. Each strip is shaded by
  // its angle to a light from the upper left (the back of the paper, plain cream, shows on the outside of the coil), and the coil throws a soft shadow on the
  // egg. When it is flat the strips give way to the plain image, the sticker swings a little as it settles, and its shadow arrives last. Nothing shows before
  // it starts, and a replay (or leaving the page) cancels the run in progress.
  let heroBadgeRun = 0;
  function startHeroBadge() {
    const badge = document.getElementById('ab-hero-badge');
    if (!badge) return;
    const stage = badge.querySelector('.ip-badge-stage');
    const cast = badge.querySelector('.ip-badge-cast');
    const run = ++heroBadgeRun;
    // Fewer strips where the device is likely to be modest: a phone (the badge is small there anyway) or a machine reporting few cores or little memory.
    const modest = window.innerWidth <= 767 || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
    const N = modest ? 36 : 56;
    if (!stage.children.length) {
      for (let j = 0; j < N; j++) {
        const strip = document.createElement('span');
        strip.className = 'ip-badge-strip';
        strip.style.top = `${(j / N) * 100}%`;
        strip.style.height = `calc(${100 / N}% + .5px)`;
        const pos = `0 ${(j / (N - 1)) * 100}%`;
        const size = `100% ${N * 100}%`;
        const front = document.createElement('span');
        front.className = 'f';
        front.style.backgroundPosition = pos;
        front.style.backgroundSize = size;
        const back = document.createElement('span');
        back.className = 'b';
        back.style.webkitMaskPosition = pos; back.style.maskPosition = pos;
        back.style.webkitMaskSize = size; back.style.maskSize = size;
        strip.append(front, back);
        stage.append(strip);
      }
    }
    const strips = [...stage.children];
    badge.getAnimations().forEach((an) => an.cancel());
    if (motionReduced()) { badge.dataset.state = 'done'; return; }
    badge.dataset.state = 'wait';
    const DELAY = 1050;  // the egg's fade (0.9s) and a beat
    const UNROLL = 2800;
    const SWING = 950;
    const ease = (v) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
    const LIGHT = [-0.4, 0.92];            // light direction in (down the badge, toward the viewer)
    const HALF = [-0.204, 0.979];          // halfway between the light and the viewer, for the highlight
    const shade = (ny, nz) => 0.7 + 0.42 * Math.max(0, ny * LIGHT[0] + nz * LIGHT[1]) + 0.45 * Math.pow(Math.max(0, ny * HALF[0] + nz * HALF[1]), 24);
    const FLAT = shade(0, 1);
    function frame(p) {
      const H = badge.offsetHeight;
      const t = H * 0.075;                  // the paper's thickness, exaggerated so the coil reads
      const front = H * p;                  // how far down the sheet the roll has come
      const left = Math.max(H - front, 0.0001);
      const rOut = Math.sqrt((left * t) / Math.PI);
      stage.style.perspective = `${H * 2.6}px`;
      strips.forEach((strip, j) => {
        const s = ((j + 0.5) * H) / N;
        if (s <= front) {
          if (strip._flat) return;
          strip._flat = true;
          strip.style.transform = 'scaleY(1.04)';
          strip.style.setProperty('--b', '1');
          return;
        }
        strip._flat = false;
        const q = Math.max(rOut * rOut - (t * (s - front)) / Math.PI, 0);
        const r = Math.sqrt(q);
        const th = ((rOut - r) * 2 * Math.PI) / t;       // how far round the coil this strip is
        const y = front + r * Math.sin(th);
        const z = rOut - r * Math.cos(th);
        const facing = Math.cos(th) >= 0 ? 1 : -1;       // whether the printed face or the back faces us
        const b = (shade(-Math.sin(th) * facing, Math.cos(th) * facing) / FLAT) * (0.86 + 0.14 * (rOut ? r / rOut : 1));
        strip.style.transform = `translate3d(0, ${(y - s).toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${th.toFixed(4)}rad) scaleY(1.05)`;
        strip.style.setProperty('--b', b.toFixed(3));
      });
      // The coil's shadow on the egg, just under and ahead of it.
      const cy = front + rOut * 1.15;
      const ch = rOut * 2.8;
      cast.style.top = `${(cy - ch / 2).toFixed(1)}px`;
      cast.style.height = `${ch.toFixed(1)}px`;
      cast.style.opacity = String(Math.min(1, rOut / (H * 0.07)) * 0.9);
    }
    const startAt = performance.now() + DELAY;
    const tick = (now) => {
      if (run !== heroBadgeRun) return;
      const e = now - startAt;
      if (e < 0) { requestAnimationFrame(tick); return; }
      if (badge.dataset.state !== 'play') { stage.style.display = ''; strips.forEach((st) => { st._flat = undefined; }); badge.dataset.state = 'play'; }
      const p = Math.min(1, e / UNROLL);
      frame(ease(p) * 0.995);
      if (p < 1) { requestAnimationFrame(tick); return; }
      // flat: swap in the plain image, then the paper settles in three shrinking swings and the shadow arrives
      badge.dataset.state = 'flat';
      const swing = badge.animate([
        { transform: 'translateY(-4px) rotate(1deg) scale(1.03)' },
        { transform: 'translateY(-2px) rotate(6deg) scale(1.025)', offset: 0.28 },
        { transform: 'translateY(0) rotate(11deg) scale(1.01)', offset: 0.5 },
        { transform: 'rotate(6.8deg) scale(1)', offset: 0.72 },
        { transform: 'rotate(8.7deg)', offset: 0.88 },
        { transform: 'rotate(8deg) scale(1)' },
      ], { duration: SWING, easing: 'ease-out' });
      swing.onfinish = () => { if (run === heroBadgeRun) badge.dataset.state = 'done'; };
    };
    requestAnimationFrame(tick);
  }

  // Corporate gift order: pick any mix of the three kits, give each one a recipient list (a CSV, at least 10 recipients; the count fills in from the file), choose
  // a delivery week, and send the request. Nothing is sent from this prototype; the live site calculates shipping and emails a pay link.
  (function initCorporateOrder() {
    const view = views['corporate-gift-order'];
    const form = document.getElementById('cgo-form');
    if (!form) return;
    const PRODUCTS = [
      { id: 'eggsecutive', name: 'The Eggsecutive Sampler', price: 30, kits: {} },
      { id: 'vip', name: 'The VIP Egg-sperience', price: 50, kits: { '24kit': 2 } },
      { id: 'boardroom', name: 'The Boardroom Egg-stravaganza', price: 75, kits: { '36kit': 3 } },
    ];
    const MIN = 10;
    const COLUMNS = ['First Name', 'Last Name', 'Email', 'Phone', 'Address', 'Address 2', 'City', 'State', 'Zip', 'Business (B) or Residential (R)'];
    const SAMPLE_ROW = ['John', 'Doe', 'john.doe@example.com', '5551234567', '123 Main Street', 'Suite 100', 'Dallas', 'TX', '75001', 'B'];
    const state = {};
    PRODUCTS.forEach((p) => { state[p.id] = { rows: 0, file: '' }; });
    const money = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const el = (id) => document.getElementById(id);
    const card = (id) => form.querySelector(`.cgo-card[data-product="${id}"]`);

    // The flavors a kit can be filled with.
    PRODUCTS.filter((p) => Object.keys(p.kits).length).forEach((p) => {
      const list = el(`cgo-flavors-${p.id}`).querySelector('.cgo-flavor-list');
      list.innerHTML = FLAVORS.map((f) => `<label class="cgo-flavor"><input type="checkbox" name="flavor-${p.id}" value="${f.id}"><span>${f.label}</span></label>`).join('');
    });

    // Delivery weeks: Monday to Sunday, starting with the first Monday that is at least five days away, twelve of them.
    const week = el('cgo-week');
    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    (() => {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 5);
      d.setDate(d.getDate() + ((8 - d.getDay()) % 7));
      for (let i = 0; i < 12; i++) {
        const end = new Date(d); end.setDate(end.getDate() + 6);
        const o = document.createElement('option');
        o.value = d.toISOString().slice(0, 10);
        o.textContent = `${fmt(d)} - ${fmt(end)}`;
        week.append(o);
        d.setDate(d.getDate() + 7);
      }
    })();

    function csvRows(text) {
      const rows = []; let row = []; let cell = ''; let q = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
        else if (c === '"') q = true;
        else if (c === ',') { row.push(cell); cell = ''; }
        else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
        else cell += c;
      }
      if (cell || row.length) { row.push(cell); rows.push(row); }
      return rows.filter((r) => r.some((x) => x.trim()));
    }
    const download = (name, rows) => {
      const csv = rows.map((r) => r.map((x) => (/[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x)).join(',')).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = name;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    view.addEventListener('click', (e) => {
      if (e.target.closest('[data-template]')) download('corporate-gifting-template.csv', [COLUMNS, SAMPLE_ROW]);
      if (e.target.closest('[data-sample]')) download('corporate-gifting-sample.csv', [COLUMNS, SAMPLE_ROW]);
    });

    const cardError = (id, msg) => { const p = el(`cgo-error-${id}`); p.textContent = msg || ''; p.hidden = !msg; };
    function option(id) { const r = card(id).querySelector('input[type="radio"]:checked'); return r ? r.value : ''; }
    function need(id) { const p = PRODUCTS.find((x) => x.id === id); return p.kits[option(id)] || 0; }
    function sync() {
      const lines = []; let total = 0;
      PRODUCTS.forEach((p) => {
        const qty = Number(el(`cgo-qty-${p.id}`).value) || 0;
        const fl = el(`cgo-flavors-${p.id}`);
        const n = need(p.id);
        if (fl) { fl.hidden = !n; if (n) el(`cgo-flavors-${p.id}-title`).textContent = `Choose ${n} flavors`; }
        card(p.id).querySelectorAll('.cgo-options .radio-choice').forEach((row) => row.classList.toggle('selected', row.querySelector('input').checked));
        if (qty > 0) { lines.push({ p, qty, sum: qty * p.price }); total += qty * p.price; }
      });
      el('cgo-lines').innerHTML = lines.length
        ? lines.map((l) => `<div class="cgo-line"><div><p class="cgo-line-name">Corporate Gift - ${l.p.name}</p><p class="cgo-line-sub">(${l.qty} recipients)</p></div><p class="cgo-line-sum">${money(l.sum)}</p></div>`).join('')
        : '<p class="cgo-none">No items selected yet.</p>';
      el('cgo-total').textContent = money(total);
      return lines;
    }

    form.addEventListener('input', (e) => {
      const c = e.target.closest('.cgo-card');
      if (c) {
        cardError(c.dataset.product, '');
        if (e.target.matches('input[type="number"]')) setFieldError(e.target, '');
        if (e.target.matches('input[type="checkbox"]')) {
          const p = PRODUCTS.find((x) => x.id === c.dataset.product); const n = need(p.id);
          const boxes = [...c.querySelectorAll('.cgo-flavor input')];
          const picked = boxes.filter((b) => b.checked).length;
          boxes.forEach((b) => { b.disabled = picked >= n && !b.checked; });
        }
      }
      if (e.target === week) setFieldError(week, '');
      el('cgo-form-error').hidden = true;
      sync();
    });
    form.addEventListener('change', (e) => {
      if (e.target.matches('input[type="radio"]')) {
        const c = e.target.closest('.cgo-card');
        c.querySelectorAll('.cgo-flavor input').forEach((b) => { b.checked = false; b.disabled = false; });
        sync();
      }
      if (e.target.matches('input[type="file"]')) readFile(e.target);
    });
    function readFile(input) {
      const id = input.id.replace('cgo-file-', '');
      const file = input.files[0];
      const stat = el(`cgo-filestat-${id}`);
      const qty = el(`cgo-qty-${id}`);
      state[id] = { rows: 0, file: '' };
      stat.hidden = true; cardError(id, '');
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const rows = csvRows(String(reader.result).replace(/^﻿/, ''));
        const head = (rows[0] || []).map((x) => x.trim().toLowerCase());
        const missing = ['first name', 'last name', 'email', 'address', 'zip'].filter((c) => !head.includes(c));
        if (missing.length) { input.value = ''; cardError(id, `That file is missing a column: ${missing.map((m) => m.replace(/\b\w/g, (c) => c.toUpperCase())).join(', ')}. Use the template.`); sync(); return; }
        const count = rows.length - 1;
        if (count < MIN) { input.value = ''; cardError(id, `That file has ${count} recipient${count === 1 ? '' : 's'}. Each product needs at least ${MIN}.`); sync(); return; }
        state[id] = { rows: count, file: file.name };
        qty.value = String(count); setFieldError(qty, '');
        stat.textContent = `${file.name}: ${count} recipients`; stat.hidden = false;
        sync();
      };
      reader.readAsText(file);
    }

    function fail(message, target) {
      const box = el('cgo-form-error');
      box.textContent = message; box.hidden = false;
      if (target) target.focus();
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let first = null; let any = false;
      const flag = (node) => { if (!first) first = node; };
      PRODUCTS.forEach((p) => {
        cardError(p.id, '');
        const qtyEl = el(`cgo-qty-${p.id}`);
        const qty = Number(qtyEl.value) || 0;
        if (!qty) return;
        any = true;
        if (qty < MIN) { setFieldError(qtyEl, `Minimum ${MIN} recipients per product.`); flag(qtyEl); return; }
        if (state[p.id].rows !== qty) { cardError(p.id, 'Upload a CSV or set the number of recipients to 0.'); flag(el(`cgo-file-${p.id}`).labels[0]); return; }
        const n = need(p.id);
        if (n && card(p.id).querySelectorAll('.cgo-flavor input:checked').length !== n) { cardError(p.id, `Choose ${n} flavors for the kit.`); flag(card(p.id).querySelector('.cgo-flavor input')); }
      });
      if (!any) { fail('Pick at least one gift: set a number of recipients and upload their CSV.', el('cgo-qty-eggsecutive')); return; }
      if (!week.value) { setFieldError(week, 'Choose a delivery week.'); flag(week); }
      if (first) { first.focus(); return; }
      const lines = sync();
      el('cgo-done-lines').innerHTML = lines.map((l) => `<div class="cgo-line"><div><p class="cgo-line-name">Corporate Gift - ${l.p.name}${need(l.p.id) ? ` (${option(l.p.id) === '24kit' ? '24-count kit' : '36-count kit'}: ${[...card(l.p.id).querySelectorAll('.cgo-flavor input:checked')].map((b) => FLAVORS.find((f) => f.id === b.value).label).join(', ')})` : ''}</p><p class="cgo-line-sub">${l.qty} recipients</p></div><p class="cgo-line-sum">${money(l.sum)}</p></div>`).join('')
        + `<div class="cgo-line"><div><p class="cgo-line-name">Delivery week</p><p class="cgo-line-sub">${week.options[week.selectedIndex].textContent}</p></div></div><div class="cgo-line"><div><p class="cgo-line-name">Estimated total</p></div><p class="cgo-line-sum">${el('cgo-total').textContent}</p></div>`;
      form.hidden = true; view.querySelector('.cgo-how').hidden = true; el('cgo-done').hidden = false;
      window.scrollTo(0, 0);
      el('cgo-done').querySelector('h2').setAttribute('tabindex', '-1');
      el('cgo-done').querySelector('h2').focus({ preventScroll: true });
    });
    el('cgo-again').addEventListener('click', () => {
      form.reset();
      PRODUCTS.forEach((p) => { state[p.id] = { rows: 0, file: '' }; el(`cgo-filestat-${p.id}`).hidden = true; cardError(p.id, ''); card(p.id).querySelectorAll('.cgo-flavor input').forEach((b) => { b.checked = false; b.disabled = false; }); });
      form.hidden = false; view.querySelector('.cgo-how').hidden = false; el('cgo-done').hidden = true;
      sync(); window.scrollTo(0, 0);
    });
    sync();
  })();

  // Gift Cards: the three header cards settle into their tilt each time the page is shown (taking the class off and putting it back restarts the animation).
  function replayGiftStrip() {
    const strip = document.querySelector('#view-gift-cards .gc-strip');
    if (!strip) return;
    strip.classList.remove('is-in');
    void strip.offsetWidth;
    strip.classList.add('is-in');
  }

  // About, hero: a clip of one flavor, picked at random each time the page is shown (never the one before), plays muted and looping inside the egg. It starts
  // from that flavor's still, plays only while it is on screen and the tab is visible, and stays a still under reduced motion. Chicken and Waffle's clip
  // is 31MB, so it is not in the pool; only the chosen clip is downloaded.
  let heroLast = '';
  let heroWatch = null;
  function initAboutHero() {
    const video = document.getElementById('ab-hero-video');
    if (!video) return;
    const pool = Object.values(FLAVOR_MEDIA).map((m) => m.file).filter((file) => file !== 'Chicken-Waffle');
    let before = heroLast;
    try { before = sessionStorage.getItem('deg-hero-flavor') || before; } catch (e) { /* private window: just don't repeat within this page load */ }
    const options = pool.filter((file) => file !== before);
    const file = options[Math.floor(Math.random() * options.length)];
    heroLast = file;
    try { sessionStorage.setItem('deg-hero-flavor', file); } catch (e) { /* no storage */ }
    video.poster = `assets/flavors/${file}.jpg`;
    if (heroWatch) { heroWatch.disconnect(); heroWatch = null; }
    // The intro runs again each time the page is shown: the egg fades in first (a CSS class taken off and put back to restart it), then the sticker
    // unrolls from the top down in 3D, then its shadow arrives.
    const eggBox = video.parentElement;
    eggBox.classList.remove('is-fading');
    void eggBox.offsetWidth;
    eggBox.classList.add('is-fading');
    startHeroBadge();
    video.pause();
    if (motionReduced()) { video.removeAttribute('src'); video.load(); return; }
    video.src = `assets/flavors/${file}.mp4`;
    video.muted = true;
    const play = () => { const p = video.play(); if (p && p.catch) p.catch(() => { /* the poster stays */ }); };
    if ('IntersectionObserver' in window) {
      heroWatch = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting && !document.hidden) play(); else video.pause(); });
      }, { threshold: 0.2 });
      heroWatch.observe(video);
    } else play();
  }
  document.addEventListener('visibilitychange', () => {
    const video = document.getElementById('ab-hero-video');
    if (!video || !video.src) return;
    if (document.hidden) video.pause();
    else if (video.getBoundingClientRect().bottom > 0 && video.getBoundingClientRect().top < window.innerHeight) { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
  });

  // About, Our mission and values: a scroll-driven stage (see "About: Our mission and values" in styles.css), after the Figma screens. The section is a tall
  // runway with a pinned stage. How far the page has scrolled through it (0 to 1) drives everything, scrubbed rather than timed. From a desktop down to a
  // 768px tablet the egg is a fixed 640px wide to start and shrinks to 0.64 of that, the third Figma screen's size, by the third photo, then holds it. On a
  // phone it starts 1.6 times the width of the page's content (past both edges of the window) and shrinks only to that width, edge to edge with the
  // other content. It drifts from the top of the stage to its middle. Each photo opens over the last as the page reaches its fifth of the runway, and each
  // tag drops in just after. The tags follow the egg's right outline down its side, from the shoulder to the belly, so each sits on the real edge at its
  // own height and the cascade bends with the curve. The last 8% of the runway holds the finished state. It reads scroll position directly, not animation
  // frames, and is a still under reduced motion.
  let aboutValuesReady = false;
  function initAboutValues() {
    const vs = document.getElementById('ab-values-scroll');
    if (!vs) return;
    if (aboutValuesReady) { vs.dispatchEvent(new Event('vs:measure')); return; }
    aboutValuesReady = true;
    if (motionReduced()) return;
    const pin = vs.querySelector('.vs-pin');
    const stage = vs.querySelector('.vs-stage');
    const egg = document.getElementById('vs-egg');
    const tags = document.getElementById('vs-tags');
    const photos = [...egg.querySelectorAll('.vs-photo')];
    const items = [...tags.children];
    const RATIO = 1068 / 1374; // the egg's width over its height, as drawn
    const START_W = 640;       // the egg's fixed width from a desktop down to a 768px tablet
    const END = 683 / 1068;    // the third Figma screen's egg over the first: the smallest the desktop egg gets
    const PHONE_START = 1.6;   // a phone's egg starts this many times the width of the content, and ends at that width
    const SHRINK_BY = 0.6;     // the egg has reached its end size by the end of the third step, and holds it for the fourth and fifth
    const HEADER = 69;
    const HOLD = 0.92;         // the finished state holds for the last 8% of the runway
    // The egg's right edge as a share of its width (0.5 is the centre line), every twentieth of its height from the top to 70% down, read from the drawn silhouette.
    const EDGE = [0.51, 0.664, 0.732, 0.788, 0.836, 0.873, 0.906, 0.932, 0.954, 0.972, 0.987, 0.996, 0.999, 0.996, 0.986];
    const edgeAt = (t) => {
      const k = Math.min(EDGE.length - 1.001, Math.max(0, t * 20));
      const i = Math.floor(k);
      return EDGE[i] + (EDGE[i + 1] - EDGE[i]) * (k - i);
    };
    const TAG_FIRST = 0.05;    // the first tag's middle sits this far down the egg
    const TAG_STEP = 0.14;     // and each next tag this much further, so the five reach the belly
    const steps = photos.length;
    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    const easeOut = (v) => 1 - Math.pow(1 - v, 3);
    const easeInOut = (v) => 0.5 - Math.cos(Math.PI * v) / 2;
    let geo = null;
    vs.classList.add('is-live');
    // Each reveal should never wait on a download: the five photos are fetched as soon as the section is set up.
    photos.forEach((el) => { el.loading = 'eager'; });
    function measure() {
      const vw = window.innerWidth;
      const mobile = vw <= 767;
      const gut = vw <= 640 ? 16 : 40;
      const area = stage.clientHeight;
      const endW = Math.min(vw - 2 * gut, START_W);
      const w = mobile ? endW * PHONE_START : START_W;
      const h = w / RATIO;
      // On a window too short for the smallest egg, it stops at the stage height instead (never on a portrait phone, which keeps its edge-to-edge width).
      const base = mobile ? 1 / PHONE_START : END;
      const end = mobile && window.innerHeight >= vw ? base : Math.max(0.4, Math.min(base, (area - 8) / h));
      const tagW = items.map((el) => el.offsetWidth);
      const tagH = Math.max(...items.map((el) => el.offsetHeight));
      geo = { mobile, vw, gut, area, h, w, tagW, tagH, end, stageTop: stage.offsetTop, tagHs: items.map((el) => el.offsetHeight) };
      egg.style.width = `${w}px`;
      egg.style.height = `${h}px`;
      egg.style.marginLeft = `${-w / 2}px`;
    }
    function update() {
      if (vs.closest('[hidden]')) return;
      if (!geo) measure();
      const total = vs.offsetHeight - pin.offsetHeight;
      const raw = total > 0 ? clamp01((HEADER - vs.getBoundingClientRect().top) / total) : 0;
      const p = clamp01(raw / HOLD);
      const shrink = easeInOut(clamp01(p / SHRINK_BY));
      const scale = 1 + (geo.end - 1) * shrink;
      const eggH = geo.h * scale;
      const eggW = geo.w * scale;
      // The egg starts at the top of the stage and settles to its middle.
      const top = Math.max(0, ((geo.area - geo.h * geo.end) / 2) * shrink);
      egg.style.transform = `translateY(${top}px) scale(${scale})`;
      const at = p * steps;
      photos.forEach((el, i) => {
        const r = i === 0 ? 1 : easeOut(clamp01((at - i) / 0.6));
        el.style.clipPath = `ellipse(${r * 80}% ${r * 80}% at 50% 58%)`;
      });
      const eggTop = geo.stageTop + top;
      const cx = geo.vw / 2;
      // Down the egg's side: on desktop the tags are TAG_STEP of the egg's height apart (or just clear of each other if the egg is short); on a phone they are always just clear of each other.
      const step = geo.mobile ? geo.tagH + 6 : Math.max(eggH * TAG_STEP, geo.tagH + 8);
      items.forEach((el, i) => {
        const o = i === 0 ? 1 : clamp01((at - i - 0.25) / 0.3);
        el.style.setProperty('--o', String(o));
        el.style.setProperty('--dy', `${(1 - easeOut(o)) * -18}px`);
        const mid = eggH * TAG_FIRST + i * step;
        const edge = cx + eggW * (edgeAt(mid / eggH) - 0.5);
        // Desktop: the tag's left edge a little over the outline, so it hugs the curve. Phone: the tag centred on the outline, held inside the page gutter.
        // Neither passes the window's right edge.
        let left = geo.mobile ? edge - geo.tagW[i] / 2 : edge - 24;
        left = Math.min(left, geo.vw - (geo.mobile ? geo.gut : 16) - geo.tagW[i]);
        el.style.setProperty('--x', `${left - cx}px`);
        el.style.setProperty('--y', `${eggTop + mid - geo.tagHs[i] / 2}px`);
      });
    }
    const remeasure = () => { geo = null; update(); };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', remeasure);
    vs.addEventListener('vs:measure', remeasure);
    remeasure();
    // The tags are measured by their text, so measure again once the display face has loaded.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  }

  // A short message form: required fields are named in place, and a sent message swaps the button for a thank-you line. There is no
  // server behind it in the prototype.
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const f = (name) => contactForm.elements[name];
    ['name', 'email', 'message'].forEach((n) => f(n).addEventListener('input', () => { f(n).removeAttribute('aria-invalid'); setFieldError(f(n), ''); }));
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateFields([
        [f('name'), present, 'Enter your name.'],
        [f('email'), isEmail, 'Enter a valid email so we can reply.'],
        [f('message'), present, 'Write a message for us.'],
      ])) return;
      const ok = contactForm.querySelector('.page-success');
      ok.textContent = `Thanks, ${firstNameOf(f('name').value)}. Your message is on its way. We'll reply by email.`;
      ok.hidden = false;
      contactForm.querySelectorAll('input, textarea, button').forEach((el) => { el.disabled = true; });
    });
  }

  // Egg bar request: the live site's contact form for booking a deviled egg bar. Nothing is sent from the prototype.
  const eggBarForm = document.getElementById('egg-bar-form');
  if (eggBarForm) {
    const f = (name) => eggBarForm.elements[name];
    ['name', 'email'].forEach((n) => f(n).addEventListener('input', () => { f(n).removeAttribute('aria-invalid'); setFieldError(f(n), ''); }));
    eggBarForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateFields([
        [f('name'), present, 'Enter your name.'],
        [f('email'), isEmail, 'Enter a valid email so we can reply.'],
      ])) return;
      const ok = eggBarForm.querySelector('.page-success');
      ok.textContent = `Thanks, ${firstNameOf(f('name').value)}. Your egg bar request is on its way. We'll reply by email.`;
      ok.hidden = false;
      eggBarForm.querySelectorAll('input, select, textarea, button').forEach((el) => { el.disabled = true; });
    });
  }

  // Gift cards: an amount, how it arrives, who it is for and from whom. The card on the right is the card as it will look, and Continue opens
  // its own short checkout (Review and pay). A gift card never goes in the food bag: it has no store, time or address, no tip, and no tax.
  const giftForm = document.getElementById('gift-form');
  const gc = { amount: 50, delivery: 'email' };
  function giftWhen() {
    if (gc.delivery === 'print') return ['Delivery', 'Print at home'];
    const key = giftForm.elements.date.value;
    return ['Arrives', `${key && key !== dateKey(new Date()) ? pickupDateLabel(key) : 'Today'}, by email`];
  }
  function syncGiftCard() {
    if (!giftForm) return;
    const f = giftForm.elements;
    if (!f.date.value) { f.date.value = dateKey(new Date()); f.date.min = f.date.value; }
    const email = gc.delivery === 'email';
    document.getElementById('gc-email-wrap').hidden = !email;
    document.getElementById('gc-date-wrap').hidden = !email;
    document.getElementById('gc-card-num').textContent = gc.amount;
    document.getElementById('gc-add').textContent = `Continue · ${money(gc.amount)}`;
    const msg = document.getElementById('gc-pv-msg');
    msg.textContent = f.message.value.trim();
    msg.hidden = !msg.textContent;
  }
  if (giftForm) {
    const f = giftForm.elements;
    const error = giftForm.querySelector('.field-error');
    document.getElementById('gc-amounts').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      gc.amount = Number(chip.dataset.amount);
      document.querySelectorAll('#gc-amounts .chip').forEach((c) => { const on = c === chip; c.classList.toggle('active', on); c.setAttribute('aria-checked', String(on)); });
      syncGiftCard();
      // The figure on the card swaps in (restarting its short animation).
      const fig = document.getElementById('gc-card-amount');
      fig.classList.remove('is-swap'); void fig.offsetWidth; fig.classList.add('is-swap');
      document.getElementById('gc-stage').dispatchEvent(new Event('gc-nudge'));
    });
    giftForm.querySelectorAll('input[name="gc-delivery"]').forEach((input) => input.addEventListener('change', () => {
      gc.delivery = input.value;
      giftForm.querySelectorAll('.gc-delivery .radio-choice').forEach((row) => row.classList.toggle('selected', row.querySelector('input').checked));
      syncGiftCard();
    }));
    giftForm.addEventListener('input', (e) => { e.target.removeAttribute('aria-invalid'); error.hidden = true; syncGiftCard(); });
    // The button sits beside the card, outside the form, and submits it by its form attribute.
    giftForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = gc.delivery === 'email';
      const checks = [[f.to, present, 'Enter who the card is for.']];
      if (email) checks.push([f.toEmail, isEmail, 'Enter a valid email to send the card to.']);
      checks.push([f.from, present, 'Enter your name so they know who it is from.']);
      const bad = checks.find(([input, ok]) => !ok(input.value.trim()));
      if (bad) {
        bad[0].setAttribute('aria-invalid', 'true');
        error.textContent = bad[2];
        error.hidden = false;
        bad[0].focus();
        return;
      }
      const [whenLabel, when] = giftWhen();
      giftOrder = {
        amount: gc.amount, delivery: gc.delivery, to: f.to.value.trim(), toEmail: f.toEmail.value.trim(), from: f.from.value.trim(),
        message: f.message.value.trim(), whenLabel, when,
      };
      saveGiftOrder();
      renderGiftCheckout();
      showView('gift-checkout');
    });
  }

  // The card being bought, kept for the visit so a reload on the checkout address does not lose it.
  const GIFT_ORDER_KEY = 'deg-gift-order';
  let giftOrder = null;
  function saveGiftOrder() { try { sessionStorage.setItem(GIFT_ORDER_KEY, JSON.stringify(giftOrder)); } catch (_) {} }
  function loadGiftOrder() {
    if (!giftOrder) { try { giftOrder = JSON.parse(sessionStorage.getItem(GIFT_ORDER_KEY) || 'null'); } catch (_) { giftOrder = null; } }
    return giftOrder;
  }
  const gkEmail = document.getElementById('gk-email');
  function renderGiftCheckout() {
    const g = loadGiftOrder();
    if (!g) return;
    const byEmail = g.delivery === 'email';
    document.getElementById('gk-thumb-num').textContent = g.amount;
    document.getElementById('gk-to').innerHTML = byEmail ? `${escapeHTML(g.to)}<br><span class="gk-sub">${escapeHTML(g.toEmail)}</span>` : escapeHTML(g.to);
    document.getElementById('gk-from').textContent = g.from;
    document.getElementById('gk-when-label').textContent = g.whenLabel;
    document.getElementById('gk-when').textContent = g.when;
    document.getElementById('gk-msg').textContent = g.message;
    document.getElementById('gk-msg-row').hidden = !g.message;
    document.getElementById('gk-msg-rule').hidden = !g.message;
    document.getElementById('gk-email-note').textContent = byEmail
      ? 'Your receipt goes here.'
      : 'We\u2019ll send the printable card and your receipt here.';
    if (!gkEmail.value) gkEmail.value = ['co-email', 'dc-email', 'sc-email'].map((id) => document.getElementById(id).value).find(Boolean) || '';
    document.getElementById('gk-items').innerHTML = `<div class="drawer-item"><span class="gk-item-thumb" aria-hidden="true"><img src="assets/pages/gift-preview.webp" alt="" width="56" height="56"></span><div class="drawer-item-body"><span class="drawer-item-name">DECO Gift Card</span><span class="drawer-item-sub">To ${escapeHTML(g.to)} · ${escapeHTML(g.when)}</span><span class="drawer-item-price">${money(g.amount)}</span></div></div>`;
    document.getElementById('gk-subtotal').textContent = money(g.amount);
    document.getElementById('gk-total').textContent = money(g.amount);
    document.getElementById('gk-pay').textContent = `Pay ${money(g.amount)}`;
    document.getElementById('gk-pay-note').textContent = byEmail
      ? `We\u2019ll email the card to ${g.to} ${g.when.startsWith('Today') ? 'as soon as you pay' : `on ${g.when.replace(/, by email$/, '')}`}.`
      : 'We\u2019ll email a printable card to you as soon as you pay.';
  }
  document.getElementById('gk-edit').addEventListener('click', () => showView('gift-cards'));
  let payingGift = false;
  document.getElementById('gk-pay').addEventListener('click', () => {
    if (!giftOrder || payingGift) return;
    if (!validateFields([[gkEmail, isEmail, 'Enter a valid email so we can send your receipt.']])) return;
    const g = giftOrder;
    const btn = document.getElementById('gk-pay');
    payingGift = true; btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Paying\u2026';
    announceCheckout('Placing your order\u2026');
    window.setTimeout(() => {
      payingGift = false; btn.disabled = false; btn.removeAttribute('aria-busy');
      const byEmail = g.delivery === 'email';
      const today = g.when.startsWith('Today');
      const whenText = byEmail ? (today ? 'today' : `on ${g.when.replace(/, by email$/, '')}`) : '';
      giftOrder = null;
      try { sessionStorage.removeItem(GIFT_ORDER_KEY); } catch (_) {}
      // The next card starts fresh for someone else; the sender and the amount stay.
      giftForm.elements.to.value = ''; giftForm.elements.toEmail.value = ''; giftForm.elements.message.value = '';
      giftForm.elements.date.value = '';
      syncGiftCard();
      showConfirmation({
        gift: true,
        title: byEmail ? (today ? 'Gift card sent!' : 'Gift card scheduled!') : 'Your gift card is ready!',
        number: orderNumber(),
        subHTML: byEmail
          ? `Order {number} · A <strong>${money(g.amount)}</strong> gift card for <strong>${escapeHTML(g.to)}</strong> ${today ? 'is on its way' : 'goes out'} ${whenText}. Your receipt is in your inbox.`
          : `Order {number} · Your <strong>${money(g.amount)}</strong> gift card for <strong>${escapeHTML(g.to)}</strong> is in your inbox, ready to print. Your receipt is there too.`,
        steps: ['', ''],
        name: g.from,
        cheer: 'Good egg.',
        items: [{ label: 'DECO Gift Card', sub: `To ${escapeHTML(g.to)} · ${escapeHTML(g.when)}`, amount: money(g.amount) }],
        total: g.amount,
        cardHTML: `${MAIL_ICON}<span>${byEmail ? `${escapeHTML(g.to)}<br>${escapeHTML(g.toEmail)}` : `Printable card sent to<br>${escapeHTML(gkEmail.value.trim())}`}${g.message ? `<br><em class="gk-quote">\u201c${escapeHTML(g.message)}\u201d</em>` : ''}</span>`,
        backLabel: '\u2190 Back to home', backView: 'home',
      });
    }, 900);
  });


  // Gift card preview, held in the hand. The card is a real 3D plane under a camera: at rest it lies flat on its shadow, and when it comes into view it lifts off the
  // surface and floats, drifting a little. The pointer tilts it toward you with a moving highlight; pressing picks it up (it comes closer, the shadow falls away), dragging
  // carries it with a little lag and turns it in your hand, and letting go throws it back with the speed of your hand and a springy settle. Every channel is its own
  // damped spring, so nothing snaps. Reduced motion keeps the card flat and still.
  (function initGiftCard3D() {
    const stage = document.getElementById('gc-stage');
    if (!stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const card = stage.querySelector('.gc-card');
    const shadow = stage.querySelector('.gc-shadow');
    stage.classList.add('is-3d');
    const ch = (k, c, x = 0) => ({ x, v: 0, t: x, k, c });
    const S = {
      rx: ch(150, 13), ry: ch(150, 13), rz: ch(120, 12),
      tx: ch(110, 14), ty: ch(110, 14), lift: ch(80, 11), idle: ch(40, 10),
    };
    let hover = false, down = false, visible = false, raf = 0, last = 0, t0 = 0;
    let px = .5, py = .5;               // pointer inside the card, 0..1
    let sx = 0, sy = 0, vx = 0, vy = 0, lastX = 0, lastY = 0, lastT = 0; // drag start and hand velocity
    const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

    function aim() {
      const idle = visible && !hover && !down;
      S.idle.t = idle ? 1 : 0;
      if (!visible) { S.lift.t = 0; S.rx.t = S.ry.t = S.rz.t = S.tx.t = S.ty.t = 0; return; }
      if (down) {
        const dx = lastX - sx, dy = lastY - sy;
        S.lift.t = 1.25;
        // On a narrow screen the card has only its gutters to move in: it never carries the page sideways.
        const sr = stage.getBoundingClientRect(), grow = (1100 / (1100 - 87) - 1) * sr.width / 2 + 2;
        S.tx.t = clamp(dx * .42, -clamp(sr.left - grow, 0, 70), clamp(window.innerWidth - sr.right - grow, 0, 70));
        S.ty.t = clamp(dy * .42, -50, 50);
        S.ry.t = clamp(dx * .16, -28, 28) + (px - .5) * 14;
        S.rx.t = clamp(-dy * .16, -22, 22) - (py - .5) * 12;
        S.rz.t = clamp(dx * .035, -7, 7);
      } else if (hover) {
        S.lift.t = .62;
        S.tx.t = S.ty.t = S.rz.t = 0;
        S.ry.t = (px - .5) * 2 * 13;
        S.rx.t = -(py - .5) * 2 * 10;
      } else {
        S.lift.t = .5; // the resting float
        S.tx.t = S.ty.t = S.rx.t = S.ry.t = S.rz.t = 0;
      }
    }

    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) { last = 0; return; }
      const dt = Math.min((now - (last || now)) / 1000, 1 / 20); last = now;
      if (!t0) t0 = now;
      aim();
      const steps = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / steps;
      for (let i = 0; i < steps; i++) for (const s of Object.values(S)) {
        s.v += ((s.t - s.x) * s.k - s.v * s.c) * h;
        s.x += s.v * h;
      }
      // The float: slow, out of step on each axis so it never looks looped.
      const sec = (now - t0) / 1000, f = S.idle.x;
      const fx = Math.sin(sec * 1.05) * 1.7 * f, fy = Math.sin(sec * .8 + 1.3) * 2.3 * f, fz = Math.sin(sec * .65 + .4) * 1.1 * f, fl = Math.sin(sec * 1.2 + .9) * 4 * f;
      const rx = S.rx.x + fx, ry = S.ry.x + fy, rz = S.rz.x + fz, L = Math.max(0, S.lift.x);
      card.style.transform = `translate3d(${S.tx.x.toFixed(2)}px, ${(S.ty.x - fl).toFixed(2)}px, ${(L * 70).toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg)`;
      // The shadow is on the surface below: it slides away from the light as the card rises, softens and fades, and slides against the tilt.
      const rise = L + fl / 30;
      shadow.style.transform = `translate3d(${(S.tx.x * .55 - ry * 1.6).toFixed(2)}px, ${(8 + rise * 46 + S.ty.x * .3 + rx * 1.1).toFixed(2)}px, 0) scale(${(1 - rise * .06).toFixed(3)})`;
      shadow.style.filter = `blur(${(6 + rise * 26).toFixed(1)}px)`;
      shadow.style.opacity = Math.max(.16, .62 - rise * .26).toFixed(3);
      // The highlight is a light fixed above and to the left: it slides across the face as the card turns, and the far edge falls into shade.
      const tilt = clamp((Math.abs(rx) + Math.abs(ry)) / 26, 0, 1);
      card.style.setProperty('--sx', `${(50 - ry * 3.2).toFixed(1)}%`);
      card.style.setProperty('--sy', `${(28 + rx * 3).toFixed(1)}%`);
      card.style.setProperty('--sa', (.1 + tilt * .38 + Math.min(L, 1.3) * .05).toFixed(3));
      card.style.setProperty('--sd', (clamp(ry / 26, -1, 1) * .22).toFixed(3));
      const moving = down || hover || visible; // the float keeps it live while it is in view
      if (moving) raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };

    const local = (e) => {
      const r = card.getBoundingClientRect();
      // The card is tilted, so measure on the stage, which is not.
      const s = stage.getBoundingClientRect();
      px = clamp((e.clientX - s.left) / s.width, 0, 1);
      py = clamp((e.clientY - s.top) / s.height, 0, 1);
      return r;
    };
    stage.addEventListener('pointerenter', (e) => { if (e.pointerType === 'touch') return; hover = true; local(e); kick(); });
    stage.addEventListener('pointermove', (e) => {
      local(e);
      if (down) {
        const now = performance.now(), dtm = Math.max(1, now - lastT);
        vx = vx * .6 + ((e.clientX - lastX) / dtm * 1000) * .4;
        vy = vy * .6 + ((e.clientY - lastY) / dtm * 1000) * .4;
        lastX = e.clientX; lastY = e.clientY; lastT = now;
      } else if (e.pointerType !== 'touch') hover = true;
      kick();
    });
    stage.addEventListener('pointerleave', (e) => { if (!down) { hover = false; kick(); } });
    stage.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      down = true; hover = true; stage.classList.add('is-held');
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
      local(e); sx = lastX = e.clientX; sy = lastY = e.clientY; lastT = performance.now(); vx = vy = 0;
      kick();
    });
    const release = (e) => {
      if (!down) return;
      down = false; stage.classList.remove('is-held');
      try { stage.releasePointerCapture(e.pointerId); } catch (_) {}
      // It leaves the hand with the hand's speed, then the springs settle it back.
      S.tx.v += clamp(vx, -900, 900) * .55; S.ty.v += clamp(vy, -900, 900) * .55;
      S.ry.v += clamp(vx, -900, 900) * .06; S.rx.v -= clamp(vy, -900, 900) * .05;
      if (e.type === 'pointercancel' || e.pointerType === 'touch') hover = false;
      kick();
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('lostpointercapture', release);
    // Picking a different amount flicks the card, as if the figure had been changed under your thumb.
    stage.addEventListener('gc-nudge', () => { S.rx.v -= 55; S.lift.v += 2.2; kick(); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        const was = visible; visible = entry.isIntersecting;
        if (visible && !was) { t0 = 0; kick(); }        // it lifts off the surface when it arrives
        if (!visible) { cancelAnimationFrame(raf); raf = 0; for (const s of Object.values(S)) { s.x = s.t = s.v = 0; } card.style.transform = ''; shadow.style.opacity = ''; }
      }, { threshold: .55 }).observe(stage);
    } else { visible = true; kick(); }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  })();

  // Which cart the open checkout belongs to — its back link returns there.
  let checkoutCart = 'pickup';

  document.getElementById('go-to-checkout').addEventListener('click', () => {
    const kind = state.drawerCart;
    if (state.carts[kind].length === 0) return;
    closeCart();
    openCheckout(kind);
  });

  function openCheckout(kind) {
    checkoutCart = kind;
    // A delivery whose chosen time has passed asks for a new one first, then comes back here.
    if (kind === 'delivery' && !deliverySessionValid()) { startDelivery({ returnTo: 'checkout' }); return; }
    // Catering in the bag needs notice: a time that is too soon (or ASAP) is changed before paying.
    if ((kind === 'pickup' || kind === 'delivery') && !slotMeetsCateringNotice(kind)) { askCateringTime(kind); return; }
    if (kind === 'delivery') setOrderMode('delivery');
    if (kind === 'pickup') renderCheckout();
    else if (kind === 'delivery') renderDeliveryCheckout();
    else renderShipCheckout();
    showView(CHECKOUT_VIEW_FOR[kind]);
  }
  // An address that points at a checkout (a bookmark, Back, a shared link) only opens it when there is something to
  // pay for; otherwise it lands on the page that cart is filled from.
  function openCheckoutFromLink(view) {
    // The gift card checkout is its own flow: it opens only with a card built on the Gift Cards page.
    if (view === 'gift-checkout') { if (!loadGiftOrder()) { showView('gift-cards'); return; } renderGiftCheckout(); showView('gift-checkout'); return; }
    const kind = Object.keys(CHECKOUT_VIEW_FOR).find((k) => CHECKOUT_VIEW_FOR[k] === view);
    if (kind === 'delivery' && (!state.carts.delivery.length || !deliverySessionValid())) { startDelivery(); return; }
    if (!state.carts[kind].length || (kind === 'pickup' && !pickupSessionValid())) { showView(PAGE_FOR_CART[kind]); return; }
    openCheckout(kind);
  }

  document.getElementById('back-to-cart').addEventListener('click', () => {
    // The gift card checkout goes back to the card being built, with everything still filled in.
    if (!views['gift-checkout'].hidden) { showView('gift-cards'); return; }
    showView(PAGE_FOR_CART[checkoutCart]);
    openCart(checkoutCart);
  });

  // ---------- Checkout view ----------
  const STORE_ADDRESSES = {
    'McKinney, TX': '111 W Virginia St, McKinney, TX 75069',
    'Denison, TX': '231 W Main St, Denison, TX 75020',
    'Rockwall, TX': '2065 Summer Lee Drive, Rockwall, TX 75032',
    'Coppell, TX': '3001 Olympus Blvd, Suite 100, Coppell, TX 75019',
  };

  // The menu page's store card and the pickup banner name the chosen store.
  // On a store's own page (#store/<id>) they name that store instead, whatever the customer's pickup is.
  function renderStoreHeadings() {
    const viewing = state.viewStore ? storeById(state.viewStore) : null;
    const name = viewing ? storeName(viewing) : state.location;
    document.querySelector('.store-name').textContent = name;
    document.querySelector('.store-address').textContent = STORE_ADDRESSES[name];
    document.getElementById('store-back').hidden = !viewing;
    renderNavWhere();
  }

  function renderStoreLocatorSummary() {
    renderStoreHeadings();
    document.getElementById('store-locator-name').textContent = state.location;
    document.getElementById('store-locator-address').textContent = STORE_ADDRESSES[state.location];
    if (!views.checkout.hidden) renderCheckoutMap('pickup');
  }

  // The checkout's Store and Pickup time rows open the funnel's own pieces: the location picker, and the
  // location details modal (day and time, with ASAP) in edit mode.
  document.getElementById('open-store-locator').addEventListener('click', () => startFunnel('pickup', { returnTo: 'checkout' }));
  document.getElementById('open-pickup-settings').addEventListener('click', () => {
    const [city, st] = state.location.split(', ');
    openLocationDetails({ city, state: st }, { edit: true });
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

  const cvvHelp = document.getElementById('cvv-help');
  const cvvHint = document.getElementById('cvv-hint');
  cvvHelp.addEventListener('click', () => {
    const open = cvvHint.hidden;
    cvvHint.hidden = !open;
    cvvHelp.setAttribute('aria-expanded', String(open));
  });

  function openAddPayment() {
    lastFocusedEl = document.activeElement;
    addPaymentForm.reset();
    refreshAddPaymentSubmit();
    cvvHint.hidden = true;
    cvvHelp.setAttribute('aria-expanded', 'false');
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

  document.getElementById('close-add-payment').addEventListener('click', closeAddPayment);
  addPaymentBackdrop.addEventListener('click', closeAddPayment);

  // ---------- Add payment method chooser ----------
  // Step before the card form: pick a type. Card continues into the form
  // above; the wallets just join the radio list and become the selection.
  const paymentMethodsBackdrop = document.getElementById('payment-methods-backdrop');
  const paymentMethodsModal = document.getElementById('payment-methods-modal');
  const PAYMENT_CARD_ICON = '<svg width="24" height="24" viewBox="0 0 28 20" fill="none" aria-hidden="true"><rect x="1" y="2" width="26" height="16" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M1 7h26" stroke="currentColor" stroke-width="3"/><path d="M5 13.5h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const PAYMENT_WALLET_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v1.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="8.5" width="18" height="11" rx="2.5" stroke="currentColor" stroke-width="1.8"/><circle cx="16.5" cy="14" r="1.2" fill="currentColor"/></svg>';
  const PAYMENT_OPTIONS = [
    { id: 'card', label: 'Credit or debit card', icon: PAYMENT_CARD_ICON },
    { id: 'apple-pay', label: 'Apple Pay', icon: PAYMENT_WALLET_ICON },
    { id: 'google-pay', label: 'Google Pay', icon: PAYMENT_WALLET_ICON },
    { id: 'paypal', label: 'PayPal', icon: PAYMENT_WALLET_ICON },
  ];
  const PAYMENT_CHEVRON = '<svg class="payment-option-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function openPaymentMethods() {
    lastFocusedEl = document.activeElement;
    document.getElementById('payment-option-list').innerHTML = PAYMENT_OPTIONS.map((o) => `
      <button class="payment-option" type="button" data-id="${o.id}">
        <span class="payment-option-icon">${o.icon}</span>
        <span class="payment-option-label">${escapeHTML(o.label)}</span>
        ${PAYMENT_CHEVRON}
      </button>`).join('');
    paymentMethodsBackdrop.hidden = false;
    paymentMethodsModal.hidden = false;
    updateInert();
    document.getElementById('close-payment-methods').focus();
  }

  function closePaymentMethods() {
    paymentMethodsBackdrop.hidden = true;
    paymentMethodsModal.hidden = true;
    updateInert();
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.getElementById('payment-option-list').addEventListener('click', (e) => {
    const btn = e.target.closest('.payment-option');
    if (!btn) return;
    const option = PAYMENT_OPTIONS.find((o) => o.id === btn.dataset.id);
    closePaymentMethods();
    if (option.id === 'card') { openAddPayment(); return; }
    if (!paymentMethods.includes(option.label)) paymentMethods.push(option.label);
    state.payment = option.label;
    renderPaymentPickers();
  });
  document.querySelectorAll('[data-add-payment]').forEach((btn) => btn.addEventListener('click', openPaymentMethods));
  document.getElementById('close-payment-methods').addEventListener('click', closePaymentMethods);
  paymentMethodsBackdrop.addEventListener('click', closePaymentMethods);

  addPaymentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isAddPaymentFormValid()) return;
    const digits = cardNumberInput.value.replace(/\D/g, '');
    const last4 = digits.slice(-4);
    const nickname = cardNicknameInput.value.trim();
    const label = `${cardBrand(digits)} •••• ${last4}${nickname ? ` (${nickname})` : ''}`;

    paymentMethods.push(label);
    state.payment = label;
    renderPaymentPickers();
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

  // ----- Catering inside a pickup or delivery bag -----
  // A bag with a catering item needs notice, whatever else is in it: about two hours for pickup, a day for delivery, so
  // ASAP and the nearest slots are not offered; delivery also follows the catering fee (a flat fee, free over a threshold).
  const CATERING_NOTICE_MIN = { pickup: 120, delivery: 24 * 60 };
  const bagHasCatering = (kind) => (state.carts[kind] || []).some((line) => line.catering);
  // The notice the "where" modal asks for: a catering item in the bag, or a customer who came in to order catering.
  const cateringLead = (kind) => (bagHasCatering(kind) || cateringIntent || cateringTap ? CATERING_NOTICE_MIN[kind] || 0 : 0);
  const cateringNoticeText = (kind) => (kind === 'delivery' ? "a day's notice" : '2 hours\' notice');
  const cateringBagNote = (kind) => (bagHasCatering(kind)
    ? `Catering in your bag needs ${cateringNoticeText(kind)}${kind === 'delivery' ? `, and delivery is ${money(CATERING_DELIVERY_FEE)} (free over ${money(CATERING_FREE_DELIVERY_AT)})` : ''}.` : '');
  // The chosen slot's start as a time, or null for ASAP (which is "now").
  function chosenSlotStart(kind) {
    const sess = kind === 'delivery' ? state.delivery : { dateKey: state.pickupDateKey, timeId: state.pickupTimeId };
    if (!sess.dateKey || !sess.timeId || sess.timeId === ASAP_ID) return null;
    const [y, m, d] = sess.dateKey.split('-').map(Number);
    return new Date(y, m - 1, d, Number(String(sess.timeId).slice(0, 2)), Number(String(sess.timeId).slice(2)));
  }
  // Checked at checkout, so it follows the bag alone: an order with no catering in it needs no notice.
  function slotMeetsLead(kind, lead) {
    if (!lead) return true;
    const start = chosenSlotStart(kind);
    return !!start && start.getTime() >= Date.now() + lead * 60000;
  }
  function slotMeetsCateringNotice(kind) {
    return slotMeetsLead(kind, bagHasCatering(kind) ? CATERING_NOTICE_MIN[kind] || 0 : 0);
  }
  // Re-opens the day and time step so a slot that is too soon can be moved out.
  function askCateringTime(kind) {
    if (kind === 'delivery') { openLocationDetails(null, { edit: true, kind: 'delivery' }); return; }
    const st = PICKUP_STORES.find((x) => storeName(x) === state.location);
    if (st) openLocationDetails(st, { edit: true });
  }

  function buildTimeSlots(dateKeyValue, leadMin = 0) {
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
    // Closing is today's 8:00 PM, not 8:00 PM of whichever day the cursor landed on: after 11:30 PM the cursor
    // rolls past midnight, and measuring from it offered a whole day of slots from 12:00 AM on.
    const close = new Date(now);
    close.setHours(PICKUP_CLOSE_HOUR, 0, 0, 0);
    const slots = [];
    const [ky, km, kd] = dateKeyValue.split('-').map(Number);
    while (cursor.getTime() + 30 * 60000 <= close.getTime()) {
      const start = new Date(cursor);
      const end = new Date(cursor.getTime() + 30 * 60000);
      cursor = end;
      // With notice required, a slot that starts sooner than that is not on offer.
      if (leadMin && new Date(ky, km - 1, kd, start.getHours(), start.getMinutes()).getTime() < now.getTime() + leadMin * 60000) continue;
      slots.push({
        id: `${pad2(start.getHours())}${pad2(start.getMinutes())}`,
        label: `${formatClock(start.getHours(), start.getMinutes())} – ${formatClock(end.getHours(), end.getMinutes())}`,
      });
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
    renderNavWhere();
  }

  // The banner above the menu: the store, day and time chosen on the way here.
  // The indicator in the nav (pickup from which store, or delivery to where). It names the path the customer is on
  // and opens the "where" modal to change it; before anything is chosen it asks.
  function navWhereState() {
    const pickup = pickupSessionValid();
    const delivery = deliverySessionValid();
    const onCatering = !views.catering.hidden;
    // Catering goes into the pickup or delivery bag, so there the indicator says so.
    const verbs = onCatering ? { delivery: 'Catering delivery to', pickup: 'Catering pickup from' } : { delivery: 'Deliver to', pickup: 'Pickup from' };
    if (delivery && (state.orderMode === 'delivery' || !pickup)) {
      // A delivery bag under the minimum says how much is missing, right where the customer is looking.
      const short = Math.max(0, DELIVERY_MINIMUM - cartSubtotal('delivery'));
      const verb = cartCount('delivery') > 0 && short > 0 ? `${money(short)} to the minimum` : verbs.delivery;
      return { path: 'delivery', verb, name: deliveryLabel(), note: verb !== verbs.delivery };
    }
    if (pickup) {
      // On another store's page the order still goes to the store chosen earlier: say which one it is.
      const viewed = !views.menu.hidden && state.viewStore ? storeName(storeById(state.viewStore)) : null;
      const verb = viewed && viewed !== state.location ? 'Your pickup store' : verbs.pickup;
      return { path: 'pickup', verb, name: state.location, note: verb !== verbs.pickup };
    }
    // A store or address was chosen but its time has gone by: ask for a new time instead of forgetting the choice.
    if (state.delivery.chosen && state.orderMode === 'delivery') return { path: 'delivery', verb: 'Time has passed', name: deliveryLabel(), stale: true };
    if (state.pickupChosen) return { path: 'pickup', verb: 'Time has passed', name: state.location, stale: true };
    if (state.delivery.chosen) return { path: 'delivery', verb: 'Time has passed', name: deliveryLabel(), stale: true };
    return { path: null, verb: 'Pickup or delivery?', name: 'Choose a store' };
  }
  // Where the indicator means nothing it is hidden: the Shipping page (no store or address), the location finder (which is the place to
  // choose one), the order confirmation (the choice has just been used up), and a bag of shipping items alone with nothing chosen.
  function navWhereHidden() {
    if (!views.shipping.hidden || !views['location-picker'].hidden || !views.confirmation.hidden) return true;
    return cartCount('shipping') > 0 && cartCount('pickup') === 0 && cartCount('delivery') === 0 && !pickupSessionValid() && !deliverySessionValid();
  }
  function renderNavWhere() {
    if (!navWhereReady) return;
    const w = navWhereState();
    document.body.classList.toggle('no-nav-where', navWhereHidden());
    document.getElementById('nav-where-verb').textContent = w.verb;
    document.getElementById('nav-where-name').textContent = w.name;
    // The icon is the map's: the egg pin for pickup (and before a choice), the gold truck pin for delivery.
    document.getElementById('nav-where').dataset.path = w.path || '';
    document.getElementById('nav-where').dataset.alert = w.stale ? 'true' : '';
    document.getElementById('nav-where').dataset.note = w.note ? 'true' : '';
    document.getElementById('nav-where').setAttribute('aria-label', w.stale ? `The time for ${w.name} has passed. Choose a new time` : w.path ? `${w.verb} ${w.name}. Change` : 'Choose pickup or delivery');
    renderPayNote();
  }
  function announceNav(message) {
    const region = document.getElementById('nav-status');
    region.textContent = '';
    window.setTimeout(() => { region.textContent = message; }, 50);
  }
  document.getElementById('nav-where').addEventListener('click', () => {
    const w = navWhereState();
    // Nothing chosen yet: the plain funnel. Otherwise the modal changes the order in place.
    if (!w.path) { openWhere(wm.tab); return; }
    // A passed time starts the funnel again on the same path.
    if (w.stale) { openWhere(w.path); return; }
    openWhere(w.path, { returnTo: 'nav' });
  });

  // The line beside Place order: when the order will be ready and where, in plain words.
  function pickupReadyText() {
    if (!state.pickupChosen) return '';
    const readyBy = (state.pickupTimeLabel || '').split(' – ')[1] || state.pickupTimeLabel;
    const dateLabel = pickupDateLabel(state.pickupDateKey);
    if (state.pickupTimeId === ASAP_ID) return `Ready for pickup in about 20–30 minutes at ${state.location}.`;
    if (dateLabel === 'Today') return `Ready for pickup by ${readyBy} today at ${state.location}.`;
    if (dateLabel === 'Tomorrow') return `Ready for pickup by ${readyBy} tomorrow at ${state.location}.`;
    return `Ready for pickup by ${readyBy} on ${dateLabel} at ${state.location}.`;
  }
  function renderPayNote() {
    const el = document.getElementById('pay-note-ready');
    if (el) el.textContent = pickupReadyText();
  }

  // "Tomorrow · 12:00 – 12:30 PM": the chosen day and time in one line. "10:00 AM – 10:30 AM" is shortened to
  // "10:00 – 10:30 AM" so it stays on one line on a phone.
  function pickupWhenText() {
    const time = (state.pickupTimeLabel || '').replace(/^(\d+:\d+) (AM|PM) – (\d+:\d+) \2$/, '$1 – $3 $2');
    return `${pickupDateLabel(state.pickupDateKey)} · ${time}`;
  }

  // The location picker opens on the saved choice (with a Continue) only while it is still valid.
  function syncPickerSaved() {
    // The locations page is a finder now: the saved order lives in the "where" modal, not on this page.
    if (window.degLocationPicker && window.degLocationPicker.setSaved) window.degLocationPicker.setSaved(null);
  }

  // ---------- Pickup session + location details (the Pickup funnel's second step) ----------
  // A pickup order starts when the customer has chosen a store, a day and a time on purpose. That choice is the
  // "pickup session": it is kept for the visit, it lapses when the chosen slot passes, and placing an order ends it.
  const PICKUP_SESSION_KEY = 'deg-pickup-session';
  const ASAP_ID = 'asap';
  const ASAP_LABEL = 'ASAP (20–30 min)';
  state.pickupChosen = false;
  state.delivery = emptyDelivery();

  function savePickupSession() {
    state.pickupChosen = true;
    cateringTap = false;
    clearCateringTimeNotes();
    try {
      localStorage.setItem(PICKUP_SESSION_KEY, JSON.stringify({
        location: state.location, dateKey: state.pickupDateKey, timeId: state.pickupTimeId, timeLabel: state.pickupTimeLabel,
      }));
    } catch (e) { /* storage unavailable: the choice lasts until reload */ }
    syncPickerSaved();
    renderNavWhere();
  }

  function clearPickupSession() {
    state.pickupChosen = false;
    setCateringIntent(false);
    try { localStorage.removeItem(PICKUP_SESSION_KEY); } catch (e) { /* ignore */ }
    syncPickerSaved();
    renderNavWhere();
  }

  // The chosen time has passed if it was an earlier day, or a window starting before now today. ASAP is good for its own day.
  function pickupSlotPassed() {
    const now = new Date();
    const today = dateKey(now);
    if (state.pickupDateKey < today) return true;
    if (state.pickupDateKey > today || state.pickupTimeId === ASAP_ID) return false;
    return Number(state.pickupTimeId) < now.getHours() * 100 + now.getMinutes();
  }
  const pickupSessionValid = () => state.pickupChosen && !pickupSlotPassed();

  function restorePickupSession() {
    try {
      const saved = JSON.parse(localStorage.getItem(PICKUP_SESSION_KEY) || 'null');
      if (!saved || !STORE_ADDRESSES[saved.location]) return;
      Object.assign(state, { location: saved.location, pickupDateKey: saved.dateKey, pickupTimeId: saved.timeId, pickupTimeLabel: saved.timeLabel, pickupChosen: true });
      if (pickupSlotPassed()) clearPickupSession();
    } catch (e) { /* ignore a corrupt session */ }
  }

  const ldBackdrop = document.getElementById('ld-backdrop');
  const ldModal = document.getElementById('ld-modal');
  // What the customer has picked so far in this modal; nothing is saved until "Start my order".
  let ld = null;

  // ASAP is offered only for today, while the store is open with half an hour or more left before it closes.
  function asapAvailable(key) {
    const now = new Date();
    if (key !== dateKey(now)) return false;
    const mins = now.getHours() * 60 + now.getMinutes();
    return mins >= PICKUP_OPEN_HOUR * 60 && mins <= PICKUP_CLOSE_HOUR * 60 - 30;
  }

  function ldTimeOptions(key) {
    const lead = ld ? cateringLead(ld.kind === 'delivery' ? 'delivery' : 'pickup') : 0;
    const slots = buildTimeSlots(key, lead);
    // A bag with catering needs notice, so there is no ASAP.
    if (lead) return slots;
    // Delivery takes longer, so its ASAP closes an hour before the store does, not half an hour.
    if (ld && ld.kind === 'delivery') {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      const open = key === dateKey(now) && mins >= PICKUP_OPEN_HOUR * 60 && mins <= PICKUP_CLOSE_HOUR * 60 - 60;
      return open ? [{ id: ASAP_ID, label: DELIVERY_ASAP_LABEL, note: 'Out for delivery as soon as it is made' }, ...slots] : slots;
    }
    return asapAvailable(key) ? [{ id: ASAP_ID, label: ASAP_LABEL, note: 'Ready as soon as it is made' }, ...slots] : slots;
  }

  function renderLdFooter() {
    const ready = !!(ld.dateKey && ld.timeId);
    const start = document.getElementById('ld-start');
    start.disabled = !ready;
    // Coming from a checkout, this is a step on the way back to it, not the start of an order.
    const back = ld.kind === 'delivery' ? deliveryReturn : funnelReturn;
    const fromCheckout = back === 'checkout';
    start.textContent = ld.edit && back !== 'store' ? 'Update order' : fromCheckout ? 'Continue to checkout' : back === 'store' || back === 'nav' ? 'Continue' : ld.kind === 'delivery' ? 'Continue' : 'Start my order';
    const verb = fromCheckout || back === 'store' || back === 'nav' || ld.edit ? 'continue' : 'start';
    document.getElementById('ld-hint').textContent = ready ? '' : ld.dateKey ? `Pick a time to ${verb}.` : `Pick a day and a time to ${verb}.`;
  }

  function updateLdDateFade() {
    const list = document.getElementById('ld-date-list');
    const wrap = document.getElementById('ld-date-wrap');
    const max = list.scrollWidth - list.clientWidth;
    wrap.classList.toggle('can-scroll-left', list.scrollLeft > 1);
    wrap.classList.toggle('can-scroll-right', list.scrollLeft < max - 1);
  }

  // The day tiles are the next week; a day chosen from the full calendar beyond them gets a tile at the end, selected.
  const PICKUP_HORIZON_DAYS = 60;
  function dateInfoFor(key) {
    const [y, m, dd] = key.split('-').map(Number);
    const d = new Date(y, m - 1, dd);
    const tileTop = d.toLocaleDateString('en-US', { weekday: 'short' });
    const tileSub = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { key, label: `${tileTop}, ${tileSub}`, tileTop, tileSub };
  }
  const ldDateTiles = () => (ld && ld.dateKey && !pickupDatesCache.some((d) => d.key === ld.dateKey) ? [...pickupDatesCache, dateInfoFor(ld.dateKey)] : pickupDatesCache);
  const horizonKey = () => { const n = new Date(); return dateKey(new Date(n.getFullYear(), n.getMonth(), n.getDate() + PICKUP_HORIZON_DAYS)); };

  // "View full calendar": a month at a time, up to PICKUP_HORIZON_DAYS ahead. A day with no times (closed, or too soon for catering) is dimmed.
  let ldCalMonth = null;
  function renderLdCalendar() {
    const first = ldCalMonth;
    const todayKey = dateKey(new Date());
    const last = horizonKey();
    document.getElementById('ld-cal-title').textContent = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const lead = first.getDay();
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    let html = '<span></span>'.repeat(lead);
    for (let i = 1; i <= days; i++) {
      const d = new Date(first.getFullYear(), first.getMonth(), i);
      const key = dateKey(d);
      const off = key < todayKey || key > last || ldTimeOptions(key).length === 0;
      const on = ld && key === ld.dateKey;
      html += `<button class="ld-cal-day${on ? ' is-on' : ''}${key === todayKey ? ' is-today' : ''}" type="button" data-key="${key}" aria-pressed="${on}" aria-label="${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}"${off ? ' disabled' : ''}>${i}</button>`;
    }
    const grid = document.getElementById('ld-cal-grid');
    grid.innerHTML = html;
    grid.querySelectorAll('.ld-cal-day:not([disabled])').forEach((btn) => btn.addEventListener('click', () => {
      ld.dateKey = btn.dataset.key;
      ld.timeId = null;
      ld.timeLabel = null;
      closeLdCalendar();
      renderLdDates();
      renderLdTimes();
      renderLdFooter();
      const active = document.querySelector('#ld-date-list .pickup-date-tile.active');
      if (active) active.scrollIntoView({ block: 'nearest', inline: 'center' });
    }));
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const lastDay = new Date(last.split('-')[0], Number(last.split('-')[1]) - 1, 1);
    document.getElementById('ld-cal-prev').disabled = first <= thisMonth;
    document.getElementById('ld-cal-next').disabled = first >= lastDay;
  }
  function closeLdCalendar() {
    document.getElementById('ld-calendar').hidden = true;
    const link = document.getElementById('ld-calendar-open');
    link.setAttribute('aria-expanded', 'false');
    link.textContent = 'View full calendar';
  }
  document.getElementById('ld-calendar-open').addEventListener('click', (e) => {
    const panel = document.getElementById('ld-calendar');
    if (!panel.hidden) { closeLdCalendar(); return; }
    const from = ld && ld.dateKey ? dateInfoFor(ld.dateKey).key : dateKey(new Date());
    const [y, m] = from.split('-').map(Number);
    ldCalMonth = new Date(y, m - 1, 1);
    renderLdCalendar();
    panel.hidden = false;
    e.currentTarget.setAttribute('aria-expanded', 'true');
    e.currentTarget.textContent = 'Hide calendar';
  });
  [['ld-cal-prev', -1], ['ld-cal-next', 1]].forEach(([id, step]) => document.getElementById(id).addEventListener('click', () => {
    ldCalMonth = new Date(ldCalMonth.getFullYear(), ldCalMonth.getMonth() + step, 1);
    renderLdCalendar();
  }));

  function renderLdDates() {
    const list = document.getElementById('ld-date-list');
    list.innerHTML = '';
    ldDateTiles().forEach((d) => {
      const closed = ldTimeOptions(d.key).length === 0; // e.g. today after the store has closed
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pickup-date-tile' + (d.key === ld.dateKey ? ' active' : '') + (closed ? ' is-closed' : '');
      btn.setAttribute('aria-pressed', String(d.key === ld.dateKey));
      if (closed) btn.disabled = true;
      btn.innerHTML = `${d.tileTop}<span class="pickup-date-sub">${closed ? 'Closed' : d.tileSub}</span>`;
      btn.addEventListener('click', () => {
        if (d.key === ld.dateKey) return;
        ld.dateKey = d.key;
        ld.timeId = null;
        ld.timeLabel = null;
        renderLdDates();
        renderLdTimes();
        renderLdFooter();
      });
      list.appendChild(btn);
    });
    updateLdDateFade();
  }

  function renderLdTimes() {
    const list = document.getElementById('ld-time-list');
    const empty = document.getElementById('ld-time-empty');
    empty.hidden = !!ld.dateKey;
    if (!ld.dateKey) { list.innerHTML = ''; return; }
    const options = ldTimeOptions(ld.dateKey);
    list.innerHTML = options.map((o) => radioChoiceHTML({
      group: 'ld-time', value: o.id, label: o.label, note: o.note, selected: String(o.id) === String(ld.timeId),
    })).join('');
    list.querySelectorAll('.radio-choice-input').forEach((input) => {
      input.addEventListener('change', () => {
        const o = options.find((x) => String(x.id) === input.value);
        ld.timeId = o.id;
        ld.timeLabel = o.label;
        list.querySelectorAll('.radio-choice').forEach((row) => {
          row.classList.toggle('selected', row.querySelector('.radio-choice-input').checked);
        });
        renderLdFooter();
      });
    });
  }

  // From the picker, nothing is preselected. From the menu banner ({ edit: true }) the modal opens on the
  // current day and time, as long as they are still on offer, and saving updates the order in place.
  // The same modal picks a delivery's day and time (`kind: 'delivery'`): then its heading is where the order is
  // going, and "Change store" becomes "Change address".
  function openLocationDetails(store, { edit = false, thenOrder = false, kind = 'pickup' } = {}) {
    const delivery = kind === 'delivery';
    const name = delivery ? '' : `${store.city}, ${store.state}`;
    if (!delivery && !STORE_ADDRESSES[name]) return;
    lastFocusedEl = document.activeElement;
    ld = { store: name, dateKey: null, timeId: null, timeLabel: null, edit, thenOrder, kind };
    const saved = delivery
      ? { ok: deliverySessionValid(), dateKey: state.delivery.dateKey, timeId: state.delivery.timeId, timeLabel: state.delivery.timeLabel }
      : { ok: pickupSessionValid(), dateKey: state.pickupDateKey, timeId: state.pickupTimeId, timeLabel: state.pickupTimeLabel };
    if (edit && saved.ok) {
      const options = ldTimeOptions(saved.dateKey);
      if (options.length) ld.dateKey = saved.dateKey;
      // The saved time can have gone (ASAP after the store's last half hour); then the day stays and the time is asked again.
      if (options.some((o) => String(o.id) === String(saved.timeId))) Object.assign(ld, { timeId: saved.timeId, timeLabel: saved.timeLabel });
    }
    document.getElementById('ld-title').textContent = delivery ? `Deliver to ${deliveryLabel()}` : name;
    document.getElementById('ld-address').textContent = delivery ? deliveryAddressLine() : STORE_ADDRESSES[name];
    const hoursText = delivery ? 'Delivery hours: 10:00 AM – 8:00 PM' : 'Pickup hours: 10:00 AM – 8:00 PM';
    const noticeKind = delivery ? 'delivery' : 'pickup';
    document.getElementById('ld-hours').textContent = bagHasCatering(noticeKind) ? `${hoursText}. Catering in your bag needs ${cateringNoticeText(noticeKind)}.`
      : cateringIntent || cateringTap ? `${hoursText}. Catering orders need ${cateringNoticeText(noticeKind)}.${cateringTap && cartCount(noticeKind) > 0 ? ' Your whole order will be ready at the time you choose.' : ''}` : hoursText;
    document.getElementById('ld-change').textContent = delivery ? 'Change address' : 'Change store';
    closeLdCalendar();
    renderLdDates();
    renderLdTimes();
    renderLdFooter();
    document.querySelector('#ld-modal .ld-scroll').scrollTop = 0;
    ldBackdrop.hidden = false;
    ldModal.hidden = false;
    updateInert();
    updateLdDateFade();
    document.getElementById('ld-close').focus();
  }

  // Closing keeps nothing from the modal and returns to the picker.
  function closeLocationDetails() {
    const back = ldBackToWhere;
    ldBackToWhere = null;
    ldBackdrop.hidden = true;
    ldModal.hidden = true;
    updateInert();
    if (lastFocusedEl) lastFocusedEl.focus();
    // "Change time" on the nav's saved order: whether the time was saved or the modal cancelled, the customer is back on that order.
    if (back) openWhere(back, { returnTo: 'nav' });
  }

  function cancelLocationDetails() {
    dropStoreIntent();
    closeLocationDetails();
  }
  document.getElementById('ld-close').addEventListener('click', cancelLocationDetails);
  // "Change store" goes back to the picker; from the menu banner that means leaving the menu for it.
  document.getElementById('ld-change').addEventListener('click', () => {
    // Only the order page's banner has to leave the page to change store; from the location finder, closing is enough.
    // From the "where" modal it opens again, still carrying a store page tap that is waiting.
    const fromOrder = ld && ld.edit && !ld.thenOrder;
    const fromWhere = ld && ld.fromWhere;
    const wasDelivery = ld && ld.kind === 'delivery';
    const store = wm.preselect;
    ldBackToWhere = null;
    closeLocationDetails();
    if (wasDelivery) {
      if (deliveryReturn === 'store') openWhere('delivery', { returnTo: 'store', store });
      else startDelivery({ returnTo: views['delivery-checkout'].hidden ? null : 'checkout' });
      return;
    }
    if (fromOrder) startFunnel('pickup', { returnTo: views.checkout.hidden ? null : 'checkout' });
    else if (fromWhere) openWhere('pickup', { returnTo: funnelReturn, store });
  });
  ldBackdrop.addEventListener('click', cancelLocationDetails);
  document.getElementById('ld-date-next').addEventListener('click', () => {
    const list = document.getElementById('ld-date-list');
    list.scrollBy({ left: list.clientWidth, behavior: 'smooth' });
  });
  document.getElementById('ld-date-list').addEventListener('scroll', updateLdDateFade);

  document.getElementById('ld-start').addEventListener('click', () => {
    if (!ld || !ld.dateKey || !ld.timeId) return;
    if (ld.kind === 'delivery') { commitDeliveryTime(ld); return; }
    setOrderMode('pickup');
    Object.assign(state, { location: ld.store, pickupDateKey: ld.dateKey, pickupTimeId: ld.timeId, pickupTimeLabel: ld.timeLabel });
    savePickupSession();
    closeLocationDetails();
    renderPickupSummary();
    renderStoreLocatorSummary();
    renderDrawer();
    // At checkout the new time and store are read out, since nothing else moves.
    if (!views.checkout.hidden) announceCheckout(`Pickup updated. ${pickupReadyText()}`);
    // Updating from the order page's banner stays where it is; starting from the picker, or changing the time
    // from its Continue block, opens the order page.
    if (ld.edit && !ld.thenOrder) return;
    finishPickerFunnel();
  });


  // ---------- Delivery funnel ----------
  // The Delivery funnel: Home ("Order delivery") → address step (is it deliverable?) → address details modal (who,
  // where exactly, how to drop off) → day and time (the same modal Pickup uses) → the order page → the Delivery cart
  // → delivery checkout → confirmation. The address, contact and time form the "delivery session", kept for the
  // visit like the pickup one: it lapses when the chosen slot passes, and placing an order ends it.
  const DELIVERY_SESSION_KEY = 'deg-delivery-session';
  // Placeholder delivery area: the ZIP codes around the four stores, each delivered from its nearest store.
  // Real areas, minimums and fees are still to be approved; there is no geocoding here.
  const DELIVERY_AREAS = [
    { store: 'McKinney, TX', cities: { McKinney: ['75069', '75070', '75071', '75072'], Allen: ['75002', '75013'], Frisco: ['75033', '75034', '75035'], Plano: ['75023', '75024', '75025', '75074', '75093'] } },
    { store: 'Rockwall, TX', cities: { Rockwall: ['75032', '75087'], Rowlett: ['75088', '75089'], 'Royse City': ['75189'] } },
    { store: 'Denison, TX', cities: { Denison: ['75020', '75021'], Sherman: ['75090', '75091', '75092'] } },
    { store: 'Coppell, TX', cities: { Coppell: ['75019'], Lewisville: ['75056', '75057', '75067', '75077'], 'Flower Mound': ['75022', '75028'], Carrollton: ['75006', '75007', '75010'], Irving: ['75063'] } },
  ];
  function deliveryAreaFor(zip) {
    for (const area of DELIVERY_AREAS) {
      for (const [city, zips] of Object.entries(area.cities)) if (zips.includes(zip)) return { city, store: area.store };
    }
    return null;
  }

  function emptyDelivery() {
    return {
      chosen: false, street: '', apt: '', city: '', state: 'TX', zip: '', store: '', lat: null, lng: null,
      name: '', phone: '', email: '', nickname: 'Home', otherName: '', dropoff: 'door', notes: '',
      dateKey: null, timeId: null, timeLabel: null,
    };
  }
  function deliveryLabel() {
    const d = state.delivery;
    return d.nickname === 'Other' ? d.otherName || 'Other' : d.nickname;
  }
  function deliveryStreetLine() {
    const d = state.delivery;
    return d.apt ? `${d.street}, ${d.apt}` : d.street;
  }
  function deliveryAddressLine() {
    const d = state.delivery;
    return `${deliveryStreetLine()}, ${d.city}, ${d.state} ${d.zip}`;
  }
  const deliveryDropoffText = () => (state.delivery.dropoff === 'hand' ? 'Hand it to me' : 'Leave it at my door');
  // How to hand it over, with the customer's own note after it ("Leave it at my door · Leave at the front desk").
  const deliveryDropoffLine = () => deliveryDropoffText() + (state.delivery.notes ? ` · ${state.delivery.notes}` : '');

  function saveDeliverySession() {
    cateringTap = false;
    clearCateringTimeNotes();
    try { localStorage.setItem(DELIVERY_SESSION_KEY, JSON.stringify(state.delivery)); } catch (e) { /* storage unavailable: the choice lasts until reload */ }
    renderNavWhere();
  }
  // Placing an order ends the session (the day and time); the address and contact stay for the next order.
  function endDeliverySession() {
    setCateringIntent(false);
    Object.assign(state.delivery, { chosen: false, dateKey: null, timeId: null, timeLabel: null });
    saveDeliverySession();
  }
  function deliverySlotPassed() {
    const d = state.delivery;
    if (!d.dateKey) return true;
    const now = new Date();
    const today = dateKey(now);
    if (d.dateKey < today) return true;
    if (d.dateKey > today || d.timeId === ASAP_ID) return false;
    return Number(d.timeId) < now.getHours() * 100 + now.getMinutes();
  }
  const deliverySessionValid = () => state.delivery.chosen && !deliverySlotPassed();
  function restoreDeliverySession() {
    try {
      const saved = JSON.parse(localStorage.getItem(DELIVERY_SESSION_KEY) || 'null');
      if (!saved || typeof saved !== 'object' || !saved.street) return;
      state.delivery = { ...emptyDelivery(), ...saved };
      if (state.delivery.chosen && deliverySlotPassed()) endDeliverySession();
    } catch (e) { /* ignore a corrupt session */ }
  }
  restoreDeliverySession();

  // "Tomorrow · 12:00 – 12:30 PM", or "ASAP · 35–50 min": the chosen day and time in one line.
  function deliveryWhenText() {
    const d = state.delivery;
    if (d.timeId === ASAP_ID) return 'ASAP · 35–50 min';
    const time = (d.timeLabel || '').replace(/^(\d+:\d+) (AM|PM) – (\d+:\d+) \2$/, '$1 – $3 $2');
    return `${pickupDateLabel(d.dateKey)} · ${time}`;
  }
  // The line beside Place order: when it arrives and where, in plain words.
  function deliveryArrivalText() {
    const d = state.delivery;
    if (!d.chosen) return '';
    if (d.timeId === ASAP_ID) return 'Arriving in about 35–50 minutes.';
    const window = (d.timeLabel || '').replace(' – ', ' and ');
    const day = pickupDateLabel(d.dateKey);
    return `Arriving ${day === 'Today' ? 'today' : day === 'Tomorrow' ? 'tomorrow' : 'on ' + day} between ${window}.`;
  }

  // ----- Step 1: where (one modal for Pickup and Delivery, with a map) -----
  // The modal has two tabs behind a Pickup / Delivery toggle. Pickup lists our stores (nearest first once a place is
  // searched) and pins them on the map; Delivery takes an address, suggests as it is typed, drops a pin and answers
  // whether we deliver there. There is no "Check" button anywhere, and at most one dark button on screen.
  // The map (Leaflet, vendored) and the address search (Photon, OpenStreetMap data) are loaded and called only
  // here; both are companions: the fields, the list and the buttons do everything without them.
  let deliveryReturn = null; // 'checkout' when the funnel was opened from there
  let deliveryChecked = null; // the deliverable address the customer is about to add details to
  const daBackdrop = document.getElementById('da-backdrop');
  const daModal = document.getElementById('da-modal');
  const daAddress = document.getElementById('da-address');
  const daResult = document.getElementById('da-result');
  const DA_ICON = '<svg class="da-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 7h11v9H3V7ZM14 10h4l3 3v3h-7" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="7.5" cy="17.5" r="1.8" fill="var(--deg-cream)" stroke="currentColor" stroke-width="1.4"/><circle cx="17.5" cy="17.5" r="1.8" fill="var(--deg-cream)" stroke="currentColor" stroke-width="1.4"/></svg>';

  // What the modal knows right now. `sel` is the suggestion chosen on the Delivery tab; `store` the store chosen on Pickup.
  const wm = { seq: 0, geoReason: '', tab: 'pickup', sel: null, store: null, point: null, geoDown: false, suggestions: [], active: -1, origin: null, nav: false };
  // Opened from a checkout, the modal is about changing that order: `origin` is that checkout's path. On the same path
  // it only changes the place (a different store, with the day and time kept); on the other path it carries the order
  // over (see moveCart) once the new path's steps are done.
  const currentStoreId = () => { const st = PICKUP_STORES.find((x) => storeName(x) === state.location); return st ? st.id : null; };

  // ----- the four stores -----
  const PICKUP_STORES = [
    { id: 'mckinney', city: 'McKinney', state: 'TX', lat: 33.1972, lng: -96.6154 },
    { id: 'rockwall', city: 'Rockwall', state: 'TX', lat: 32.8990, lng: -96.4670 },
    { id: 'coppell', city: 'Coppell', state: 'TX', lat: 32.9680, lng: -97.0040 },
    { id: 'denison', city: 'Denison', state: 'TX', lat: 33.7554, lng: -96.5391 },
  ];
  const storeName = (st) => `${st.city}, ${st.state}`;
  const storeById = (id) => PICKUP_STORES.find((x) => x.id === id);
  function milesBetween(a, b) {
    const rad = (d) => (d * Math.PI) / 180;
    const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
    return 3958.8 * 2 * Math.asin(Math.sqrt(h));
  }
  // "Open until 8:00 PM" or "Closed · opens 10:00 AM", from the stores' 10 AM – 8 PM hours.
  function storeHoursText() {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    if (mins >= PICKUP_OPEN_HOUR * 60 && mins < PICKUP_CLOSE_HOUR * 60) return { open: true, text: `Open until ${formatClock(PICKUP_CLOSE_HOUR, 0)}` };
    return { open: false, text: `Closed · opens ${mins < PICKUP_OPEN_HOUR * 60 ? '' : 'tomorrow '}${formatClock(PICKUP_OPEN_HOUR, 0)}` };
  }

  // ----- the map (Leaflet, loaded on first use) -----
  let leafletLoad = null;
  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (leafletLoad) return leafletLoad;
    leafletLoad = new Promise((resolve, reject) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'vendor/leaflet.css';
      document.head.appendChild(css);
      const el = document.createElement('script');
      el.src = 'vendor/leaflet.js';
      el.onload = resolve;
      el.onerror = () => { leafletLoad = null; reject(new Error('Could not load the map')); };
      document.head.appendChild(el);
    });
    return leafletLoad;
  }
  let wmMap = null;
  let wmStoreLayer = null;
  let wmPinLayer = null;
  const wmMarkers = {};
  const PIN_PATH = 'M18 0C8.06 0 0 8.06 0 18c0 12.6 18 26 18 26s18-13.4 18-26C36 8.06 27.94 0 18 0Z';
  const storePinHTML = (selected, closed) => `<span class="wm-pin${selected ? ' is-selected' : ''}">${closed ? '<span class="wm-pin-tag">Closed</span>' : ''}<svg width="36" height="44" viewBox="0 0 36 44" aria-hidden="true"><path d="${PIN_PATH}"/><ellipse cx="18" cy="17" rx="6.5" ry="8" class="wm-pin-egg"/><circle cx="18" cy="19" r="3" class="wm-pin-yolk"/></svg></span>`;
  const deliveryPinHTML = '<span class="wm-pin is-delivery"><svg width="44" height="54" viewBox="0 0 36 44" aria-hidden="true"><path d="' + PIN_PATH + '"/><g class="wm-pin-truck" fill="none" stroke-width="1.8" stroke-linejoin="round"><path d="M8.5 13h10v9h-10v-9ZM18.5 15.5h4l3 3.2V22h-7"/><circle cx="12" cy="23" r="1.8"/><circle cx="22.5" cy="23" r="1.8"/></g></svg></span>';
  const mapMove = (fn) => (reduceMotionQuery.matches ? fn(false) : fn(true));

  async function ensureMap() {
    try { await loadLeaflet(); } catch (e) { document.getElementById('wm-map').classList.add('is-unavailable'); return null; }
    if (wmMap) { wmMap.invalidateSize(); return wmMap; }
    const L = window.L;
    wmMap = L.map('wm-map', { zoomControl: false, attributionControl: true, minZoom: 3, maxZoom: 18 });
    wmMap.attributionControl.setPrefix(false);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(wmMap);
    wmStoreLayer = L.layerGroup();
    wmPinLayer = L.layerGroup().addTo(wmMap);
    const L2 = L;
    PICKUP_STORES.forEach((st) => {
      // Created with our own icon, so Leaflet never looks for its default marker images.
      const m = L2.marker([st.lat, st.lng], { icon: L2.divIcon({ className: 'wm-pin-wrap', html: storePinHTML(false, false), iconSize: [36, 44], iconAnchor: [18, 44] }), keyboard: true, title: storeName(st), alt: storeName(st), riseOnHover: true });
      m.on('click', () => selectStore(st.id, { fromMap: true }));
      wmMarkers[st.id] = m;
      wmStoreLayer.addLayer(m);
    });
    new ResizeObserver(() => wmMap && wmMap.invalidateSize()).observe(document.getElementById('wm-map'));
    wmMap.fitBounds(PICKUP_STORES.map((st) => [st.lat, st.lng]), { padding: [40, 40], animate: false });
    return wmMap;
  }
  function refreshStorePins() {
    if (!wmMap) return;
    const hours = storeHoursText();
    PICKUP_STORES.forEach((st) => wmMarkers[st.id].setIcon(window.L.divIcon({
      className: 'wm-pin-wrap', html: storePinHTML(wm.store === st.id, !hours.open), iconSize: [36, 44], iconAnchor: [18, 44],
    })));
  }
  // The map follows the tab: the stores on Pickup, the typed address on Delivery.
  async function syncMap({ fit = true } = {}) {
    const map = await ensureMap();
    if (!map) return;
    map.invalidateSize();
    wmPinLayer.clearLayers();
    if (wm.tab === 'pickup') {
      if (!map.hasLayer(wmStoreLayer)) wmStoreLayer.addTo(map);
      refreshStorePins();
      if (wm.point) {
        window.L.circleMarker([wm.point.lat, wm.point.lng], { radius: 7, className: 'wm-here', interactive: false }).addTo(wmPinLayer);
      }
      if (fit) {
        const near = wm.store ? [storeById(wm.store)] : nearbyStores().slice(0, wm.point ? 2 : 4);
        const pts = near.map((st) => [st.lat, st.lng]).concat(wm.point ? [[wm.point.lat, wm.point.lng]] : []);
        // A place with no store in reach is shown on its own, wide enough to see where it is.
        if (wm.point && !near.length) mapMove((animate) => map.setView([wm.point.lat, wm.point.lng], 7, { animate }));
        else mapMove((animate) => map.fitBounds(pts, { padding: [48, 48], maxZoom: 13, animate }));
      }
    } else {
      if (map.hasLayer(wmStoreLayer)) map.removeLayer(wmStoreLayer);
      if (wm.sel && wm.sel.lat != null) {
        window.L.marker([wm.sel.lat, wm.sel.lng], { icon: window.L.divIcon({ className: 'wm-pin-wrap', html: deliveryPinHTML, iconSize: [44, 54], iconAnchor: [22, 54] }), interactive: false, keyboard: false }).addTo(wmPinLayer);
        if (fit) mapMove((animate) => map.setView([wm.sel.lat, wm.sel.lng], 15, { animate }));
      } else if (fit) {
        map.fitBounds(PICKUP_STORES.map((st) => [st.lat, st.lng]), { padding: [40, 40], animate: false });
      }
    }
  }

  // The pill on the map: where the order is going, once that is known.
  function renderWmPill() {
    const pill = document.getElementById('wm-pill');
    let verb = '';
    let name = '';
    if (wm.tab === 'delivery') {
      if (state.delivery.street) { verb = 'Deliver to'; name = deliveryLabel(); }
    } else if (wm.store) { verb = 'Pick up at'; name = storeName(storeById(wm.store)); }
    pill.hidden = !name;
    pill.dataset.mode = wm.tab;
    document.getElementById('wm-pill-verb').textContent = verb;
    document.getElementById('wm-pill-name').textContent = name;
  }

  // ----- opening, closing, switching -----
  function openWhere(tab, { returnTo = null, store = null } = {}) {
    const fresh = daModal.hidden;
    if (fresh) {
      funnelForCatering = false;
      wm.preselect = store;
      lastFocusedEl = document.activeElement;
      deliveryReturn = returnTo;
      funnelReturn = returnTo;
      wm.origin = returnTo === 'checkout' ? checkoutCart : returnTo === 'nav' ? navWhereState().path : null;
      wm.nav = returnTo === 'nav';
      // A fresh open sets both tabs up, whichever one it opens on.
      resetPickupTab();
      resetDeliveryTab();
      daBackdrop.hidden = false;
      daModal.hidden = false;
      updateInert();
    }
    setWhereTab(tab);
    if (fresh) document.querySelector('#da-toggle .chip.active').focus();
  }
  function closeWhere() {
    dropStoreIntent();
    funnelForCatering = false;
    // Cancelling a funnel started from Home puts the catering flag back as it was.
    if (intentBeforeFunnel !== null) { setCateringIntent(intentBeforeFunnel); intentBeforeFunnel = null; }
    closeWhereQuietly();
    if (lastFocusedEl) lastFocusedEl.focus();
  }
  // Moving on to another step, not cancelling: the next step owns focus, so do not hand it back to the opener.
  function closeWhereQuietly() {
    daBackdrop.hidden = true;
    daModal.hidden = true;
    hideSuggestions();
    updateInert();
  }
  const startDelivery = ({ returnTo = null } = {}) => openWhere('delivery', { returnTo });

  function setWhereTab(tab) {
    wm.tab = tab;
    document.querySelectorAll('#da-toggle .chip').forEach((chip) => {
      const on = chip.dataset.mode === tab;
      chip.classList.toggle('active', on);
      chip.setAttribute('aria-checked', String(on));
    });
    document.getElementById('wm-tab-delivery').hidden = tab !== 'delivery';
    document.getElementById('wm-tab-pickup').hidden = tab !== 'pickup';
    if (tab === 'delivery') initDeliveryTab(); else initPickupTab();
    // Leaving the checkout's own path says what happens to the order.
    const note = document.getElementById('wm-switch-note');
    const moving = wm.origin && wm.origin !== tab;
    note.hidden = !moving;
    if (moving) note.textContent = `Your order moves to ${tab} when you finish here.`;
    renderWmPill();
    syncMap();
  }
  document.getElementById('da-toggle').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip && chip.dataset.mode !== wm.tab) setWhereTab(chip.dataset.mode);
  });
  document.getElementById('da-close').addEventListener('click', closeWhere);
  daBackdrop.addEventListener('click', closeWhere);
  document.getElementById('wm-zoom-in').addEventListener('click', () => wmMap && wmMap.zoomIn());
  document.getElementById('wm-zoom-out').addEventListener('click', () => wmMap && wmMap.zoomOut());

  // ----- the geocoder (Photon) -----
  // The public geocoder can take several seconds, so a request is never cancelled by the next keystroke (that left slow
  // typists with no answer at all): each one runs to completion, the newest one wins, and one that takes too long gives up.
  const geoCache = new Map();
  async function geocode(q, { timeoutMs = 10000 } = {}) {
    const key = q.toLowerCase();
    if (geoCache.has(key)) return geoCache.get(key);
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
    let data;
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en&lat=33.2&lon=-96.6&location_bias_scale=0.6`;
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error('geocoder ' + res.status);
      data = await res.json();
    } finally { window.clearTimeout(timer); }
    const found = (data.features || [])
      .filter((f) => f.properties && f.properties.countrycode === 'US' && f.geometry)
      .map((f) => {
        const p = f.properties;
        const [lng, lat] = f.geometry.coordinates;
        return {
          street: p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street || p.name || '',
          hasNumber: !!p.housenumber, name: p.name || '', type: p.type || '',
          city: p.city || p.district || p.locality || '', stateName: p.state || '', zip: p.postcode || '', lat, lng,
        };
      });
    geoCache.set(key, found);
    return found;
  }

  // ----- Delivery tab -----
  // Each tab's working state is set once, when the modal opens, whichever tab it opens on, so flipping between the
  // tabs (from a checkout or from Home) never finds one of them empty or stale.
  // The saved-order button says where it leads: back to checkout, on with what was tapped or the nav change, or to the menu.
  const savedContinueLabel = () => (funnelReturn === 'checkout' ? 'Continue to checkout' : funnelReturn === 'store' || funnelReturn === 'nav' ? 'Continue' : 'Continue to menu');

  function resetDeliveryTab() {
    // Opening (or coming back with "Change address") keeps the address already entered or just checked.
    const d = state.delivery;
    const from = deliveryChecked || (d.street ? { street: d.street, zip: d.zip, city: d.city, lat: d.lat, lng: d.lng } : null);
    wm.sel = from ? { street: from.street, zip: from.zip, city: from.city, lat: from.lat, lng: from.lng } : null;
    wm.geoDown = false;
    daAddress.value = from ? `${from.street}${from.city ? ', ' + from.city : ''}` : '';
    document.getElementById('da-clear').hidden = !daAddress.value;
    hideSuggestions();
  }
  function initDeliveryTab() {
    // From the delivery checkout the saved delivery is the order being changed, so it is not offered again.
    // From the nav it is the order being changed: the saved delivery shows with a way to change its time.
    const saved = document.getElementById('da-saved');
    const own = wm.origin === 'delivery';
    const ok = deliverySessionValid() && (!own || wm.nav);
    saved.hidden = !ok;
    if (ok) {
      document.getElementById('da-saved-title').textContent = own ? 'Your delivery' : 'Continue your delivery order';
      document.getElementById('da-saved-where').innerHTML = `<strong>${escapeHTML(deliveryLabel())}</strong> · ${escapeHTML(deliveryAddressLine())}`;
      document.getElementById('da-saved-when').textContent = deliveryWhenText();
      // From the nav the saved order also offers the way straight to the menu; from a checkout it is simply the order being changed.
      document.getElementById('da-saved-continue').hidden = own && !wm.nav;
      document.getElementById('da-change-time').hidden = !own;
      document.getElementById('da-saved-continue').textContent = own && wm.nav ? 'Continue to menu' : savedContinueLabel();
    }
    renderDeliveryResult();
  }

  // The ZIP the customer typed at the end of their address ("123 Main St, McKinney TX 75069"), for when the address search
  // cannot place it. There is no separate ZIP field.
  const zipFromText = (text) => ((text.match(/\b(\d{5})(?:-\d{4})?\s*$/) || [])[1] || '');

  // What the address says right now: nothing yet, a place being checked, a deliverable address, or one outside the area.
  function renderDeliveryResult() {
    // Opened from a store page: the way out to pickup names that store.
    const viewed = deliveryReturn === 'store' && wm.preselect ? storeById(wm.preselect) : null;
    const pickupInstead = `<button class="text-btn" id="da-pickup" type="button">${viewed ? `Pick up at ${escapeHTML(viewed.city)} instead` : 'Pickup instead'}</button>`;
    const sel = wm.sel;
    const typed = daAddress.value.trim();
    const street = sel ? sel.street : wm.geoDown ? typed.replace(/[,\s]+(?:TX|Texas)?[,\s]*\d{5}(?:-\d{4})?\s*$/i, '') : '';
    const zip = sel ? sel.zip : wm.geoDown ? zipFromText(typed) : '';
    if (street.length < 3 || !isZip(zip)) {
      deliveryChecked = null;
      const message = sel && !sel.zip && sel.zipLookup !== 'failed' ? 'Checking that address…'
        : sel ? `We couldn't confirm that address's ZIP code. Try the full address with the ZIP code at the end, like "${sel.street}, ${sel.city || 'McKinney'} TX 75069".`
        : wm.geoDown ? (wm.geoReason === 'none' ? 'We couldn\'t find that address. Check the spelling, or type it with the ZIP code at the end, like "123 Main St, McKinney TX 75069".' : 'Address search isn\'t available right now. Type your full address with the ZIP code at the end, like "123 Main St, McKinney TX 75069".')
        : `Search for your street address to see if we deliver there. A ${money(DELIVERY_FEE)} delivery fee applies.`;
      daResult.className = 'delivery-result is-idle';
      daResult.innerHTML = `${DA_ICON}<p class="delivery-result-note">${message}</p>
        ${pickupInstead}`;
      return;
    }
    const area = deliveryAreaFor(zip);
    // Delivery comes from the store that covers the address, which may not be the one whose page this was opened on.
    const fromOther = area && viewed && area.store !== storeName(viewed) ? area.store.split(',')[0] : null;
    deliveryChecked = area ? { street, zip, city: area.city, store: area.store, lat: sel ? sel.lat : null, lng: sel ? sel.lng : null } : null;
    const place = area ? `${area.city}, TX ${zip}` : `${sel && sel.city ? sel.city + ' ' : ''}${zip}`.trim();
    const address = `${escapeHTML(street)}<br>${escapeHTML(place)}`;
    daResult.className = 'delivery-result ' + (area ? 'is-ok' : 'is-no');
    daResult.innerHTML = area ? `${DA_ICON}
      <h2>You're in luck, we can deliver to</h2>
      <p class="delivery-result-address">${address}</p>
      <p class="delivery-result-note">A ${money(DELIVERY_FEE)} delivery fee applies, and the minimum order is ${money(DELIVERY_MINIMUM)}.</p>
      ${fromOther ? `<p class="delivery-result-note">Delivered from ${escapeHTML(fromOther)}, the closest store to you.</p>` : ''}
      <button class="pill-btn dark full" id="da-add-details" type="button">Add address details</button>
      ${pickupInstead}` : `${DA_ICON}
      <h2>Sorry, we can't deliver to</h2>
      <p class="delivery-result-address">${address}</p>
      <p class="delivery-result-note">That address is outside our delivery area for now. Try another address, or pick up at ${viewed ? `our ${escapeHTML(viewed.city)} store` : 'a store'}.</p>
      ${pickupInstead}`;
  }

  // ----- address suggestions -----
  const suggestEl = document.getElementById('wm-suggest');
  function hideSuggestions() {
    suggestEl.hidden = true;
    daAddress.setAttribute('aria-expanded', 'false');
    daAddress.removeAttribute('aria-activedescendant');
    wm.active = -1;
  }
  function renderSuggestions() {
    if (!wm.suggestions.length) { hideSuggestions(); return; }
    suggestEl.innerHTML = wm.suggestions.map((sg, i) => `
      <li role="option" id="wm-opt-${i}" class="wm-option" data-i="${i}" aria-selected="${i === wm.active}">
        <span class="wm-option-pin" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.5" stroke="currentColor" stroke-width="2"/></svg></span>
        <span class="wm-option-text"><strong>${escapeHTML(sg.street)}</strong><span>${escapeHTML([sg.city, sg.stateName, sg.zip].filter(Boolean).join(', '))}</span></span>
      </li>`).join('');
    suggestEl.hidden = false;
    daAddress.setAttribute('aria-expanded', 'true');
  }
  function chooseSuggestion(i) {
    const sg = wm.suggestions[i];
    if (!sg) return;
    wm.sel = { street: sg.street, zip: sg.zip, city: sg.city, lat: sg.lat, lng: sg.lng };
    daAddress.value = `${sg.street}${sg.city ? ', ' + sg.city : ''}`;
    document.getElementById('da-clear').hidden = false;
    hideSuggestions();
    renderDeliveryResult();
    syncMap();
    if (!wm.sel.zip) lookupZip(wm.sel);
  }
  // A suggestion with no ZIP gets it from where it is on the map, so the customer is never asked for it.
  async function lookupZip(sel) {
    try {
      const res = await fetch(`https://photon.komoot.io/reverse?lon=${sel.lng}&lat=${sel.lat}&lang=en`);
      if (!res.ok) throw new Error('reverse ' + res.status);
      const data = await res.json();
      const zip = ((data.features || []).map((f) => f.properties && f.properties.postcode).find(Boolean) || '').slice(0, 5);
      if (wm.sel !== sel) return; // the address changed while this was out
      if (isZip(zip)) sel.zip = zip; else sel.zipLookup = 'failed';
    } catch (e) {
      if (wm.sel !== sel) return;
      sel.zipLookup = 'failed';
    }
    renderDeliveryResult();
  }
  let suggestTimer = null;
  daAddress.addEventListener('input', () => {
    window.clearTimeout(suggestTimer);
    document.getElementById('da-clear').hidden = !daAddress.value;
    // Changing the text makes the chosen address stale.
    if (wm.sel) { wm.sel = null; renderDeliveryResult(); syncMap({ fit: false }); }
    const q = daAddress.value.trim();
    if (q.length < 4) { hideSuggestions(); document.getElementById('da-search-note').textContent = ''; if (wm.geoDown) renderDeliveryResult(); return; }
    if (wm.geoDown) { renderDeliveryResult(); }
    const note = document.getElementById('da-search-note');
    suggestTimer = window.setTimeout(async () => {
      const seq = ++wm.seq;
      note.textContent = 'Searching…';
      try {
        const found = await geocode(q);
        if (seq !== wm.seq) return; // a newer search is on its way: it decides what shows
        note.textContent = '';
        // Street addresses first; a street with no number still helps, a place name does not.
        // The street data often lacks the house number the customer typed; it is kept, on the street's position.
        const typedNumber = (q.match(/^\s*(\d+[A-Za-z]?)\b/) || [])[1];
        const seen = new Set();
        wm.suggestions = found
          .filter((f) => f.street && f.type !== 'city' && f.type !== 'state')
          .map((f) => (typedNumber && !f.hasNumber ? { ...f, street: `${typedNumber} ${f.street}`, hasNumber: true } : f))
          .sort((a, b) => Number(b.hasNumber) - Number(a.hasNumber))
          .filter((f) => { const k = `${f.street}|${f.zip}`; if (seen.has(k)) return false; seen.add(k); return true; })
          .slice(0, 5);
        wm.active = -1;
        if (wm.suggestions.length) {
          wm.geoDown = false;
          wm.geoReason = '';
          renderSuggestions();
        } else {
          // Nothing matched: say so and offer the ZIP route, so the customer is never left typing into a field that answers nothing.
          wm.geoDown = true;
          wm.geoReason = 'none';
          hideSuggestions();
          renderDeliveryResult();
        }
      } catch (e) {
        if (seq !== wm.seq) return;
        note.textContent = '';
        wm.geoDown = true;
        wm.geoReason = 'down';
        hideSuggestions();
        renderDeliveryResult();
      }
    }, 500);
  });
  daAddress.addEventListener('keydown', (e) => {
    const open = !suggestEl.hidden;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!open) return;
      e.preventDefault();
      const n = wm.suggestions.length;
      wm.active = (wm.active + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
      suggestEl.querySelectorAll('.wm-option').forEach((li, i) => li.setAttribute('aria-selected', String(i === wm.active)));
      daAddress.setAttribute('aria-activedescendant', 'wm-opt-' + wm.active);
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      chooseSuggestion(wm.active >= 0 ? wm.active : 0);
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation();
      hideSuggestions();
    }
  });
  suggestEl.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus in the field
  suggestEl.addEventListener('click', (e) => {
    const li = e.target.closest('.wm-option');
    if (li) chooseSuggestion(Number(li.dataset.i));
  });
  daAddress.addEventListener('blur', () => window.setTimeout(hideSuggestions, 120));
  document.getElementById('da-clear').addEventListener('click', () => {
    daAddress.value = '';
    wm.sel = null;
    hideSuggestions();
    document.getElementById('da-clear').hidden = true;
    renderDeliveryResult();
    syncMap();
    daAddress.focus();
  });
  // Enter with the address complete moves on.
  document.getElementById('da-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!suggestEl.hidden) { chooseSuggestion(wm.active >= 0 ? wm.active : 0); return; }
    renderDeliveryResult();
    if (deliveryChecked) { closeWhereQuietly(); openDeliveryDetails({ from: deliveryChecked }); }
  });

  daResult.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'da-add-details') { closeWhereQuietly(); openDeliveryDetails({ from: deliveryChecked }); }
    else if (btn.id === 'da-pickup') setWhereTab('pickup');
  });
  document.getElementById('da-saved-continue').addEventListener('click', () => {
    closeWhereQuietly();
    // Opened from the nav on the delivery that is already chosen: this goes to the menu, not back to the page it was opened on.
    if (wm.nav && wm.origin === 'delivery') deliveryReturn = null;
    finishDeliveryFunnel();
  });
  document.getElementById('da-change-time').addEventListener('click', () => {
    const back = wm.nav ? 'delivery' : null;
    closeWhereQuietly();
    openLocationDetails(null, { edit: true, kind: 'delivery' });
    ldBackToWhere = back;
  });

  // ----- Pickup tab -----
  // How far a customer can sensibly be from the store they pick up at. A searched place with no store inside it gets
  // the "no stores near that location" answer instead of a list of stores hours away. A placeholder, until approved.
  const PICKUP_RADIUS_MILES = 50;
  function sortedStores() {
    const list = PICKUP_STORES.map((st) => ({ ...st, miles: wm.point ? milesBetween(wm.point, st) : null }));
    return wm.point ? list.sort((a, b) => a.miles - b.miles) : list.sort((a, b) => a.city.localeCompare(b.city));
  }
  // The stores worth showing: all four with no place searched, otherwise only those within reach of it.
  function nearbyStores() {
    const list = sortedStores();
    return wm.point ? list.filter((st) => st.miles <= PICKUP_RADIUS_MILES) : list;
  }
  function resetPickupTab() {
    // From the pickup checkout the current store starts chosen: the modal is only there to change it.
    wm.store = wm.origin === 'pickup' ? currentStoreId() : wm.preselect || null;
    wm.point = null;
    document.getElementById('wm-pk-q').value = '';
    document.getElementById('wm-pk-clear').hidden = true;
    document.getElementById('wm-pk-note').textContent = '';
  }
  function initPickupTab() {
    // From the pickup checkout the saved pickup is the order being changed, so it is not offered again.
    const saved = document.getElementById('wm-pk-saved');
    const own = wm.origin === 'pickup';
    const ok = pickupSessionValid() && (!own || wm.nav);
    saved.hidden = !ok;
    if (ok) {
      document.getElementById('wm-pk-saved-title').textContent = own ? 'Your pickup' : 'Continue your pickup order';
      document.getElementById('wm-pk-saved-where').innerHTML = `<strong>${escapeHTML(state.location)}</strong> · ${escapeHTML(STORE_ADDRESSES[state.location] || '')}`;
      document.getElementById('wm-pk-saved-when').textContent = pickupWhenText();
      document.getElementById('wm-pk-saved-continue').hidden = own && !wm.nav;
      document.getElementById('wm-pk-change-time').hidden = !own;
      document.getElementById('wm-pk-saved-continue').textContent = own && wm.nav ? 'Continue to menu' : savedContinueLabel();
      // Tapped on another store's page: the saved pickup is the one to keep, the store below the one to switch to.
      const keeping = switchingFrom();
      if (keeping) {
        document.getElementById('wm-pk-saved-title').textContent = `Your order is set for ${keeping}`;
        document.getElementById('wm-pk-saved-continue').textContent = `Keep ${keeping}`;
      }
    }
    renderStoreList();
  }
  // The city of the pickup already set, while a store page tap for a different store is waiting on this modal.
  function switchingFrom() {
    if (funnelReturn !== 'store' || !wm.preselect || wm.origin === 'pickup' || !pickupSessionValid()) return null;
    const current = storeById(currentStoreId());
    return current && current.id !== wm.preselect ? current.city : null;
  }
  function renderStoreList() {
    const hours = storeHoursText();
    const list = document.getElementById('wm-stores');
    const storeOnly = wm.origin === 'pickup';
    const current = storeOnly ? currentStoreId() : null;
    const shown = nearbyStores();
    const none = !!wm.point && !shown.length;
    document.getElementById('wm-pk-title').textContent = wm.point ? 'Nearby' : 'Our stores';
    document.getElementById('wm-pk-title').hidden = none;
    list.hidden = none;
    document.getElementById('wm-pk-empty').hidden = !none;
    if (none) document.getElementById('wm-pk-note').textContent = '';
    list.innerHTML = shown.map((st) => `
      <li><div class="radio-choice wm-store${wm.store === st.id ? ' selected' : ''}">
        <label class="radio-choice-row">
          <input class="radio-choice-input" type="radio" name="wm-store" value="${st.id}"${wm.store === st.id ? ' checked' : ''}>
          <span class="radio-choice-text">
            <span class="radio-choice-name">${escapeHTML(storeName(st))}</span>
            <span class="radio-choice-note">${escapeHTML(STORE_ADDRESSES[storeName(st)] || '')}</span>
            <span class="radio-choice-note wm-store-meta">${st.id === current ? 'Your store · ' : ''}${st.miles != null ? `${st.miles < 10 ? st.miles.toFixed(1) : Math.round(st.miles)} mi · ` : ''}${escapeHTML(hours.text)}</span>
          </span>
          <span class="radio-choice-ind" aria-hidden="true"></span>
        </label>
      </div></li>`).join('');
    list.querySelectorAll('.radio-choice-input').forEach((input) => input.addEventListener('change', () => selectStore(input.value)));
    // The one action: "Pick up here", or from the pickup checkout "Update pickup location", which waits for a different store.
    const pick = document.getElementById('wm-pk-pick');
    const keeping = switchingFrom();
    const chosen = storeById(wm.store);
    pick.textContent = storeOnly ? 'Update pickup location'
      : keeping && chosen ? (wm.store === currentStoreId() ? `Keep ${keeping}` : `Switch to ${chosen.city}`)
      : 'Pick up here';
    pick.disabled = storeOnly && wm.store === current;
    document.getElementById('wm-pk-actions').hidden = !wm.store || none;
  }
  function selectStore(id, { fromMap = false } = {}) {
    wm.store = id;
    renderStoreList();
    renderWmPill();
    refreshStorePins();
    const st = storeById(id);
    if (wmMap) mapMove((animate) => wmMap.setView([st.lat, st.lng], Math.max(wmMap.getZoom(), 12), { animate }));
    if (fromMap) {
      const row = document.querySelector(`#wm-stores input[value="${id}"]`);
      if (row) row.closest('li').scrollIntoView({ block: 'nearest' });
    }
  }
  // "No stores near that location": the way on is a different search, or having eggs shipped.
  document.getElementById('wm-pk-ship').addEventListener('click', () => {
    closeWhere();
    history.pushState(null, '', '#shipping');
    showView('shipping');
  });
  document.getElementById('wm-pk-pick').addEventListener('click', () => {
    const st = storeById(wm.store);
    if (!st) return;
    // From the pickup checkout only the store changes: the day and time stay, and the customer is back where they were.
    if (wm.origin === 'pickup') {
      if (st.id === currentStoreId()) return;
      const fromNav = wm.nav;
      // From the nav the modal stays open: the saved order above updates to the new store and "Continue to menu" is still there.
      if (!fromNav) closeWhere();
      state.location = storeName(st);
      savePickupSession();
      renderPickupSummary();
      renderStoreLocatorSummary();
      renderDrawer();
      const msg = `Pickup location updated to ${state.location}. ${pickupReadyText()}`;
      if (fromNav) { initPickupTab(); renderWmPill(); refreshStorePins(); announceNav(msg); return; }
      if (views.checkout.hidden) announceNav(msg); else announceCheckout(msg);
      return;
    }
    const switching = switchingFrom();
    closeWhereQuietly();
    // Keeping the store already set carries on with its day and time.
    if (switching && st.id === currentStoreId()) { finishPickerFunnel(); return; }
    // Switching stores offers the day and time already set, while the new store still has them.
    openLocationDetails(st, switching ? { edit: true, thenOrder: true } : {});
    if (ld) { ld.fromWhere = true; renderLdFooter(); }
  });
  document.getElementById('wm-pk-saved-continue').addEventListener('click', () => {
    closeWhereQuietly();
    if (wm.nav && wm.origin === 'pickup') funnelReturn = null;
    finishPickerFunnel();
  });
  document.getElementById('wm-pk-change-time').addEventListener('click', () => {
    const st = storeById(currentStoreId());
    const back = wm.nav ? 'pickup' : null;
    closeWhereQuietly();
    if (st) { openLocationDetails(st, { edit: true }); ldBackToWhere = back; }
  });

  // A searched place (or the customer's location) puts the stores in order of distance from it.
  function showPickupPoint(point, label) {
    wm.point = point;
    wm.store = wm.origin === 'pickup' ? currentStoreId() : null;
    document.getElementById('wm-pk-note').textContent = label ? `Showing stores near ${label}.` : '';
    renderStoreList();
    syncMap();
  }
  const pkInput = document.getElementById('wm-pk-q');
  const pkSuggest = document.getElementById('wm-pk-suggest');
  const pk = { suggestions: [], active: -1, seq: 0, timer: null };
  const PK_PIN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.4" stroke="currentColor" stroke-width="2"/></svg>';
  function hidePkSuggestions() {
    pkSuggest.hidden = true;
    pkInput.setAttribute('aria-expanded', 'false');
    pkInput.removeAttribute('aria-activedescendant');
    pk.active = -1;
  }
  function renderPkSuggestions() {
    if (!pk.suggestions.length) { hidePkSuggestions(); return; }
    pkSuggest.innerHTML = pk.suggestions.map((sg, i) => `
      <li role="option" id="wm-pk-opt-${i}" class="wm-option" data-i="${i}" aria-selected="${i === pk.active}">
        <span class="wm-option-pin" aria-hidden="true">${PK_PIN}</span>
        <span class="wm-option-text"><strong>${escapeHTML(sg.title)}</strong>${sg.sub ? `<span>${escapeHTML(sg.sub)}</span>` : ''}</span>
      </li>`).join('');
    pkSuggest.hidden = false;
    pkInput.setAttribute('aria-expanded', 'true');
  }
  // Places for the typed text: a ZIP we deliver in is answered at once; anything else asks the geocoder, and keeps the
  // cities, states and ZIP codes (a street result stands for its town).
  async function placeSuggestions(q) {
    if (/^\d{5}$/.test(q)) {
      const known = deliveryAreaFor(q);
      if (known) {
        const near = PICKUP_STORES.find((st) => storeName(st) === known.store);
        return [{ title: `${known.city}, TX ${q}`, sub: '', label: `${known.city}, TX ${q}`, lat: near.lat, lng: near.lng }];
      }
    }
    const found = await geocode(q);
    const places = ['city', 'district', 'locality', 'county', 'state', 'suburb', 'borough'];
    const seen = new Set();
    const out = [];
    found.forEach((f) => {
      const isPlace = places.includes(f.type);
      const name = isPlace ? (f.name || f.city) : f.city;
      if (!name) return;
      const title = f.type === 'state' ? name : [name, f.stateName].filter(Boolean).join(', ');
      const zip = /^\d/.test(q) && f.zip ? f.zip : '';
      const key = `${title}|${zip}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ title: zip ? `${title} ${zip}` : title, sub: '', label: zip ? `${title} ${zip}` : title, lat: f.lat, lng: f.lng });
    });
    return out.slice(0, 5);
  }
  function choosePkSuggestion(i) {
    const sg = pk.suggestions[i];
    if (!sg) return;
    window.clearTimeout(pk.timer);
    pk.seq += 1;
    pkInput.value = sg.label;
    document.getElementById('wm-pk-clear').hidden = false;
    hidePkSuggestions();
    showPickupPoint({ lat: sg.lat, lng: sg.lng }, sg.label);
  }
  pkInput.addEventListener('input', () => {
    document.getElementById('wm-pk-clear').hidden = !pkInput.value;
    window.clearTimeout(pk.timer);
    const q = pkInput.value.trim();
    const note = document.getElementById('wm-pk-note');
    if (q.length < 3) { pk.seq += 1; hidePkSuggestions(); if (note.textContent === 'Searching…') note.textContent = ''; return; }
    pk.timer = window.setTimeout(async () => {
      const seq = ++pk.seq;
      note.textContent = 'Searching…';
      try {
        const list = await placeSuggestions(q);
        if (seq !== pk.seq) return; // a newer search is on its way: it decides what shows
        pk.suggestions = list;
        pk.active = -1;
        if (list.length) { note.textContent = ''; renderPkSuggestions(); } else { hidePkSuggestions(); note.textContent = "We couldn't find that place. Try a city, state or ZIP code."; }
      } catch (err) {
        if (seq !== pk.seq) return;
        hidePkSuggestions();
        note.textContent = "Search isn't available right now. Our four stores are listed below.";
      }
    }, 450);
  });
  pkInput.addEventListener('keydown', (e) => {
    const open = !pkSuggest.hidden;
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && open) {
      e.preventDefault();
      const n = pk.suggestions.length;
      pk.active = (pk.active + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
      pkSuggest.querySelectorAll('.wm-option').forEach((li, i) => li.setAttribute('aria-selected', String(i === pk.active)));
      pkInput.setAttribute('aria-activedescendant', 'wm-pk-opt-' + pk.active);
    } else if (e.key === 'Enter' && open && pk.active >= 0) {
      e.preventDefault();
      choosePkSuggestion(pk.active);
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation();
      hidePkSuggestions();
    }
  });
  pkSuggest.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus in the field
  pkSuggest.addEventListener('click', (e) => {
    const li = e.target.closest('.wm-option');
    if (li) choosePkSuggestion(Number(li.dataset.i));
  });
  pkInput.addEventListener('blur', () => window.setTimeout(hidePkSuggestions, 120));
  document.getElementById('wm-pk-clear').addEventListener('click', () => {
    pkInput.value = '';
    document.getElementById('wm-pk-clear').hidden = true;
    window.clearTimeout(pk.timer);
    pk.seq += 1;
    hidePkSuggestions();
    wm.point = null;
    wm.store = wm.origin === 'pickup' ? currentStoreId() : null;
    document.getElementById('wm-pk-note').textContent = '';
    renderStoreList();
    syncMap();
    pkInput.focus();
  });
  document.getElementById('wm-pk-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = pkInput.value.trim();
    const note = document.getElementById('wm-pk-note');
    window.clearTimeout(pk.timer);
    pk.seq += 1;
    hidePkSuggestions();
    if (q.length < 2) return;
    // A ZIP in our delivery area is answered without the network.
    const known = /^\d{5}$/.test(q) ? deliveryAreaFor(q) : null;
    if (known) {
      const near = PICKUP_STORES.find((st) => storeName(st) === known.store);
      showPickupPoint({ lat: near.lat, lng: near.lng }, q);
      return;
    }
    note.textContent = 'Searching…';
    try {
      const found = await geocode(q);
      const hit = found[0];
      if (!hit) { note.textContent = "We couldn't find that place. Try a city, state or ZIP code."; return; }
      showPickupPoint({ lat: hit.lat, lng: hit.lng }, [hit.city || hit.name, hit.stateName].filter(Boolean).join(', ') || q);
    } catch (err) {
      if (err.name === 'AbortError') return;
      note.textContent = "Search isn't available right now. Our four stores are listed below.";
    }
  });

  // The target button: stores (or the address) near where the customer is.
  document.getElementById('wm-locate').addEventListener('click', () => {
    const note = document.getElementById(wm.tab === 'pickup' ? 'wm-pk-note' : 'da-result');
    if (!navigator.geolocation) { if (wm.tab === 'pickup') note.textContent = "Your browser can't share your location. Search by city, state or ZIP."; return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (wm.tab === 'pickup') { showPickupPoint(point, 'you'); return; }
      if (wmMap) mapMove((animate) => wmMap.setView([point.lat, point.lng], 15, { animate }));
    }, () => {
      if (wm.tab === 'pickup') note.textContent = "We couldn't get your location. Search by city, state or ZIP instead.";
    }, { timeout: 8000 });
  });

  // ----- Step 2: address details -----
  const ddBackdrop = document.getElementById('dd-backdrop');
  const ddModal = document.getElementById('dd-modal');
  const ddFields = {
    street: document.getElementById('dd-street'), apt: document.getElementById('dd-apt'),
    name: document.getElementById('dd-name'), phone: document.getElementById('dd-phone'),
    other: document.getElementById('dd-nick-other'), notes: document.getElementById('dd-notes'),
  };
  let dd = null; // { edit, nickname, dropoff, area }

  function renderDdNick() {
    document.querySelectorAll('#dd-nick .chip').forEach((chip) => {
      const on = chip.dataset.value === dd.nickname;
      chip.classList.toggle('active', on);
      chip.setAttribute('aria-checked', String(on));
    });
    ddFields.other.hidden = dd.nickname !== 'Other';
  }
  function renderDdDropoff() {
    const list = document.getElementById('dd-dropoff');
    list.innerHTML = [
      { value: 'door', label: 'Leave it at my door', note: 'Contactless' },
      { value: 'hand', label: 'Hand it to me', note: 'Your courier meets you at the door' },
    ].map((o) => radioChoiceHTML({ group: 'dd-dropoff', value: o.value, label: o.label, note: o.note, selected: o.value === dd.dropoff })).join('');
    list.querySelectorAll('.radio-choice-input').forEach((input) => {
      input.addEventListener('change', () => {
        dd.dropoff = input.value;
        list.querySelectorAll('.radio-choice').forEach((row) => row.classList.toggle('selected', row.querySelector('.radio-choice-input').checked));
      });
    });
  }
  const updateDdCount = () => { document.getElementById('dd-count').textContent = `${ddFields.notes.value.length} / 200`; };

  // `from` is the address the customer just checked on the step before (street, ZIP, city, store); `edit` reopens
  // the saved details from checkout or the banner, keeping the address they already have.
  function openDeliveryDetails({ from = null, edit = false } = {}) {
    const d = state.delivery;
    const area = from || { street: d.street, zip: d.zip, city: d.city, store: d.store, lat: d.lat, lng: d.lng };
    lastFocusedEl = document.activeElement;
    dd = { edit, area, nickname: d.nickname || 'Home', dropoff: d.dropoff || 'door' };
    ddFields.street.value = area.street;
    ddFields.apt.value = from ? '' : d.apt;
    ddFields.name.value = d.name;
    ddFields.phone.value = d.phone;
    ddFields.other.value = d.otherName;
    ddFields.notes.value = d.notes;
    Object.values(ddFields).forEach((input) => setFieldError(input, ''));
    document.getElementById('dd-where').textContent = `${area.city}, TX ${area.zip}`;
    renderDdNick();
    renderDdDropoff();
    updateDdCount();
    // With a valid day and time already chosen, saving goes straight back to checkout.
    document.getElementById('dd-save').textContent = edit || (deliveryReturn === 'checkout' && deliverySessionValid()) ? 'Save' : 'Continue';
    document.querySelector('#dd-modal .ld-scroll').scrollTop = 0;
    ddBackdrop.hidden = false;
    ddModal.hidden = false;
    updateInert();
    document.getElementById('dd-close').focus();
  }
  function closeDeliveryDetails() {
    ddBackdrop.hidden = true;
    ddModal.hidden = true;
    updateInert();
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  function cancelDeliveryDetails() {
    dropStoreIntent();
    closeDeliveryDetails();
  }
  document.getElementById('dd-close').addEventListener('click', cancelDeliveryDetails);
  ddBackdrop.addEventListener('click', cancelDeliveryDetails);
  document.getElementById('dd-change').addEventListener('click', () => {
    closeDeliveryDetails();
    const returnTo = dd && dd.edit ? 'checkout' : deliveryReturn;
    openWhere('delivery', { returnTo, store: returnTo === 'store' ? wm.preselect : null });
  });
  document.getElementById('dd-nick').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    dd.nickname = chip.dataset.value;
    renderDdNick();
    if (dd.nickname === 'Other') ddFields.other.focus();
  });
  ddFields.notes.addEventListener('input', updateDdCount);

  document.getElementById('dd-save').addEventListener('click', () => {
    const rows = [
      [ddFields.street, present, 'Enter the street address to deliver to.'],
      [ddFields.name, present, 'Enter the name for this order.'],
      [ddFields.phone, isPhone, 'Enter a phone number with area code.'],
    ];
    if (dd.nickname === 'Other') rows.push([ddFields.other, present, 'Name this address, like "Mom\'s".']);
    if (!validateFields(rows)) return;
    Object.assign(state.delivery, {
      street: ddFields.street.value.trim(), apt: ddFields.apt.value.trim(), city: dd.area.city, state: 'TX', zip: dd.area.zip, store: dd.area.store, lat: dd.area.lat ?? null, lng: dd.area.lng ?? null,
      name: ddFields.name.value.trim(), phone: ddFields.phone.value.trim(),
      nickname: dd.nickname, otherName: dd.nickname === 'Other' ? ddFields.other.value.trim() : '',
      dropoff: dd.dropoff, notes: ddFields.notes.value.trim(),
    });
    saveDeliverySession();
    closeDeliveryDetails();
    // Saving from checkout, or changing the address with a valid day and time already chosen, goes straight back.
    if (dd.edit || ((deliveryReturn === 'checkout' || deliveryReturn === 'nav') && deliverySessionValid())) {
      if (!views['delivery-checkout'].hidden) { renderDeliveryCheckout(); announceCheckout('Delivery details updated.'); return; }
      if (deliveryReturn === 'checkout' || deliveryReturn === 'nav') { finishDeliveryFunnel(); return; }
      renderNavWhere();
      renderDrawer();
      return;
    }
    openLocationDetails(null, { kind: 'delivery' });
  });

  // ----- Step 3: day and time (the Pickup modal, in delivery mode) -----
  function commitDeliveryTime(chosen) {
    Object.assign(state.delivery, { dateKey: chosen.dateKey, timeId: chosen.timeId, timeLabel: chosen.timeLabel, chosen: true });
    saveDeliverySession();
    closeLocationDetails();
    if (chosen.edit && !chosen.thenOrder) {
      renderNavWhere();
      renderDrawer();
      if (!views['delivery-checkout'].hidden) { renderDeliveryCheckout(); announceCheckout(`Delivery updated. ${deliveryArrivalText()}`); }
      return;
    }
    finishDeliveryFunnel();
  }

  // The funnel's work is done: back to checkout if the customer came from there, otherwise on to the order page.
  function finishDeliveryFunnel() {
    const back = deliveryReturn;
    deliveryReturn = null;
    setOrderMode('delivery');
    if (back === 'store') { renderDrawer(); resumeStorePage(); return; }
    if (back === 'nav') {
      const moved = wm.origin === 'pickup' ? moveCart('pickup', 'delivery') : 0;
      renderDrawer();
      renderNavWhere();
      announceNav(moved ? 'Your order moved to delivery.' : 'Delivery updated.');
      return;
    }
    if (back === 'checkout') {
      // Switching from the pickup checkout: the order comes along.
      const moved = checkoutCart === 'pickup' ? moveCart('pickup', 'delivery') : 0;
      checkoutCart = 'delivery';
      renderDrawer();
      renderDeliveryCheckout();
      showView('delivery-checkout');
      if (moved) announceCheckout('Your order moved to delivery.');
      return;
    }
    renderDrawer();
    landOnOrderPage();
  }

  // Payment methods are data: the two saved ones plus any card added in the
  // modal. Rows update in place on change so keyboard focus survives.
  const paymentMethods = ['Apple Pay', 'Visa •••• 4242'];
  // Every checkout has a payment list; they all show the same methods and
  // the same selection, so each re-renders together.
  function renderPaymentPickers() {
    document.querySelectorAll('.payment-picker').forEach((picker) => {
      picker.innerHTML = paymentMethods.map((label, i) => radioChoiceHTML({
        group: 'payment-' + picker.id, value: i, label, selected: label === state.payment,
      })).join('');
      picker.querySelectorAll('.radio-choice-input').forEach((input) => {
        input.addEventListener('change', () => {
          state.payment = paymentMethods[Number(input.value)];
          picker.querySelectorAll('.radio-choice').forEach((row) => {
            row.classList.toggle('selected', row.querySelector('.radio-choice-input').checked);
          });
        });
      });
    });
  }
  renderPaymentPickers();

  const tipCustomWrap = document.getElementById('tip-custom');
  const tipCustomInput = document.getElementById('tip-custom-input');

  document.getElementById('tip-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-value]');
    if (!btn) return;
    document.querySelectorAll('#tip-picker .chip').forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-checked', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-checked', 'true');
    const isCustom = btn.dataset.value === 'custom';
    state.tipPct = isCustom ? 'custom' : Number(btn.dataset.value);
    tipCustomWrap.hidden = !isCustom;
    if (isCustom) tipCustomInput.focus();
    renderCheckoutTotals();
    announceTotal();
  });

  // Dollars and cents only, up to 4 whole digits: anything else snaps back to
  // the last valid value instead of letting NaN or a stray character reach the total.
  let lastValidTip = '';
  tipCustomInput.addEventListener('input', () => {
    if (/^\d{0,4}(\.\d{0,2})?$/.test(tipCustomInput.value)) lastValidTip = tipCustomInput.value;
    else tipCustomInput.value = lastValidTip;
    state.tipCustom = parseFloat(lastValidTip) || 0;
    renderCheckoutTotals();
    announceTotal();
  });
  tipCustomInput.addEventListener('blur', () => {
    if (tipCustomInput.value === '') return;
    lastValidTip = state.tipCustom.toFixed(2);
    tipCustomInput.value = lastValidTip;
  });

  // The order-summary list shared by all three checkouts.
  function renderSummaryItems(list, countEl, items) {
    list.innerHTML = '';
    items.forEach((item) => {
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
        ${lineSub(item) ? `<span class="drawer-item-sub">${lineSub(item)}</span>` : ''}
        <span class="drawer-item-price">${money(lineTotal(item))}</span>
      `;
      row.appendChild(body);
      list.appendChild(row);
    });
    const totalQty = unitsIn(null, items);
    countEl.textContent = `(${totalQty} item${totalQty === 1 ? '' : 's'})`;
  }

  // Name, number and email are the same person's whichever checkout comes first: the other one starts with them filled in
  // (typing over them is fine, and a field already filled is left alone).
  const CONTACT_FIELDS = [['name', 'name'], ['phone', 'phone'], ['email', 'email']];
  const CONTACT_PREFIX = { pickup: 'co-', delivery: 'dc-', ship: 'sc-' };
  function shareContact(into) {
    CONTACT_FIELDS.forEach(([key, suffix]) => {
      const target = document.getElementById(CONTACT_PREFIX[into] + suffix);
      if (target.value) return;
      const others = Object.entries(CONTACT_PREFIX).filter(([k]) => k !== into).map(([, p]) => document.getElementById(p + suffix).value);
      target.value = others.find(Boolean) || (state.delivery && state.delivery[key]) || '';
    });
  }

  function renderCheckout() {
    shareContact('pickup');
    const pkNote = document.getElementById('co-catering-note');
    pkNote.textContent = cateringBagNote('pickup');
    pkNote.hidden = !pkNote.textContent;
    renderSummaryItems(document.getElementById('checkout-items'), document.getElementById('checkout-item-count'), state.carts.pickup);
    renderCheckoutTotals();
    renderPayNote();
  }

  const orderSummaryToggle = document.getElementById('toggle-order-summary');
  const orderSummaryCollapse = document.getElementById('order-summary-collapse');
  function setOrderSummaryOpen(open) {
    orderSummaryToggle.setAttribute('aria-expanded', String(open));
    orderSummaryCollapse.classList.toggle('collapsed', !open);
  }
  orderSummaryToggle.addEventListener('click', () => {
    setOrderSummaryOpen(orderSummaryToggle.getAttribute('aria-expanded') !== 'true');
  });

  function setSummaryOpen(toggle, open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.nextElementSibling.classList.toggle('collapsed', !open);
  }
  // The shipping and delivery checkouts collapse their summaries the same way.
  ['sc', 'dc', 'gk'].forEach((p) => {
    const toggle = document.getElementById(p + '-toggle-summary');
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      toggle.nextElementSibling.classList.toggle('collapsed', expanded);
    });
  });

  let placingOrder = false;

  function renderCheckoutTotals() {
    const { subtotal, tax, total: preTipTotal } = computeTotals();
    // A tip is a percentage of the food, not of a gift card.
    const tipBase = taxableSubtotal('pickup');
    const tipAmt = state.tipPct === 'custom' ? state.tipCustom : tipBase * (state.tipPct / 100);
    const total = preTipTotal + tipAmt;

    document.getElementById('sum-subtotal').textContent = money(subtotal);
    document.getElementById('sum-tax').textContent = money(tax);
    document.getElementById('sum-tip').textContent = money(tipAmt);
    // Each tip choice shows what it comes to in dollars, so the choice is a figure, not just a percentage.
    document.querySelectorAll('#tip-picker .tip-chip').forEach((chip) => {
      const pct = chip.dataset.value === 'custom' ? null : Number(chip.dataset.value);
      chip.querySelector('.tip-chip-amt').textContent = money(pct === null ? state.tipCustom : tipBase * (pct / 100));
    });
    document.getElementById('sum-total').textContent = money(total);
    if (!placingOrder) document.getElementById('place-order').textContent = 'Place order';
    return total;
  }

  const PIN_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 22s7-7.58 7-12A7 7 0 0 0 5 10c0 4.42 7 12 7 12Z" stroke="#402D00" stroke-width="1.8"/><circle cx="12" cy="10" r="2.5" stroke="#402D00" stroke-width="1.8"/></svg>';
  const MAIL_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5.5" width="18" height="13" rx="2.5" stroke="#402D00" stroke-width="1.8"/><path d="M4 7.5l8 6 8-6" stroke="#402D00" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';


  // ---------- Delivery checkout ----------
  const dcMinNote = document.getElementById('dc-min-note');
  state.dTipPct = 18;
  state.dTipCustom = 0;

  function deliveryTotals() {
    const subtotal = cartSubtotal('delivery');
    const tax = taxableSubtotal('delivery') * TAX_RATE;
    const tip = state.dTipPct === 'custom' ? state.dTipCustom : taxableSubtotal('delivery') * (state.dTipPct / 100);
    // Catering in the bag brings the catering delivery fee: a flat fee, free over the threshold.
    const fee = bagHasCatering('delivery') ? (subtotal >= CATERING_FREE_DELIVERY_AT ? 0 : CATERING_DELIVERY_FEE) : DELIVERY_FEE;
    return { subtotal, fee, tax, tip, total: subtotal + fee + tax + tip };
  }

  function renderDeliveryTotals() {
    const t = deliveryTotals();
    document.getElementById('dc-subtotal').textContent = money(t.subtotal);
    document.getElementById('dc-fee').textContent = money(t.fee);
    document.getElementById('dc-tax').textContent = money(t.tax);
    document.getElementById('dc-tip').textContent = money(t.tip);
    document.querySelectorAll('#dc-tip-picker .tip-chip').forEach((chip) => {
      const pct = chip.dataset.value === 'custom' ? null : Number(chip.dataset.value);
      chip.querySelector('.tip-chip-amt').textContent = money(pct === null ? state.dTipCustom : taxableSubtotal('delivery') * (pct / 100));
    });
    document.getElementById('dc-total').textContent = money(t.total);
    // Below the minimum the order cannot be placed; the note says by how much, and the cart is where to fix it.
    const short = Math.max(0, DELIVERY_MINIMUM - t.subtotal);
    dcMinNote.hidden = short === 0;
    dcMinNote.textContent = short > 0 ? `Add ${money(short)} to reach the ${money(DELIVERY_MINIMUM)} delivery minimum.` : '';
    if (!placingOrder) document.getElementById('dc-place-order').disabled = short > 0;
    return t.total;
  }

  function renderDeliveryCheckout() {
    const d = state.delivery;
    document.getElementById('dc-address-name').textContent = deliveryLabel();
    document.getElementById('dc-address-line').textContent = deliveryAddressLine();
    document.getElementById('dc-dropoff-line').textContent = deliveryDropoffLine();
    document.getElementById('dc-time-summary').textContent = d.chosen ? deliveryWhenText() : '';
    renderDeliveryEta();
    const dlNote = document.getElementById('dc-catering-note');
    dlNote.textContent = cateringBagNote('delivery');
    dlNote.hidden = !dlNote.textContent;
    if (!views['delivery-checkout'].hidden) renderCheckoutMap('delivery');
    // The name and number were asked for with the address, so they arrive filled in; typing over them is fine.
    [['dc-name', d.name], ['dc-phone', d.phone], ['dc-email', d.email]].forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (!input.value && value) input.value = value;
    });
    shareContact('delivery');
    renderSummaryItems(document.getElementById('dc-items'), document.getElementById('dc-item-count'), state.carts.delivery);
    document.getElementById('dc-pay-note').textContent = deliveryArrivalText();
    renderDeliveryTotals();
  }


  // ----- The checkout's map: where the order is going, with the way to change how -----
  // Pickup and delivery checkouts open on a map (the store's pin, or the delivery address's gold pin) with a Pickup /
  // Delivery toggle laid over it. The map is only a picture here (it does not pan or zoom, so it never catches a
  // scroll); the pin sits in the middle of the part of it that the toggle leaves clear. The toggle's other side opens
  // the "where" modal, which carries the order over.
  const miniMaps = {};
  const TOGGLE_ZONE = 64; // the toggle's height plus its margin, at the top of the map
  function whereTarget(kind) {
    if (kind === 'pickup') {
      const st = PICKUP_STORES.find((x) => storeName(x) === state.location);
      return st ? { lat: st.lat, lng: st.lng, html: storePinHTML(false, false), size: [36, 44] } : null;
    }
    const d = state.delivery;
    let { lat, lng } = d;
    if (lat == null) {
      // An address typed without the address search has no position; the store that delivers it stands in.
      const st = PICKUP_STORES.find((x) => storeName(x) === d.store);
      if (!st) return null;
      ({ lat, lng } = st);
    }
    return { lat, lng, html: deliveryPinHTML, size: [44, 54] };
  }
  // A small still map with one pin, the pin's body centred in the part of the map that is clear of `topZone` px at its top.
  async function placePinMap(key, el, target, topZone) {
    try { await loadLeaflet(); } catch (e) { el.classList.add('is-unavailable'); return; }
    const L = window.L;
    let m = miniMaps[key];
    if (!m) {
      const map = L.map(el, { zoomControl: false, attributionControl: true, dragging: false, touchZoom: false, doubleClickZoom: false, scrollWheelZoom: false, boxZoom: false, keyboard: false, tap: false });
      map.attributionControl.setPrefix(false);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      }).addTo(map);
      m = miniMaps[key] = { map, layer: L.layerGroup().addTo(map) };
    }
    m.map.invalidateSize();
    m.layer.clearLayers();
    L.marker([target.lat, target.lng], {
      icon: L.divIcon({ className: 'wm-pin-wrap', html: target.html, iconSize: target.size, iconAnchor: [target.size[0] / 2, target.size[1]] }),
      interactive: false, keyboard: false,
    }).addTo(m.layer);
    // Put the map's centre above the pin by half the top zone plus half the pin, so the pin's body sits mid-way in the clear area.
    const zoom = 15;
    const point = m.map.project([target.lat, target.lng], zoom).subtract([0, topZone / 2 + target.size[1] / 2]);
    m.map.setView(m.map.unproject(point, zoom), zoom, { animate: false });
  }
  function renderCheckoutMap(kind) {
    const el = document.getElementById(kind === 'pickup' ? 'co-map' : 'dc-map');
    const target = whereTarget(kind);
    if (el && target) placePinMap(kind, el, target, TOGGLE_ZONE);
  }
  document.querySelectorAll('.where-toggle').forEach((toggle) => toggle.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip || chip.classList.contains('active')) return;
    openWhere(chip.dataset.where, { returnTo: 'checkout' });
  }));

  // "Estimated arrival", set big like Chipotle's: the minutes for an ASAP order, or the window it was scheduled for.
  function renderDeliveryEta() {
    const d = state.delivery;
    const eta = document.getElementById('dc-eta');
    eta.hidden = !d.chosen;
    if (!d.chosen) return;
    const label = document.getElementById('dc-eta-label');
    const value = document.getElementById('dc-eta-value');
    const sub = document.getElementById('dc-eta-sub');
    if (d.timeId === ASAP_ID) {
      label.textContent = 'Estimated arrival';
      value.textContent = '35–50';
      sub.textContent = 'minutes until arrival (soonest available)';
      return;
    }
    const m = (d.timeLabel || '').match(/^(\d+:\d+) (AM|PM) – (\d+:\d+) (AM|PM)$/);
    label.textContent = 'Scheduled arrival';
    value.textContent = m ? `${m[1]}–${m[3]}` : d.timeLabel;
    sub.textContent = `${m ? (m[2] === m[4] ? m[2] : `${m[2]} to ${m[4]}`) : ''} · ${pickupDateLabel(d.dateKey)}`.replace(/^ · /, '');
  }

  document.getElementById('dc-open-address').addEventListener('click', () => openDeliveryDetails({ edit: true }));
  document.getElementById('dc-open-time').addEventListener('click', () => openLocationDetails(null, { edit: true, kind: 'delivery' }));

  const dcTipCustomWrap = document.getElementById('dc-tip-custom');
  const dcTipCustomInput = document.getElementById('dc-tip-custom-input');
  document.getElementById('dc-tip-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-value]');
    if (!btn) return;
    document.querySelectorAll('#dc-tip-picker .chip').forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-checked', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-checked', 'true');
    const isCustom = btn.dataset.value === 'custom';
    state.dTipPct = isCustom ? 'custom' : Number(btn.dataset.value);
    dcTipCustomWrap.hidden = !isCustom;
    if (isCustom) dcTipCustomInput.focus();
    renderDeliveryTotals();
    announceCheckout(`Courier tip ${document.getElementById('dc-tip').textContent}. Order total ${document.getElementById('dc-total').textContent}.`, 600);
  });
  let lastValidDTip = '';
  dcTipCustomInput.addEventListener('input', () => {
    if (/^\d{0,4}(\.\d{0,2})?$/.test(dcTipCustomInput.value)) lastValidDTip = dcTipCustomInput.value;
    else dcTipCustomInput.value = lastValidDTip;
    state.dTipCustom = parseFloat(lastValidDTip) || 0;
    renderDeliveryTotals();
    announceCheckout(`Courier tip ${document.getElementById('dc-tip').textContent}. Order total ${document.getElementById('dc-total').textContent}.`, 600);
  });
  dcTipCustomInput.addEventListener('blur', () => {
    if (dcTipCustomInput.value === '') return;
    lastValidDTip = state.dTipCustom.toFixed(2);
    dcTipCustomInput.value = lastValidDTip;
  });

  document.getElementById('dc-place-order').addEventListener('click', () => {
    if (state.carts.delivery.length === 0 || placingOrder) return;
    if (cartSubtotal('delivery') < DELIVERY_MINIMUM) return;
    if (!slotMeetsCateringNotice('delivery')) { askCateringTime('delivery'); return; }
    // The day and time chosen on the way in can pass while the customer fills in the form.
    if (!deliverySessionValid()) { startDelivery({ returnTo: 'checkout' }); return; }
    if (!validateFields([
      [document.getElementById('dc-name'), present, 'Enter the name for this order.'],
      [document.getElementById('dc-phone'), isPhone, 'Enter a phone number with area code.'],
      [document.getElementById('dc-email'), isEmail, 'Enter a valid email so we can confirm your order.'],
    ])) return;
    Object.assign(state.delivery, {
      name: document.getElementById('dc-name').value.trim(),
      phone: document.getElementById('dc-phone').value.trim(),
      email: document.getElementById('dc-email').value.trim(),
    });

    const DC_BUTTONS = ['dc-place-order'];
    setPlacingOrder(true, DC_BUTTONS);
    window.setTimeout(() => {
      setPlacingOrder(false, DC_BUTTONS);
      if (state.carts.delivery.length === 0) return;
      const total = renderDeliveryTotals();
      const t = deliveryTotals();
      const d = state.delivery;
      const asap = d.timeId === ASAP_ID;
      const dateLabel = pickupDateLabel(d.dateKey);
      const windowText = (d.timeLabel || '').replace(' – ', ' and ');
      const whenPhrase = asap ? 'in about <strong>35–50 minutes</strong>'
        : dateLabel === 'Today' ? `today between <strong>${windowText}</strong>`
        : dateLabel === 'Tomorrow' ? `tomorrow between <strong>${windowText}</strong>`
        : `on <strong>${dateLabel}</strong> between <strong>${windowText}</strong>`;
      const items = recapLines(state.carts.delivery);
      items.push({ label: 'Delivery fee', amount: money(t.fee) });
      items.push({ label: 'Tax', amount: money(t.tax) });
      if (t.tip > 0) items.push({ label: 'Courier tip', amount: money(t.tip) });
      const addressLines = `<strong>${escapeHTML(deliveryLabel())}</strong><br>${escapeHTML(deliveryStreetLine())}<br>${escapeHTML(d.city)}, ${d.state} ${escapeHTML(d.zip)}<br>${escapeHTML(deliveryDropoffLine())}`;

      clearCart('delivery');
      endDeliverySession();
      showConfirmation({
        number: orderNumber(),
        subHTML: asap
          ? `Order {number} · We're preparing it now — arriving ${whenPhrase}`
          : `Order {number} · Scheduled for delivery ${whenPhrase}`,
        steps: ['Preparing', 'Delivered'],
        name: document.getElementById('dc-name').value,
        cheer: 'Your order is about to hit the road.',
        items, total,
        cardHTML: `${PIN_ICON}<span>${addressLines}</span>`,
        backLabel: '← Back to home', backView: 'home',
      });
    }, 900);
  });

  // ---------- Confirmation (all three carts) ----------
  // One confirmation page; each cart fills in its own sentence, progress
  // labels, recap and where-to-next card. Nothing here is a real order: the
  // number is made up on the spot, as the pickup one always was.
  let confirmBack = 'order';
  const orderNumber = () => '#DE-' + Math.floor(10000 + Math.random() * 89999);

  // The moment after an order is placed: a greeting by first name and a line of the brand's voice, then the page is "stamped" (see
  // "Confirmation: the order is stamped" in styles.css) with a burst of yolk-colored confetti. None of it waits on anything: the page
  // is complete and usable the whole time, and with reduced motion it simply is the finished page.
  const motionReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const firstNameOf = (full) => {
    const first = String(full || '').trim().split(/\s+/)[0] || '';
    return first && first === first.toLowerCase() ? first.charAt(0).toUpperCase() + first.slice(1) : first;
  };
  const CONFETTI_COLORS = ['#F7BA17', '#FFD426', '#FFDEA0', '#8B5E00', '#130D00'];
  function confettiBurst(origin) {
    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    layer.setAttribute('aria-hidden', 'true');
    const g = 1500; // px/s², so the pieces arc up and then fall
    let longest = 0;
    for (let i = 0; i < 34; i += 1) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      const size = 6 + Math.random() * 7;
      const yolk = i % 3 === 0;
      piece.style.width = `${size}px`;
      piece.style.height = `${yolk ? size : size * 1.35}px`;
      piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      piece.style.borderRadius = yolk ? '50%' : '50% 50% 50% 50% / 62% 62% 38% 38%'; // a yolk, or a little egg
      const angle = (-90 + (Math.random() - .5) * 150) * Math.PI / 180;
      const speed = 380 + Math.random() * 520;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = 1.5 + Math.random() * .8;
      const spin = (Math.random() - .5) * 900;
      const frames = [];
      for (let k = 0; k <= 12; k += 1) {
        const t = (k / 12) * life;
        frames.push({
          transform: `translate(${origin.x + vx * t}px, ${origin.y + vy * t + .5 * g * t * t}px) rotate(${spin * t}deg)`,
          opacity: k / 12 > .72 ? 1 - (k / 12 - .72) / .28 : 1,
          offset: k / 12,
        });
      }
      piece.animate(frames, { duration: life * 1000, delay: 380 + Math.random() * 90, easing: 'linear', fill: 'both' });
      longest = Math.max(longest, life * 1000 + 470);
      layer.appendChild(piece);
    }
    document.body.appendChild(layer);
    window.setTimeout(() => layer.remove(), longest + 100);
  }
  let celebrateTimer = null;
  function celebrateOrder() {
    const view = views.confirmation;
    window.clearTimeout(celebrateTimer);
    view.classList.remove('is-celebrating');
    if (motionReduced()) return;
    view.querySelectorAll('.recap .summary-line').forEach((line, i) => line.style.setProperty('--i', String(Math.min(i, 8))));
    void view.offsetWidth; // restart the sequence for an order placed after another
    view.classList.add('is-celebrating');
    celebrateTimer = window.setTimeout(() => view.classList.remove('is-celebrating'), 3600);
    const badge = view.querySelector('.success-badge').getBoundingClientRect();
    if (badge.width && view.querySelector('.success-badge').animate) confettiBurst({ x: badge.left + badge.width / 2, y: badge.top + badge.height / 2 });
    if (navigator.vibrate) navigator.vibrate([14, 50, 22]);
  }

  function showConfirmation({ number, subHTML, steps, items, total, cardHTML, backLabel, backView, name, cheer, gift, title }) {
    const who = firstNameOf(name);
    // A gift card has nothing to prepare or collect: no tracker, and a way to send another.
    views.confirmation.classList.toggle('is-gift', !!gift);
    document.getElementById('confirm-another').hidden = !gift;
    document.getElementById('confirm-title').textContent = title || (who ? `Order confirmed, ${who}!` : 'Order confirmed!');
    const cheerEl = document.getElementById('confirm-cheer');
    cheerEl.textContent = cheer || '';
    cheerEl.hidden = !cheer;
    document.getElementById('confirm-sub').innerHTML = subHTML.replace('{number}', `<strong>${number}</strong>`);
    if (!gift) {
      document.getElementById('progress-step2-label').textContent = steps[0];
      document.getElementById('progress-step3-label').textContent = steps[1];
    }
    document.getElementById('fulfillment-card').innerHTML = cardHTML;
    const confirmItems = document.getElementById('confirm-items');
    confirmItems.innerHTML = '';
    items.forEach((line) => {
      const el = document.createElement('div');
      el.className = 'summary-line';
      // A line with choices on it (what was left out, toast, add-ons) shows them under its name, as the bag and checkout do.
      el.innerHTML = `<span class="summary-line-text"><span>${line.label}</span>${line.sub ? `<small class="summary-line-sub">${line.sub}</small>` : ''}</span><span>${line.amount}</span>`;
      confirmItems.appendChild(el);
    });
    document.getElementById('confirm-total').textContent = money(total);
    document.getElementById('back-to-menu').textContent = backLabel;
    confirmBack = backView;
    showView('confirmation');
    // The page changed without a click on it, so focus goes to its heading and it is read out.
    const heading = document.querySelector('#view-confirmation h1');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    celebrateOrder();
  }

  // A catering box keeps its choices in .config, not in .sub, so its detail comes from lineSub like the bag's; the text is already safe HTML.
  const recapLines = (items) => items.map((item) => ({ label: `${item.name} ×${item.qty}`, sub: lineSub(item), amount: money(lineTotal(item)) }));

  // Switching a checkout from pickup to delivery (or back) takes its lines with it. Carts are otherwise kept apart;
  // this is the one place they join, and only when the customer changes how the order is fulfilled.
  function moveCart(from, to) {
    const lines = state.carts[from];
    if (!lines.length) return 0;
    lines.forEach((line) => {
      if (line.cart) line.cart = to;
      if (!line.catering && typeof line.basePrice === 'number') line.price = to === 'delivery' ? forDelivery(line.basePrice) : line.basePrice;
    });
    state.carts[to].push(...lines);
    state.carts[from] = [];
    persistCart();
    renderCartBadge();
    renderDrawer();
    return lines.length;
  }

  function clearCart(kind) {
    state.carts[kind] = [];
    persistCart();
    renderCartBadge();
    renderDrawer();
  }

  // Placing the order takes a moment on screen, so the button says so and cannot be pressed twice.
  // A quiet status region (visually hidden, announced politely) for what happens on this page without a focus move.
  const checkoutStatus = document.getElementById('checkout-status');
  let statusTimer = null;
  function announceCheckout(message, delay = 50) {
    const region = !views['gift-checkout'].hidden ? document.getElementById('gk-status')
      : !views['ship-checkout'].hidden ? document.getElementById('sc-status')
      : !views['delivery-checkout'].hidden ? document.getElementById('dc-status') : checkoutStatus;
    window.clearTimeout(statusTimer);
    region.textContent = '';
    statusTimer = window.setTimeout(() => { region.textContent = message; }, delay);
  }
  const announceTotal = () => announceCheckout(`Tip ${document.getElementById('sum-tip').textContent}. Order total ${document.getElementById('sum-total').textContent}.`, 600);

  function setPlacingOrder(on, ids = ['place-order']) {
    placingOrder = on;
    if (on) announceCheckout('Placing your order…');
    ids.forEach((id) => {
      const btn = document.getElementById(id);
      btn.disabled = on;
      btn.setAttribute('aria-busy', String(on));
      btn.textContent = on ? 'Placing order…' : 'Place order';
    });
  }

  document.getElementById('place-order').addEventListener('click', () => {
    if (state.carts.pickup.length === 0 || placingOrder) return;
    if (!slotMeetsCateringNotice('pickup')) { askCateringTime('pickup'); return; }
    // The store calls this number if something is wrong, and the receipt goes to the email, so all three fields are required.
    if (!validateFields([
      [document.getElementById('co-name'), present, 'Enter the name for this order.'],
      [document.getElementById('co-phone'), isPhone, 'Enter a phone number with area code.'],
      [document.getElementById('co-email'), isEmail, 'Enter a valid email so we can confirm your order.'],
    ])) return;

    setPlacingOrder(true);
    window.setTimeout(() => {
      setPlacingOrder(false);
      if (state.carts.pickup.length === 0) return;
      const total = renderCheckoutTotals();
      const address = STORE_ADDRESSES[state.location] || STORE_ADDRESSES['McKinney, TX'];
      const dateLabel = pickupDateLabel(state.pickupDateKey);
      const readyBy = state.pickupTimeLabel.split(' – ')[1] || state.pickupTimeLabel;
      const whenPhrase = state.pickupTimeId === ASAP_ID ? 'in about <strong>20–30 minutes</strong>'
        : dateLabel === 'Today' ? `by <strong>${readyBy}</strong>`
        : dateLabel === 'Tomorrow' ? `tomorrow at <strong>${readyBy}</strong>`
        : `on <strong>${dateLabel}</strong> at <strong>${readyBy}</strong>`;
      const items = recapLines(state.carts.pickup);

      clearCart('pickup');
      clearPickupSession();
      showConfirmation({
        number: orderNumber(),
        subHTML: state.pickupTimeId === ASAP_ID
          ? `Order {number} · We're preparing it now — ready for pickup at <strong>${state.location}</strong> ${whenPhrase}`
          : `Order {number} · Scheduled for pickup at <strong>${state.location}</strong> ${whenPhrase}`,
        steps: ['Preparing', 'Ready'],
        name: document.getElementById('co-name').value,
        cheer: state.pickupTimeId === ASAP_ID ? 'We’re already deviling your order.' : 'We’ll have it deviled and waiting.',
        items, total,
        cardHTML: `${PIN_ICON}<span>${address}</span><a class="pill-btn outline sm" id="get-directions" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" target="_blank" rel="noopener">Get directions</a>`,
        backLabel: '← Back to home', backView: 'home',
      });
    }, 900);
  });

  // A placed order ends its pickup or delivery session, so the order page is no longer open to the customer: pickup and
  // delivery confirmations go back Home, where the next order starts. Shipping and Catering go back to their own pages.
  document.getElementById('confirm-another').addEventListener('click', () => { showView('gift-cards'); });
  document.getElementById('back-to-menu').addEventListener('click', () => {
    if (confirmBack === 'home') history.replaceState(null, '', '#home');
    showView(confirmBack);
  });

  // ---------- Shared checkout form helpers ----------
  // An inline error sits at the end of its field group, like the signup forms';
  // it clears as soon as the field is touched again.
  function setFieldError(input, message) {
    const group = input.closest('.field-group') || input.parentElement;
    let el = group.querySelector('.field-error');
    if (!message) {
      if (el) el.remove();
      input.removeAttribute('aria-invalid');
      if (input.id && input.getAttribute('aria-describedby') === input.id + '-error') input.removeAttribute('aria-describedby');
      return;
    }
    if (!el) {
      el = document.createElement('p');
      el.className = 'field-error';
      el.setAttribute('role', 'alert');
      // The message is the field's description too, so it is read when focus lands on the field.
      if (input.id) { el.id = input.id + '-error'; input.setAttribute('aria-describedby', el.id); }
      group.appendChild(el);
      input.addEventListener('input', () => setFieldError(input, ''), { once: true });
      input.addEventListener('change', () => setFieldError(input, ''), { once: true });
    }
    el.textContent = message;
    input.setAttribute('aria-invalid', 'true');
  }

  // Runs [input, test, message] rows; marks every failure, focuses the first. True when all pass.
  function validateFields(rows) {
    let first = null;
    let failed = 0;
    rows.forEach(([input, ok, message]) => {
      const pass = ok(input.value.trim());
      setFieldError(input, pass ? '' : message);
      if (!pass) { failed += 1; if (!first) first = input; }
    });
    if (first) {
      first.focus();
      // Focus moves to the first problem and reads its message; the count says how many more there are.
      if (failed > 1 && first.closest('#view-checkout, #view-delivery-checkout, #view-ship-checkout')) announceCheckout(`${failed} fields need attention.`, 700);
    }
    return !first;
  }
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = (v) => v.replace(/\D/g, '').length >= 10;
  const present = (v) => v.length > 0;
  const isZip = (v) => /^\d{5}$/.test(v);

  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  };
  const addDaysISO = (iso, n) => {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d + n);
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  };
  const longDate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };
  const clockLabel = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return formatClock(h, m);
  };

  // ---------- Shipping checkout ----------
  // Prototype rate only: the live site works shipping out from the address and shows no price before it, so this one flat figure
  // stands in (and says so on the page) until real pricing exists. It appears only once a ZIP code has been entered.
  const SHIPPING_RATE_PLACEHOLDER = 19.99;

  // Holiday windows are the only way to order a kit for now (the live cart works the same way): the customer reserves a window, not a
  // date. Each can be ordered until its cutoff day, as on the live page's lineup.
  const SHIP_WINDOWS = [
    { id: 'halloween', label: 'Halloween', range: 'Oct 28 – Oct 30', cutoff: '2026-10-27', cutoffLabel: 'Oct 27' },
    { id: 'thanksgiving', label: 'Thanksgiving', range: 'Nov 24 – Nov 25', cutoff: '2026-11-23', cutoffLabel: 'Nov 23' },
    { id: 'christmas', label: 'Christmas', range: 'Dec 22 – Dec 24', cutoff: '2026-12-21', cutoffLabel: 'Dec 21' },
  ];
  const shipWindowOpen = (w) => todayISO() <= w.cutoff;
  // The Shipping page lists the same windows the checkout offers, so the two can't disagree.
  const SHIP_WINDOW_ART = { halloween: 'holiday-halloween', thanksgiving: 'holiday-thanksgiving', christmas: 'holiday-christmas' };
  function renderShipHoliday() {
    const when = (w) => (shipWindowOpen(w) ? `Order by ${w.cutoffLabel}` : 'Closed');
    // Current and Polished: the art, the name over its dates, and the cutoff.
    const rows = (src) => SHIP_WINDOWS.map((w) => `
      <li>
        <img class="ship-window-art" src="${src(w)}" alt="" width="56" height="56" loading="lazy" decoding="async">
        <span class="ship-window-text"><strong>${w.label}</strong><span>${w.range}</span></span>
        <span class="ship-window-when">${when(w)}</span>
      </li>`).join('');
    const png = (w) => `assets/shipping/${SHIP_WINDOW_ART[w.id]}.png`;
    document.getElementById('ship-holiday-list').innerHTML = rows(png);
    // How many days are left to order a window: its cutoff day counts, so the last day reads "Last day to order".
    const daysLeft = (w) => Math.ceil((new Date(`${w.cutoff}T23:59:59`) - new Date()) / 864e5);
    const left = (w) => { const d = daysLeft(w); return d <= 1 ? 'Last day to order' : `${d} days left`; };
    const nextOpen = SHIP_WINDOWS.find(shipWindowOpen);
    // Custom: the mascot standing on its tile, the name over its dates, "Next window" on the first open one, and on the right the cutoff over the days left.
    const windowRows = SHIP_WINDOWS.map((w) => `
      <li class="ship-window${shipWindowOpen(w) ? '' : ' is-closed'}">
        <div class="ship-window-art" aria-hidden="true"><img src="assets/shipping/custom/holiday-${w.id}.webp" alt="" width="101" height="101" loading="lazy" decoding="async"></div>
        <div class="ship-window-text"><strong>${w.label}</strong><span>Arrives ${w.range}</span>${w === nextOpen ? '<em>Next window</em>' : ''}</div>
        <div class="ship-window-when">${shipWindowOpen(w) ? `<strong>Order by ${w.cutoffLabel}</strong><span>${left(w)}</span>` : '<strong>Closed</strong>'}</div>
      </li>`).join('');
    document.getElementById('ship-holiday-list-c').innerHTML = windowRows;
    // Distilled: words only, one tile per window.
    document.getElementById('ship-holiday-list-d').innerHTML = SHIP_WINDOWS.map((w) => `
      <li class="${shipWindowOpen(w) ? '' : 'is-closed'}"><strong>${w.label}</strong><span>${w.range}</span><b>${shipWindowOpen(w) ? `Order by ${w.cutoffLabel}` : 'Closed'}</b></li>`).join('');
    document.getElementById('shc-next').innerHTML = nextOpen
      ? `<span>Next window</span><strong>${nextOpen.label}</strong><span>Order by ${nextOpen.cutoffLabel}</span>`
      : '<span>Holiday windows are closed for now</span>';
  }

  // TEMPORARY COMPARISON of three versions of the Shipping page (see index.html). The choice is kept for the visit.
  const SHIP_VERSIONS = ['current', 'distilled', 'custom'];
  let shipVersion = 'current';
  try { const saved = localStorage.getItem('deg-ship-version'); if (SHIP_VERSIONS.includes(saved)) shipVersion = saved; } catch (e) { /* ignore */ }
  function setShipVersion(name) {
    if (!SHIP_VERSIONS.includes(name)) return;
    shipVersion = name;
    try { localStorage.setItem('deg-ship-version', name); } catch (e) { /* storage unavailable */ }
    document.querySelectorAll('#view-shipping .ship-v').forEach((el) => { el.hidden = el.dataset.shipVariant !== name; });
    document.querySelectorAll('#view-shipping [data-ship-version]').forEach((btn) => btn.setAttribute('aria-checked', String(btn.dataset.shipVersion === name)));
    // A banner image is lazy while its version is hidden, so the page does not fetch what nobody is looking at; shown, it loads at once.
    if (!document.getElementById('view-shipping').hidden) document.querySelectorAll('#view-shipping .ship-v:not([hidden]) img[data-eager]').forEach((img) => { img.loading = 'eager'; });
    if (name === 'custom' && !document.getElementById('view-shipping').hidden) replayShipHero();
    updateBarReveal();
  }
  // Custom: the dispatch hero plays when it is shown (the routes draw out of Texas, the boxes land, the egg takes off), then the egg drifts, paused
  // whenever the hero is off screen. Under reduced motion it is the finished picture.
  let shipHeroWatch = null;
  // The egg's takeoff: from the middle of Texas up to its place over the Midwest, along a curve, easing out, tilting level and growing as it goes.
  function shipEggFlight() {
    const P0 = [-845, 916], P1 = [-900, -260], P2 = [0, 0], frames = [];
    for (let i = 0; i <= 28; i++) {
      const t = i / 28, e = 1 - Math.pow(1 - t, 3), u = 1 - e;
      const x = u * u * P0[0] + 2 * u * e * P1[0] + e * e * P2[0];
      const y = u * u * P0[1] + 2 * u * e * P1[1] + e * e * P2[1];
      frames.push({ offset: t, opacity: Math.min(1, t * 5), transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(-18 * u).toFixed(2)}deg) scale(${(0.5 + 0.5 * e).toFixed(3)})` });
    }
    return frames;
  }
  function replayShipHero() {
    const hero = document.getElementById('shc-hero');
    if (!hero || reduceMotionQuery.matches) return;
    hero.classList.remove('is-play');
    void hero.offsetWidth;
    hero.classList.add('is-play');
    const fly = hero.querySelector('.shc-fly');
    if (fly && fly.animate) {
      fly.getAnimations().forEach((x) => x.cancel());
      fly.animate(shipEggFlight(), { duration: 1600, delay: 150, easing: 'linear', fill: 'backwards' });
    }
    if (!shipHeroWatch && 'IntersectionObserver' in window) {
      shipHeroWatch = new IntersectionObserver(([entry]) => hero.classList.toggle('is-away', !entry.isIntersecting), { threshold: .1 });
      shipHeroWatch.observe(hero);
    }
  }
  document.querySelectorAll('#view-shipping [data-ship-version]').forEach((btn) => btn.addEventListener('click', () => setShipVersion(btn.dataset.shipVersion)));
  // Custom: the sidebar and the phone's pill bar follow the section on screen, not only the last tap. The current section is
  // the last one whose top has passed the header; a scroll listener (like the reveal bar's) does it, throttled to one frame.
  let shipSpyTicking = false;
  function updateShipSpy() {
    shipSpyTicking = false;
    const polished = document.querySelector('#view-shipping .ship-v:not([hidden]).ship-c');
    if (!polished) return;
    const sections = [...polished.querySelectorAll('.menu-section')];
    const current = sections.filter((sec) => sec.getBoundingClientRect().top <= 220).pop() || sections[0];
    polished.querySelectorAll('.category-item').forEach((b) => b.classList.toggle('active', b.dataset.target === current.id));
  }
  window.addEventListener('scroll', () => { if (!shipSpyTicking) { shipSpyTicking = true; requestAnimationFrame(updateShipSpy); } }, { passive: true });
  state.shipWindow = null;
  state.sTipPct = 0;
  state.sTipCustom = 0;

  const scField = (id) => document.getElementById('sc-' + id);
  const shipAddressKnown = () => isZip(scField('zip').value.trim());

  function renderShipWindows() {
    const grid = document.getElementById('sc-window');
    const open = SHIP_WINDOWS.filter(shipWindowOpen);
    // A window that has closed cannot stay chosen.
    if (state.shipWindow && !open.some((w) => w.id === state.shipWindow)) state.shipWindow = null;
    grid.innerHTML = SHIP_WINDOWS.map((w) => radioChoiceHTML({
      group: 'ship-window', value: w.id, label: w.label,
      note: shipWindowOpen(w) ? `${w.range} · order by ${w.cutoffLabel}` : `${w.range} · closed`,
      selected: state.shipWindow === w.id,
    })).join('');
    grid.querySelectorAll('.radio-choice-input').forEach((input) => {
      const w = SHIP_WINDOWS.find((x) => x.id === input.value);
      if (!shipWindowOpen(w)) { input.disabled = true; input.closest('.radio-choice').classList.add('is-closed'); return; }
      input.addEventListener('change', () => {
        state.shipWindow = input.value;
        document.getElementById('sc-window-error').hidden = true;
        grid.querySelectorAll('.radio-choice').forEach((row) => row.classList.toggle('selected', row.querySelector('.radio-choice-input').checked));
        announceCheckout(`${w.label} window chosen, ${w.range}.`);
      });
    });
  }

  function shipTotals() {
    const subtotal = cartSubtotal('shipping');
    const shipping = shipAddressKnown() ? SHIPPING_RATE_PLACEHOLDER : null;
    const tip = state.sTipPct === 'custom' ? state.sTipCustom : subtotal * (state.sTipPct / 100);
    return { subtotal, shipping, tip, total: subtotal + (shipping || 0) + tip };
  }

  function renderShipTotals() {
    const t = shipTotals();
    scField('subtotal').textContent = money(t.subtotal);
    scField('shipping').textContent = t.shipping === null ? '' : money(t.shipping);
    document.getElementById('sc-shipping-note').textContent = t.shipping === null
      ? 'Enter your address to view shipping options.'
      : "Prototype rate. Final shipping pricing isn't set yet.";
    scField('tip').textContent = money(t.tip);
    document.querySelectorAll('#sc-tip-picker .tip-chip').forEach((chip) => {
      const pct = chip.dataset.value === 'custom' ? null : Number(chip.dataset.value);
      chip.querySelector('.tip-chip-amt').textContent = money(pct === null ? state.sTipCustom : t.subtotal * (pct / 100));
    });
    scField('total').textContent = money(t.total);
    return t;
  }

  function renderShipCheckout() {
    shareContact('ship');
    renderSummaryItems(document.getElementById('sc-items'), document.getElementById('sc-item-count'), state.carts.shipping);
    renderShipWindows();
    renderShipTotals();
    renderPaymentPickers();
  }

  // The shipping line appears when the ZIP does.
  scField('zip').addEventListener('input', () => {
    const was = document.getElementById('sc-shipping-note').textContent;
    renderShipTotals();
    if (was !== document.getElementById('sc-shipping-note').textContent && shipAddressKnown()) announceCheckout(`Shipping and handling ${scField('shipping').textContent}. Order total ${scField('total').textContent}.`, 600);
  });

  // Ship to someone else: the buyer's contact stays as it is; the recipient's name is the one on the box.
  const scGift = document.getElementById('sc-gift');
  scGift.addEventListener('change', () => {
    document.getElementById('sc-recipient-wrap').hidden = !scGift.checked;
    if (scGift.checked) scField('recipient').focus();
    else setFieldError(scField('recipient'), '');
  });

  const scTipCustomWrap = document.getElementById('sc-tip-custom');
  const scTipCustomInput = document.getElementById('sc-tip-custom-input');
  const announceShipTip = () => announceCheckout(`Tip ${scField('tip').textContent}. Order total ${scField('total').textContent}.`, 600);
  document.getElementById('sc-tip-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-value]');
    if (!btn) return;
    document.querySelectorAll('#sc-tip-picker .chip').forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-checked', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-checked', 'true');
    const isCustom = btn.dataset.value === 'custom';
    state.sTipPct = isCustom ? 'custom' : Number(btn.dataset.value);
    scTipCustomWrap.hidden = !isCustom;
    if (isCustom) scTipCustomInput.focus();
    renderShipTotals();
    announceShipTip();
  });
  let lastValidSTip = '';
  scTipCustomInput.addEventListener('input', () => {
    if (/^\d{0,4}(\.\d{0,2})?$/.test(scTipCustomInput.value)) lastValidSTip = scTipCustomInput.value;
    else scTipCustomInput.value = lastValidSTip;
    state.sTipCustom = parseFloat(lastValidSTip) || 0;
    renderShipTotals();
    announceShipTip();
  });
  scTipCustomInput.addEventListener('blur', () => {
    if (scTipCustomInput.value === '') return;
    lastValidSTip = state.sTipCustom.toFixed(2);
    scTipCustomInput.value = lastValidSTip;
  });

  document.getElementById('sc-place-order').addEventListener('click', () => {
    if (state.carts.shipping.length === 0) return;
    const f = scField;
    const rows = [
      [f('name'), present, 'Enter the name for this order.'],
      [f('phone'), isPhone, 'Enter a phone number with area code.'],
      [f('email'), isEmail, 'Enter a valid email so we can send your tracking link.'],
    ];
    if (scGift.checked) rows.push([f('recipient'), present, "Enter the recipient's name."]);
    rows.push(
      [f('street'), present, 'Enter the street address to ship to.'],
      [f('city'), present, 'Enter the city.'],
      [f('state'), present, 'Choose a state. We ship to the 48 contiguous states.'],
      [f('zip'), isZip, 'Enter a 5-digit ZIP code.'],
    );
    if (!validateFields(rows)) return;
    const chosen = SHIP_WINDOWS.find((w) => w.id === state.shipWindow);
    if (!chosen) {
      const error = document.getElementById('sc-window-error');
      error.hidden = false;
      const first = document.querySelector('#sc-window .radio-choice-input:not(:disabled)');
      if (first) first.focus();
      announceCheckout(error.textContent);
      return;
    }

    const t = renderShipTotals();
    const items = recapLines(state.carts.shipping);
    items.push({ label: 'Shipping and handling', amount: money(t.shipping) });
    if (t.tip > 0) items.push({ label: 'Tip', amount: money(t.tip) });
    const apt = f('street2').value.trim();
    const who = scGift.checked ? f('recipient').value.trim() : f('name').value.trim();
    const addressLines = `${escapeHTML(who)}<br>${escapeHTML(f('street').value.trim())}${apt ? ', ' + escapeHTML(apt) : ''}<br>${escapeHTML(f('city').value.trim())}, ${f('state').value} ${f('zip').value.trim()}`;

    clearCart('shipping');
    showConfirmation({
      number: orderNumber(),
      subHTML: `Order {number} · We'll email your tracking link the morning we ship. Your kit is reserved for the <strong>${chosen.label} window (${chosen.range})</strong>.`,
      steps: ['Packing', 'Shipped'],
      name: f('name').value,
      cheer: 'Your kit is reserved. Good egg.',
      items, total: t.total,
      cardHTML: `${PIN_ICON}<span>${addressLines}</span>`,
      backLabel: '← Back to Nationwide Shipping', backView: 'shipping',
    });
  });

  // ---------- Init ----------
  initPickupDefaults();
  renderPickupSummary();
  renderStoreLocatorSummary();
  restorePickupSession();
  renderPickupSummary();
  renderStoreLocatorSummary();
  renderGrids();
  renderCartBadge();
  renderDrawer();
  navWhereReady = true;
  renderNavWhere();
  setShipVersion(shipVersion);
  openFirstPage();
  pageHistoryReady = true;
})();
