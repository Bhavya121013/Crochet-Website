/**
 * StitchCraft — Crochet Studio & Fair-Price Calculator
 * Features: Real-time reactive pricing engine, Multi-yarn tracker,
 * Android PWA install prompt handler, LocalStorage project manager,
 * and Client Quote Card generator.
 * 
 * Author: Bhavya Agarwal
 */

// Global State
const state = {
  currency: '₹',
  yarnCount: 1,
  deferredPrompt: null,
  activeTab: 'calculator',
  savedProjects: []
};

// Preset Templates
const PRESETS = {
  amigurumi: {
    name: 'Strawberry Frog Plushie',
    client: 'Instagram Customer',
    yarns: [
      { name: 'Sage Green Velvet', used: 65, weight: 100, price: 250 },
      { name: 'Berry Red Velvet', used: 20, weight: 100, price: 250 }
    ],
    stuffing: 30,
    eyes: 20,
    keychain: 15,
    other: 0,
    hours: 3,
    minutes: 30,
    hourlyRate: 120,
    packaging: 35,
    overhead: 15,
    platformFee: 0,
    profit: 35
  },
  cardigan: {
    name: 'Floral Granny Square Cardigan',
    client: 'Boutique Order',
    yarns: [
      { name: 'Cream Cotton/Acrylic', used: 350, weight: 100, price: 220 },
      { name: 'Mustard Yellow', used: 120, weight: 100, price: 220 },
      { name: 'Dusty Rose', used: 150, weight: 100, price: 220 }
    ],
    stuffing: 0,
    eyes: 0,
    keychain: 0,
    other: 60, // wooden buttons
    hours: 16,
    minutes: 0,
    hourlyRate: 150,
    packaging: 80,
    overhead: 50,
    platformFee: 6.5,
    profit: 40
  },
  totebag: {
    name: 'Sunburst Market Tote Bag',
    client: 'Custom Order',
    yarns: [
      { name: 'Natural Cotton Cord', used: 220, weight: 100, price: 180 },
      { name: 'Terracotta Accent', used: 60, weight: 100, price: 180 }
    ],
    stuffing: 0,
    eyes: 0,
    keychain: 0,
    other: 40, // handles/lining
    hours: 5,
    minutes: 30,
    hourlyRate: 120,
    packaging: 30,
    overhead: 20,
    platformFee: 0,
    profit: 30
  },
  buckethat: {
    name: 'Wavy Checkerboard Bucket Hat',
    client: 'Depop / Etsy Buyer',
    yarns: [
      { name: 'Soft Worsted Acrylic', used: 120, weight: 100, price: 160 }
    ],
    stuffing: 0,
    eyes: 0,
    keychain: 0,
    other: 0,
    hours: 3,
    minutes: 15,
    hourlyRate: 120,
    packaging: 25,
    overhead: 15,
    platformFee: 6.5,
    profit: 30
  },
  coaster: {
    name: 'Daisy Mug Rug (Set of 4)',
    client: 'Gift Set',
    yarns: [
      { name: 'Soft Mercerized Cotton', used: 75, weight: 50, price: 110 }
    ],
    stuffing: 0,
    eyes: 0,
    keychain: 0,
    other: 15, // twine and tags
    hours: 1,
    minutes: 45,
    hourlyRate: 120,
    packaging: 20,
    overhead: 10,
    platformFee: 0,
    profit: 25
  },
  scrunchie: {
    name: 'Chenille Cloud Scrunchie',
    client: 'Craft Market Stock',
    yarns: [
      { name: 'Jumbo Chenille Fluff', used: 25, weight: 100, price: 200 }
    ],
    stuffing: 0,
    eyes: 0,
    keychain: 0,
    other: 8, // elastic band
    hours: 0,
    minutes: 25,
    hourlyRate: 120,
    packaging: 10,
    overhead: 5,
    platformFee: 0,
    profit: 40
  }
};

// Initialization on DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  initServiceWorker();
  initTheme();
  initPWAInstall();
  initNavigation();
  initYarnManager();
  initCalculatorListeners();
  initPresets();
  initSavedProjects();
  initQuoteModal();

  // Initial Calculation
  calculatePrice();
});

/* --------------------------------------------------------------------------
   Service Worker Registration
   -------------------------------------------------------------------------- */
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('StitchCraft Service Worker active:', reg.scope))
        .catch((err) => console.warn('Service Worker registration skipped:', err));
    });
  }
}

