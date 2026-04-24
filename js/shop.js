/* ── SHOP FORMAT SELECTOR ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const modal       = document.getElementById('shopModal');
  const step1       = document.getElementById('modalStep1');
  const step2       = document.getElementById('modalStep2');
  const buyBtn      = document.getElementById('modalBuyBtn');
  const backBtn     = document.getElementById('modalBackBtn');
  const proceedBtn  = document.getElementById('modalProceedBtn');
  const finalPrice  = document.getElementById('modalFinalPrice');
  const step2Title  = document.getElementById('modalStep2Title');
  const formatOpts  = document.querySelectorAll('.format-option');

  let currentItem   = null;
  let selectedFormat = null;
  let basePrice      = 0;

  // Move to step 2
  buyBtn?.addEventListener('click', () => {
    step1.style.display = 'none';
    step2.style.display = 'flex';
    step2Title.textContent = document.getElementById('modalTitle').textContent;
    selectedFormat = null;
    proceedBtn.disabled = true;
    formatOpts.forEach(o => o.classList.remove('selected'));
    finalPrice.textContent = '$' + basePrice;
  });

  // Back to step 1
  backBtn?.addEventListener('click', () => {
    step2.style.display = 'none';
    step1.style.display = 'flex';
  });

  // Format selection
  formatOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      formatOpts.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedFormat = opt.dataset.format;
      const surcharge = parseInt(opt.dataset.surcharge, 10);
      const total = basePrice + surcharge;
      finalPrice.textContent = '$' + Math.max(total, 0);
      proceedBtn.disabled = false;
    });
  });

  // Proceed to checkout — pass data via sessionStorage
  proceedBtn?.addEventListener('click', () => {
    if (!currentItem || !selectedFormat) return;
    const surcharge = parseInt(document.querySelector('.format-option.selected')?.dataset.surcharge || 0, 10);
    const total = Math.max(basePrice + surcharge, 0);

    sessionStorage.setItem('mf_order', JSON.stringify({
      title:  currentItem.dataset.title,
      img:    currentItem.dataset.img,
      tag:    currentItem.dataset.tag,
      format: selectedFormat,
      price:  total
    }));
    window.location.href = 'checkout.html';
  });

  // Hook into existing openModal logic — patch it after script.js runs
  window._mfSetCurrentItem = (item) => {
    currentItem = item;
    basePrice   = parseInt(item.dataset.price, 10) || 0;
    // Reset steps
    step1.style.display = 'flex';
    step2.style.display = 'none';
    selectedFormat = null;
    proceedBtn.disabled = true;
    formatOpts.forEach(o => o.classList.remove('selected'));
  };
});

//checkout js
document.addEventListener('DOMContentLoaded', () => {

  /* ── Only run on checkout page ───────────────────── */
  if (!document.querySelector('.checkout-page')) return;

  /* ── Load order from sessionStorage ─────────────── */
  const raw = sessionStorage.getItem('mf_order');
  let order = null;
  try { order = raw ? JSON.parse(raw) : null; } catch {}

  if (!order) {
    // No order data — redirect back to shop
    window.location.href = 'shop.html';
    return;
  }

  // Populate sidebar
  document.getElementById('sidebarImg').src    = order.img;
  document.getElementById('sidebarTitle').textContent  = order.title;
  document.getElementById('sidebarTag').textContent    = order.tag;
  document.getElementById('sidebarFormat').textContent = order.format;
  document.getElementById('sidebarTotal').textContent  = '$' + order.price;

  /* ── Step navigation helpers ─────────────────────── */
  const panels   = ['panelDelivery', 'panelPayment', 'panelConfirm'];
  const stepDots = ['stepDot1', 'stepDot2', 'stepDot3'];
  let currentStep = 0;

  const goTo = (n) => {
    panels.forEach((id, i) => {
      document.getElementById(id).style.display = i === n ? 'block' : 'none';
    });
    stepDots.forEach((id, i) => {
      document.getElementById(id).classList.toggle('active', i <= n);
    });
    currentStep = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Delivery → Payment ─────────────────────────── */
  document.getElementById('deliveryNextBtn')?.addEventListener('click', () => {
    const name    = document.getElementById('coName').value.trim();
    const email   = document.getElementById('coEmail').value.trim();
    const phone   = document.getElementById('coPhone').value.trim();
    const addr    = document.getElementById('coAddr').value.trim();
    const city    = document.getElementById('coCity').value.trim();
    const zip     = document.getElementById('coZip').value.trim();
    const country = document.getElementById('coCountry').value;

    if (!name || !email || !phone || !addr || !city || !zip || !country) {
      showError('deliveryNextBtn', 'Please fill in all required fields ↑');
      return;
    }
    if (!email.includes('@')) {
      showError('deliveryNextBtn', 'Please enter a valid email ↑');
      return;
    }
    goTo(1);
  });

  /* ── Payment → Confirm ──────────────────────────── */
  document.getElementById('paymentNextBtn')?.addEventListener('click', () => {
    const method = document.querySelector('input[name="payMethod"]:checked')?.value;
    if (!method) {
      showError('paymentNextBtn', 'Please select a payment method ↑');
      return;
    }

    // Populate confirm panel
    const name    = document.getElementById('coName').value.trim();
    const email   = document.getElementById('coEmail').value.trim();
    const phone   = document.getElementById('coPhone').value.trim();
    const addr    = document.getElementById('coAddr').value.trim();
    const city    = document.getElementById('coCity').value.trim();
    const state   = document.getElementById('coState').value.trim();
    const zip     = document.getElementById('coZip').value.trim();
    const country = document.getElementById('coCountry').value;
    const notes   = document.getElementById('coNotes').value.trim();

    document.getElementById('confirmDelivery').innerHTML = `
      <strong>${name}</strong><br>
      ${email} · ${phone}<br>
      ${addr}<br>
      ${city}${state ? ', ' + state : ''} ${zip}<br>
      ${country}${notes ? '<br><em>' + notes + '</em>' : ''}
    `;

    const methodLabels = { card: 'Credit / Debit Card', momo: 'Mobile Money', paypal: 'PayPal', transfer: 'Bank Transfer' };
    let payDetails = methodLabels[method] || method;
    if (method === 'momo') {
      const net = document.getElementById('momoNetwork').value;
      const num = document.getElementById('momoNumber').value.trim();
      if (net || num) payDetails += `<br>${net} · ${num}`;
    } else if (method === 'paypal') {
      const pe = document.getElementById('paypalEmail').value.trim();
      if (pe) payDetails += `<br>${pe}`;
    } else if (method === 'card') {
      const cn = document.getElementById('cardNumber').value.trim();
      if (cn.length >= 4) payDetails += `<br>···· ···· ···· ${cn.slice(-4)}`;
    }
    document.getElementById('confirmPayment').innerHTML = payDetails;

    document.getElementById('confirmOrder').innerHTML = `
      <strong>${order.title}</strong><br>
      Format: ${order.format}<br>
      Tag: ${order.tag}
    `;
    document.getElementById('confirmTotal').textContent = '$' + order.price;

    goTo(2);
  });

  /* ── Back buttons ────────────────────────────────── */
  document.getElementById('paymentBackBtn')?.addEventListener('click', () => goTo(0));
  document.getElementById('confirmBackBtn')?.addEventListener('click', () => goTo(1));

  /* ── Toggle payment detail panels ───────────────── */
  document.querySelectorAll('input[name="payMethod"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.pay-details').forEach(d => d.style.display = 'none');
      const details = document.querySelector(`.${radio.value}-details`);
      if (details) details.style.display = 'block';
    });
  });

  /* ── Terms checkbox ──────────────────────────────── */
  document.getElementById('agreeTerms')?.addEventListener('change', (e) => {
    document.getElementById('placeOrderBtn').disabled = !e.target.checked;
  });

  /* ── Place Order ─────────────────────────────────── */
  document.getElementById('placeOrderBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('placeOrderBtn');
    btn.disabled = true;
    btn.textContent = 'Placing order…';

    const name    = document.getElementById('coName').value.trim();
    const email   = document.getElementById('coEmail').value.trim();
    const phone   = document.getElementById('coPhone').value.trim();
    const addr    = document.getElementById('coAddr').value.trim();
    const city    = document.getElementById('coCity').value.trim();
    const state   = document.getElementById('coState').value.trim();
    const zip     = document.getElementById('coZip').value.trim();
    const country = document.getElementById('coCountry').value;
    const notes   = document.getElementById('coNotes').value.trim();
    const method  = document.querySelector('input[name="payMethod"]:checked')?.value || '—';

    const payload = {
      name, email, phone,
      address: `${addr}, ${city}${state ? ', ' + state : ''} ${zip}, ${country}`,
      delivery_notes: notes || '—',
      payment_method: method,
      artwork: order.title,
      format: order.format,
      tag: order.tag,
      total: '$' + order.price
    };

    try {
      const res = await fetch('https://formspree.io/f/mlgalvdo', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        sessionStorage.removeItem('mf_order');
        document.querySelector('.checkout-page > :not(#checkoutSuccess)').style.display = 'none';
        document.querySelector('.checkout-steps').style.display = 'none';
        const success = document.getElementById('checkoutSuccess');
        success.style.display = 'flex';
        document.getElementById('successEmail').textContent =
          'Confirmation details sent to ' + email;
      } else {
        throw new Error();
      }
    } catch {
      btn.disabled = false;
      btn.textContent = 'Something went wrong — try again';
      setTimeout(() => {
        btn.textContent = 'Place Order →';
        btn.disabled = false;
      }, 3000);
    }
  });

  /* ── Card number formatting ──────────────────────── */
  document.getElementById('cardNumber')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 16);
    e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
  });
  document.getElementById('cardExpiry')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (v.length > 2) v = v.substring(0, 2) + ' / ' + v.substring(2);
    e.target.value = v;
  });

  /* ── Helper: temp button error msg ──────────────── */
  function showError(btnId, msg) {
    const btn = document.getElementById(btnId);
    const orig = btn.textContent;
    btn.textContent = msg;
    btn.style.background = '#710d0b';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
    }, 2500);
  }

});/* ── SHOP FORMAT SELECTOR ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const modal       = document.getElementById('shopModal');
  const step1       = document.getElementById('modalStep1');
  const step2       = document.getElementById('modalStep2');
  const buyBtn      = document.getElementById('modalBuyBtn');
  const backBtn     = document.getElementById('modalBackBtn');
  const proceedBtn  = document.getElementById('modalProceedBtn');
  const finalPrice  = document.getElementById('modalFinalPrice');
  const step2Title  = document.getElementById('modalStep2Title');
  const formatOpts  = document.querySelectorAll('.format-option');

  let currentItem   = null;
  let selectedFormat = null;
  let basePrice      = 0;

  // Move to step 2
  buyBtn?.addEventListener('click', () => {
    step1.style.display = 'none';
    step2.style.display = 'flex';
    step2Title.textContent = document.getElementById('modalTitle').textContent;
    selectedFormat = null;
    proceedBtn.disabled = true;
    formatOpts.forEach(o => o.classList.remove('selected'));
    finalPrice.textContent = '$' + basePrice;
  });

  // Back to step 1
  backBtn?.addEventListener('click', () => {
    step2.style.display = 'none';
    step1.style.display = 'flex';
  });

  // Format selection
  formatOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      formatOpts.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedFormat = opt.dataset.format;
      const surcharge = parseInt(opt.dataset.surcharge, 10);
      const total = basePrice + surcharge;
      finalPrice.textContent = '$' + Math.max(total, 0);
      proceedBtn.disabled = false;
    });
  });

  // Proceed to checkout — pass data via sessionStorage
  proceedBtn?.addEventListener('click', () => {
    if (!currentItem || !selectedFormat) return;
    const surcharge = parseInt(document.querySelector('.format-option.selected')?.dataset.surcharge || 0, 10);
    const total = Math.max(basePrice + surcharge, 0);

    sessionStorage.setItem('mf_order', JSON.stringify({
      title:  currentItem.dataset.title,
      img:    currentItem.dataset.img,
      tag:    currentItem.dataset.tag,
      format: selectedFormat,
      price:  total
    }));
    window.location.href = 'checkout.html';
  });

  // Hook into existing openModal logic — patch it after script.js runs
  window._mfSetCurrentItem = (item) => {
    currentItem = item;
    basePrice   = parseInt(item.dataset.price, 10) || 0;
    // Reset steps
    step1.style.display = 'flex';
    step2.style.display = 'none';
    selectedFormat = null;
    proceedBtn.disabled = true;
    formatOpts.forEach(o => o.classList.remove('selected'));
  };
});

//checkout js
document.addEventListener('DOMContentLoaded', () => {

  /* ── Only run on checkout page ───────────────────── */
  if (!document.querySelector('.checkout-page')) return;

  /* ── Load order from sessionStorage ─────────────── */
  const raw = sessionStorage.getItem('mf_order');
  let order = null;
  try { order = raw ? JSON.parse(raw) : null; } catch {}

  if (!order) {
    // No order data — redirect back to shop
    window.location.href = 'shop.html';
    return;
  }

  // Populate sidebar
  document.getElementById('sidebarImg').src    = order.img;
  document.getElementById('sidebarTitle').textContent  = order.title;
  document.getElementById('sidebarTag').textContent    = order.tag;
  document.getElementById('sidebarFormat').textContent = order.format;
  document.getElementById('sidebarTotal').textContent  = '$' + order.price;

  /* ── Step navigation helpers ─────────────────────── */
  const panels   = ['panelDelivery', 'panelPayment', 'panelConfirm'];
  const stepDots = ['stepDot1', 'stepDot2', 'stepDot3'];
  let currentStep = 0;

  const goTo = (n) => {
    panels.forEach((id, i) => {
      document.getElementById(id).style.display = i === n ? 'block' : 'none';
    });
    stepDots.forEach((id, i) => {
      document.getElementById(id).classList.toggle('active', i <= n);
    });
    currentStep = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Delivery → Payment ─────────────────────────── */
  document.getElementById('deliveryNextBtn')?.addEventListener('click', () => {
    const name    = document.getElementById('coName').value.trim();
    const email   = document.getElementById('coEmail').value.trim();
    const phone   = document.getElementById('coPhone').value.trim();
    const addr    = document.getElementById('coAddr').value.trim();
    const city    = document.getElementById('coCity').value.trim();
    const zip     = document.getElementById('coZip').value.trim();
    const country = document.getElementById('coCountry').value;

    if (!name || !email || !phone || !addr || !city || !zip || !country) {
      showError('deliveryNextBtn', 'Please fill in all required fields ↑');
      return;
    }
    if (!email.includes('@')) {
      showError('deliveryNextBtn', 'Please enter a valid email ↑');
      return;
    }
    goTo(1);
  });

  /* ── Payment → Confirm ──────────────────────────── */
  document.getElementById('paymentNextBtn')?.addEventListener('click', () => {
    const method = document.querySelector('input[name="payMethod"]:checked')?.value;
    if (!method) {
      showError('paymentNextBtn', 'Please select a payment method ↑');
      return;
    }

    // Populate confirm panel
    const name    = document.getElementById('coName').value.trim();
    const email   = document.getElementById('coEmail').value.trim();
    const phone   = document.getElementById('coPhone').value.trim();
    const addr    = document.getElementById('coAddr').value.trim();
    const city    = document.getElementById('coCity').value.trim();
    const state   = document.getElementById('coState').value.trim();
    const zip     = document.getElementById('coZip').value.trim();
    const country = document.getElementById('coCountry').value;
    const notes   = document.getElementById('coNotes').value.trim();

    document.getElementById('confirmDelivery').innerHTML = `
      <strong>${name}</strong><br>
      ${email} · ${phone}<br>
      ${addr}<br>
      ${city}${state ? ', ' + state : ''} ${zip}<br>
      ${country}${notes ? '<br><em>' + notes + '</em>' : ''}
    `;

    const methodLabels = { card: 'Credit / Debit Card', momo: 'Mobile Money', paypal: 'PayPal', transfer: 'Bank Transfer' };
    let payDetails = methodLabels[method] || method;
    if (method === 'momo') {
      const net = document.getElementById('momoNetwork').value;
      const num = document.getElementById('momoNumber').value.trim();
      if (net || num) payDetails += `<br>${net} · ${num}`;
    } else if (method === 'paypal') {
      const pe = document.getElementById('paypalEmail').value.trim();
      if (pe) payDetails += `<br>${pe}`;
    } else if (method === 'card') {
      const cn = document.getElementById('cardNumber').value.trim();
      if (cn.length >= 4) payDetails += `<br>···· ···· ···· ${cn.slice(-4)}`;
    }
    document.getElementById('confirmPayment').innerHTML = payDetails;

    document.getElementById('confirmOrder').innerHTML = `
      <strong>${order.title}</strong><br>
      Format: ${order.format}<br>
      Tag: ${order.tag}
    `;
    document.getElementById('confirmTotal').textContent = '$' + order.price;

    goTo(2);
  });

  /* ── Back buttons ────────────────────────────────── */
  document.getElementById('paymentBackBtn')?.addEventListener('click', () => goTo(0));
  document.getElementById('confirmBackBtn')?.addEventListener('click', () => goTo(1));

  /* ── Toggle payment detail panels ───────────────── */
  document.querySelectorAll('input[name="payMethod"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.pay-details').forEach(d => d.style.display = 'none');
      const details = document.querySelector(`.${radio.value}-details`);
      if (details) details.style.display = 'block';
    });
  });

  /* ── Terms checkbox ──────────────────────────────── */
  document.getElementById('agreeTerms')?.addEventListener('change', (e) => {
    document.getElementById('placeOrderBtn').disabled = !e.target.checked;
  });

  /* ── Place Order ─────────────────────────────────── */
  document.getElementById('placeOrderBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('placeOrderBtn');
    btn.disabled = true;
    btn.textContent = 'Placing order…';

    const name    = document.getElementById('coName').value.trim();
    const email   = document.getElementById('coEmail').value.trim();
    const phone   = document.getElementById('coPhone').value.trim();
    const addr    = document.getElementById('coAddr').value.trim();
    const city    = document.getElementById('coCity').value.trim();
    const state   = document.getElementById('coState').value.trim();
    const zip     = document.getElementById('coZip').value.trim();
    const country = document.getElementById('coCountry').value;
    const notes   = document.getElementById('coNotes').value.trim();
    const method  = document.querySelector('input[name="payMethod"]:checked')?.value || '—';

    const payload = {
      name, email, phone,
      address: `${addr}, ${city}${state ? ', ' + state : ''} ${zip}, ${country}`,
      delivery_notes: notes || '—',
      payment_method: method,
      artwork: order.title,
      format: order.format,
      tag: order.tag,
      total: '$' + order.price
    };

    try {
      const res = await fetch('https://formspree.io/f/mlgalvdo', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        sessionStorage.removeItem('mf_order');
        document.querySelector('.checkout-page > :not(#checkoutSuccess)').style.display = 'none';
        document.querySelector('.checkout-steps').style.display = 'none';
        const success = document.getElementById('checkoutSuccess');
        success.style.display = 'flex';
        document.getElementById('successEmail').textContent =
          'Confirmation details sent to ' + email;
      } else {
        throw new Error();
      }
    } catch {
      btn.disabled = false;
      btn.textContent = 'Something went wrong — try again';
      setTimeout(() => {
        btn.textContent = 'Place Order →';
        btn.disabled = false;
      }, 3000);
    }
  });

  /* ── Card number formatting ──────────────────────── */
  document.getElementById('cardNumber')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 16);
    e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
  });
  document.getElementById('cardExpiry')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (v.length > 2) v = v.substring(0, 2) + ' / ' + v.substring(2);
    e.target.value = v;
  });

  /* ── Helper: temp button error msg ──────────────── */
  function showError(btnId, msg) {
    const btn = document.getElementById(btnId);
    const orig = btn.textContent;
    btn.textContent = msg;
    btn.style.background = '#710d0b';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
    }, 2500);
  }

});/* ── SHOP FORMAT SELECTOR ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const modal       = document.getElementById('shopModal');
  const step1       = document.getElementById('modalStep1');
  const step2       = document.getElementById('modalStep2');
  const buyBtn      = document.getElementById('modalBuyBtn');
  const backBtn     = document.getElementById('modalBackBtn');
  const proceedBtn  = document.getElementById('modalProceedBtn');
  const finalPrice  = document.getElementById('modalFinalPrice');
  const step2Title  = document.getElementById('modalStep2Title');
  const formatOpts  = document.querySelectorAll('.format-option');

  let currentItem   = null;
  let selectedFormat = null;
  let basePrice      = 0;

  // Move to step 2
  buyBtn?.addEventListener('click', () => {
    step1.style.display = 'none';
    step2.style.display = 'flex';
    step2Title.textContent = document.getElementById('modalTitle').textContent;
    selectedFormat = null;
    proceedBtn.disabled = true;
    formatOpts.forEach(o => o.classList.remove('selected'));
    finalPrice.textContent = '$' + basePrice;
  });

  // Back to step 1
  backBtn?.addEventListener('click', () => {
    step2.style.display = 'none';
    step1.style.display = 'flex';
  });

  // Format selection
  formatOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      formatOpts.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedFormat = opt.dataset.format;
      const surcharge = parseInt(opt.dataset.surcharge, 10);
      const total = basePrice + surcharge;
      finalPrice.textContent = '$' + Math.max(total, 0);
      proceedBtn.disabled = false;
    });
  });

  // Proceed to checkout — pass data via sessionStorage
  proceedBtn?.addEventListener('click', () => {
    if (!currentItem || !selectedFormat) return;
    const surcharge = parseInt(document.querySelector('.format-option.selected')?.dataset.surcharge || 0, 10);
    const total = Math.max(basePrice + surcharge, 0);

    sessionStorage.setItem('mf_order', JSON.stringify({
      title:  currentItem.dataset.title,
      img:    currentItem.dataset.img,
      tag:    currentItem.dataset.tag,
      format: selectedFormat,
      price:  total
    }));
    window.location.href = 'checkout.html';
  });

  // Hook into existing openModal logic — patch it after script.js runs
  window._mfSetCurrentItem = (item) => {
    currentItem = item;
    basePrice   = parseInt(item.dataset.price, 10) || 0;
    // Reset steps
    step1.style.display = 'flex';
    step2.style.display = 'none';
    selectedFormat = null;
    proceedBtn.disabled = true;
    formatOpts.forEach(o => o.classList.remove('selected'));
  };
});

//checkout js
document.addEventListener('DOMContentLoaded', () => {

  /* ── Only run on checkout page ───────────────────── */
  if (!document.querySelector('.checkout-page')) return;

  /* ── Load order from sessionStorage ─────────────── */
  const raw = sessionStorage.getItem('mf_order');
  let order = null;
  try { order = raw ? JSON.parse(raw) : null; } catch {}

  if (!order) {
    // No order data — redirect back to shop
    window.location.href = 'shop.html';
    return;
  }

  // Populate sidebar
  document.getElementById('sidebarImg').src    = order.img;
  document.getElementById('sidebarTitle').textContent  = order.title;
  document.getElementById('sidebarTag').textContent    = order.tag;
  document.getElementById('sidebarFormat').textContent = order.format;
  document.getElementById('sidebarTotal').textContent  = '$' + order.price;

  /* ── Step navigation helpers ─────────────────────── */
  const panels   = ['panelDelivery', 'panelPayment', 'panelConfirm'];
  const stepDots = ['stepDot1', 'stepDot2', 'stepDot3'];
  let currentStep = 0;

  const goTo = (n) => {
    panels.forEach((id, i) => {
      document.getElementById(id).style.display = i === n ? 'block' : 'none';
    });
    stepDots.forEach((id, i) => {
      document.getElementById(id).classList.toggle('active', i <= n);
    });
    currentStep = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Delivery → Payment ─────────────────────────── */
  document.getElementById('deliveryNextBtn')?.addEventListener('click', () => {
    const name    = document.getElementById('coName').value.trim();
    const email   = document.getElementById('coEmail').value.trim();
    const phone   = document.getElementById('coPhone').value.trim();
    const addr    = document.getElementById('coAddr').value.trim();
    const city    = document.getElementById('coCity').value.trim();
    const zip     = document.getElementById('coZip').value.trim();
    const country = document.getElementById('coCountry').value;

    if (!name || !email || !phone || !addr || !city || !zip || !country) {
      showError('deliveryNextBtn', 'Please fill in all required fields ↑');
      return;
    }
    if (!email.includes('@')) {
      showError('deliveryNextBtn', 'Please enter a valid email ↑');
      return;
    }
    goTo(1);
  });

  /* ── Payment → Confirm ──────────────────────────── */
  document.getElementById('paymentNextBtn')?.addEventListener('click', () => {
    const method = document.querySelector('input[name="payMethod"]:checked')?.value;
    if (!method) {
      showError('paymentNextBtn', 'Please select a payment method ↑');
      return;
    }

    // Populate confirm panel
    const name    = document.getElementById('coName').value.trim();
    const email   = document.getElementById('coEmail').value.trim();
    const phone   = document.getElementById('coPhone').value.trim();
    const addr    = document.getElementById('coAddr').value.trim();
    const city    = document.getElementById('coCity').value.trim();
    const state   = document.getElementById('coState').value.trim();
    const zip     = document.getElementById('coZip').value.trim();
    const country = document.getElementById('coCountry').value;
    const notes   = document.getElementById('coNotes').value.trim();

    document.getElementById('confirmDelivery').innerHTML = `
      <strong>${name}</strong><br>
      ${email} · ${phone}<br>
      ${addr}<br>
      ${city}${state ? ', ' + state : ''} ${zip}<br>
      ${country}${notes ? '<br><em>' + notes + '</em>' : ''}
    `;

    const methodLabels = { card: 'Credit / Debit Card', momo: 'Mobile Money', paypal: 'PayPal', transfer: 'Bank Transfer' };
    let payDetails = methodLabels[method] || method;
    if (method === 'momo') {
      const net = document.getElementById('momoNetwork').value;
      const num = document.getElementById('momoNumber').value.trim();
      if (net || num) payDetails += `<br>${net} · ${num}`;
    } else if (method === 'paypal') {
      const pe = document.getElementById('paypalEmail').value.trim();
      if (pe) payDetails += `<br>${pe}`;
    } else if (method === 'card') {
      const cn = document.getElementById('cardNumber').value.trim();
      if (cn.length >= 4) payDetails += `<br>···· ···· ···· ${cn.slice(-4)}`;
    }
    document.getElementById('confirmPayment').innerHTML = payDetails;

    document.getElementById('confirmOrder').innerHTML = `
      <strong>${order.title}</strong><br>
      Format: ${order.format}<br>
      Tag: ${order.tag}
    `;
    document.getElementById('confirmTotal').textContent = '$' + order.price;

    goTo(2);
  });

  /* ── Back buttons ────────────────────────────────── */
  document.getElementById('paymentBackBtn')?.addEventListener('click', () => goTo(0));
  document.getElementById('confirmBackBtn')?.addEventListener('click', () => goTo(1));

  /* ── Toggle payment detail panels ───────────────── */
  document.querySelectorAll('input[name="payMethod"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.pay-details').forEach(d => d.style.display = 'none');
      const details = document.querySelector(`.${radio.value}-details`);
      if (details) details.style.display = 'block';
    });
  });

  /* ── Terms checkbox ──────────────────────────────── */
  document.getElementById('agreeTerms')?.addEventListener('change', (e) => {
    document.getElementById('placeOrderBtn').disabled = !e.target.checked;
  });

  /* ── Place Order ─────────────────────────────────── */
  document.getElementById('placeOrderBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('placeOrderBtn');
    btn.disabled = true;
    btn.textContent = 'Placing order…';

    const name    = document.getElementById('coName').value.trim();
    const email   = document.getElementById('coEmail').value.trim();
    const phone   = document.getElementById('coPhone').value.trim();
    const addr    = document.getElementById('coAddr').value.trim();
    const city    = document.getElementById('coCity').value.trim();
    const state   = document.getElementById('coState').value.trim();
    const zip     = document.getElementById('coZip').value.trim();
    const country = document.getElementById('coCountry').value;
    const notes   = document.getElementById('coNotes').value.trim();
    const method  = document.querySelector('input[name="payMethod"]:checked')?.value || '—';

    const payload = {
      name, email, phone,
      address: `${addr}, ${city}${state ? ', ' + state : ''} ${zip}, ${country}`,
      delivery_notes: notes || '—',
      payment_method: method,
      artwork: order.title,
      format: order.format,
      tag: order.tag,
      total: '$' + order.price
    };

    try {
      const res = await fetch('https://formspree.io/f/mlgalvdo', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        sessionStorage.removeItem('mf_order');
        document.querySelector('.checkout-page > :not(#checkoutSuccess)').style.display = 'none';
        document.querySelector('.checkout-steps').style.display = 'none';
        const success = document.getElementById('checkoutSuccess');
        success.style.display = 'flex';
        document.getElementById('successEmail').textContent =
          'Confirmation details sent to ' + email;
      } else {
        throw new Error();
      }
    } catch {
      btn.disabled = false;
      btn.textContent = 'Something went wrong — try again';
      setTimeout(() => {
        btn.textContent = 'Place Order →';
        btn.disabled = false;
      }, 3000);
    }
  });

  /* ── Card number formatting ──────────────────────── */
  document.getElementById('cardNumber')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 16);
    e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
  });
  document.getElementById('cardExpiry')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (v.length > 2) v = v.substring(0, 2) + ' / ' + v.substring(2);
    e.target.value = v;
  });

  /* ── Helper: temp button error msg ──────────────── */
  function showError(btnId, msg) {
    const btn = document.getElementById(btnId);
    const orig = btn.textContent;
    btn.textContent = msg;
    btn.style.background = '#710d0b';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
    }, 2500);
  }

});