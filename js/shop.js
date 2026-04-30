/**
 * MR.FANTASTIC — Shop & Checkout Logic
 * Requires: currency.js (loaded before this file)
 * Requires: https://js.paystack.co/v1/inline.js (in checkout.html head)
 */

/* ── SHOP FORMAT SELECTOR ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  const step1      = document.getElementById('modalStep1');
  const step2      = document.getElementById('modalStep2');
  const buyBtn     = document.getElementById('modalBuyBtn');
  const backBtn    = document.getElementById('modalBackBtn');
  const proceedBtn = document.getElementById('modalProceedBtn');
  const finalPrice = document.getElementById('modalFinalPrice');
  const step2Title = document.getElementById('modalStep2Title');
  const formatOpts = document.querySelectorAll('.format-option');
  const formatSummaryEl = document.getElementById('formatSummary');
  const formatListEl = document.getElementById('formatList');

  let currentItem    = null;
  let selectedFormats = [];
  let baseUSD        = 0;

  /* ── Escape HTML utility ───────────────────────────── */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ── Update all visible prices once currency loads ────── */
  const updateShopPrices = () => {
    const c = window.MF_Currency;
    if (!c) return;

    // Shop grid "from $X" labels
    document.querySelectorAll('.shop-item').forEach(item => {
      const usd     = parseInt(item.dataset.price, 10);
      const priceEl = item.querySelector('.shop-item-price');
      if (!usd || !priceEl || priceEl.classList.contains('sold-out-price')) return;
      priceEl.textContent = 'from ' + c.format(usd);
    });

    // Format-picker surcharge labels in modal
    formatOpts.forEach(opt => {
      const surcharge = parseInt(opt.dataset.surcharge, 10);
      const priceEl   = opt.querySelector('.format-price');
      if (!priceEl) return;
      if (surcharge === 0)      priceEl.textContent = 'Base price';
      else if (surcharge > 0)   priceEl.textContent = '+' + c.format(surcharge);
      else                      priceEl.textContent = '−' + c.format(Math.abs(surcharge));
    });

    // Update running total if modal is open and formats selected
    if (finalPrice && baseUSD > 0) {
      updateFormatSummary();
    }
  };

  if (window.MF_Currency) updateShopPrices();
  else window.addEventListener('mf:currency:ready', updateShopPrices);

  /* ── Update format summary list & total ─────────────── */
  function updateFormatSummary() {
    const summary = formatSummaryEl;
    const list = formatListEl;
    if (!summary || !list || !finalPrice) return;
    
    list.innerHTML = '';
    let totalUSD = 0;
    
    selectedFormats.forEach(({ format, surcharge }) => {
      totalUSD += (baseUSD + surcharge);
      const li = document.createElement('li');
      const priceText = window.MF_Currency 
        ? window.MF_Currency.format(baseUSD + surcharge) 
        : '$' + (baseUSD + surcharge);
      li.innerHTML = `<span>${escapeHtml(format)}</span><span>${escapeHtml(priceText)}</span>`;
      list.appendChild(li);
    });

    summary.style.display = selectedFormats.length > 0 ? 'block' : 'none';
    finalPrice.textContent = window.MF_Currency 
      ? window.MF_Currency.format(totalUSD) 
      : '$' + totalUSD;
    proceedBtn.disabled = selectedFormats.length === 0;
  }

  /* ── Step 1 → Step 2 (Choose Format) ─────────────────── */
  buyBtn?.addEventListener('click', () => {
    step1.style.display = 'none';
    step2.style.display = 'flex';
    step2Title.textContent = document.getElementById('modalTitle').textContent;
    selectedFormats = [];
    document.querySelectorAll('.format-option .format-checkbox').forEach(cb => cb.checked = false);
    formatOpts.forEach(o => o.classList.remove('selected'));
    updateFormatSummary();
    if (finalPrice && window.MF_Currency) {
      finalPrice.textContent = window.MF_Currency.format(0);
    }
  });

  backBtn?.addEventListener('click', () => {
    step2.style.display = 'none';
    step1.style.display = 'flex';
  });

  /* ── Format selection (checkbox toggle) ─────────────── */
  formatOpts.forEach(opt => {
    const checkbox = opt.querySelector('.format-checkbox');
    if (!checkbox) return;

    opt.addEventListener('click', (e) => {
      e.preventDefault();
      checkbox.checked = !checkbox.checked;
      opt.classList.toggle('selected', checkbox.checked);

      const format = checkbox.dataset.format;
      const surcharge = parseInt(checkbox.dataset.surcharge, 10);

      if (checkbox.checked) {
        if (!selectedFormats.find(f => f.format === format)) {
          selectedFormats.push({ format, surcharge });
        }
      } else {
        selectedFormats = selectedFormats.filter(f => f.format !== format);
      }

      updateFormatSummary();
    });
  });

  /* ── Proceed to checkout ─────────────────────────────── */
  proceedBtn?.addEventListener('click', () => {
    if (!currentItem || selectedFormats.length === 0) return;

    let totalUSD = 0;
    selectedFormats.forEach(({ surcharge }) => {
      totalUSD += (baseUSD + surcharge);
    });

    const c = window.MF_Currency || { 
      code: 'USD', rate: 1, country: 'US',
      format: (usd) => '$' + Math.round(usd).toLocaleString(),
      paystackAmount: (usd) => Math.round(usd * 100)
    };

    const order = {
      title:      currentItem.dataset.title,
      img:        currentItem.dataset.img,
      tag:        currentItem.dataset.tag,
      formats:    selectedFormats,
      priceUSD:   totalUSD,
      currency:   c.code,
      rate:       c.rate,
      country:    c.country || 'US'
    };

    try {
      sessionStorage.setItem('mf_order', JSON.stringify(order));
    } catch {
      try { localStorage.setItem('mf_order_backup', JSON.stringify(order)); } catch {}
    }

    try {
      localStorage.setItem('mf_last_cart', JSON.stringify({
        title: order.title,
        formats: order.formats,
        timestamp: Date.now()
      }));
    } catch {}

    window.location.href = 'checkout.html';
  });

  window._mfSetCurrentItem = (item) => {
    currentItem    = item;
    baseUSD        = parseInt(item.dataset.price, 10) || 0;
    step1.style.display = 'flex';
    step2.style.display = 'none';
    selectedFormats = [];
    document.querySelectorAll('.format-option .format-checkbox').forEach(cb => cb.checked = false);
    formatOpts.forEach(o => o.classList.remove('selected'));
    updateFormatSummary();

    const modalPrice = document.getElementById('modalPrice');
    if (modalPrice && window.MF_Currency) {
      modalPrice.textContent = 'from ' + window.MF_Currency.format(baseUSD);
    }
  };
});