/* --------------------------------------------------------------------------
   Theme Switcher (Light / Cozy Dark Mode)
   -------------------------------------------------------------------------- */
function initTheme() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('stitchcraft_theme') || 'light';
  setTheme(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });
}

function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('stitchcraft_theme', theme);
  const themeIcon = document.querySelector('.theme-icon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

/* --------------------------------------------------------------------------
   PWA & Android Install Modal Handling
   -------------------------------------------------------------------------- */
function initPWAInstall() {
  const pwaBanner = document.getElementById('pwaBanner');
  const pwaInstallBtn = document.getElementById('pwaInstallBtn');
  const pwaDismissBtn = document.getElementById('pwaDismissBtn');
  const androidModal = document.getElementById('androidModal');
  const androidModalClose = document.getElementById('androidModalClose');
  const androidInstallActionBtn = document.getElementById('androidInstallActionBtn');
  const androidContinueWebBtn = document.getElementById('androidContinueWebBtn');
  const headerInstallBtn = document.getElementById('headerInstallBtn');
  const footerInstallLink = document.getElementById('footerInstallLink');
  const manualInstructions = document.getElementById('manualInstallInstructions');

  // Detect Android device
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  // Intercept beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
    
    // Show top install banner
    if (!sessionStorage.getItem('pwa_banner_dismissed')) {
      pwaBanner.classList.remove('hidden');
    }
  });

  // Auto popup for Android users on first visit in session
  if (isAndroid && !isStandalone && !sessionStorage.getItem('android_popup_shown')) {
    setTimeout(() => {
      androidModal.classList.remove('hidden');
      sessionStorage.setItem('android_popup_shown', 'true');
    }, 1200);
  }

  // Trigger Install logic
  async function triggerInstall() {
    if (state.deferredPrompt) {
      state.deferredPrompt.prompt();
      const choice = await state.deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showToast('🎉 Thank you for installing StitchCraft App!', 'success');
      }
      state.deferredPrompt = null;
      pwaBanner.classList.add('hidden');
      androidModal.classList.add('hidden');
    } else {
      // Show manual instructions
      if (manualInstructions) {
        manualInstructions.classList.remove('hidden');
        showToast('Follow the steps below to install from your browser menu', 'info');
      } else {
        alert('To install StitchCraft on your phone:\nTap the three dots (⋮) in Chrome, then tap "Install App" or "Add to Home Screen"!');
      }
    }
  }

  pwaInstallBtn?.addEventListener('click', triggerInstall);
  androidInstallActionBtn?.addEventListener('click', triggerInstall);
  
  headerInstallBtn?.addEventListener('click', () => {
    androidModal.classList.remove('hidden');
  });

  footerInstallLink?.addEventListener('click', (e) => {
    e.preventDefault();
    androidModal.classList.remove('hidden');
  });

  pwaDismissBtn?.addEventListener('click', () => {
    pwaBanner.classList.add('hidden');
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  });

  androidModalClose?.addEventListener('click', () => {
    androidModal.classList.add('hidden');
  });

  androidContinueWebBtn?.addEventListener('click', () => {
    androidModal.classList.add('hidden');
  });

  // Close modal when clicking backdrop
  androidModal?.addEventListener('click', (e) => {
    if (e.target === androidModal) androidModal.classList.add('hidden');
  });
}

