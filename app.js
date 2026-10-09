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
    img.decoding = 'async';
    img.alt = item.name;
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
    { id: '6-pack-3-flavors', name: '6 Pack – 3 Flavors', price: 12.99, note: '420 Cal.', desc: 'Six deviled eggs in three delicious flavors — a great way to sample our most popular creations.', image: 'assets/products/6-pack-3-flavors.jpg', pickerConfig: { total: 6, maxFlavors: 3 } },
    { id: '6-pack-6-flavors', name: '6 Pack – 6 Flavors', price: 14.99, note: '420 Cal.', desc: 'Six deviled eggs, each a different flavor — try them all and find your favorite.', image: 'assets/products/6-pack-6-flavors.jpg', pickerConfig: { total: 6, maxFlavors: 6 } },
    { id: '12-pack', name: '12 Pack Deviled Egg', price: 24.99, note: '840 Cal.', desc: 'A dozen of our gourmet deviled eggs — perfect for sharing at parties, picnics, or family gatherings.', image: 'assets/products/12-pack.jpg', pickerConfig: { total: 12, maxFlavors: 4 } },
    { id: '24-count-platter', name: '24 Count Deviled Egg Platter', price: 44.99, note: '1680 Cal.', desc: 'A stunning platter of 24 deviled eggs — the ultimate centerpiece for your next event or celebration.', image: 'assets/products/24-count-platter.jpg', pickerConfig: { total: 24, maxFlavors: 3 } },
    { id: 'try-them-all-platter', name: 'Try Them All Deviled Egg Platter', price: 54.99, note: '1800 Cal.', desc: 'Every flavor we offer on one beautiful platter — the complete Deviled Egg Co. experience.', image: 'assets/products/try-them-all-platter.jpg' },
  ];

  // Every Eggceptional Bowl is a WooCommerce "variable" product on the live
  // site (unlike Egg Salads/Platters, which are simple products) — each has
  // its own Add-Ons (paid, priced per item), Free Eggstras (unpriced extras),
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
      freeEggstras: ['Lettuce', 'Onions', 'Sriracha', 'Sriracha Aioli', 'Creamy Caesar', 'Ranch', 'Cholula', 'Terriyaki', 'Parmesan', 'Buffalo', 'Sweet & Sour', 'BBQ', 'Homemade Ranch'],
      exclusions: ['Chicken', 'Bacon', 'Avo-Smash', 'Cheddar', 'Lettuce', 'Tomato', 'Ranch'],
    },
    { id: 'cheeseburger', name: 'Cheeseburger Eggceptional Bowl', price: 14.99, note: '47g Protein', desc: 'Seasoned beef, cheese, pickles, and our famous deviled eggs in bowl form.', image: 'assets/products/cheeseburger-bowl.jpg',
      addOns: [
        { label: 'Double Meat', price: 3.00, note: '+4oz meat' },
        { label: 'Smashed Avocado', price: 2.00, note: '½ whole fresh avocado' },
        { label: 'Eggstra Egg', price: 2.00, note: '+3oz egg whites' },
      ],
      freeEggstras: ['Lettuce', 'Onions', 'Sriracha', 'Sriracha Aioli', 'Creamy Caesar', 'Ranch', 'Cholula', 'Parmesan', 'Buffalo', 'Sweet & Sour', 'BBQ', 'Homemade Ranch'],
      exclusions: ['Hamburger', 'Cheese', 'Red Onion', 'Lettuce', 'Pickles', 'Ketchup'],
    },
    { id: 'caesar', name: 'The Caesar Eggceptional Bowl', price: 14.99, note: '70g Protein', desc: 'Crisp romaine, parmesan, croutons, and our signature deviled eggs.', image: 'assets/products/caesar-bowl.jpg',
      addOns: [
        { label: 'Substitute Salmon', price: 3.00 },
        { label: 'Double Meat', price: 3.00, note: '+4oz meat' },
        { label: 'Avocado Smash', price: 2.00, note: '½ whole fresh avocado' },
        { label: 'Eggstra Eggs', price: 3.00, note: '+3oz egg whites' },
      ],
      freeEggstras: ['Lettuce', 'Onions', 'Sriracha', 'Creamy Caesar', 'Ranch', 'Cholua Sauce', 'Teriyaki', 'Parmesan', 'Buffalo Sauce', 'Sweet & Sour', 'BBQ Sauce', 'Ranch'],
      exclusions: ['Egg Whites', 'Grilled Chicken', 'Capers', 'Diced Red Onion', 'Shredded Romaine Lettuce', 'Creamy Caesar Dressing', 'Parmesan Cheese'],
    },
    { id: 'buffalo', name: 'Buffalo Eggceptional Bowl', price: 14.99, desc: 'Bold buffalo flavors paired with cool ranch and our signature deviled eggs.', image: 'assets/products/buffalo-bowl.jpg',
      addOns: [
        { label: 'Double Meat', price: 3.00, note: '+4oz meat' },
        { label: 'Smashed Avocado', price: 2.00, note: '½ whole fresh avocado' },
        { label: 'Eggstra Egg', price: 2.00, note: '+3oz egg whites' },
      ],
      freeEggstras: ['Lettuce', 'Onions', 'Sriracha', 'Sriracha Aioli', 'Creamy Caesar', 'Ranch', 'Cholula', 'Parmesan', 'Buffalo', 'Sweet & Sour', 'BBQ', 'Homemade Ranch'],
      exclusions: ['Grilled Chicken', 'Red Onion', 'Lettuce', 'Buffalo Sauce', 'Homemade Ranch', 'Cheddar', 'Egg White'],
    },
    { id: 'walking-taco', name: 'Walking Taco Eggceptional Bowl', price: 14.99, note: '70g Protein', desc: 'Seasoned meat, crunchy chips, cheese, salsa, and deviled eggs in one bowl.', image: 'assets/products/walking-taco-bowl.jpg',
      addOns: [
        { label: 'Double Meat', price: 3.00, note: '+4oz meat' },
        { label: 'Smashed Avocado', price: 2.00, note: '½ whole fresh avocado' },
        { label: 'Eggstra Egg', price: 3.00, note: '+3oz egg whites' },
      ],
      freeEggstras: ['Lettuce', 'Onions', 'Sriracha', 'Sriracha Aioli', 'Creamy Caesar', 'Ranch', 'Cholula', 'Terriyaki', 'Parmesan', 'Buffalo', 'Sweet & Sour', 'BBQ', 'Homemade Ranch'],
      exclusions: ['Refried Beans', 'Sharp Cheddar Cheese', 'Cholula', 'Lettuce', 'Sour Cream', 'Doritos', 'Chicken', 'Egg White'],
    },
    { id: 'bangin-brisket', name: 'Bangin’ Brisket Eggceptional Bowl', price: 14.99, note: '57g Protein', desc: 'Slow-smoked brisket paired with our deviled eggs for bold Texas flavor.', image: 'assets/products/bangin-brisket-bowl.jpg',
      addOns: [
        { label: 'Double Meat', price: 5.00, note: '+4oz meat' },
        { label: 'Smashed Avocado', price: 2.00, note: '½ whole fresh avocado' },
        { label: 'Eggstra Egg', price: 2.00, note: '+3oz egg whites' },
      ],
      freeEggstras: ['Lettuce', 'Onions', 'Sriracha', 'Sriracha Aioli', 'Creamy Caesar', 'Ranch', 'Cholula', 'Terriyaki', 'Parmesan', 'Buffalo', 'Sweet & Sour', 'BBQ', 'Homemade Ranch'],
      exclusions: ['Brisket', 'Pickled Jalapeño', 'Red Onion', 'BBQ Sauce', 'Cheese', 'Lettuce'],
    },
    { id: 'pok-egg', name: 'Pok-Egg Eggceptional Bowl', price: 14.99, note: '32g Protein', desc: 'Hawaiian-inspired poke-style bowl with crisp vegetables and deviled eggs.', image: 'assets/products/pok-egg-bowl.jpg',
      addOns: [
        { label: 'Double Meat', price: 4.00, note: '+4oz meat' },
        { label: 'Avocado Smash', price: 2.00, note: '½ whole fresh avocado' },
        { label: 'Eggstra Eggs', price: 3.00, note: '+3oz egg whites' },
      ],
      freeEggstras: ['Lettuce', 'Onions', 'Sriracha', 'Sriracha Aioli', 'Creamy Caesar', 'Ranch', 'Cholula', 'Teriyaki', 'Parmesan', 'Buffalo Sauce', 'Sweet & Sour', 'BBQ Sauce', 'Ranch'],
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
    { id: 'classic-choice', name: 'The Classic Choice', price: 10, note: 'Per person · min 10 boxes', desc: 'A crowd-pleasing catering option with our classic deviled egg selection.' },
    { id: 'all-in-power-lunch', name: 'The “All In” Power Lunch', price: 12.50, note: 'Per person · min 10 boxes', desc: 'The complete lunch experience — deviled eggs, sides, and drinks for your team.', image: 'assets/products/all-in-power-lunch.jpg' },
    { id: 'coffee-bar', name: 'Catering Coffee Bar', price: 24.99, note: 'Per service · serves 10–12', desc: 'A full coffee bar service to complement your catering order.' },
    { id: 'power-pair', name: 'Power Pair Bundle', price: 59.99, note: 'Per bundle · serves 10', desc: 'Two of our most popular items bundled together for easy group ordering.' },
    { id: 'bagel-brew', name: 'Bagel & Brew Bundle', price: 69.99, note: 'Per bundle · serves 10', desc: 'Fresh bagels with deviled egg salad plus our coffee bar — perfect for morning meetings.' },
    { id: 'hungry-team', name: 'The “Hungry Team”', price: 99.99, note: 'Per bundle · serves 10', desc: 'Our biggest catering bundle — feeds a hungry team with all the favorites.' },
    { id: 'light-lunch', name: 'The “Light Lunch”', price: 69.99, note: 'Per bundle · serves 10', desc: 'A lighter catering option that still packs all the deviled egg flavor.' },
  ];

  const WRAP_PRICE = 9.99;
  const WRAP_IMAGE = 'assets/products/eggceptional-wraps.jpg';
  const WRAP_DESC = 'Fresh-pressed flatbread wraps built from our signature deviled egg flavors — pick your filling, then add sides.';
  // Sourced verbatim from deviledeggco.com/product/eggceptional-wraps: each
  // flavor's own ingredient line, shown once that flavor is selected — this
  // product has no "NO:" exclusion toggles like the deviled egg flavors do.
  const WRAP_FLAVORS = [
    { id: 'blte', label: 'BLTE', ingredients: 'Ranch Yolk Mix, Bacon, Cheddar Cheese, Lettuce, Tomato & House-Made Creamy Ranch' },
    { id: 'cali-roll', label: 'Cali Roll', ingredients: 'Imitation Crab Mix, Sriracha Aioli, Fresh Avocado, Cucumber, Teriyaki & Black Sesame' },
    { id: 'the-caesar', label: 'The Caesar', ingredients: 'Caesar Yolk Mix, Grilled Chicken, Bacon, Parmesan Cheese, Lettuce, Tomato & House-Made Creamy Ranch' },
    { id: 'buffalo-chicken', label: 'Buffalo Chicken', ingredients: 'Buffalo Yolk Mix, Grilled Chicken, Red Onion, Buffalo Sauce, Lettuce & House-Made Creamy Ranch' },
  ];
  // "Make it a Meal" is its own highlighted toggle on the live site, but it
  // shares the exact {label, price, note} shape the bowl modal's own addOns
  // already use, so it gets Add-Ons' existing chip UI for free as the first
  // entry here instead of a one-off toggle component built for one row.
  const WRAP_ADDONS = [
    { label: 'Make it a Meal', price: 3.49, note: 'Chips & a bottled drink' },
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
  const SANDWICH_WRAP = [
    { id: 'eggceptional-wraps', name: 'Eggceptional Wraps', price: WRAP_PRICE, desc: WRAP_DESC, image: WRAP_IMAGE, wrapFlavors: WRAP_FLAVORS, addOns: WRAP_ADDONS },
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

  // Nationwide shipping kits (Nationwide Shipping page). Contents are the live
  // product pages' own: the kit copy, the 12 flavors those pages offer (each
  // with the same "NO:" ingredient toggles as FLAVORS above) and the shipping
  // and storage note. They open the same dozen-style modal as the menu's packs
  // and add to the in-app bag — never an outside page.
  const SHIPPING_NOTICE = 'Our eggs are never frozen and ship in coolers on ice in kits to be assembled at your convenience. We do require overnight shipping during summer months but offer less costly options in the fall & winter in time for the holidays! Once our eggs arrive, refrigerate them (cannot be frozen) and consume within 3 days.';
  const KIT_FLAVOR_IDS = ['backyard-bbq', 'buffalo-blue-cheese', 'buffalo-chicken-ranch', 'cali-roll', 'chicken-bacon-ranch', 'chicken-pickle-egg', 'everything-seasoning', 'jalapeno-popper', 'smoked-salmon', 'south-of-the-border', 'sriracha-bacon', 'traditional'];
  const SHIPPING_KITS = [
    {
      id: 'kit-sampler', name: 'Mini Deviled Egg Salad Sampler', price: 74.99, image: 'assets/shipping/kit-sampler.png', ships: true, cart: 'shipping',
      desc: 'Try all of our top sellers- shipped right to your door. This is a great gift for birthdays, anniversaries or just because.',
      detailsLabel: 'This kit includes:',
      details: ['(18) 2oz deviled egg salads perfect for eggsploring our options before your next big event.'],
      fixedFlavors: ['Traditional', 'Everything Seasoning', 'Smoked Salmon', 'South of the Border', 'Sriracha Bacon', 'Jalapeno Popper', 'Crab Rangoon', 'Chicken Bacon Ranch', 'Cali Roll', 'Buffalo Blue Cheese', 'Buffalo Chicken', 'Chicken N a Pickle', 'Chicken Caesar', 'Gyro', 'Cheeseburger', 'BBQ Chicken', 'Featured Flavor!'],
      notice: SHIPPING_NOTICE,
    },
    {
      id: 'kit-24', name: '24 Count Kit', price: 64.99, image: 'assets/shipping/kit-24.png', ships: true, cart: 'shipping',
      desc: 'Deviled Eggs — choose 2 flavors.',
      details: ['24 egg white halves conveniently packaged into egg trays with lids perfect for transporting or storing.', '2 flavors of yolk filling in piping bags for the perfect presentation.', 'Toppings for your deviled egg flavors of choice.'],
      flavorIds: KIT_FLAVOR_IDS, pickerConfig: { total: 24, maxFlavors: 2 },
      notice: SHIPPING_NOTICE,
    },
    {
      id: 'kit-36', name: '36 Count Kit', price: 99.99, image: 'assets/shipping/kit-24.png', ships: true, cart: 'shipping',
      desc: 'Deviled Eggs — choose 3 flavors.',
      details: ['36 egg white halves conveniently packaged into egg trays with lids perfect for transporting or storing.', '3 flavors of yolk filling in piping bags for the perfect presentation.', 'Toppings for your deviled egg flavors of choice.'],
      flavorIds: KIT_FLAVOR_IDS, pickerConfig: { total: 36, maxFlavors: 3 },
      notice: SHIPPING_NOTICE,
    },
  ];

  // Four carts, one per fulfillment path, never merged: Pickup (the location
  // menus), Delivery (the same menu, brought to an address), Shipping
  // (Nationwide Shipping kits) and Catering. Each checks out on its own page.
  const CART_KINDS = ['pickup', 'delivery', 'shipping', 'catering'];
  const CART_LABELS = { pickup: 'Pickup', delivery: 'Delivery', shipping: 'Shipping', catering: 'Catering' };
  // Delivery's placeholder rules, until real ones are approved: one flat fee, a minimum subtotal, and the ASAP estimate.
  const DELIVERY_FEE = 4.99;
  const DELIVERY_MINIMUM = 15;
  const DELIVERY_ASAP_LABEL = 'ASAP (35–50 min)';

  // The nav indicator draws only once the rest of the app is set up (see Init at the end).
  let navWhereReady = false;

  const state = {
    carts: { pickup: [], delivery: [], shipping: [], catering: [] },
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
    bagelFlavor: null,
    bagelOptions: new Set(),
    bagelQty: 1,
    bowlAddOns: new Set(),
    bowlEggstras: new Set(),
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
  [...DEVILED_EGGS, ...PROTEIN_BOWLS, ...EGG_SALADS, ...PLATTERS, ...CATERING, ...SANDWICH_WRAP].forEach((p) => {
    if (p.image) PRODUCT_IMAGE_BY_NAME[p.name] = p.image;
  });
  PRODUCT_IMAGE_BY_NAME['Full Size Bagel'] = BAGEL_IMAGE;
  SHIPPING_KITS.forEach((k) => { PRODUCT_IMAGE_BY_NAME[k.name] = k.image; });

  // Saved carts: the current per-path shape, or the older single list, whose
  // shipping kits (tagged `ships`) move to the Shipping cart.
  const withImage = (item) => ({ ...item, image: item.image || PRODUCT_IMAGE_BY_NAME[item.name] });
  try {
    const saved = JSON.parse(localStorage.getItem('deg-carts') || 'null');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      CART_KINDS.forEach((kind) => { if (Array.isArray(saved[kind])) state.carts[kind] = saved[kind].map(withImage); });
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

  function persistCart() {
    localStorage.setItem('deg-carts', JSON.stringify(state.carts));
    localStorage.removeItem('deg-cart');
  }

  function money(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  // Items across every cart (the header badge), or one cart's.
  // Catering counts lines, not boxes: 200 boxes is one order line, and "211 items" on two lines was misleading.
  const unitsIn = (kind, items) => (kind === 'catering' ? items.length : items.reduce((n, item) => n + item.qty, 0));
  function cartCount(kind) {
    const kinds = kind ? [kind] : CART_KINDS;
    return kinds.reduce((sum, k) => sum + unitsIn(k, state.carts[k]), 0);
  }

  // A line's price × qty, plus anything charged once per line (a catering box's drinks).
  const lineTotal = (item) => item.price * item.qty + (item.extra || 0);
  // A line's detail text: a box meal's is rebuilt from its saved choices, so it can never disagree with them.
  const lineSub = (item) => (item.config ? boxLineSub(item) : item.sub || '');

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
    persistCart();
    renderCartBadge();
    closeModal();
    openCart(editingKind);
  }

  function addToCart(entry) {
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
    renderBagelCard();
    renderFeatured();
  }

  // Every product opens its modal first (never an instant add); which modal depends on what it can customize.
  function openMenuItem(item, keyPrefix, cartCategory) {
    if (gateFulfillment(() => openMenuItem(item, keyPrefix, cartCategory))) return;
    if (item.wrapFlavors) {
      openWrapModal(item);
    } else if (item.pickerConfig || item.fixedFlavors) {
      openDozenModal(item);
    } else if (item.addOns) {
      openBowlModal(item);
    } else {
      openQuickviewModal(item, { keyPrefix, cartCategory });
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
    { from: DEVILED_EGGS, id: '6-pack-6-flavors', keyPrefix: 'egg', cartCategory: 'Deviled eggs' },
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
        <span class="featured-meta"><span class="featured-price">${money(item.price)}</span>${item.note ? `<span aria-hidden="true">•</span><span>${item.note}</span>` : ''}</span>`);

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
      btn.setAttribute('aria-label', (item.pickerConfig || item.addOns || item.wrapFlavors) ? 'Customize ' + item.name : 'View ' + item.name);
      btn.innerHTML = ADD_ICON;
      const activate = () => openMenuItem(item, keyPrefix, cartCategory);
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

  // On a store's page, the first thing added asks how the order is going (pickup or delivery) if that is not chosen yet.
  const openBagelFromMenu = () => { if (!gateFulfillment(() => openBagelFromMenu())) openBagelModal(); };

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
    btn.addEventListener('click', openBagelFromMenu);
    media.appendChild(btn);
    card.appendChild(media);

    card.addEventListener('click', (e) => {
      if (e.target.closest('.add-btn')) return;
      openBagelFromMenu();
    });

    grid.appendChild(card);
  }

  // ---------- Pickup order page (#order) ----------
  // The Pickup funnel's third step, laid out like Chipotle's mobile ordering: a list of category tiles, and a tile
  // that stands for several products (the pack sizes, the egg salad sizes, the bowls) opens a screen of rows.
  // A tile for a single product opens its modal straight away. Every row opens the same modal as its card on #menu.
  const ORDER_GROUPS = [
    { id: 'deviled-eggs', name: 'Deviled Eggs', image: 'assets/products/12-pack.jpg', items: DEVILED_EGGS, keyPrefix: 'egg', cartCategory: 'Deviled eggs' },
    { id: 'egg-salads', name: 'Egg Salads', image: 'assets/products/egg-salad-pint.jpg', items: EGG_SALADS, keyPrefix: 'saladcup', cartCategory: 'Egg salad' },
    { id: 'protein-bowls', name: 'Protein Bowls', image: 'assets/products/avo-chick-blt-bowl.jpg', items: PROTEIN_BOWLS, keyPrefix: 'bowl', cartCategory: 'Protein bowl' },
    { id: 'bagels', name: 'Bagels', image: BAGEL_IMAGE, price: BAGEL_PRICE, open: () => openBagelModal() },
    { id: 'sandwich-wrap', name: 'Sandwich/Wrap', image: WRAP_IMAGE, items: SANDWICH_WRAP, keyPrefix: 'wrap', cartCategory: 'Sandwich/Wrap' },
  ];
  const orderGroupSingle = (g) => g.open || (g.items.length === 1 ? () => openMenuItem(g.items[0], g.keyPrefix, g.cartCategory) : null);
  const ORDER_CHEVRON = '<svg class="order-tile-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const orderTilesScreen = document.getElementById('order-tiles-screen');
  const orderGroupScreen = document.getElementById('order-group-screen');

  function renderOrderTiles() {
    document.getElementById('order-tiles').innerHTML = ORDER_GROUPS.map((g) => {
      const single = !!orderGroupSingle(g);
      const from = g.items ? Math.min(...g.items.map((i) => i.price)) : g.price;
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
    orderTilesScreen.hidden = false;
    orderGroupScreen.hidden = true;
    document.title = orderPageTitle();
  }

  // TEMP: card-style switcher for comparing the three product-card variants. Remove once one is chosen.
  const CARD_VARIANTS = [['0', 'Current'], ['1', 'Photo grid'], ['2', 'Tile'], ['3', 'Menu list']];
  function setCardVariant(v) {
    document.getElementById('order-rows').dataset.cards = v;
    try { localStorage.setItem('deg-card-variant', v); } catch (e) { /* storage unavailable */ }
    document.querySelectorAll('#card-variant-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
  }
  (function initCardSwitch() {
    let v = '1';
    try { v = localStorage.getItem('deg-card-variant') || '1'; } catch (e) { /* storage unavailable */ }
    const bar = document.createElement('div');
    bar.id = 'card-variant-switch';
    bar.className = 'card-variant-switch';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Product card style');
    bar.innerHTML = CARD_VARIANTS.map(([k, label]) => `<button type="button" data-v="${k}">${label}</button>`).join('');
    bar.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setCardVariant(b.dataset.v); });
    document.getElementById('order-rows').before(bar);
    setCardVariant(v);
  })();

  function renderOrderRows(g) {
    const list = document.getElementById('order-rows');
    list.innerHTML = '';
    g.items.forEach((item) => {
      const li = document.createElement('li');
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'order-row';
      row.setAttribute('aria-label', `${(item.pickerConfig || item.addOns || item.wrapFlavors) ? 'Customize' : 'View'} ${item.name}`);
      row.innerHTML = `
        <span class="order-row-media"></span>
        <span class="order-row-text">
          <span class="order-row-name">${item.name}</span>
          <span class="order-row-meta"><span class="order-row-price">${money(item.price)}</span>${item.note ? `<span aria-hidden="true">•</span><span>${item.note}</span>` : ''}</span>
          ${item.desc ? `<span class="order-row-desc">${item.desc}</span>` : ''}
        </span>
        <span class="order-row-add" aria-hidden="true">${ADD_ICON}</span>
        <span class="order-row-cta" aria-hidden="true">${(item.pickerConfig || item.addOns || item.wrapFlavors) ? 'Customize' : 'View'}</span>`;
      row.querySelector('.order-row-media').appendChild(productThumb(item));
      row.addEventListener('click', () => openMenuItem(item, g.keyPrefix, g.cartCategory));
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
  renderOrderTiles();

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
      document.querySelectorAll('.category-item').forEach((b) => {
        b.classList.toggle('active', b.dataset.target === targetId);
      });

      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Keep the newly active pill visible within the mobile horizontal
      // scroller — block:'nearest' keeps this from also nudging the
      // page's own vertical scroll.
      const mobileTwin = document.querySelector(`.drawer-nav-mobile .category-item[data-target="${targetId}"]`);
      if (mobileTwin) mobileTwin.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  });

  // Native overflow-x:auto already gives touch users free momentum
  // scrolling; this adds the same "grab and drag" affordance for mouse
  // pointers, which have no native equivalent. Gated to pointerType
  // 'mouse' so it never fights a real touchscreen's own scrolling.
  (() => {
    const scroller = document.querySelector('.drawer-nav-mobile');
    if (!scroller) return;
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
  })();

  // Mobile-only: the category pill bar stays hidden (see the ≤640px CSS — position:fixed, opacity:0) until the
  // user has scrolled about halfway down the featured-item card, then fades in as a floating bar. A no-op on
  // wider screens: the bar is display:none there regardless, so toggling a class on it does nothing visible.
  const drawerNavMobile = document.querySelector('.drawer-nav-mobile');
  const featureCard = document.getElementById('featured-items');
  const REVEAL_LINE_PX = 69;
  let revealTicking = false;
  function updateBarReveal() {
    revealTicking = false;
    if (!drawerNavMobile || !featureCard) return;
    // A hidden menu has no layout (its rect is all zeros), which would read as "scrolled past the featured card".
    if (document.getElementById('view-menu').hidden) { drawerNavMobile.classList.remove('is-revealed'); return; }
    const rect = featureCard.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    drawerNavMobile.classList.toggle('is-revealed', midpoint <= REVEAL_LINE_PX);
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
    else if (!ldModal.hidden) closeLocationDetails();
    else if (!ddModal.hidden) closeDeliveryDetails();
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

  // Single-flavor products (the egg salads): one pick, so radios instead of
  // steppers. Exclusion chips live in the selected row's .radio-choice-extra and
  // everything updates in place (a re-render would drop keyboard focus).
  function renderSingleFlavorExtra(group, flavor) {
    const extra = group.querySelector('.radio-choice-extra');
    if (!flavor || !flavor.exclusions || !flavor.exclusions.length) { extra.innerHTML = ''; return; }
    const excluded = state.modalExclusions[flavor.id] || new Set();
    extra.innerHTML = `
      <div class="flavor-exclusions">
        <span class="flavor-exclusions-label">Remove ingredients</span>
        <div class="chip-row">
          ${flavor.exclusions.map((ing) => `<button class="chip exclude-chip${excluded.has(ing) ? ' active' : ''}" type="button">NO: ${ing}</button>`).join('')}
        </div>
      </div>`;
    extra.querySelectorAll('.exclude-chip').forEach((chip, i) => {
      chip.addEventListener('click', () => {
        const ing = flavor.exclusions[i];
        const set = state.modalExclusions[flavor.id] || new Set();
        if (set.has(ing)) set.delete(ing); else set.add(ing);
        state.modalExclusions[flavor.id] = set;
        chip.classList.toggle('active', set.has(ing));
      });
    });
  }

  function renderSingleFlavorRadios(grid) {
    const chosenId = Object.keys(state.modalFlavorQty)[0] || null;
    const flavors = flavorList();
    grid.innerHTML = flavors.map((f) => radioChoiceHTML({
      group: 'dozen-flavor', value: f.id, label: f.label, selected: f.id === chosenId,
    })).join('');
    const groups = [...grid.querySelectorAll('.radio-choice')];
    groups.forEach((group, i) => { if (flavors[i].id === chosenId) renderSingleFlavorExtra(group, flavors[i]); });
    grid.querySelectorAll('.radio-choice-input').forEach((input) => {
      input.addEventListener('change', () => {
        state.modalFlavorQty = { [input.value]: 1 };
        state.modalExclusions = {};
        groups.forEach((group, i) => {
          const on = group.querySelector('.radio-choice-input').checked;
          group.classList.toggle('selected', on);
          renderSingleFlavorExtra(group, on ? flavors[i] : null);
        });
        renderModalFooter();
        renderFlavorGuidance(dozenAllocated());
      });
    });
    renderFlavorGuidance(dozenAllocated());
  }

  // One flavor's clip can be open at a time, inline in its own row. The <video>
  // element outlives the grid re-renders (every + / - redraws the rows) so the
  // clip keeps playing while the customer adds eggs.
  const PLAY_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg>';
  const flavorReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let flavorWatch = { id: null, wrap: null, playing: false };

  function stopFlavorWatch() {
    const video = flavorWatch.wrap && flavorWatch.wrap.querySelector('video');
    if (video) video.pause();
    flavorWatch = { id: null, wrap: null, playing: false };
  }

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

  function renderFlavorGrid() {
    const grid = document.getElementById('flavor-grid');
    const single = activeProduct.total === 1;
    grid.classList.toggle('addon-list', single);
    if (single) {
      grid.setAttribute('role', 'radiogroup');
      grid.setAttribute('aria-label', 'Flavor');
      renderSingleFlavorRadios(grid);
      return;
    }
    grid.removeAttribute('role');
    grid.removeAttribute('aria-label');
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
      const media = FLAVOR_MEDIA[f.id];
      const watching = !!media && flavorWatch.id === f.id;
      const statLine = f.desc || (media && media.cal ? `${media.cal} cal · ${media.protein}g protein each` : '');
      const row = document.createElement('div');
      row.className = 'flavor-row dozen-flavor-row' + (qty > 0 ? ' selected' : '') + (atLimit ? ' at-limit' : '');
      row.dataset.flavor = f.id;
      row.innerHTML = `
        <div class="flavor-row-head">
          ${media ? `<button class="flavor-thumb${watching ? ' open' : ''}" type="button" aria-expanded="${watching}" aria-controls="flavor-watch-${f.id}" aria-label="${watching ? 'Hide' : 'Watch'} the ${escapeHTML(f.label)} video"><img src="assets/flavors/${media.file}.jpg" alt="" width="56" height="56" loading="lazy" decoding="async"><span class="flavor-thumb-badge" aria-hidden="true">${PLAY_ICON}</span></button>` : ''}
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
              <p>${escapeHTML(media.desc)}</p>
              <button class="flavor-watch-hide" type="button">Hide video</button>
            </div>
          </div>
        ` : ''}
        ${showExclusions ? `
          <div class="flavor-exclusions">
            <span class="flavor-exclusions-label">Remove ingredients</span>
            <div class="chip-row">
              ${f.exclusions.map((ing) => `<button class="chip exclude-chip${excluded.has(ing) ? ' active' : ''}" type="button">NO: ${ing}</button>`).join('')}
            </div>
          </div>
        ` : ''}
      `;
      if (media) {
        row.querySelector('.flavor-thumb').addEventListener('click', () => toggleFlavorWatch(f.id));
      }
      if (watching) {
        row.querySelector('.flavor-watch-hide').addEventListener('click', () => toggleFlavorWatch(f.id));
        row.querySelector('.flavor-watch-slot').replaceWith(flavorWatchMedia(f));
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
      // The grid redraws on every + / -, which pauses a re-attached video; pick the clip up again unless the customer paused it.
      if (watching && flavorWatch.playing) flavorWatch.wrap.querySelector('video').play().catch(() => {});
    });
    renderFlavorGuidance(allocated);
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
    const complete = activeProduct.fixedFlavors || allocated === activeProduct.total;
    btn.disabled = !complete;
    // total:1 (the egg salads — one flavor for the whole tub) reads oddly
    // through the "Choose N eggs" copy every multi-piece pack uses;
    // singular products get their own natural phrasing instead.
    btn.textContent = complete
      ? `${editingLine ? 'Update order' : `Add ${state.modalQty} to order`} · ${money(total)}`
      : activeProduct.total === 1
        ? 'Choose a flavor to continue'
        : `Choose ${activeProduct.total - allocated} ${allocated === 0 ? '' : 'more '}${eggWord(activeProduct.total - allocated)} to continue`;
  }

  function openDozenModal(product, line = null) {
    lastFocusedEl = document.activeElement;
    // A fixed-flavor kit (the sampler) has nothing to allocate: no picker config.
    const picker = product.pickerConfig || { total: 0, maxFlavors: 1 };
    activeProduct = {
      ...product,
      total: picker.total,
      maxFlavors: picker.maxFlavors,
      step: picker.total / picker.maxFlavors,
    };
    stopFlavorWatch();
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

    document.getElementById('dozen-modal-title').textContent = activeProduct.name;
    document.getElementById('dozen-modal-price').textContent = money(activeProduct.price);
    document.getElementById('dozen-modal-image').src = activeProduct.image;
    // Catering cutouts sit in the same compact panel as the box modal's, not stretched to a 420px photo.
    itemModal.querySelector('.item-modal-media').classList.toggle('item-modal-media-cutout', !!activeProduct.cutout);
    // The item's own authored description, not a generated sentence — this
    // modal now also serves the egg salads (a tub, not "deviled eggs"), so
    // a hardcoded "N deviled eggs, hand piped fresh daily" no longer fits
    // every product that opens it.
    document.getElementById('dozen-modal-desc').textContent = activeProduct.desc || '';
    document.getElementById('flavor-section-title').textContent = activeProduct.maxFlavors === 1 ? 'Choose your flavor' : 'Choose your flavors';
    itemModal.querySelector('.item-modal-header-title').textContent = activeProduct.name;

    // Kit extras: what's in the box, the fixed flavor lineup, the shipping note.
    document.getElementById('dozen-modal-desc').hidden = !activeProduct.desc;
    const info = document.getElementById('dozen-modal-info');
    info.hidden = !(activeProduct.details && activeProduct.details.length);
    document.getElementById('dozen-modal-info-label').textContent = activeProduct.detailsLabel || "What's included";
    document.getElementById('dozen-modal-details').innerHTML = (activeProduct.details || []).map((d) => `<li>${escapeHTML(d)}</li>`).join('');
    document.getElementById('flavor-block').hidden = !!activeProduct.fixedFlavors;
    document.getElementById('fixed-flavors').hidden = !activeProduct.fixedFlavors;
    document.getElementById('fixed-flavors-list').innerHTML = (activeProduct.fixedFlavors || []).map((f) => `<li>${escapeHTML(f)}</li>`).join('');
    const notice = document.getElementById('dozen-modal-notice');
    notice.hidden = !activeProduct.notice;
    notice.textContent = activeProduct.notice || '';

    state.bagelPreset = (line && line.edit.bagelPreset) || 'mixed';
    document.getElementById('bagel-preset-block').hidden = !activeProduct.bagelPresets;
    if (activeProduct.bagelPresets) renderBagelPresets();

    if (!activeProduct.fixedFlavors) renderFlavorGrid();
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

  function closeDozenModal() {
    endLineEdit();
    stopFlavorWatch();
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
      return excluded && excluded.size ? `${f.label} (no ${[...excluded].join(', ').toLowerCase()})` : f.label;
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
        type: 'dozen', productId: activeProduct.id, flavorQty: { ...state.modalFlavorQty },
        exclusions: Object.fromEntries(Object.entries(state.modalExclusions).map(([id, set]) => [id, [...set]])),
        note, bagelPreset: activeProduct.bagelPresets ? state.bagelPreset : undefined,
      };
    }
    if (editingLine) { commitLineEdit(entry, closeDozenModal); return; }
    addToCart({
      ...entry,
      cart: activeProduct.cart || orderKind(),
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

  // Yolk spread: exactly one flavor, as native radios (same row as the wrap and
  // egg salads). Updated in place on change so keyboard focus survives.
  function renderBagelFlavorRadios() {
    const grid = document.getElementById('bagel-flavor-grid');
    grid.innerHTML = BAGEL_FLAVORS.map((flavor, i) => radioChoiceHTML({
      group: 'bagel-flavor', value: i, label: flavor, selected: state.bagelFlavor === flavor,
    })).join('');
    grid.querySelectorAll('.radio-choice-input').forEach((input) => {
      input.addEventListener('change', () => {
        state.bagelFlavor = BAGEL_FLAVORS[Number(input.value)];
        grid.querySelectorAll('.radio-choice').forEach((row) => {
          row.classList.toggle('selected', row.querySelector('.radio-choice-input').checked);
        });
        renderBagelModalFooter();
      });
    });
  }

  function renderBagelModalFooter() {
    document.getElementById('bagel-qty-select').value = String(state.bagelQty);
    const total = BAGEL_PRICE * state.bagelQty;
    const btn = document.getElementById('add-bagel-to-order');
    btn.disabled = !state.bagelFlavor;
    btn.textContent = state.bagelFlavor ? `${editingLine ? 'Update order' : `Add ${state.bagelQty} to order`} · ${money(total)}` : 'Choose a flavor to continue';
  }

  function openBagelModal(line = null) {
    lastFocusedEl = document.activeElement;
    editingLine = line;
    document.getElementById('bagel-modal-image').src = BAGEL_IMAGE;
    document.getElementById('bagel-modal-price').textContent = money(BAGEL_PRICE);
    document.getElementById('bagel-modal-desc').textContent = BAGEL_DESC;
    state.bagelToast = 'Not Toasted';
    state.bagelType = 'Plain';
    state.bagelFlavor = null;
    state.bagelOptions = new Set();
    state.bagelQty = 1;
    if (line) {
      const e = line.edit;
      Object.assign(state, { bagelToast: e.toast, bagelType: e.bagelType, bagelFlavor: e.flavor, bagelOptions: new Set(e.options), bagelQty: line.qty });
    }
    populateQtySelect(document.getElementById('bagel-qty-select'));
    document.querySelectorAll('#bagel-toast-picker .chip').forEach((b) => b.classList.toggle('active', b.dataset.value === state.bagelToast));
    document.querySelectorAll('#bagel-type-picker .chip').forEach((b) => b.classList.toggle('active', b.dataset.value === state.bagelType));
    document.querySelectorAll('#bagel-options-picker .chip').forEach((b) => b.classList.toggle('active', state.bagelOptions.has(b.dataset.value)));
    renderBagelFlavorRadios();
    renderBagelModalFooter();
    bagelModal.querySelector('.item-modal-scroll').scrollTop = 0;
    bagelModal.querySelector('.item-modal-header-title').classList.remove('visible');
    bagelModalBackdrop.hidden = false;
    bagelModal.hidden = false;
    updateInert();
    document.getElementById('close-bagel-modal').focus();
  }

  function closeBagelModal() {
    endLineEdit();
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
    if (!state.bagelFlavor) return;
    const parts = [state.bagelType, state.bagelToast, state.bagelFlavor];
    if (state.bagelOptions.size) parts.push(Array.from(state.bagelOptions).join(', '));
    const entry = {
      name: 'Full Size Bagel',
      sub: parts.join(' · '),
      price: BAGEL_PRICE,
      qty: state.bagelQty,
      image: BAGEL_IMAGE,
      edit: { type: 'bagel', toast: state.bagelToast, bagelType: state.bagelType, flavor: state.bagelFlavor, options: Array.from(state.bagelOptions) },
    };
    if (editingLine) { commitLineEdit(entry, closeBagelModal); return; }
    addToCart({
      ...entry,
      key: 'bagel-' + JSON.stringify({ t: state.bagelType, toast: state.bagelToast, f: state.bagelFlavor, o: Array.from(state.bagelOptions) }) + '-' + Date.now(),
    });
    celebrateAdd(bagelModal, closeBagelModal, BAGEL_IMAGE, state.bagelQty);
  });

  // ---------- Bowl customization modal ----------
  // Add-Ons are paid (priced per item) and multi-select, like Free Eggstras
  // and the exclusion list — none of the four sections are mutually
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

  function renderBowlEggstras() {
    const container = document.getElementById('bowl-eggstras-picker');
    container.innerHTML = activeBowl.freeEggstras.map((label) => `
      <button class="chip${state.bowlEggstras.has(label) ? ' active' : ''}" type="button" data-value="${label}">${label}</button>
    `).join('');
    container.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const value = chip.dataset.value;
        if (state.bowlEggstras.has(value)) state.bowlEggstras.delete(value);
        else state.bowlEggstras.add(value);
        chip.classList.toggle('active');
      });
    });
  }

  function renderBowlExclusions() {
    const container = document.getElementById('bowl-no-picker');
    container.innerHTML = activeBowl.exclusions.map((label) => `
      <button class="chip exclude-chip${state.bowlExclusions.has(label) ? ' active' : ''}" type="button" data-value="${label}">NO: ${label}</button>
    `).join('');
    container.querySelectorAll('.exclude-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const value = chip.dataset.value;
        if (state.bowlExclusions.has(value)) state.bowlExclusions.delete(value);
        else state.bowlExclusions.add(value);
        chip.classList.toggle('active');
      });
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
    state.bowlEggstras = new Set(line ? line.edit.eggstras : []);
    state.bowlExclusions = new Set(line ? line.edit.exclusions : []);
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
    renderBowlEggstras();
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
    if (state.bowlEggstras.size) parts.push(Array.from(state.bowlEggstras).join(', '));
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
        type: 'bowl', productId: activeBowl.id, addOns: Array.from(state.bowlAddOns), eggstras: Array.from(state.bowlEggstras),
        exclusions: Array.from(state.bowlExclusions), options: Array.from(state.bowlOptions),
      },
    };
    if (editingLine) { commitLineEdit(entry, closeBowlModal); return; }
    addToCart({
      ...entry,
      key: 'bowl-' + activeBowl.id + '-' + JSON.stringify({
        a: Array.from(state.bowlAddOns), e: Array.from(state.bowlEggstras),
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

  // One flavor, chosen with native radios. Rows are built once per open and
  // updated in place on change: re-rendering would destroy the focused radio
  // and break arrow-key navigation within the group.
  function renderWrapFlavorGrid() {
    const grid = document.getElementById('wrap-flavor-grid');
    grid.innerHTML = activeWrap.wrapFlavors.map((f) => radioChoiceHTML({
      group: 'wrap-flavor', value: f.id, label: f.label, note: f.ingredients, selected: state.wrapFlavor === f.id,
    })).join('');
    grid.querySelectorAll('.radio-choice-input').forEach((input) => {
      input.addEventListener('change', () => {
        state.wrapFlavor = input.value;
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
    let sum = 0;
    state.wrapAddOns.forEach((i) => { sum += activeWrap.addOns[i].price; });
    return sum;
  }

  function renderWrapModalFooter() {
    document.getElementById('wrap-qty-select').value = String(state.wrapQty);
    const unitPrice = activeWrap.price + wrapAddOnsTotal();
    const total = unitPrice * state.wrapQty;
    const btn = document.getElementById('add-wrap-to-order');
    const complete = Boolean(state.wrapFlavor);
    btn.disabled = !complete;
    btn.textContent = complete ? `${editingLine ? 'Update order' : `Add ${state.wrapQty} to order`} · ${money(total)}` : 'Choose a flavor to continue';
  }

  function openWrapModal(item, line = null) {
    lastFocusedEl = document.activeElement;
    activeWrap = item;
    editingLine = line;
    state.wrapFlavor = line ? line.edit.flavor : null;
    state.wrapAddOns = new Set(line ? line.edit.addOns : []);
    state.wrapQty = line ? line.qty : 1;
    populateQtySelect(document.getElementById('wrap-qty-select'));

    document.getElementById('wrap-modal-title').textContent = item.name;
    document.getElementById('wrap-modal-price').textContent = money(item.price);
    document.getElementById('wrap-modal-image').src = item.image;
    document.getElementById('wrap-modal-desc').textContent = item.desc || '';
    document.getElementById('wrap-modal-header-title').textContent = item.name;

    renderWrapFlavorGrid();
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
    const flavor = activeWrap.wrapFlavors.find((f) => f.id === state.wrapFlavor);
    if (!flavor) return;
    const addOnLabels = Array.from(state.wrapAddOns).map((i) => activeWrap.addOns[i].label);
    const parts = [flavor.label];
    if (addOnLabels.length) parts.push(addOnLabels.join(', '));
    const unitPrice = activeWrap.price + wrapAddOnsTotal();
    const entry = {
      name: activeWrap.name,
      sub: parts.join(' · '),
      price: unitPrice,
      qty: state.wrapQty,
      image: activeWrap.image,
      edit: { type: 'wrap', productId: activeWrap.id, flavor: flavor.id, addOns: Array.from(state.wrapAddOns) },
    };
    if (editingLine) { commitLineEdit(entry, closeWrapModal); return; }
    addToCart({
      ...entry,
      key: 'wrap-' + activeWrap.id + '-' + flavor.id + '-' + JSON.stringify(Array.from(state.wrapAddOns)) + '-' + Date.now(),
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
    addToCart({
      cart: activeQuickview.cartMeta.cart || orderKind(),
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
  const CATERING_SANDWICHES = [{"id": "blte-sw", "label": "BLTE", "desc": "Ranch Yolk Mix, Bacon, Cheddar Cheese, Lettuce, Tomato & House-Made Creamy Ranch"}, {"id": "cali-sw", "label": "Cali Roll", "desc": "Imitation Crab Mix, Sriracha Aioli, Fresh Avocado, Cucumber, Teriyaki & Black Sesame"}, {"id": "veggie-sw", "label": "Vegetarian", "desc": "Cream Cheese, Cucumbers, Tomato & Everything Seasoning"}, {"id": "caesar-sw", "label": "The Caesar", "desc": "Caesar Yolk Mix, Grilled Chicken, Bacon, Parmean Cheese, Lettuce, Tomato & House-Made Creamy Ranch"}, {"id": "bbq-sw", "label": "Backyard BBQ", "desc": "Traditional Yolk Mix, BBQ Brisket, Lettuce, Pickled Jalapeno, Red Onion, BBQ Sauce, Cheddar Cheese"}, {"id": "buffalo-sw", "label": "Buffalo Chicken", "desc": "Buffalo Yolk Mix, Grilled Chicken, Red Onion, Buffalo Sauce, Lettuce & House-Made Creamy Ranch"}];
  const CATERING_BOWLS = [{"id": "avo-blt-bowl", "label": "Avocado Chicken BLT", "desc": "Egg Whites, Grilled Chicken, Bacon, Fresh Avocado, Cheddar Cheese, Lettuce, Tomato & House-Made Creamy Ranch"}, {"id": "buffalo-bowl", "label": "Buffalo Chicken Bowl", "desc": "Egg Whites, Lettuce, Grilled Chicken, Red Onion, Buffalo Sauce, Cheddar Cheese & House-Made Creamy Ranch"}, {"id": "caesar-bowl", "label": "The Caesar Bowl", "desc": "Egg Whites, Grilled Chicken, Capers, Romaine Lettuce, Red Onion, Creamy Caesar & Parmesan Cheese"}, {"id": "brisket-bowl", "label": "Banging Brisket Bowl", "desc": "Egg Whites, BBQ Brisket, Lettuce, Pickled Jalapeño, Red Onion, BBQ Sauce & Cheddar Cheese"}, {"id": "poke-bowl", "label": "Poke-Egg-Bowl", "desc": "Egg Whites, Imitation Crab, Sriracha Aioli, Fresh Avocado, Cucumber, Teriyaki Sauce & Black Sesame Seeds"}, {"id": "walking-taco-bowl", "label": "Walking Taco Bowl", "desc": "Egg Whites, Refried Beans, Grilled Chicken, Lettuce, Cheddar Cheese, Cholula Hot Sauce, Sour Cream & Doritos"}];
  const CATERING_EGGS = [{"id": "buffalo-blue", "label": "Buffalo Blue", "desc": "Hot Sauce Yolk Mix, Blue Cheese Crumbles & A Hot Sauce Drizzle"}, {"id": "buffalo-chicken", "label": "Buffalo Chicken Egg", "desc": "Buffalo Sauce Infused Yolk Mix, Grilled Chicken, Red Onion & A Buffalo Sauce Drizzle"}, {"id": "walking-taco", "label": "Walking Taco Egg", "desc": "Cholula Infused Yolk Mix, Grilled Chicken, Refried Beans, Lettuce, Sour Cream, Cheddar Cheese & Crumbled Doritos"}, {"id": "jalapeno-popper", "label": "Jalapeño Popper", "desc": "Cream Cheese Yolk Mix, Bacon Crumbles, Fresh Jalapeño Slice & A Chipotle Sauce Drizzle"}, {"id": "chicken-pickle", "label": "Chicken N A Pickle", "desc": "Sweet Chicken Sauce Yolk Mix, Grilled Chicken, A Dill Pickle Slice & A Sweet Chicken Sauce Drizzle"}, {"id": "smoked-salmon", "label": "Smoked Salmon", "desc": "Cream Cheese Infused Yolk Mix, Capers, Red Onion & Fully Cooked Wild Caught Smoked Salmon"}, {"id": "crab-rangoon", "label": "Crab Rangoon", "desc": "Sweet Crab Mix, Cream Cheese Infused Yolk Mix, Crispy Wontons & A Sweet & Sour Sauce Drizzle"}, {"id": "cali-roll", "label": "Cali Roll Egg", "desc": "Spicy Mayo Crab Mix, Fresh Cucumber Slice, Black Sesame Seeds & A Teriyaki Sauce Drizzle"}, {"id": "sriracha-bacon", "label": "Sriracha Bacon", "desc": "Sriracha Yolk Mix, Bacon Crumbles & A Sriracha Drizzle"}, {"id": "blte", "label": "BLTE Egg", "desc": "Ranch Yolk Mix, Bacon Crumbles, Lettuce, Cherry Tomato Slice & A Ranch Sauce Drizzle"}, {"id": "south-border", "label": "South of the Border", "desc": "Cholula Infused Yolk Mix, Cheddar Cheese & Fresh Jalapeño Slice"}, {"id": "chicken-caesar", "label": "Chicken Caesar", "desc": "Caesar Infused Yolk Mix, Grilled Chicken, Lettuce, Parmesan Cheese & A Caesar Drizzle"}, {"id": "backyard-bbq", "label": "Backyard BBQ Egg", "desc": "Smokey BBQ In The Base, Traditional Yolk Mix, Dill Pickle Slice & A BBQ Sauce Drizzle"}, {"id": "chicken-bacon-ranch", "label": "Chicken Bacon Ranch", "desc": "Ranch Yolk Mix, Grilled Chicken, Bacon Crumbles, Cheddar Cheese & A Ranch Sauce Drizzle"}, {"id": "traditional", "label": "Traditional", "desc": "Mayo & Dijon Infused Yolk Mix, Paprika Seasoning"}, {"id": "everything", "label": "Everything Seasoning", "desc": "Cream Cheese Infused Yolk Mix, Everything Seasoning"}];
  const CATERING_COFFEE_NOTE = 'The Coffee Bar Included';
  const CATERING_DRINKS = { price: 3, choices: ['Water', 'Sprite', 'Coke', 'Unsweet Tea', 'Sweet Tea'], maxEach: 10 };
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
    classic: {
      kind: 'box', id: 'classic', name: 'The Classic Choice', price: 10, minQty: 10, image: 'assets/catering/classic.png',
      desc: 'Choose sandwich or bowl, up to 2 flavors, then a side.',
      included: ['Kettle Cooked Chips'],
      sides: [SIDE_COOKIE, SIDE_PICKLE, { id: 'eggs-2pack', label: '2-Pack of Gourmet Deviled Eggs', price: 4, flavor: true }, SIDE_EGG_SALAD],
    },
    allin: {
      kind: 'box', id: 'allin', name: 'The "All In" Power Lunch', price: 12.5, minQty: 10, image: 'assets/catering/allin.png',
      desc: 'Choose sandwich or bowl, up to 2 flavors, then pick your sides.',
      included: ['Kettle Cooked Chips', 'Cookie'],
      sides: [{ id: 'eggs-2pack', label: 'Gourmet 2-Pack of Deviled Eggs', price: 4, flavor: true }, SIDE_PICKLE, SIDE_EGG_SALAD, { id: 'bag-chips', label: 'Bag of Chips', price: 2 }],
      drinks: CATERING_DRINKS,
    },
    'power-pair': {
      kind: 'bundle', id: 'power-pair', name: 'Power Pair Bundle', price: 59.99, image: 'assets/catering/power-pair.png',
      desc: 'Serves 10 People',
      details: ['10 Signature 2-Pack Gourmet Deviled Eggs (20 eggs total)', CATERING_COFFEE_NOTE],
      flavors: CATERING_EGGS, unit: ['two-pack', 'two-packs'],
    },
    'bagel-brew': {
      kind: 'bundle', id: 'bagel-brew', name: 'Bagel & Brew Bundle', price: 69.99, image: 'assets/catering/bagel-brew.png',
      desc: 'Serves 10 People',
      details: ['Bagel Box: 5 Plain Bagels | 5 Everything Bagels', 'Choice of 2 Signature Egg Spreads, Toppings, or Cream Cheese', CATERING_COFFEE_NOTE],
      flavors: CATERING_EGGS, unit: ['spread', 'spreads'], bagelPresets: BAGEL_PRESETS,
    },
    'hungry-team': {
      kind: 'bundle', id: 'hungry-team', name: 'The "Hungry Team"', price: 99.99, image: 'assets/catering/light-lunch.png',
      desc: 'Serves 10 People: Best Value For a Full Meal',
      details: ['10 Signature Full-Sandwiches | Choose Up To 2 Flavors', CATERING_COFFEE_NOTE],
      flavors: CATERING_SANDWICHES, unit: ['sandwich', 'sandwiches'],
    },
    'light-lunch': {
      kind: 'bundle', id: 'light-lunch', name: 'The "Light Lunch"', price: 69.99, image: 'assets/catering/light-lunch.png',
      desc: 'Serves 10 People',
      details: ['10 Signature Half-Sandwiches | Choose Up To 2 Flavors', CATERING_COFFEE_NOTE],
      flavors: CATERING_SANDWICHES, unit: ['sandwich', 'sandwiches'],
    },
    'coffee-bar': {
      kind: 'simple', id: 'coffee-bar', name: 'Catering Coffee Bar', price: 24.99, icon: 'coffee',
      desc: 'Serves 10-12 People: 96oz Hardy Coffee, Cream, Sugar & Sweeteners, and setup: Cups, Lids & Stirrers.',
    },
  };

  function openCateringItem(id) {
    const item = CATERING_ITEMS[id];
    if (item.kind === 'box') { openBoxModal(item); return; }
    if (item.kind === 'simple') { openQuickviewModal(item, { keyPrefix: 'catering', cartCategory: 'Catering · Add-on station · Serves 10-12', cart: 'catering' }); return; }
    openDozenModal(cateringBundleProduct(item));
  }

  // A bundle is one dozen-style picker: its 10 pieces go out in steps of 5
  // across up to 2 flavors, and every bundle ordered gets the same mix.
  function cateringBundleProduct(item) {
    return {
      ...item,
      cart: 'catering',
      cutout: true,
      pickerConfig: { total: 10, maxFlavors: 2 },
      hintTail: ' Every bundle gets the same mix.',
    };
  }

  document.querySelectorAll('[data-cater-order]').forEach((btn) => {
    btn.addEventListener('click', () => openCateringItem(btn.dataset.caterOrder));
  });

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
    { id: 'bowl', label: 'Lunch Size Bowl', note: 'High protein', flavors: CATERING_BOWLS },
  ];
  // 10 to 40 one at a time, then bigger steps up to a 200-box event.
  const BOX_QTY_OPTIONS = [...Array.from({ length: 31 }, (_, i) => 10 + i), 45, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200];
  const boxProtein = () => BOX_PROTEINS.find((p) => p.id === box.protein);
  const boxDrinkCount = () => Object.values(box.drinks).reduce((a, n) => a + n, 0);
  const boxSides = () => box.item.sides.filter((side) => box.sides.has(side.id));
  const boxUnitPrice = () => box.item.price + boxSides().reduce((sum, side) => sum + side.price, 0);
  const boxDrinkCost = () => boxDrinkCount() * CATERING_DRINKS.price;

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

  function renderBoxFlavors() {
    const grid = document.getElementById('box-flavor-grid');
    const hint = document.getElementById('box-flavor-hint');
    if (!box.protein) {
      grid.innerHTML = '';
      hint.textContent = 'Choose sandwich or bowl first.';
      return;
    }
    const flavors = boxProtein().flavors;
    const full = box.flavors.length >= 2;
    hint.textContent = box.flavors.length === 2
      ? 'Two flavors chosen. Your boxes split evenly between them.'
      : 'Pick up to 2 flavors. Two flavors split your boxes evenly.';
    grid.innerHTML = flavors.map((f) => {
      const on = box.flavors.includes(f.id);
      const blocked = full && !on;
      return `
      <button class="addon-row${on ? ' selected' : ''}${blocked ? ' at-limit' : ''}" type="button" role="checkbox" aria-checked="${on}"${blocked ? ' aria-disabled="true"' : ''} data-id="${f.id}">
        <span class="addon-row-text">
          <span class="addon-row-name">${escapeHTML(f.label)}</span>
          <span class="addon-row-note">${escapeHTML(f.desc)}</span>
        </span>
        <span class="addon-row-box" aria-hidden="true">${on ? ADDON_CHECK_ICON : ''}</span>
      </button>`;
    }).join('');
    grid.querySelectorAll('.addon-row').forEach((row) => {
      row.addEventListener('click', () => {
        const id = row.dataset.id;
        const at = box.flavors.indexOf(id);
        if (at >= 0) box.flavors.splice(at, 1);
        else if (box.flavors.length < 2) box.flavors.push(id);
        else return;
        renderBoxFlavors();
        grid.querySelector(`.addon-row[data-id="${id}"]`).focus();
        renderBoxFooter();
      });
    });
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
      <div class="side-option">
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

  function renderBoxDrinks() {
    const block = document.getElementById('box-drinks-block');
    block.hidden = !box.item.drinks;
    if (!box.item.drinks) return;
    document.getElementById('box-drinks-sub').textContent = `${money(CATERING_DRINKS.price)} each. Choose any mix.`;
    const grid = document.getElementById('box-drinks-grid');
    grid.innerHTML = '';
    CATERING_DRINKS.choices.forEach((name) => {
      const qty = box.drinks[name] || 0;
      const row = document.createElement('div');
      row.className = 'flavor-row dozen-flavor-row' + (qty > 0 ? ' selected' : '');
      row.innerHTML = `
        <div class="flavor-row-head">
          <span class="flavor-row-name">${escapeHTML(name)}</span>
          <div class="mini-stepper">
            <button class="mini-step-btn" type="button" aria-label="Remove one ${escapeHTML(name)}"${qty <= 0 ? ' disabled' : ''}>${STEP_MINUS_ICON}</button>
            <span>${qty}</span>
            <button class="mini-step-btn" type="button" aria-label="Add one ${escapeHTML(name)}"${qty >= CATERING_DRINKS.maxEach ? ' disabled' : ''}>${STEP_PLUS_ICON}</button>
          </div>
        </div>`;
      const [dec, inc] = row.querySelectorAll('.mini-step-btn');
      dec.addEventListener('click', () => { box.drinks[name] = Math.max(0, qty - 1); if (!box.drinks[name]) delete box.drinks[name]; renderBoxDrinks(); renderBoxFooter(); });
      inc.addEventListener('click', () => { box.drinks[name] = qty + 1; renderBoxDrinks(); renderBoxFooter(); });
      grid.appendChild(row);
    });
  }

  // What still has to be chosen before the box can go in the cart, or null.
  function boxMissing() {
    if (!box.protein) return 'Choose a protein to continue';
    if (!box.flavors.length) return 'Pick a flavor to continue';
    const needFlavor = boxSides().find((side) => side.flavor && !box.sideFlavor[side.id]);
    if (needFlavor) return `Choose a flavor for your ${needFlavor.id === 'egg-salad' ? 'egg salad' : 'deviled eggs'} to continue`;
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
    if (drinks.length) rows.push(['Drinks', drinks.join(', ')]);
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
      drinks: cfg ? { ...cfg.drinks } : {},
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
    if (box.editing) { box.editing = null; openCart('catering'); return; }
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.getElementById('close-box-modal').addEventListener('click', closeBoxModal);
  boxModalBackdrop.addEventListener('click', closeBoxModal);
  document.getElementById('box-qty-select').addEventListener('change', (e) => {
    box.qty = Number(e.target.value);
    renderBoxFlavors();
    renderBoxFooter();
  });
  document.getElementById('box-qty-presets').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    box.qty = Number(chip.dataset.qty);
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
    return [...DEVILED_EGGS, ...EGG_SALADS, ...PLATTERS, ...SHIPPING_KITS].find((p) => p.id === id);
  }
  // A line added before Edit existed saved only a sentence. If its product can be customized, Edit still
  // reopens that product's modal, starting blank, and saving replaces the line.
  function blankEditSpec(line) {
    const dozen = [...DEVILED_EGGS, ...EGG_SALADS, ...PLATTERS, ...SHIPPING_KITS, ...Object.values(CATERING_ITEMS).filter((i) => i.kind === 'bundle')]
      .find((p) => p.name === line.name && !p.fixedFlavors && (p.pickerConfig || p.kind === 'bundle'));
    if (dozen) return { type: 'dozen', productId: dozen.id, flavorQty: {}, exclusions: {}, note: '', blank: true };
    const bowl = PROTEIN_BOWLS.find((b) => b.name === line.name);
    if (bowl) return { type: 'bowl', productId: bowl.id, addOns: [], eggstras: [], exclusions: [], options: [], blank: true };
    if (line.name === 'Full Size Bagel') return { type: 'bagel', toast: 'Not Toasted', bagelType: 'Plain', flavor: null, options: [], blank: true };
    const wrap = SANDWICH_WRAP.find((w) => w.name === line.name);
    if (wrap) return { type: 'wrap', productId: wrap.id, flavor: null, addOns: [], blank: true };
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
    if (e.type === 'dozen') openDozenModal(findDozenProduct(e.productId), line);
    else if (e.type === 'bowl') openBowlModal(PROTEIN_BOWLS.find((b) => b.id === e.productId), line);
    else if (e.type === 'bagel') openBagelModal(line);
    else if (e.type === 'wrap') openWrapModal(SANDWICH_WRAP.find((w) => w.id === e.productId), line);
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
    addToCart({
      cart: 'catering',
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
    const here = !views.shipping.hidden ? 'shipping' : !views.catering.hidden ? 'catering' : orderKind();
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

  function computeTotals() {
    const subtotal = cartSubtotal('pickup');
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }

  const DRAWER_EMPTY = {
    pickup: 'Your cart is empty. Add something delicious from the menu.',
    shipping: 'No shipping kits yet. Add one from Nationwide Shipping.',
    catering: 'No catering items yet. Add one from Catering.',
    delivery: 'Your cart is empty. Add something delicious from the menu.',
  };
  const DRAWER_NOTE = {
    shipping: 'Shipping is added at checkout.',
    catering: 'Delivery fee and tax are added at checkout.',
    delivery: 'Delivery fee, tip and tax are added at checkout.',
  };

  function drawerContextHTML(kind) {
    if (kind === 'shipping') return 'Ships nationwide · order Mon–Wed for week-of arrival';
    if (kind === 'catering') return 'Catering · box meals are a 10-box minimum';
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

    // Pickup shows its total with tax, as it always has; the other two carts
    // owe fees that only checkout knows, so they show a subtotal and say so.
    const isPickup = kind === 'pickup';
    document.getElementById('drawer-total-label').textContent = isPickup ? 'Total' : 'Subtotal';
    document.getElementById('drawer-total').textContent = money(isPickup ? computeTotals().total : cartSubtotal(kind));
    const note = document.getElementById('drawer-total-note');
    // Delivery has a minimum: below it the note says how much is missing, and checkout waits.
    const short = kind === 'delivery' ? Math.max(0, DELIVERY_MINIMUM - cartSubtotal('delivery')) : 0;
    note.hidden = isPickup || items.length === 0;
    note.textContent = short > 0 ? `Add ${money(short)} to reach the ${money(DELIVERY_MINIMUM)} delivery minimum.` : DRAWER_NOTE[kind] || '';

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
    'ship-checkout': document.getElementById('view-ship-checkout'),
    'cater-checkout': document.getElementById('view-cater-checkout'),
    'delivery-checkout': document.getElementById('view-delivery-checkout'),
  };
  // Each cart checks out on its own page; all of them swap the site header for the checkout header.
  const CHECKOUT_VIEWS = ['checkout', 'ship-checkout', 'cater-checkout', 'delivery-checkout'];
  const CHECKOUT_VIEW_FOR = { pickup: 'checkout', delivery: 'delivery-checkout', shipping: 'ship-checkout', catering: 'cater-checkout' };
  const PAGE_FOR_CART = { pickup: 'order', delivery: 'order', shipping: 'shipping', catering: 'catering' };

  // Each page names itself in the browser tab (and to screen readers when the page changes).
  const SITE_NAME = 'Deviled Egg Co.';
  const PAGE_TITLES = {
    home: 'Deviled Egg Co. — Order Online',
    'location-picker': `Our locations — ${SITE_NAME}`,
    menu: `Menu — ${SITE_NAME}`,
    order: `Order pickup — ${SITE_NAME}`,
    shipping: `Nationwide Shipping — ${SITE_NAME}`,
    catering: `Catering — ${SITE_NAME}`,
    'delivery-checkout': `Secure Checkout, Delivery — ${SITE_NAME}`,
    checkout: `Secure Checkout — ${SITE_NAME}`,
    'ship-checkout': `Secure Checkout, Nationwide Shipping — ${SITE_NAME}`,
    'cater-checkout': `Secure Checkout, Catering — ${SITE_NAME}`,
    confirmation: `Order confirmed — ${SITE_NAME}`,
  };

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
    if (name === 'delivery-checkout') setSummaryOpen(document.getElementById('dc-toggle-summary'), true);
    if (name === 'checkout') renderCheckoutMap('pickup');
    if (name === 'delivery-checkout') renderCheckoutMap('delivery');
    document.body.classList.toggle('is-checkout', CHECKOUT_VIEWS.includes(name));
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
    if (window.degLocationPicker && window.degLocationPicker.sync) window.degLocationPicker.sync();
  }

  // The URL names the page on screen (#shipping, #menu, …), so a reload or a shared link lands where the
  // customer is. Checkout and confirmation keep the page they came from. Home is the bare URL.
  const PAGE_VIEWS = ['home', 'location-picker', 'menu', 'order', 'shipping', 'catering', 'checkout', 'ship-checkout', 'cater-checkout', 'delivery-checkout', 'confirmation'];
  // Checkout and confirmation have addresses of their own: reached from a page they are pushed onto the history, so
  // Back returns to that page; a link to one with nothing to check out goes back to the page its cart belongs to.
  const PAGE_HASH_OF = { checkout: '#checkout', 'ship-checkout': '#checkout/shipping', 'cater-checkout': '#checkout/catering', 'delivery-checkout': '#checkout/delivery', confirmation: '#confirmation' };
  function syncPageHash(name) {
    if (!PAGE_VIEWS.includes(name)) return;
    // #order/<group> is the order page too (see openOrderGroup).
    if (name === 'order' && location.hash.startsWith('#order')) return;
    if (name === 'menu' && location.hash.startsWith('#store/')) return;
    const want = name === 'home' ? '' : (PAGE_HASH_OF[name] || '#' + name);
    if (location.hash === want || (name === 'home' && (location.hash === '' || location.hash === '#home'))) return;
    const url = location.pathname + location.search + want;
    if (CHECKOUT_VIEWS.includes(name)) history.pushState(null, '', url);
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
    history.replaceState(null, '', '#home');
    showView('home');
  };
  // Two logos, one shown at a time: the wordmark, and on phones the egg submark (the checkout bar keeps the wordmark).
  document.querySelectorAll('.site-header .logo').forEach((siteLogo) => {
    siteLogo.addEventListener('click', goHome);
    siteLogo.addEventListener('keydown', (e) => { if (e.key === 'Enter') goHome(); });
  });

  // ---------- A store's own page ----------
  // The menu page, with its banner, store card and menu, is every real store's page: #store/<id>. The finder's cards
  // open it. Browsing is open to everyone; the first thing added asks how the order is going (pickup or delivery) if
  // that is not chosen yet, with this store already selected, and then carries on with what was tapped.
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
  function gateFulfillment(resume) {
    if (views.menu.hidden) return false;
    const chosen = state.orderMode === 'delivery' ? deliverySessionValid() : pickupSessionValid();
    if (chosen) return false;
    pendingStoreOpen = resume;
    openWhere('pickup', { returnTo: 'store', store: state.viewStore || currentStoreId() });
    return true;
  }
  function resumeStorePage() {
    const resume = pendingStoreOpen;
    pendingStoreOpen = null;
    if (resume) resume();
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
  // Delivery from this store: the row opens the "where" modal on its Delivery tab.
  document.getElementById('si-delivery-btn').addEventListener('click', () => {
    closeStoreInfo();
    openWhere('delivery', { returnTo: 'store' });
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
    history.replaceState(null, '', '#order');
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
    if (path === 'shipping' || path === 'catering') {
      history.replaceState(null, '', '#' + path);
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
      history.replaceState(null, '', '#' + page);
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
  const PAGE_HASHES = { '#home': 'home', '#location-picker': 'location-picker', '#menu': 'menu', '#order': 'order', '#shipping': 'shipping', '#catering': 'catering', '#checkout': 'checkout', '#confirmation': 'order' };
  navLinksEl.addEventListener('click', (e) => {
    // "Pickup & Delivery" links nowhere for now (like the Home "Order delivery" tile): the click does nothing.
    // "Pickup & Delivery" opens the "where" modal, like the Home tiles, on the tab it was last on.
    if (e.target.closest('[data-open-where]')) { e.preventDefault(); openWhere(wm.tab); return; }
    const link = e.target.closest('a[data-view]');
    if (!link) return;
    e.preventDefault();
    const name = link.dataset.view;
    history.replaceState(null, '', '#' + name);
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
    const [base, group] = location.hash.split('/');
    // The address checker is a modal: a link to #delivery opens it over Home.
    if (base === '#delivery') { showView('home'); startDelivery(); return; }
    if (base === '#store') { showStorePage(group); return; }
    let view = PAGE_HASHES[base] || 'home';
    if (base === '#checkout') view = group === 'shipping' ? 'ship-checkout' : group === 'catering' ? 'cater-checkout' : group === 'delivery' ? 'delivery-checkout' : 'checkout';
    if (CHECKOUT_VIEWS.includes(view)) { openCheckoutFromLink(view); return; }
    showView(view);
    if (view === 'order' && group) openOrderGroup(group, { push: false });
  }
  window.addEventListener('hashchange', routeFromHash);

  // Kit cards open their in-app modal; the whole card is the target, as on the menu.
  document.querySelector('.kit-grid').addEventListener('click', (e) => {
    const card = e.target.closest('.kit-card');
    if (!card) return;
    openMenuItem(SHIPPING_KITS.find((k) => k.id === card.dataset.kit));
  });

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
    if (kind === 'delivery') setOrderMode('delivery');
    if (kind === 'pickup') renderCheckout();
    else if (kind === 'delivery') renderDeliveryCheckout();
    else if (kind === 'shipping') renderShipCheckout();
    else renderCaterCheckout();
    showView(CHECKOUT_VIEW_FOR[kind]);
  }
  // An address that points at a checkout (a bookmark, Back, a shared link) only opens it when there is something to
  // pay for; otherwise it lands on the page that cart is filled from.
  function openCheckoutFromLink(view) {
    const kind = Object.keys(CHECKOUT_VIEW_FOR).find((k) => CHECKOUT_VIEW_FOR[k] === view);
    if (kind === 'delivery' && (!state.carts.delivery.length || !deliverySessionValid())) { startDelivery(); return; }
    if (!state.carts[kind].length || (kind === 'pickup' && !pickupSessionValid())) { showView(PAGE_FOR_CART[kind]); return; }
    openCheckout(kind);
  }

  document.getElementById('back-to-cart').addEventListener('click', () => {
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
    // Closing is today's 8:00 PM, not 8:00 PM of whichever day the cursor landed on: after 11:30 PM the cursor
    // rolls past midnight, and measuring from it offered a whole day of slots from 12:00 AM on.
    const close = new Date(now);
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
    renderNavWhere();
  }

  // The banner above the menu: the store, day and time chosen on the way here.
  // The indicator in the nav (pickup from which store, or delivery to where). It names the path the customer is on
  // and opens the "where" modal to change it; before anything is chosen it asks.
  function navWhereState() {
    const pickup = pickupSessionValid();
    const delivery = deliverySessionValid();
    if (delivery && (state.orderMode === 'delivery' || !pickup)) return { path: 'delivery', verb: 'Deliver to', name: deliveryLabel() };
    if (pickup) return { path: 'pickup', verb: 'Pickup from', name: state.location };
    return { path: null, verb: 'Pickup or delivery?', name: 'Choose a store' };
  }
  function renderNavWhere() {
    if (!navWhereReady) return;
    const w = navWhereState();
    document.getElementById('nav-where-verb').textContent = w.verb;
    document.getElementById('nav-where-name').textContent = w.name;
    // The icon is the map's: the egg pin for pickup (and before a choice), the gold truck pin for delivery.
    document.getElementById('nav-where').dataset.path = w.path || '';
    document.getElementById('nav-where').setAttribute('aria-label', w.path ? `${w.verb} ${w.name}. Change` : 'Choose pickup or delivery');
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
    const slots = buildTimeSlots(key);
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
    start.textContent = ld.edit ? 'Update order' : fromCheckout ? 'Continue to checkout' : back === 'store' || back === 'nav' ? 'Continue' : ld.kind === 'delivery' ? 'Continue' : 'Start my order';
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

  function renderLdDates() {
    const list = document.getElementById('ld-date-list');
    list.innerHTML = '';
    pickupDatesCache.forEach((d) => {
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
    document.getElementById('ld-hours').textContent = delivery ? 'Delivery hours: 10:00 AM – 8:00 PM' : 'Pickup hours: 10:00 AM – 8:00 PM';
    document.getElementById('ld-change').textContent = delivery ? 'Change address' : 'Change store';
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
    ldBackdrop.hidden = true;
    ldModal.hidden = true;
    updateInert();
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.getElementById('ld-close').addEventListener('click', closeLocationDetails);
  // "Change store" goes back to the picker; from the menu banner that means leaving the menu for it.
  document.getElementById('ld-change').addEventListener('click', () => {
    // Only the order page's banner has to leave the page to change store; from the picker, closing is enough.
    const fromOrder = ld && ld.edit && !ld.thenOrder;
    const wasDelivery = ld && ld.kind === 'delivery';
    closeLocationDetails();
    if (wasDelivery) { startDelivery({ returnTo: views['delivery-checkout'].hidden ? null : 'checkout' }); return; }
    if (fromOrder) startFunnel('pickup', { returnTo: views.checkout.hidden ? null : 'checkout' });
  });
  ldBackdrop.addEventListener('click', closeLocationDetails);
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

  function saveDeliverySession() {
    try { localStorage.setItem(DELIVERY_SESSION_KEY, JSON.stringify(state.delivery)); } catch (e) { /* storage unavailable: the choice lasts until reload */ }
    renderNavWhere();
  }
  // Placing an order ends the session (the day and time); the address and contact stay for the next order.
  function endDeliverySession() {
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
  const daZip = document.getElementById('da-zip');
  const daResult = document.getElementById('da-result');
  const DA_ICON = '<svg class="da-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 7h11v9H3V7ZM14 10h4l3 3v3h-7" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="7.5" cy="17.5" r="1.8" fill="var(--deg-cream)" stroke="currentColor" stroke-width="1.4"/><circle cx="17.5" cy="17.5" r="1.8" fill="var(--deg-cream)" stroke="currentColor" stroke-width="1.4"/></svg>';

  // What the modal knows right now. `sel` is the suggestion chosen on the Delivery tab; `store` the store chosen on Pickup.
  const wm = { tab: 'pickup', sel: null, store: null, point: null, geoDown: false, suggestions: [], active: -1, origin: null, nav: false };
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
        const near = wm.store ? [storeById(wm.store)] : sortedStores().slice(0, wm.point ? 2 : 4);
        const pts = near.map((st) => [st.lat, st.lng]).concat(wm.point ? [[wm.point.lat, wm.point.lng]] : []);
        mapMove((animate) => map.fitBounds(pts, { padding: [48, 48], maxZoom: 13, animate }));
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
    pendingStoreOpen = null;
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
  let geoAbort = null;
  async function geocode(q) {
    if (geoAbort) geoAbort.abort();
    geoAbort = new AbortController();
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en&lat=33.2&lon=-96.6&location_bias_scale=0.6`;
    const res = await fetch(url, { signal: geoAbort.signal });
    if (!res.ok) throw new Error('geocoder ' + res.status);
    const data = await res.json();
    return (data.features || [])
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
    daZip.value = '';
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

  // What the fields say right now: nothing yet, a deliverable address, or one outside the area.
  function renderDeliveryResult() {
    const sel = wm.sel;
    const zipTyped = daZip.value.trim();
    const needZip = (sel && !sel.zip) || (!sel && wm.geoDown);
    document.getElementById('da-zip-wrap').hidden = !needZip;
    const street = sel ? sel.street : wm.geoDown ? daAddress.value.trim() : '';
    const zip = sel && sel.zip ? sel.zip : zipTyped;
    if (street.length < 3 || !isZip(zip)) {
      deliveryChecked = null;
      const message = needZip && wm.geoDown ? "Address search isn't available right now. Enter your street address and ZIP code."
        : needZip ? 'Add your ZIP code to see if we deliver there.'
        : `Search for your street address to see if we deliver there. A ${money(DELIVERY_FEE)} delivery fee applies.`;
      daResult.className = 'delivery-result is-idle';
      daResult.innerHTML = `${DA_ICON}<p class="delivery-result-note">${message}</p>
        <button class="text-btn" id="da-pickup" type="button">Pickup instead</button>`;
      return;
    }
    const area = deliveryAreaFor(zip);
    deliveryChecked = area ? { street, zip, city: area.city, store: area.store, lat: sel ? sel.lat : null, lng: sel ? sel.lng : null } : null;
    const place = area ? `${area.city}, TX ${zip}` : `${sel && sel.city ? sel.city + ' ' : ''}${zip}`.trim();
    const address = `${escapeHTML(street)}<br>${escapeHTML(place)}`;
    daResult.className = 'delivery-result ' + (area ? 'is-ok' : 'is-no');
    daResult.innerHTML = area ? `${DA_ICON}
      <h2>You're in luck, we can deliver to</h2>
      <p class="delivery-result-address">${address}</p>
      <p class="delivery-result-note">A ${money(DELIVERY_FEE)} delivery fee applies, and the minimum order is ${money(DELIVERY_MINIMUM)}.</p>
      <button class="pill-btn dark full" id="da-add-details" type="button">Add address details</button>
      <button class="text-btn" id="da-pickup" type="button">Pickup instead</button>` : `${DA_ICON}
      <h2>Sorry, we can't deliver to</h2>
      <p class="delivery-result-address">${address}</p>
      <p class="delivery-result-note">That address is outside our delivery area for now. Try another address, or pick up at a store.</p>
      <button class="text-btn" id="da-pickup" type="button">Pickup instead</button>`;
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
    daZip.value = '';
    renderDeliveryResult();
    syncMap();
  }
  let suggestTimer = null;
  daAddress.addEventListener('input', () => {
    window.clearTimeout(suggestTimer);
    document.getElementById('da-clear').hidden = !daAddress.value;
    // Changing the text makes the chosen address stale.
    if (wm.sel) { wm.sel = null; renderDeliveryResult(); syncMap({ fit: false }); }
    const q = daAddress.value.trim();
    if (q.length < 4) { hideSuggestions(); if (wm.geoDown) renderDeliveryResult(); return; }
    if (wm.geoDown) { renderDeliveryResult(); }
    suggestTimer = window.setTimeout(async () => {
      try {
        const found = await geocode(q);
        wm.geoDown = false;
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
        renderSuggestions();
        document.getElementById('da-zip-wrap').hidden = true;
      } catch (e) {
        if (e.name === 'AbortError') return;
        wm.geoDown = true;
        hideSuggestions();
        renderDeliveryResult();
      }
    }, 350);
  });
  daZip.addEventListener('input', renderDeliveryResult);
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
    daZip.value = '';
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
  document.getElementById('da-change-time').addEventListener('click', () => { closeWhereQuietly(); openLocationDetails(null, { edit: true, kind: 'delivery' }); });

  // ----- Pickup tab -----
  function sortedStores() {
    const list = PICKUP_STORES.map((st) => ({ ...st, miles: wm.point ? milesBetween(wm.point, st) : null }));
    return wm.point ? list.sort((a, b) => a.miles - b.miles) : list.sort((a, b) => a.city.localeCompare(b.city));
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
    }
    renderStoreList();
  }
  function renderStoreList() {
    const hours = storeHoursText();
    const list = document.getElementById('wm-stores');
    const storeOnly = wm.origin === 'pickup';
    const current = storeOnly ? currentStoreId() : null;
    document.getElementById('wm-pk-title').textContent = wm.point ? 'Nearby' : 'Our stores';
    list.innerHTML = sortedStores().map((st) => `
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
    pick.textContent = storeOnly ? 'Update pickup location' : 'Pick up here';
    pick.disabled = storeOnly && wm.store === current;
    document.getElementById('wm-pk-actions').hidden = !wm.store;
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
  document.getElementById('wm-pk-pick').addEventListener('click', () => {
    const st = storeById(wm.store);
    if (!st) return;
    // From the pickup checkout only the store changes: the day and time stay, and the customer is back where they were.
    if (wm.origin === 'pickup') {
      if (st.id === currentStoreId()) return;
      closeWhere();
      state.location = storeName(st);
      savePickupSession();
      renderPickupSummary();
      renderStoreLocatorSummary();
      renderDrawer();
      const msg = `Pickup location updated to ${state.location}. ${pickupReadyText()}`;
      if (views.checkout.hidden) announceNav(msg); else announceCheckout(msg);
      return;
    }
    closeWhereQuietly();
    openLocationDetails(st);
  });
  document.getElementById('wm-pk-saved-continue').addEventListener('click', () => {
    closeWhereQuietly();
    if (wm.nav && wm.origin === 'pickup') funnelReturn = null;
    finishPickerFunnel();
  });
  document.getElementById('wm-pk-change-time').addEventListener('click', () => {
    const st = storeById(currentStoreId());
    closeWhereQuietly();
    if (st) openLocationDetails(st, { edit: true });
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
  pkInput.addEventListener('input', () => { document.getElementById('wm-pk-clear').hidden = !pkInput.value; });
  document.getElementById('wm-pk-clear').addEventListener('click', () => {
    pkInput.value = '';
    document.getElementById('wm-pk-clear').hidden = true;
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

  document.getElementById('dd-close').addEventListener('click', closeDeliveryDetails);
  ddBackdrop.addEventListener('click', closeDeliveryDetails);
  document.getElementById('dd-change').addEventListener('click', () => {
    closeDeliveryDetails();
    startDelivery({ returnTo: dd && dd.edit ? 'checkout' : deliveryReturn });
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
    if (chosen.edit) {
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
    history.replaceState(null, '', '#order');
    showView('order');
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
    const totalQty = items === state.carts.catering ? items.length : items.reduce((sum, item) => sum + item.qty, 0);
    countEl.textContent = `(${totalQty} item${totalQty === 1 ? '' : 's'})`;
  }

  function renderCheckout() {
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
  // The shipping, catering and delivery checkouts collapse their summaries the same way.
  ['sc', 'cc', 'dc'].forEach((p) => {
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
    const tipAmt = state.tipPct === 'custom' ? state.tipCustom : subtotal * (state.tipPct / 100);
    const total = preTipTotal + tipAmt;

    document.getElementById('sum-subtotal').textContent = money(subtotal);
    document.getElementById('sum-tax').textContent = money(tax);
    document.getElementById('sum-tip').textContent = money(tipAmt);
    // Each tip choice shows what it comes to in dollars, so the choice is a figure, not just a percentage.
    document.querySelectorAll('#tip-picker .tip-chip').forEach((chip) => {
      const pct = chip.dataset.value === 'custom' ? null : Number(chip.dataset.value);
      chip.querySelector('.tip-chip-amt').textContent = money(pct === null ? state.tipCustom : subtotal * (pct / 100));
    });
    document.getElementById('sum-total').textContent = money(total);
    if (!placingOrder) document.getElementById('place-order').textContent = 'Place order';
    return total;
  }

  const PIN_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 22s7-7.58 7-12A7 7 0 0 0 5 10c0 4.42 7 12 7 12Z" stroke="#402D00" stroke-width="1.8"/><circle cx="12" cy="10" r="2.5" stroke="#402D00" stroke-width="1.8"/></svg>';


  // ---------- Delivery checkout ----------
  const dcMinNote = document.getElementById('dc-min-note');
  state.dTipPct = 18;
  state.dTipCustom = 0;

  function deliveryTotals() {
    const subtotal = cartSubtotal('delivery');
    const tax = subtotal * TAX_RATE;
    const tip = state.dTipPct === 'custom' ? state.dTipCustom : subtotal * (state.dTipPct / 100);
    return { subtotal, fee: DELIVERY_FEE, tax, tip, total: subtotal + DELIVERY_FEE + tax + tip };
  }

  function renderDeliveryTotals() {
    const t = deliveryTotals();
    document.getElementById('dc-subtotal').textContent = money(t.subtotal);
    document.getElementById('dc-fee').textContent = money(t.fee);
    document.getElementById('dc-tax').textContent = money(t.tax);
    document.getElementById('dc-tip').textContent = money(t.tip);
    document.querySelectorAll('#dc-tip-picker .tip-chip').forEach((chip) => {
      const pct = chip.dataset.value === 'custom' ? null : Number(chip.dataset.value);
      chip.querySelector('.tip-chip-amt').textContent = money(pct === null ? state.dTipCustom : t.subtotal * (pct / 100));
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
    document.getElementById('dc-dropoff-line').textContent = deliveryDropoffText() + (d.notes ? ` · ${d.notes}` : '');
    document.getElementById('dc-time-summary').textContent = d.chosen ? deliveryWhenText() : '';
    renderDeliveryEta();
    if (!views['delivery-checkout'].hidden) renderCheckoutMap('delivery');
    // The name and number were asked for with the address, so they arrive filled in; typing over them is fine.
    [['dc-name', d.name], ['dc-phone', d.phone], ['dc-email', d.email]].forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (!input.value && value) input.value = value;
    });
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
      const addressLines = `<strong>${escapeHTML(deliveryLabel())}</strong><br>${escapeHTML(deliveryStreetLine())}<br>${escapeHTML(d.city)}, ${d.state} ${escapeHTML(d.zip)}<br>${escapeHTML(deliveryDropoffText())}`;

      clearCart('delivery');
      endDeliverySession();
      showConfirmation({
        number: orderNumber(),
        subHTML: asap
          ? `Order {number} · We're preparing it now — arriving ${whenPhrase}`
          : `Order {number} · Scheduled for delivery ${whenPhrase}`,
        steps: ['Preparing', 'Delivered'],
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

  function showConfirmation({ number, subHTML, steps, items, total, cardHTML, backLabel, backView }) {
    document.getElementById('confirm-sub').innerHTML = subHTML.replace('{number}', `<strong>${number}</strong>`);
    document.getElementById('progress-step2-label').textContent = steps[0];
    document.getElementById('progress-step3-label').textContent = steps[1];
    document.getElementById('fulfillment-card').innerHTML = cardHTML;
    const confirmItems = document.getElementById('confirm-items');
    confirmItems.innerHTML = '';
    items.forEach((line) => {
      const el = document.createElement('div');
      el.className = 'summary-line';
      el.innerHTML = `<span>${line.label}</span><span>${line.amount}</span>`;
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
  }

  const recapLines = (items) => items.map((item) => ({ label: `${item.name} ×${item.qty}`, amount: money(lineTotal(item)) }));

  // Switching a checkout from pickup to delivery (or back) takes its lines with it. Carts are otherwise kept apart;
  // this is the one place they join, and only when the customer changes how the order is fulfilled.
  function moveCart(from, to) {
    const lines = state.carts[from];
    if (!lines.length) return 0;
    lines.forEach((line) => { if (line.cart) line.cart = to; });
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
    const region = views['delivery-checkout'].hidden ? checkoutStatus : document.getElementById('dc-status');
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
        items, total,
        cardHTML: `${PIN_ICON}<span>${address}</span><a class="pill-btn outline" id="get-directions" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" target="_blank" rel="noopener">Get directions</a>`,
        backLabel: '← Back to home', backView: 'home',
      });
    }, 900);
  });

  // A placed order ends its pickup or delivery session, so the order page is no longer open to the customer: pickup and
  // delivery confirmations go back Home, where the next order starts. Shipping and Catering go back to their own pages.
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
      if (failed > 1 && first.closest('#view-checkout, #view-delivery-checkout')) announceCheckout(`${failed} fields need attention.`, 700);
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
  // Prototype rate only: the live site gives no shipping prices, so this one
  // flat figure stands in (and says so on the page) until real pricing exists.
  const SHIPPING_RATE_PLACEHOLDER = 19.99;

  // Orders placed Mon–Wed arrive that week; Thu–Sun go out the following Monday.
  function shipWindow(now = new Date()) {
    const day = now.getDay(); // 0 Sun … 6 Sat
    if (day >= 1 && day <= 3) {
      return { title: 'Arrives this week', body: 'We hand-pack every order in our Texas kitchen the morning we ship. Orders placed Monday through Wednesday arrive within the same week.', arrive: 'this week' };
    }
    const daysToMonday = (8 - day) % 7 || 7;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToMonday);
    const label = monday.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    return { title: `Ships ${label}`, body: 'Orders placed Thursday through Sunday go out the following Monday and arrive that week.', arrive: `the week of ${label}` };
  }

  function renderShipCheckout() {
    renderSummaryItems(document.getElementById('sc-items'), document.getElementById('sc-item-count'), state.carts.shipping);
    const when = shipWindow();
    document.getElementById('sc-when').innerHTML = `<strong>${when.title}</strong><p>${when.body}</p>`;
    renderShipTotals();
    renderPaymentPickers();
  }

  function renderShipTotals() {
    const subtotal = cartSubtotal('shipping');
    document.getElementById('sc-subtotal').textContent = money(subtotal);
    document.getElementById('sc-shipping').textContent = money(SHIPPING_RATE_PLACEHOLDER);
    document.getElementById('sc-total').textContent = money(subtotal + SHIPPING_RATE_PLACEHOLDER);
    return subtotal + SHIPPING_RATE_PLACEHOLDER;
  }

  document.getElementById('sc-place-order').addEventListener('click', () => {
    if (state.carts.shipping.length === 0) return;
    const f = (id) => document.getElementById('sc-' + id);
    const ok = validateFields([
      [f('name'), present, 'Enter the name for this order.'],
      [f('phone'), isPhone, 'Enter a phone number with area code.'],
      [f('email'), isEmail, 'Enter a valid email so we can send your tracking link.'],
      [f('street'), present, 'Enter the street address to ship to.'],
      [f('city'), present, 'Enter the city.'],
      [f('state'), present, 'Choose a state. We ship to the 48 contiguous states.'],
      [f('zip'), isZip, 'Enter a 5-digit ZIP code.'],
    ]);
    if (!ok) return;

    const total = renderShipTotals();
    const when = shipWindow();
    const items = recapLines(state.carts.shipping);
    items.push({ label: 'Shipping', amount: money(SHIPPING_RATE_PLACEHOLDER) });
    const apt = f('street2').value.trim();
    const addressLines = `${escapeHTML(f('name').value.trim())}<br>${escapeHTML(f('street').value.trim())}${apt ? ', ' + escapeHTML(apt) : ''}<br>${escapeHTML(f('city').value.trim())}, ${f('state').value} ${f('zip').value.trim()}`;

    clearCart('shipping');
    showConfirmation({
      number: orderNumber(),
      subHTML: `Order {number} · We'll email your tracking link the morning we ship. Your kit arrives <strong>${when.arrive}</strong>.`,
      steps: ['Packing', 'Shipped'],
      items, total,
      cardHTML: `${PIN_ICON}<span>${addressLines}</span>`,
      backLabel: '← Back to Nationwide Shipping', backView: 'shipping',
    });
  });

  // ---------- Catering checkout ----------
  // Rules and figures are the live catering order form's own: pickup is free
  // and can be same-day (2 hours' notice); delivery is a $20 flat fee, free at
  // $200, and needs a day's notice; tax is 8.25%.
  const CATERING_DELIVERY_FEE = 20;
  const CATERING_FREE_DELIVERY_AT = 200;
  const CATERING_LOCATIONS = [
    { id: 'denison', name: 'Denison', address: '231 W Main St, Denison, TX 75020', desc: 'Historic Downtown · Full-service dine-in' },
    { id: 'mckinney', name: 'McKinney', address: '111 W Virginia St, McKinney, TX 75069', desc: 'Downtown on the Square · Carry-out' },
    { id: 'rockwall', name: 'Rockwall', address: '2065 Summer Lee Drive, Rockwall, TX 75032', desc: 'At The Harbor' },
    { id: 'coppell', name: 'Coppell', address: '3001 Olympus Blvd, Suite 100, Coppell, TX 75019', desc: 'Cypress Waters · Carry-out & catering' },
  ];
  const cater = { fulfilment: 'pickup', location: 'mckinney' };

  function caterTotals() {
    const subtotal = cartSubtotal('catering');
    const fee = cater.fulfilment === 'delivery' && subtotal < CATERING_FREE_DELIVERY_AT ? CATERING_DELIVERY_FEE : 0;
    const tax = subtotal * TAX_RATE;
    return { subtotal, fee, tax, total: subtotal + fee + tax };
  }

  function renderCaterTotals() {
    const { subtotal, fee, tax, total } = caterTotals();
    const delivery = cater.fulfilment === 'delivery';
    document.getElementById('cc-subtotal').textContent = money(subtotal);
    document.getElementById('cc-delivery-fee').textContent = !delivery ? 'Pickup · Free' : fee ? money(fee) : 'Free';
    document.getElementById('cc-tax').textContent = money(tax);
    document.getElementById('cc-total').textContent = money(total);
    return total;
  }

  // Pickup can be today; delivery needs a day's notice. Both live in the date
  // field's min, so an impossible date can't be picked.
  function syncCaterDate() {
    const delivery = cater.fulfilment === 'delivery';
    const input = document.getElementById('cc-date');
    input.min = delivery ? addDaysISO(todayISO(), 1) : todayISO();
    if (input.value && input.value < input.min) input.value = '';
    document.getElementById('cc-date-help').textContent = delivery
      ? 'Delivery: 24–48 hours lead time required.'
      : 'Pickup: same-day OK · please give us at least 2 hours.';
  }

  function renderCaterLocations() {
    const list = document.getElementById('cc-locations');
    list.innerHTML = CATERING_LOCATIONS.map((loc) => radioChoiceHTML({
      group: 'cc-location', value: loc.id, label: loc.name, note: `${loc.address} · ${loc.desc}`, selected: loc.id === cater.location,
    })).join('');
    list.querySelectorAll('.radio-choice-input').forEach((input) => {
      input.addEventListener('change', () => {
        cater.location = input.value;
        list.querySelectorAll('.radio-choice').forEach((row) => {
          row.classList.toggle('selected', row.querySelector('.radio-choice-input').checked);
        });
      });
    });
  }

  function setCaterFulfilment(kind) {
    cater.fulfilment = kind;
    document.querySelectorAll('#cc-fulfilment .chip').forEach((chip) => {
      const on = chip.dataset.value === kind;
      chip.classList.toggle('active', on);
      chip.setAttribute('aria-checked', String(on));
    });
    document.getElementById('cc-pickup').hidden = kind !== 'pickup';
    document.getElementById('cc-delivery').hidden = kind !== 'delivery';
    syncCaterDate();
    renderCaterTotals();
  }

  document.getElementById('cc-fulfilment').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip) setCaterFulfilment(chip.dataset.value);
  });

  function renderCaterCheckout() {
    renderSummaryItems(document.getElementById('cc-items'), document.getElementById('cc-item-count'), state.carts.catering);
    renderCaterLocations();
    setCaterFulfilment(cater.fulfilment);
    renderPaymentPickers();
  }

  document.getElementById('cc-place-order').addEventListener('click', () => {
    if (state.carts.catering.length === 0) return;
    const f = (id) => document.getElementById('cc-' + id);
    const delivery = cater.fulfilment === 'delivery';
    const rows = [
      [f('date'), (v) => v !== '' && v >= f('date').min, delivery ? 'Pick a date at least a day from now.' : 'Pick the date of your event.'],
    ];
    if (delivery) {
      rows.push([f('address'), present, 'Enter the address to deliver to.'], [f('zip'), isZip, 'Enter a 5-digit ZIP code.'], [f('delivery-time'), present, 'Choose a delivery time.']);
    } else {
      rows.push([f('pickup-time'), present, 'Choose a pickup time.']);
    }
    rows.push(
      [f('name'), present, 'Enter your name.'],
      [f('phone'), isPhone, 'Enter a phone number with area code.'],
      [f('email'), isEmail, 'Enter a valid email so we can confirm your order.'],
    );
    if (!validateFields(rows)) return;

    const { fee } = caterTotals();
    const total = renderCaterTotals();
    const items = recapLines(state.carts.catering);
    if (delivery) items.push({ label: 'Delivery', amount: fee ? money(fee) : 'Free' });
    items.push({ label: 'Tax', amount: money(caterTotals().tax) });
    const when = `${longDate(f('date').value)} at <strong>${clockLabel(delivery ? f('delivery-time').value : f('pickup-time').value)}</strong>`;
    const loc = CATERING_LOCATIONS.find((l) => l.id === cater.location);
    const where = delivery ? escapeHTML(f('address').value.trim()) : `${loc.name} · ${loc.address}`;

    clearCart('catering');
    showConfirmation({
      number: orderNumber(),
      subHTML: `Order {number} · We'll confirm by phone within an hour. ${delivery ? 'Delivery' : 'Pickup'} on ${when}.`,
      steps: ['Confirming', delivery ? 'Delivered' : 'Ready'],
      items, total,
      cardHTML: `${PIN_ICON}<span>${where}</span>`,
      backLabel: '← Back to Catering', backView: 'catering',
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
  openFirstPage();
})();