/* ── CHECKOUT PAGE ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  if (!document.querySelector('.checkout-page')) return;

  /* ── Stronger email validation ────────────────────────── */
  function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!regex.test(email)) return false;
    
    const domain = email.split('@')[1]?.toLowerCase();
    const typos = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'outlok.com': 'outlook.com'
    };
    if (typos[domain]) {
      const suggestion = email.replace(domain, typos[domain]);
      if (confirm(`Did you mean: ${suggestion}?`)) {
        document.getElementById('coEmail').value = suggestion;
      }
    }
    return true;
  }

  /* ── Load order ──────────────────────────────────────── */
  let order = null;
  try {
    const raw = sessionStorage.getItem('mf_order');
    order = raw ? JSON.parse(raw) : null;
  } catch {}

  if (!order) {
    try {
      const backup = localStorage.getItem('mf_order_backup');
      if (backup) {
        order = JSON.parse(backup);
        localStorage.removeItem('mf_order_backup');
      }
    } catch {}
  }

  if (!order) { 
    alert('No order found. Please select an item from the shop.');
    window.location.href = 'shop.html'; 
    return; 
  }

  /* ── Rebuild currency helper ──────────────────────────── */
  const storedRate   = order.rate || 1;
  const storedCode   = order.currency || 'USD';
  const SYMBOLS      = { GHS:'GH₵', NGN:'₦', ZAR:'R', KES:'KSh', GBP:'£', EUR:'€', USD:'$' };
  const storedSymbol = SYMBOLS[storedCode] || '$';

  const c = window.MF_Currency || {
    code: storedCode,
    symbol: storedSymbol,
    rate: storedRate,
    format: (usd) => storedSymbol + Math.round(usd * storedRate).toLocaleString(),
    paystackAmount: (usd) => Math.round(usd * storedRate * 100)
  };

  const displayPrice = c.format(order.priceUSD);

  /* ── Populate sidebar ────────────────────────────────── */
  document.getElementById('sidebarImg').src            = order.img;
  document.getElementById('sidebarTitle').textContent  = order.title;
  document.getElementById('sidebarTag').textContent    = order.tag;
  document.getElementById('sidebarFormat').textContent = order.formats.map(f => f.format).join(', ');
  document.getElementById('sidebarTotal').textContent  = displayPrice;

  const currencyBadge = document.getElementById('sidebarCurrency');
  if (currencyBadge) currencyBadge.textContent = c.code;

  /* ── Step navigation ─────────────────────────────────── */
  const panels   = ['panelDelivery', 'panelPayment', 'panelConfirm'];
  const stepDots = ['stepDot1', 'stepDot2', 'stepDot3'];

  const goTo = (n) => {
    panels.forEach((id, i) => {
      document.getElementById(id).style.display = i === n ? 'block' : 'none';
    });
    stepDots.forEach((id, i) => {
      document.getElementById(id).classList.toggle('active', i <= n);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Delivery → Payment ──────────────────────────────── */
  document.getElementById('deliveryNextBtn')?.addEventListener('click', () => {
    const name    = document.getElementById('coName').value.trim();
    const email   = document.getElementById('coEmail').value.trim();
    const phone   = document.getElementById('coPhone').value.trim();
    const addr    = document.getElementById('coAddr').value.trim();
    const city    = document.getElementById('coCity').value.trim();
    const zip     = document.getElementById('coZip').value.trim();
    const country = document.getElementById('coCountry').value;

    if (!name || !email || !phone || !addr || !city || !zip || !country) {
      showError('deliveryNextBtn', 'Please fill in all required fields ↑'); return;
    }
    if (!isValidEmail(email)) {
      showError('deliveryNextBtn', 'Please enter a valid email ↑'); return;
    }
    goTo(1);
  });

  /* ── Terms toggle ────────────────────────────────────── */
  document.getElementById('toggleTermsBtn')?.addEventListener('click', () => {
    const content = document.getElementById('termsContent');
    if (content) {
      content.style.display = content.style.display === 'none' ? 'block' : 'none';
    }
  });

  /* ── Payment → Confirm ───────────────────────────────── */
  document.getElementById('paymentNextBtn')?.addEventListener('click', () => {
    const method = document.querySelector('input[name="payMethod"]:checked')?.value;
    if (!method) { showError('paymentNextBtn', 'Please select a payment method ↑'); return; }

    const name    = document.getElementById('coName').value.trim();
    const email   = document.getElementById('coEmail').value.trim();
    const phone   = document.getElementById('coPhone').value.trim();
    const addr    = document.getElementById('coAddr').value.trim();
    const city    = document.getElementById('coCity').value.trim();
    const state   = document.getElementById('coState').value.trim();
    const zip     = document.getElementById('coZip').value.trim();
    const country = document.getElementById('coCountry').value;
    const notes   = document.getElementById('coNotes').value.trim();

    // XSS-safe confirm section
    const confirmDelivery = document.getElementById('confirmDelivery');
    confirmDelivery.innerHTML = '';
    const strong = document.createElement('strong');
    strong.textContent = name;
    confirmDelivery.appendChild(strong);
    confirmDelivery.appendChild(document.createElement('br'));
    confirmDelivery.appendChild(document.createTextNode(`${email} · ${phone}`));
    confirmDelivery.appendChild(document.createElement('br'));
    confirmDelivery.appendChild(document.createTextNode(addr));
    confirmDelivery.appendChild(document.createElement('br'));
    confirmDelivery.appendChild(document.createTextNode(`${city}${state ? ', ' + state : ''} ${zip}`));
    confirmDelivery.appendChild(document.createElement('br'));
    confirmDelivery.appendChild(document.createTextNode(country));
    if (notes) {
      confirmDelivery.appendChild(document.createElement('br'));
      const em = document.createElement('em');
      em.textContent = notes;
      confirmDelivery.appendChild(em);
    }

    let payDetails = '';
    if (method === 'paystack') {
      payDetails = `Paystack — Card, MoMo or Bank (${c.code})`;
    } else if (method === 'paypal') {
      const pe = document.getElementById('paypalEmail')?.value.trim();
      payDetails = 'PayPal' + (pe ? ` (${pe})` : '');
    } else if (method === 'transfer') {
      payDetails = 'Bank Transfer — details sent to your email';
    }
    document.getElementById('confirmPayment').textContent = payDetails;

    const confirmOrder = document.getElementById('confirmOrder');
    confirmOrder.innerHTML = '';
    const strongTitle = document.createElement('strong');
    strongTitle.textContent = order.title;
    confirmOrder.appendChild(strongTitle);
    confirmOrder.appendChild(document.createElement('br'));
    confirmOrder.appendChild(document.createTextNode('Formats: ' + order.formats.map(f => f.format).join(', ')));
    confirmOrder.appendChild(document.createElement('br'));
    confirmOrder.appendChild(document.createTextNode(order.tag));

    document.getElementById('confirmTotal').textContent = displayPrice;
    goTo(2);
  });

  /* ── Back buttons ────────────────────────────────────── */
  document.getElementById('paymentBackBtn')?.addEventListener('click', () => goTo(0));
  document.getElementById('confirmBackBtn')?.addEventListener('click',  () => goTo(1));

  /* ── Payment method panel toggle ─────────────────────── */
  document.querySelectorAll('input[name="payMethod"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.pay-details').forEach(d => d.style.display = 'none');
      const panel = document.querySelector(`.${radio.value}-details`);
      if (panel) panel.style.display = 'block';
    });
  });

  document.getElementById('agreeTerms')?.addEventListener('change', (e) => {
    document.getElementById('placeOrderBtn').disabled = !e.target.checked;
  });

  /* ── Place Order (with double‑submit guard) ──────────── */
  let orderInProgress = false;
  document.getElementById('placeOrderBtn')?.addEventListener('click', async () => {
    if (orderInProgress) return;
    const method = document.querySelector('input[name="payMethod"]:checked')?.value;
    if (!method) {
      alert('Please select a payment method.');
      goTo(1);
      return;
    }

    orderInProgress = true;
    const email  = document.getElementById('coEmail').value.trim();
    const btn    = document.getElementById('placeOrderBtn');

    if (method === 'paystack') {
      btn.disabled = true;
      btn.textContent = 'Opening payment…';

      const amountSmallestUnit = c.paystackAmount(order.priceUSD);
      const reference = 'MF_' + Date.now() + '_' + Math.random().toString(36).substr(2,6).toUpperCase();

      const handler = PaystackPop.setup({
        key:      'pk_live_YOUR_PAYSTACK_PUBLIC_KEY', // ← replace later
        email:    email,
        amount:   amountSmallestUnit,
        currency: c.code,
        ref:      reference,
        label:    'MR.FANTASTIC — ' + order.title,
        metadata: {
          custom_fields: [
            { display_name: 'Artwork',  variable_name: 'artwork',  value: order.title  },
            { display_name: 'Formats',  variable_name: 'formats',  value: order.formats.map(f=>f.format).join(', ') },
            { display_name: 'Customer', variable_name: 'customer',
              value: document.getElementById('coName').value.trim() }
          ]
        },
        callback: async (response) => {
          const emailSent = await sendOrderEmail(response.reference, `Paystack (${c.code})`);
          if (emailSent) {
            showSuccess(email);
          } else {
            alert('Payment successful, but order confirmation email failed. Please contact us with your reference: ' + response.reference);
            orderInProgress = false;
            btn.disabled = false;
            btn.textContent = 'Place Order →';
          }
        },
        onClose: () => {
          orderInProgress = false;
          btn.disabled = false;
          btn.textContent = 'Place Order →';
        }
      });

      handler.openIframe();

    } else {
      btn.disabled = true;
      btn.textContent = 'Placing order…';
      const label = method === 'paypal' ? 'PayPal' : 'Bank Transfer';
      const ref = 'MANUAL_' + Date.now();
      const emailSent = await sendOrderEmail(ref, label);
      if (emailSent) {
        showSuccess(email);
      } else {
        alert('Order received but confirmation email failed. Please contact us with your order details.');
        orderInProgress = false;
        btn.disabled = false;
        btn.textContent = 'Place Order →';
      }
    }
  });

  /* ── Log order to inbox via Formspree ─────────────────── */
  async function sendOrderEmail(reference, paymentMethod) {
    const name    = document.getElementById('coName').value.trim();
    const email   = document.getElementById('coEmail').value.trim();
    const phone   = document.getElementById('coPhone').value.trim();
    const addr    = document.getElementById('coAddr').value.trim();
    const city    = document.getElementById('coCity').value.trim();
    const state   = document.getElementById('coState').value.trim();
    const zip     = document.getElementById('coZip').value.trim();
    const country = document.getElementById('coCountry').value;
    const notes   = document.getElementById('coNotes').value.trim();

    try {
      const res = await fetch('https://formspree.io/f/mnjlkrew', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone,
          address:        `${addr}, ${city}${state ? ', '+state : ''} ${zip}, ${country}`,
          delivery_notes: notes || '—',
          payment_method: paymentMethod,
          payment_ref:    reference,
          artwork:        order.title,
          formats:        order.formats.map(f=> f.format).join(', '),
          price_usd:      '$' + order.priceUSD,
          price_charged:  displayPrice + ' (' + c.code + ')',
        })
      });

      if (!res.ok) throw new Error('Formspree rejected');
      return true;
    } catch {
      try {
        const failedOrders = JSON.parse(localStorage.getItem('mf_failed_orders') || '[]');
        failedOrders.push({
          name, email, phone,
          reference,
          paymentMethod,
          order,
          timestamp: Date.now()
        });
        localStorage.setItem('mf_failed_orders', JSON.stringify(failedOrders));
      } catch {}
      return false;
    }
  }

  function showSuccess(email) {
    sessionStorage.removeItem('mf_order');
    localStorage.removeItem('mf_order_backup');
    document.getElementById('checkoutMain').style.display   = 'none';
    document.querySelector('.checkout-steps').style.display = 'none';
    const success = document.getElementById('checkoutSuccess');
    success.style.display = 'flex';
    document.getElementById('successEmail').textContent =
      'Confirmation details sent to ' + email;
  }

  function showError(btnId, msg) {
    const btn  = document.getElementById(btnId);
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent      = msg;
    btn.style.background = '#710d0b';
    setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 2500);
  }
});