/* --------------------------------------------------------------------------
   Navigation & Tabs
   -------------------------------------------------------------------------- */
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      switchTab(targetTab);
    });
  });

  // Handle hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (['calculator', 'saved', 'tools'].includes(hash)) {
      switchTab(hash);
    }
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

  const tabBtn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
  const pane = document.getElementById(`tab-${tabId}`);
  if (tabBtn) tabBtn.classList.add('active');
  if (pane) pane.classList.add('active');

  if (tabId === 'saved') {
    renderSavedProjects();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --------------------------------------------------------------------------
   Multi-Yarn Manager
   -------------------------------------------------------------------------- */
function initYarnManager() {
  const addYarnBtn = document.getElementById('addYarnBtn');
  const yarnList = document.getElementById('yarnList');

  addYarnBtn.addEventListener('click', () => {
    state.yarnCount++;
    const yarnId = state.yarnCount;

    const yarnCard = document.createElement('div');
    yarnCard.className = 'yarn-card';
    yarnCard.dataset.yarnId = yarnId;
    yarnCard.innerHTML = `
      <div class="yarn-card-header">
        <span class="yarn-title-badge">🧶 Yarn #${yarnId}</span>
        <button class="btn-remove-yarn" title="Remove this yarn" aria-label="Remove yarn">✕</button>
      </div>
      <div class="input-grid-4">
        <div class="input-group">
          <label>Yarn Color / Brand</label>
          <input type="text" class="yarn-name" placeholder="e.g. Accent Color" value="Yarn #${yarnId}">
        </div>
        <div class="input-group">
          <label>Yarn Used (grams)</label>
          <input type="number" class="yarn-used" min="0" step="1" placeholder="40" value="40">
        </div>
        <div class="input-group">
          <label>Full Skein Weight (g)</label>
          <input type="number" class="yarn-weight" min="1" step="1" placeholder="100" value="100">
        </div>
        <div class="input-group">
          <label>Skein Price (<span class="currency-symbol">${state.currency}</span>)</label>
          <input type="number" class="yarn-price" min="0" step="0.5" placeholder="250" value="250">
        </div>
      </div>
      <div class="yarn-subtotal-bar">
        <span>Yarn #${yarnId} Estimated Cost:</span>
        <strong class="yarn-cost-display"><span class="currency-symbol">${state.currency}</span>100.00</strong>
      </div>
    `;

    yarnList.appendChild(yarnCard);
    attachYarnListeners(yarnCard);
    updateRemoveButtonsVisibility();
    calculatePrice();
    showToast(`Added Yarn #${yarnId}`, 'info');
  });

  // Attach to initial row
  const firstRow = document.querySelector('.yarn-card');
  if (firstRow) attachYarnListeners(firstRow);
}

function attachYarnListeners(card) {
  const inputs = card.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', calculatePrice);
  });

  const removeBtn = card.querySelector('.btn-remove-yarn');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      card.remove();
      updateRemoveButtonsVisibility();
      calculatePrice();
      showToast('Yarn removed', 'info');
    });
  }
}

function updateRemoveButtonsVisibility() {
  const allCards = document.querySelectorAll('.yarn-card');
  allCards.forEach(c => {
    const btn = c.querySelector('.btn-remove-yarn');
    if (btn) {
      if (allCards.length > 1) {
        btn.classList.remove('hidden');
      } else {
        btn.classList.add('hidden');
      }
    }
  });
}

/* --------------------------------------------------------------------------
   Calculator Listeners & Reactive Engine
   -------------------------------------------------------------------------- */
function initCalculatorListeners() {
  // Currency Selector
  const currencySelect = document.getElementById('currencySelect');
  currencySelect.addEventListener('change', (e) => {
    state.currency = e.target.value;
    document.querySelectorAll('.currency-symbol').forEach(el => el.textContent = state.currency);
    calculatePrice();
  });

  // Project Name
  const projectNameInput = document.getElementById('projectName');
  projectNameInput.addEventListener('input', (e) => {
    const val = e.target.value.trim() || 'Handmade Creation';
    document.getElementById('summaryProjectBadge').textContent = val;
  });

  // All numeric inputs on page
  const directInputIds = [
    'notionStuffing', 'notionEyes', 'notionKeychain', 'notionOther',
    'hoursInput', 'minutesInput', 'hourlyRate',
    'packagingCost', 'overheadCost', 'platformFee'
  ];

  directInputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculatePrice);
  });

  // Time Steppers
  document.querySelectorAll('.btn-stepper[data-add-min]').forEach(btn => {
    btn.addEventListener('click', () => {
      const addMins = parseInt(btn.dataset.addMin, 10);
      const hoursEl = document.getElementById('hoursInput');
      const minsEl = document.getElementById('minutesInput');
      
      let curHours = parseInt(hoursEl.value, 10) || 0;
      let curMins = parseInt(minsEl.value, 10) || 0;

      curMins += addMins;
      while (curMins >= 60) {
        curMins -= 60;
        curHours += 1;
      }

      hoursEl.value = curHours;
      minsEl.value = curMins;
      calculatePrice();
    });
  });

  document.getElementById('resetTimeBtn')?.addEventListener('click', () => {
    document.getElementById('hoursInput').value = 0;
    document.getElementById('minutesInput').value = 0;
    calculatePrice();
  });

  // Wage preset suggestions
  document.querySelectorAll('.wage-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('hourlyRate').value = chip.dataset.rate;
      calculatePrice();
    });
  });

  // Profit Slider & Number Input Sync
  const profitRange = document.getElementById('profitRange');
  const profitInput = document.getElementById('profitInput');
  const profitPercentVal = document.getElementById('profitPercentVal');

  profitRange.addEventListener('input', (e) => {
    const val = e.target.value;
    profitInput.value = val;
    profitPercentVal.textContent = `${val}%`;
    updateProfitChipActive(val);
    calculatePrice();
  });

  profitInput.addEventListener('input', (e) => {
    let val = parseFloat(e.target.value) || 0;
    profitRange.value = Math.min(val, 100);
    profitPercentVal.textContent = `${val}%`;
    updateProfitChipActive(val);
    calculatePrice();
  });

  document.querySelectorAll('.preset-profit-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.profit;
      profitRange.value = val;
      profitInput.value = val;
      profitPercentVal.textContent = `${val}%`;
      updateProfitChipActive(val);
      calculatePrice();
    });
  });

  // Copy Summary Button
  document.getElementById('copySummaryBtn')?.addEventListener('click', copyPriceSummary);

  // Reset All Button
  document.getElementById('resetAllBtn')?.addEventListener('click', () => {
    if (confirm('Reset calculator to default values?')) {
      loadPresetData(PRESETS.amigurumi);
      showToast('Calculator reset to defaults', 'info');
    }
  });
}

function updateProfitChipActive(val) {
  document.querySelectorAll('.preset-profit-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.profit == val);
  });
}

/* --------------------------------------------------------------------------
   Core Calculation Formula Engine
   -------------------------------------------------------------------------- */
function calculatePrice() {
  const sym = state.currency;

  // 1. Yarn Calculation (Iterate over all dynamic yarn rows)
  let totalYarnCost = 0;
  let totalYarnGrams = 0;

  const yarnCards = document.querySelectorAll('.yarn-card');
  yarnCards.forEach(card => {
    const used = parseFloat(card.querySelector('.yarn-used').value) || 0;
    const weight = parseFloat(card.querySelector('.yarn-weight').value) || 1;
    const price = parseFloat(card.querySelector('.yarn-price').value) || 0;

    const rowCost = weight > 0 ? (used / weight) * price : 0;
    card.querySelector('.yarn-cost-display').innerHTML = `${sym}${rowCost.toFixed(2)}`;

    totalYarnCost += rowCost;
    totalYarnGrams += used;
  });

  document.getElementById('totalGramsDisplay').textContent = `${totalYarnGrams}g`;
  document.getElementById('totalYarnCostDisplay').textContent = `${sym}${totalYarnCost.toFixed(2)}`;
  document.getElementById('summaryGrams').textContent = `${totalYarnGrams}g`;

  // 2. Notions & Materials
  const stuffing = parseFloat(document.getElementById('notionStuffing').value) || 0;
  const eyes = parseFloat(document.getElementById('notionEyes').value) || 0;
  const keychain = parseFloat(document.getElementById('notionKeychain').value) || 0;
  const other = parseFloat(document.getElementById('notionOther').value) || 0;
  const totalNotions = stuffing + eyes + keychain + other;

  // 3. Labor & Time
  const hours = parseFloat(document.getElementById('hoursInput').value) || 0;
  const minutes = parseFloat(document.getElementById('minutesInput').value) || 0;
  const hourlyRate = parseFloat(document.getElementById('hourlyRate').value) || 0;

  const totalHoursDecimal = hours + (minutes / 60);
  const laborCost = totalHoursDecimal * hourlyRate;

  // Format labor time
  const timeFormatted = `${hours}h ${minutes}m`;
  document.getElementById('totalTimeFormatted').textContent = `${hours} hrs ${minutes} mins`;
  document.getElementById('laborSubtotalDisplay').textContent = `${sym}${laborCost.toFixed(2)}`;
  document.getElementById('chartHoursSummary').textContent = `${timeFormatted} labor`;
  document.getElementById('lineLaborHours').textContent = `${totalHoursDecimal.toFixed(1)}h`;
  document.getElementById('lineWage').textContent = `${sym}${hourlyRate}`;

  // 4. Overheads & Packaging
  const packaging = parseFloat(document.getElementById('packagingCost').value) || 0;
  const overhead = parseFloat(document.getElementById('overheadCost').value) || 0;
  const platformFeePct = parseFloat(document.getElementById('platformFee').value) || 0;
  const fixedOverheads = packaging + overhead;

  // 5. Total Base Cost
  const totalProductionCost = totalYarnCost + totalNotions + laborCost + fixedOverheads;

  // 6. Profit
  const profitMarginPct = parseFloat(document.getElementById('profitInput').value) || 0;
  const profitAmount = totalProductionCost * (profitMarginPct / 100);

  // 7. Platform Fee Buffer (e.g. Etsy 6.5%)
  let recommendedRetail = totalProductionCost + profitAmount;
  let platformFeeBuffer = 0;
  if (platformFeePct > 0 && platformFeePct < 90) {
    // Retail after platform commission: R * (1 - fee%) = Target
    const grossPrice = recommendedRetail / (1 - (platformFeePct / 100));
    platformFeeBuffer = grossPrice - recommendedRetail;
    recommendedRetail = grossPrice;
  }

  // Dual Pricing Strategies: Wholesale & Golden Retail
  const wholesalePrice = totalProductionCost * 1.5;
  const goldenRetailPrice = totalProductionCost * 2.2;

  // Effective Crafter Earnings (Labor earned + Business Profit)
  const totalEarnings = laborCost + profitAmount;

  // --------------------------------------------------------------------------
  // Update UI Elements
  // --------------------------------------------------------------------------
  document.getElementById('finalSellingPriceDisplay').innerHTML = `${sym}${recommendedRetail.toFixed(2)}`;
  document.getElementById('profitSummaryNote').textContent = `Includes ${sym}${profitAmount.toFixed(2)} business profit`;
  document.getElementById('wholesalePriceDisplay').textContent = `${sym}${wholesalePrice.toFixed(2)}`;
  document.getElementById('goldenRetailPriceDisplay').textContent = `${sym}${goldenRetailPrice.toFixed(2)}`;

  document.getElementById('totalCostDisplay').textContent = `${sym}${totalProductionCost.toFixed(2)}`;
  document.getElementById('totalEarningsDisplay').textContent = `${sym}${totalEarnings.toFixed(2)}`;

  // Itemized lines
  document.getElementById('lineYarn').textContent = `${sym}${totalYarnCost.toFixed(2)}`;
  document.getElementById('lineNotions').textContent = `${sym}${totalNotions.toFixed(2)}`;
  document.getElementById('lineLabor').textContent = `${sym}${laborCost.toFixed(2)}`;
  document.getElementById('lineOverheads').textContent = `${sym}${fixedOverheads.toFixed(2)}`;
  
  const feeRow = document.getElementById('lineFeeRow');
  if (platformFeePct > 0) {
    feeRow.classList.remove('hidden');
    document.getElementById('lineFee').textContent = `+${sym}${platformFeeBuffer.toFixed(2)} (${platformFeePct}%)`;
  } else {
    feeRow.classList.add('hidden');
  }

  document.getElementById('lineTotalCost').textContent = `${sym}${totalProductionCost.toFixed(2)}`;
  document.getElementById('lineProfitPct').textContent = `${profitMarginPct}%`;
  document.getElementById('lineProfit').textContent = `${sym}${profitAmount.toFixed(2)}`;

  // Chart Legend & Stacked Bar
  document.getElementById('legYarn').textContent = `${sym}${totalYarnCost.toFixed(0)}`;
  document.getElementById('legNotions').textContent = `${sym}${totalNotions.toFixed(0)}`;
  document.getElementById('legLabor').textContent = `${sym}${laborCost.toFixed(0)}`;
  document.getElementById('legOverhead').textContent = `${sym}${fixedOverheads.toFixed(0)}`;
  document.getElementById('legProfit').textContent = `${sym}${profitAmount.toFixed(0)}`;

  // Update Stacked Bar Percentages
  if (recommendedRetail > 0) {
    const pYarn = (totalYarnCost / recommendedRetail) * 100;
    const pNotions = (totalNotions / recommendedRetail) * 100;
    const pLabor = (laborCost / recommendedRetail) * 100;
    const pOverheads = (fixedOverheads / recommendedRetail) * 100;

    const bar = document.getElementById('costStackedBar');
    if (bar) {
      bar.children[0].style.width = `${Math.max(pYarn, 2)}%`;
      bar.children[1].style.width = `${Math.max(pNotions, 2)}%`;
      bar.children[2].style.width = `${Math.max(pLabor, 2)}%`;
      bar.children[3].style.width = `${Math.max(pOverheads, 2)}%`;
    }
  }

  // Return calculation result object for saving/export
  return {
    projectName: document.getElementById('projectName').value.trim() || 'Crochet Project',
    clientName: document.getElementById('clientName').value.trim() || '',
    currency: sym,
    totalYarnCost,
    totalYarnGrams,
    totalNotions,
    laborCost,
    totalHoursDecimal,
    fixedOverheads,
    totalProductionCost,
    profitMarginPct,
    profitAmount,
    platformFeePct,
    recommendedRetail,
    wholesalePrice,
    goldenRetailPrice,
    totalEarnings
  };
}