/* ── TERMS MODAL LOGIC ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const termsModal = document.getElementById('termsModal');
  const openTermsBtn = document.getElementById('openTermsModalBtn');
  const closeTermsBtn = document.getElementById('termsModalClose');
  
  // New elements for the Agree flow
  const modalAgreeBtn = document.getElementById('modalAgreeBtn');
  const agreeCheckbox = document.getElementById('agreeTerms');
  const placeOrderBtn = document.getElementById('placeOrderBtn');

  if (termsModal && openTermsBtn) {
    const closeTerms = () => {
      termsModal.classList.remove('open');
      document.body.style.overflow = '';
    };

    // Open modal
    openTermsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      termsModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    // Close modal via the X button
    closeTermsBtn?.addEventListener('click', closeTerms);

    // CLICKING THE NEW AGREE BUTTON IN THE MODAL
    modalAgreeBtn?.addEventListener('click', () => {
      if (agreeCheckbox && placeOrderBtn) {
        // Automatically check the box on the main page
        agreeCheckbox.checked = true;
        // Unlock the "Place Order" button
        placeOrderBtn.disabled = false; 
      }
      // Close the popup after agreeing
      closeTerms();
    });

    // Close when clicking outside the box
    termsModal.addEventListener('click', (e) => {
      if (e.target === termsModal) closeTerms();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && termsModal.classList.contains('open')) {
        closeTerms();
      }
    });
  }
});