/* --------------------------------------------------------------------------
   Quick Presets
   -------------------------------------------------------------------------- */
function initPresets() {
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const presetKey = chip.dataset.preset;
      const data = PRESETS[presetKey];
      if (data) {
        loadPresetData(data);
        showToast(`Loaded preset: ${data.name}`, 'info');
      }
    });
  });
}

function loadPresetData(data) {
  document.getElementById('projectName').value = data.name;
  document.getElementById('summaryProjectBadge').textContent = data.name;
  document.getElementById('clientName').value = data.client || '';

  // Setup yarns
  const yarnList = document.getElementById('yarnList');
  yarnList.innerHTML = '';
  state.yarnCount = 0;

  data.yarns.forEach((y, idx) => {
    state.yarnCount++;
    const yarnId = state.yarnCount;
    const card = document.createElement('div');
    card.className = 'yarn-card';
    card.dataset.yarnId = yarnId;
    card.innerHTML = `
      <div class="yarn-card-header">
        <span class="yarn-title-badge">🧶 Yarn #${yarnId} (${y.name})</span>
        <button class="btn-remove-yarn ${data.yarns.length > 1 ? '' : 'hidden'}" title="Remove this yarn" aria-label="Remove yarn">✕</button>
      </div>
      <div class="input-grid-4">
        <div class="input-group">
          <label>Yarn Color / Brand</label>
          <input type="text" class="yarn-name" value="${y.name}">
        </div>
        <div class="input-group">
          <label>Yarn Used (grams)</label>
          <input type="number" class="yarn-used" min="0" step="1" value="${y.used}">
        </div>
        <div class="input-group">
          <label>Full Skein Weight (g)</label>
          <input type="number" class="yarn-weight" min="1" step="1" value="${y.weight}">
        </div>
        <div class="input-group">
          <label>Skein Price (<span class="currency-symbol">${state.currency}</span>)</label>
          <input type="number" class="yarn-price" min="0" step="0.5" value="${y.price}">
        </div>
      </div>
      <div class="yarn-subtotal-bar">
        <span>Yarn #${yarnId} Estimated Cost:</span>
        <strong class="yarn-cost-display"><span class="currency-symbol">${state.currency}</span>0.00</strong>
      </div>
    `;
    yarnList.appendChild(card);
    attachYarnListeners(card);
  });

  // Notions
  document.getElementById('notionStuffing').value = data.stuffing;
  document.getElementById('notionEyes').value = data.eyes;
  document.getElementById('notionKeychain').value = data.keychain;
  document.getElementById('notionOther').value = data.other;

  // Time & wage
  document.getElementById('hoursInput').value = data.hours;
  document.getElementById('minutesInput').value = data.minutes;
  document.getElementById('hourlyRate').value = data.hourlyRate;

  // Overheads
  document.getElementById('packagingCost').value = data.packaging;
  document.getElementById('overheadCost').value = data.overhead;
  document.getElementById('platformFee').value = data.platformFee;

  // Profit
  document.getElementById('profitRange').value = data.profit;
  document.getElementById('profitInput').value = data.profit;
  document.getElementById('profitPercentVal').textContent = `${data.profit}%`;
  updateProfitChipActive(data.profit);

  calculatePrice();
}

/* --------------------------------------------------------------------------
   Local Storage: Saved Projects
   -------------------------------------------------------------------------- */
function initSavedProjects() {
  const saved = localStorage.getItem('stitchcraft_saved_projects');
  if (saved) {
    try {
      state.savedProjects = JSON.parse(saved);
    } catch (e) {
      state.savedProjects = [];
    }
  }
  updateSavedCountBadge();

  // Save Project Button
  document.getElementById('saveProjectBtn')?.addEventListener('click', saveCurrentProject);

  // Export JSON Button
  document.getElementById('exportAllJsonBtn')?.addEventListener('click', exportProjectsJson);
}

function updateSavedCountBadge() {
  const badge = document.getElementById('savedCountBadge');
  if (badge) badge.textContent = state.savedProjects.length;
}

function saveCurrentProject() {
  const currentCalc = calculatePrice();
  const id = 'proj_' + Date.now();
  
  // Extract all yarns
  const yarns = [];
  document.querySelectorAll('.yarn-card').forEach(card => {
    yarns.push({
      name: card.querySelector('.yarn-name').value,
      used: parseFloat(card.querySelector('.yarn-used').value) || 0,
      weight: parseFloat(card.querySelector('.yarn-weight').value) || 1,
      price: parseFloat(card.querySelector('.yarn-price').value) || 0
    });
  });

  const projectRecord = {
    id,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    data: {
      ...currentCalc,
      yarns,
      stuffing: parseFloat(document.getElementById('notionStuffing').value) || 0,
      eyes: parseFloat(document.getElementById('notionEyes').value) || 0,
      keychain: parseFloat(document.getElementById('notionKeychain').value) || 0,
      other: parseFloat(document.getElementById('notionOther').value) || 0,
      hours: parseFloat(document.getElementById('hoursInput').value) || 0,
      minutes: parseFloat(document.getElementById('minutesInput').value) || 0,
      hourlyRate: parseFloat(document.getElementById('hourlyRate').value) || 0,
      packaging: parseFloat(document.getElementById('packagingCost').value) || 0,
      overhead: parseFloat(document.getElementById('overheadCost').value) || 0,
      platformFee: parseFloat(document.getElementById('platformFee').value) || 0,
      profit: parseFloat(document.getElementById('profitInput').value) || 0
    }
  };

  state.savedProjects.unshift(projectRecord);
  localStorage.setItem('stitchcraft_saved_projects', JSON.stringify(state.savedProjects));
  updateSavedCountBadge();
  showToast(`💾 "${currentCalc.projectName}" saved to collection!`, 'success');
}

function renderSavedProjects() {
  const grid = document.getElementById('savedProjectsGrid');
  if (!grid) return;

  if (state.savedProjects.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🧶</div>
        <h3>No projects saved yet</h3>
        <p>Calculate a price and tap "Save Project" to keep your project quotes organized here.</p>
        <button class="btn-primary btn-sm" onclick="switchTab('calculator')">Create First Calculation</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.savedProjects.map(item => {
    const d = item.data;
    return `
      <div class="saved-card">
        <div>
          <div class="saved-card-header">
            <div>
              <h3 class="saved-card-title">${escapeHtml(d.projectName)}</h3>
              <span class="saved-card-date">${item.date} ${d.clientName ? `• Client: ${escapeHtml(d.clientName)}` : ''}</span>
            </div>
            <button class="btn-remove-yarn" onclick="deleteSavedProject('${item.id}')" title="Delete project">✕</button>
          </div>
          <div class="saved-card-price">${d.currency}${d.recommendedRetail.toFixed(2)}</div>
          <div class="saved-card-details">
            • Yarn: ${d.totalYarnGrams}g (${d.currency}${d.totalYarnCost.toFixed(2)})<br>
            • Time: ${d.hours}h ${d.minutes}m @ ${d.currency}${d.hourlyRate}/hr<br>
            • Production Cost: ${d.currency}${d.totalProductionCost.toFixed(2)}<br>
            • Profit Margin: ${d.profitMarginPct}% (${d.currency}${d.profitAmount.toFixed(2)})
          </div>
        </div>
        <div class="saved-card-actions">
          <button class="btn-primary btn-sm btn-block" onclick="loadSavedProject('${item.id}')">
            📂 Load in Calculator
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.deleteSavedProject = function(id) {
  if (confirm('Delete this saved project?')) {
    state.savedProjects = state.savedProjects.filter(p => p.id !== id);
    localStorage.setItem('stitchcraft_saved_projects', JSON.stringify(state.savedProjects));
    updateSavedCountBadge();
    renderSavedProjects();
    showToast('Project deleted', 'info');
  }
};

window.loadSavedProject = function(id) {
  const item = state.savedProjects.find(p => p.id === id);
  if (!item) return;

  const d = item.data;
  loadPresetData({
    name: d.projectName,
    client: d.clientName,
    yarns: d.yarns,
    stuffing: d.stuffing,
    eyes: d.eyes,
    keychain: d.keychain,
    other: d.other,
    hours: d.hours,
    minutes: d.minutes,
    hourlyRate: d.hourlyRate,
    packaging: d.packaging,
    overhead: d.overhead,
    platformFee: d.platformFee,
    profit: d.profit
  });

  switchTab('calculator');
  showToast(`Loaded "${d.projectName}"`, 'success');
};

function exportProjectsJson() {
  const jsonStr = JSON.stringify(state.savedProjects, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stitchcraft_crochet_projects_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Projects exported as JSON file', 'success');
}

/* --------------------------------------------------------------------------
   Client Quote Card Modal
   -------------------------------------------------------------------------- */
function initQuoteModal() {
  const openBtn = document.getElementById('openQuoteModalBtn');
  const quoteModal = document.getElementById('quoteModal');
  const closeBtn = document.getElementById('quoteModalClose');
  const copyMsgBtn = document.getElementById('copyQuoteMsgBtn');
  const printBtn = document.getElementById('printQuoteBtn');

  openBtn?.addEventListener('click', () => {
    updateQuoteCardContent();
    quoteModal.classList.remove('hidden');
  });

  closeBtn?.addEventListener('click', () => quoteModal.classList.add('hidden'));

  quoteModal?.addEventListener('click', (e) => {
    if (e.target === quoteModal) quoteModal.classList.add('hidden');
  });

  copyMsgBtn?.addEventListener('click', copyClientWhatsAppText);
  printBtn?.addEventListener('click', () => window.print());
}

function updateQuoteCardContent() {
  const calc = calculatePrice();
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  document.getElementById('quoteCardDate').textContent = dateStr;
  document.getElementById('quoteCardProjectName').textContent = calc.projectName;
  document.getElementById('quoteCardClientName').textContent = calc.clientName || 'Valued Customer';
  
  const materialsCost = calc.totalYarnCost + calc.totalNotions;
  document.getElementById('quoteCardMaterials').textContent = `${calc.currency}${materialsCost.toFixed(2)}`;
  document.getElementById('quoteCardLabor').textContent = `${calc.currency}${calc.laborCost.toFixed(2)}`;
  document.getElementById('quoteCardPackaging').textContent = `${calc.currency}${calc.fixedOverheads.toFixed(2)}`;
  document.getElementById('quoteCardTotal').textContent = `${calc.currency}${calc.recommendedRetail.toFixed(2)}`;
}

function copyClientWhatsAppText() {
  const calc = calculatePrice();
  const text = `🧶 *Crochet Quote for ${calc.projectName}*
Hello${calc.clientName ? ' ' + calc.clientName : ''}! Here are the pricing details for your custom handmade crochet order:

• *Item:* ${calc.projectName}
• *Handmade Craft Time:* ~${document.getElementById('totalTimeFormatted').textContent}
• *Materials & Quality Yarn:* Included
• *Packaging & Care Details:* Included

✨ *Total Price:* *${calc.currency}${calc.recommendedRetail.toFixed(2)}*

_Each stitch is crafted 100% by hand with love. Please let me know if you would like to proceed with this custom order!_`;

  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 Client quote message copied! Ready to paste into WhatsApp / Instagram DM.', 'success');
  }).catch(() => {
    prompt('Copy your quote text:', text);
  });
}

function copyPriceSummary() {
  const calc = calculatePrice();
  const summary = `🧶 StitchCraft Summary:
${calc.projectName}
• Selling Price: ${calc.currency}${calc.recommendedRetail.toFixed(2)}
• Total Cost: ${calc.currency}${calc.totalProductionCost.toFixed(2)}
• Profit: ${calc.currency}${calc.profitAmount.toFixed(2)} (${calc.profitMarginPct}%)
• Labor: ${document.getElementById('totalTimeFormatted').textContent} @ ${calc.currency}${document.getElementById('hourlyRate').value}/hr`;

  navigator.clipboard.writeText(summary).then(() => {
    showToast('Price summary copied to clipboard!', 'success');
  }).catch(() => {
    prompt('Summary:', summary);
  });
}

/* --------------------------------------------------------------------------
   Toast Utilities
   -------------------------------------------------------------------------- */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✨' : '🧶'}</span> <span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}
