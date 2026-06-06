// Progress Bar
window.addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const progress = document.getElementById('progress');
  if (progress) {
    progress.style.width = (window.scrollY / h * 100) + '%';
  }
});

// Mobile Menu
function toggleMenu() {
  const menu = document.getElementById('mobile-menu') || document.querySelector('.mobile-menu');
  if (menu) {
    menu.classList.toggle('open');
  }
}

// Same-page section jumps without changing the URL hash (static site / SEO)
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-inpage-scroll]');
  if (!link) return;
  const id = link.getAttribute('data-inpage-scroll');
  if (!id) return;
  const target = document.getElementById(id);
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// Nav toggle button (refactored pages)
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', toggleMenu);
  }

  const mobileMenuLinks = document.querySelectorAll('.mobile-menu ul li a');
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
      const menu = document.querySelector('.mobile-menu');
      if (menu) {
        menu.classList.remove('open');
      }
    });
  });
});

// Reveal on Scroll (Intersection Observer)
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -60px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  const revealElements = document.querySelectorAll('.reveal');
  revealElements.forEach(el => observer.observe(el));

  if (!document.getElementById('toast')) {
    const toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }

  initLeadTracking();
  initRevenueEngineering();
});

// --- GA4 + Telegram lead tracking ---
const GA_MEASUREMENT_ID = 'G-ESVPGJL66K';
const ATTRIBUTION_STORAGE_KEY = 'er_attribution_v1';

function sanitizePartnerRef(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 32);
}

function sanitizeUtm(value) {
  return String(value || '').trim().slice(0, 80);
}

function readStoredAttribution() {
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAttribution(data) {
  try {
    sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota errors */
  }
}

function getAttributionFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const ref = sanitizePartnerRef(params.get('ref'));
  const utmSource = sanitizeUtm(params.get('utm_source'));
  const utmMedium = sanitizeUtm(params.get('utm_medium'));
  const utmCampaign = sanitizeUtm(params.get('utm_campaign'));

  if (!ref && !utmSource && !utmMedium && !utmCampaign) {
    return null;
  }

  return {
    ref: ref || '',
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    channel: ref
      ? `partner:${ref}`
      : [utmSource, utmMedium].filter(Boolean).join('/') || 'campaign',
    landing_page: window.location.pathname,
    captured_at: new Date().toISOString(),
  };
}

function getAttribution() {
  const fromUrl = getAttributionFromUrl();
  if (fromUrl) {
    saveAttribution(fromUrl);
    return fromUrl;
  }
  return readStoredAttribution() || {};
}

function withAttribution(payload = {}) {
  const attr = getAttribution();
  return {
    ...payload,
    ...(attr.ref ? { ref: attr.ref } : {}),
    ...(attr.utm_source ? { utm_source: attr.utm_source } : {}),
    ...(attr.utm_medium ? { utm_medium: attr.utm_medium } : {}),
    ...(attr.utm_campaign ? { utm_campaign: attr.utm_campaign } : {}),
    ...(attr.channel ? { channel: attr.channel } : {}),
  };
}

function appendAttributionToMessage(message) {
  const attr = getAttribution();
  const parts = [];
  if (attr.ref) parts.push(`Referral code: ${attr.ref}`);
  if (attr.utm_source) parts.push(`Source: ${attr.utm_source}`);
  if (!parts.length) return message;
  return `${message}\n\n(${parts.join(' · ')})`;
}

function trackGaEvent(eventName, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, withAttribution(params));
  }
}

function linkLabel(el) {
  return (el.getAttribute('aria-label') || el.textContent || el.title || 'cta').trim().replace(/\s+/g, ' ').slice(0, 120);
}

function isQuoteCta(el) {
  if (!el) return false;
  if (el.matches('[data-track="quote"], .copy-template-btn')) return true;
  const text = (el.textContent || '').toLowerCase();
  return /quote|inquir|check date|booking details|send event/.test(text);
}

function normalizePhoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function isValidPhilippineMobile(phone) {
  const digits = normalizePhoneDigits(phone);
  if (digits.length === 11 && digits.startsWith('09')) return true;
  if (digits.length === 10 && digits.startsWith('9')) return true;
  if (digits.length === 12 && digits.startsWith('639')) return true;
  return false;
}

function validateContactFormFields({ name, phone, message }) {
  if (!name || !phone || !message) {
    return 'Please fill in name, mobile number, and event details.';
  }
  if (!isValidPhilippineMobile(phone)) {
    return 'Please enter your full mobile number (e.g. 0948 512 1132).';
  }
  return null;
}

function formatRetryAfterMessage(response) {
  const seconds = Number.parseInt(response.headers.get('Retry-After') || '', 10);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 'You can try again in about an hour, or message us on Messenger anytime.';
  }
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `You can try again in about ${minutes} minute${minutes === 1 ? '' : 's'}, or message us on Messenger anytime.`;
}

function initLeadTracking() {
  document.addEventListener('click', (e) => {
    const messengerLink = e.target.closest('a[href*="m.me/"], a[href*="facebook.com"]');
    if (messengerLink && messengerLink.href.includes('m.me')) {
      const label = linkLabel(messengerLink);
      trackGaEvent('messenger_click', { link_text: label, page_path: location.pathname });
      if (isQuoteCta(messengerLink)) {
        trackGaEvent('quote_click', { link_text: label, page_path: location.pathname });
      }
      return;
    }

    const callLink = e.target.closest('a[href^="tel:"]');
    if (callLink) {
      const label = linkLabel(callLink);
      trackGaEvent('call_click', { link_text: label, page_path: location.pathname });
      return;
    }

    const quoteBtn = e.target.closest('[data-track="quote"], .copy-template-btn');
    if (quoteBtn) {
      const label = linkLabel(quoteBtn);
      trackGaEvent('quote_click', { link_text: label, page_path: location.pathname });
    }
  });

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      if (form.dataset.submitting === '1') {
        return;
      }
      const submitBtn = form.querySelector('[type="submit"]');
      const name = form.querySelector('[name="name"]')?.value?.trim() || '';
      const phone = form.querySelector('[name="phone"]')?.value?.trim() || '';
      const message = form.querySelector('[name="message"]')?.value?.trim() || '';
      const website = form.querySelector('[name="website"]')?.value?.trim() || '';

      const validationError = validateContactFormFields({ name, phone, message });
      if (validationError) {
        showToast(validationError);
        return;
      }

      form.dataset.submitting = '1';
      if (submitBtn) submitBtn.disabled = true;

      trackGaEvent('form_submit', {
        form_name: 'contact',
        page_path: location.pathname
      });

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(withAttribution({
            name,
            phone,
            message,
            website,
            page: location.pathname,
          })),
        });
        const data = await response.json().catch(() => ({}));

        if (response.ok && data.ok) {
          showContactFormSuccess(form, { name, phone, message });
          showToast('Inquiry sent! Continue on Messenger for the fastest reply.');
          trackGaEvent('generate_lead', { form_name: 'contact' });
        } else if (response.status === 429) {
          showToast(formatRetryAfterMessage(response));
        } else if (data.error === 'phone_invalid') {
          showToast('Please enter your full mobile number (e.g. 0948 512 1132).');
        } else {
          showToast('Could not send right now. Please message us on Messenger.');
        }
      } catch {
        showToast('Could not send right now. Please message us on Messenger.');
      } finally {
        delete form.dataset.submitting;
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
}

// Book Package Helper (Copy to Clipboard & Redirect)
function bookPackage(setName) {
  const message = `Hi! I would like to book ${setName} for my event.`;

  trackGaEvent('quote_click', { package_name: setName, page_path: location.pathname });

  navigator.clipboard.writeText(message).then(() => {
    showToast(`"Message copied! Opening Messenger..."`);

    setTimeout(() => {
      window.open('https://m.me/EasyRental.ngani', '_blank');
    }, 1200);
  }).catch(() => {
    window.open(`https://m.me/EasyRental.ngani?text=${encodeURIComponent(message)}`, '_blank');
  });
}

function showToast(text) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.innerText = text;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

function buildMessengerUrl(message) {
  const base = 'https://m.me/EasyRental.ngani';
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(appendAttributionToMessage(message))}`;
}

function buildContactMessengerPrefill(name, phone, message) {
  const lines = [
    'Hi Easy Rental! I submitted an inquiry on your website.',
    '',
    `Name: ${name}`,
    `Phone: ${phone}`,
    '',
    message,
  ];
  return lines.join('\n');
}

function showContactFormSuccess(form, { name, phone, message }) {
  const wrap = form.parentElement;
  if (!wrap) return;

  let panel = wrap.querySelector('.contact-form-success');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'contact-form-success';
    panel.setAttribute('role', 'status');
    wrap.insertBefore(panel, form.nextSibling);
  }

  const prefill = buildContactMessengerPrefill(name, phone, message);
  const messengerUrl = buildMessengerUrl(prefill);

  panel.replaceChildren();
  const title = document.createElement('p');
  title.className = 'contact-form-success__title';
  title.textContent = 'Inquiry sent';
  const text = document.createElement('p');
  text.className = 'contact-form-success__text';
  text.textContent =
    'Our team was notified. Continue on Messenger for the fastest quote—your details are pre-filled.';
  const messengerBtn = document.createElement('a');
  messengerBtn.className = 'contact-form-success__btn pill pill-lg';
  messengerBtn.href = messengerUrl;
  messengerBtn.target = '_blank';
  messengerBtn.rel = 'noopener noreferrer';
  messengerBtn.textContent = 'Continue on Messenger';
  messengerBtn.addEventListener('click', () => {
    trackGaEvent('messenger_click', {
      link_text: 'Continue on Messenger (form success)',
      page_path: location.pathname,
    });
    trackGaEvent('quote_click', {
      link_text: 'Continue on Messenger (form success)',
      page_path: location.pathname,
    });
  });
  const againBtn = document.createElement('button');
  againBtn.type = 'button';
  againBtn.className = 'contact-form-success__again';
  againBtn.textContent = 'Send another inquiry';
  againBtn.addEventListener('click', () => {
    panel.hidden = true;
    form.hidden = false;
    form.reset();
  });
  panel.append(title, text, messengerBtn, againBtn);

  form.hidden = true;
  panel.hidden = false;
}

function bindPrefillMessengerLink(link) {
  if (!link || link.dataset.prefillBound === '1') return;
  link.dataset.prefillBound = '1';
  link.addEventListener('click', (e) => {
    const msg = link.getAttribute('data-prefill-msg');
    if (!msg) return;
    e.preventDefault();
    window.open(buildMessengerUrl(msg), '_blank', 'noopener');
  });
}

function attributionQueryString() {
  const attr = getAttribution();
  const params = new URLSearchParams();
  if (attr.ref) params.set('ref', attr.ref);
  if (attr.utm_source) params.set('utm_source', attr.utm_source);
  if (attr.utm_medium) params.set('utm_medium', attr.utm_medium);
  if (attr.utm_campaign) params.set('utm_campaign', attr.utm_campaign);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function decorateInternalLinks() {
  const qs = attributionQueryString();
  if (!qs) return;

  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:')) return;
    if (/^https?:\/\//i.test(href) && !href.includes(window.location.host)) return;
    if (!/\.html($|[?#])/.test(href) && !href.endsWith('.html')) return;
    if (href.includes('utm_') || href.includes('ref=')) return;

    const separator = href.includes('?') ? '&' : '?';
    link.setAttribute('href', `${href}${separator}${qs.slice(1)}`);
  });
}

function initAttributionTracking() {
  const attr = getAttribution();
  if (!attr.channel) return;

  if (typeof gtag === 'function') {
    gtag('set', 'user_properties', {
      traffic_channel: attr.channel,
      partner_ref: attr.ref || '(none)',
    });
  }

  if (!sessionStorage.getItem('er_channel_session_fired')) {
    trackGaEvent('channel_session', {
      landing_page: attr.landing_page || location.pathname,
    });
    sessionStorage.setItem('er_channel_session_fired', '1');
  }
}

const UPSELL_OFFERS = {
  '/wedding-package-basic-lipa-batangas.html': {
    offer_id: 'basic_to_standard',
    eyebrow: 'Recommended upgrade',
    title: 'Need shade for your guests?',
    body: 'Standard adds a 3×4.5m tent, 2 tables, and 20 chairs for ₱1,319 — one delivery, one booking.',
    href: 'wedding-package-set-a-lipa-batangas.html',
    cta: 'View Standard package',
    prefill: 'Hi Easy Rental! I am on the Basic package page but want the Standard package (₱1,319). Event date: ____. Venue/barangay: ____. Preferred delivery time: ____.',
  },
  '/wedding-package-set-a-lipa-batangas.html': {
    offer_id: 'standard_to_combo',
    eyebrow: 'Popular add-on',
    title: 'Add videoke for your program',
    body: 'Combo bundle: tent + videoke for ₱1,698. Need full seating too? Premium is ₱2,778.',
    href: 'wedding-package-combo-lipa-batangas.html',
    cta: 'View Combo package',
    prefill: 'Hi Easy Rental! I am considering Standard but want the Combo package (tent + videoke, ₱1,698). Event date: ____. Venue/barangay: ____.',
  },
  '/wedding-package-combo-lipa-batangas.html': {
    offer_id: 'combo_to_premium',
    eyebrow: 'Full party setup',
    title: 'Need tables and chairs too?',
    body: 'Premium includes tent, videoke, 3 tables, and 30 chairs for ₱2,778 — best for larger guest counts.',
    href: 'wedding-package-set-b-lipa-batangas.html',
    cta: 'View Premium package',
    prefill: 'Hi Easy Rental! I am on the Combo page but want the Premium package (₱2,778). Event date: ____. Venue/barangay: ____. Guest count: ____.',
  },
  '/tent-rental-lipa-batangas.html': {
    offer_id: 'tent_to_standard',
    eyebrow: 'Bundle & save coordination',
    title: 'Book tent + tables + chairs together',
    body: 'Standard package (₱1,319) includes your tent plus seating for ~20 guests in one Messenger thread.',
    href: 'wedding-package-set-a-lipa-batangas.html',
    cta: 'See Standard bundle',
    prefill: 'Hi Easy Rental! I was looking at tent-only rental but want the Standard package (₱1,319). Event date: ____. Venue/barangay: ____.',
  },
  '/table-rental-lipa-batangas.html': {
    offer_id: 'table_to_basic',
    eyebrow: 'Starter bundle',
    title: 'Pair your table with chairs',
    body: 'Basic package: 1× 6ft table + 10 chairs for ₱360 — faster quote than renting separately.',
    href: 'wedding-package-basic-lipa-batangas.html',
    cta: 'View Basic package',
    prefill: 'Hi Easy Rental! I need the Basic package (table + 10 chairs, ₱360). Event date: ____. Venue/barangay: ____.',
  },
  '/tables-chairs-rental-batangas.html': {
    offer_id: 'chairs_to_standard',
    eyebrow: 'Complete outdoor setup',
    title: 'Add a tent in one booking',
    body: 'Standard package bundles tent, 2 tables, and 20 chairs for ₱1,319 with one delivery fee quote.',
    href: 'wedding-package-set-a-lipa-batangas.html',
    cta: 'View Standard package',
    prefill: 'Hi Easy Rental! I was browsing tables & chairs but want the Standard package (₱1,319). Event date: ____. Venue/barangay: ____.',
  },
  '/videoke-rental-lipa-batangas.html': {
    offer_id: 'videoke_to_combo',
    eyebrow: 'Bundle pricing',
    title: 'Book videoke + tent together',
    body: 'Combo package: tent + videoke for ₱1,698 — one vendor, one schedule on event day.',
    href: 'wedding-package-combo-lipa-batangas.html',
    cta: 'View Combo package',
    prefill: 'Hi Easy Rental! I want the Combo package (tent + videoke, ₱1,698). Event date: ____. Venue/barangay: ____.',
  },
  '/wedding-event-package-lipa-batangas.html': {
    offer_id: 'hub_to_standard',
    eyebrow: 'Most booked',
    title: 'Not sure which package?',
    body: 'Standard (₱1,319) fits most ~20-guest weddings and debuts — tent, 2 tables, and 20 chairs in one booking.',
    href: 'wedding-package-set-a-lipa-batangas.html',
    cta: 'View Standard package',
    prefill: 'Hi Easy Rental! I am comparing packages and want the Standard package (₱1,319). Event date: ____. Venue/barangay: ____. Guest count: ____.',
  },
};

const OFFER_LADDER = [
  { label: 'Small gathering', package: 'Basic', price: '₱360', href: 'wedding-package-basic-lipa-batangas.html', note: 'Table + 10 chairs' },
  { label: '~20 guests · Most booked', package: 'Standard', price: '₱1,319', href: 'wedding-package-set-a-lipa-batangas.html', note: 'Tent + tables + chairs', featured: true },
  { label: 'Tent + videoke', package: 'Combo', price: '₱1,698', href: 'wedding-package-combo-lipa-batangas.html', note: 'Entertainment bundle' },
  { label: 'Full party setup', package: 'Premium', price: '₱2,778', href: 'wedding-package-set-b-lipa-batangas.html', note: 'Tent, videoke, 30 chairs' },
];

function initUpsellBar() {
  const offer = UPSELL_OFFERS[location.pathname];
  if (!offer || document.getElementById('upsell-bar')) return;

  const footer = document.querySelector('footer');
  if (!footer) return;

  const qs = attributionQueryString();
  const packageHref = `${offer.href}${qs}`;

  const bar = document.createElement('aside');
  bar.id = 'upsell-bar';
  bar.className = 'upsell-bar reveal';
  bar.setAttribute('role', 'complementary');
  bar.setAttribute('aria-label', 'Recommended package upgrade');
  bar.innerHTML = `
    <div class="upsell-bar__inner">
      <div class="upsell-bar__copy">
        <span class="upsell-bar__eyebrow">${offer.eyebrow}</span>
        <h3 class="upsell-bar__title">${offer.title}</h3>
        <p class="upsell-bar__body">${offer.body}</p>
      </div>
      <div class="upsell-bar__actions">
        <a href="${packageHref}" class="pill pill-sm" data-upsell-id="${offer.offer_id}" data-upsell-action="view_package">${offer.cta}</a>
        <a href="https://m.me/EasyRental.ngani" target="_blank" rel="noopener noreferrer" class="pill pill-outline-dark pill-sm" data-upsell-id="${offer.offer_id}" data-upsell-action="messenger">Ask on Messenger</a>
      </div>
    </div>
  `;

  const messengerCta = bar.querySelector('[data-upsell-action="messenger"]');
  if (messengerCta) {
    messengerCta.setAttribute('data-prefill-msg', offer.prefill);
    bindPrefillMessengerLink(messengerCta);
  }

  footer.parentNode.insertBefore(bar, footer);

  bar.querySelectorAll('[data-upsell-id]').forEach((el) => {
    el.addEventListener('click', () => {
      trackGaEvent('upsell_click', {
        offer_id: offer.offer_id,
        upsell_action: el.getAttribute('data-upsell-action'),
        page_path: location.pathname,
      });
    });
  });

  const observerTarget = bar;
  if (observerTarget.classList.contains('reveal')) {
    observer.observe(observerTarget);
  }
}

function initOfferLadder() {
  const path = location.pathname;
  if (path !== '/' && path !== '/index.html') return;
  if (document.getElementById('offer-ladder')) return;

  const anchor = document.getElementById('package-value');
  if (!anchor) return;

  const qs = attributionQueryString();
  const ladder = document.createElement('section');
  ladder.id = 'offer-ladder';
  ladder.className = 'offer-ladder reveal';
  ladder.setAttribute('aria-labelledby', 'offer-ladder-heading');
  ladder.innerHTML = `
    <div class="offer-ladder__inner">
      <div class="offer-ladder__head">
        <div class="label">Which package fits?</div>
        <h2 id="offer-ladder-heading" class="display offer-ladder__title">Pick your bundle by guest count</h2>
        <p class="offer-ladder__sub">Published equipment rates — delivery auto-calculated in our app after you send your venue on Messenger.</p>
      </div>
      <div class="offer-ladder__grid">
        ${OFFER_LADDER.map((row) => `
          <a href="${row.href}${qs}" class="offer-ladder__card${row.featured ? ' offer-ladder__card--featured' : ''}" data-offer-tier="${row.package.toLowerCase()}">
            ${row.featured ? '<span class="offer-ladder__badge">Most booked</span>' : ''}
            <span class="offer-ladder__tier-label">${row.label}</span>
            <span class="offer-ladder__package">${row.package}</span>
            <span class="offer-ladder__price">${row.price}</span>
            <span class="offer-ladder__note">${row.note}</span>
          </a>
        `).join('')}
      </div>
    </div>
  `;

  anchor.insertAdjacentElement('afterend', ladder);
  observer.observe(ladder);

  ladder.querySelectorAll('.offer-ladder__card').forEach((card) => {
    card.addEventListener('click', () => {
      trackGaEvent('offer_ladder_click', {
        offer_tier: card.getAttribute('data-offer-tier'),
        page_path: location.pathname,
      });
    });
  });
}

function initRevenueEngineering() {
  initAttributionTracking();
  decorateInternalLinks();
  initOfferLadder();
  initUpsellBar();
}

function getCtaVariant() {
  const params = new URLSearchParams(window.location.search);
  const qsVariant = params.get('cta_variant');
  if (qsVariant === 'a' || qsVariant === 'b') return qsVariant;
  return Math.random() < 0.5 ? 'a' : 'b';
}

function applyCtaVariant() {
  const variant = getCtaVariant();
  document.documentElement.setAttribute('data-cta-variant', variant);

  const variantTargets = document.querySelectorAll('[data-cta-a][data-cta-b]');
  variantTargets.forEach((el) => {
    const text = variant === 'b'
      ? el.getAttribute('data-cta-b')
      : el.getAttribute('data-cta-a');
    if (text) el.textContent = text;
  });

  trackGaEvent('cta_variant_assigned', {
    variant,
    page_path: location.pathname
  });
}

function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.setAttribute('readonly', '');
    tempInput.style.position = 'absolute';
    tempInput.style.left = '-9999px';
    document.body.appendChild(tempInput);
    tempInput.select();

    try {
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      resolve();
    } catch (error) {
      document.body.removeChild(tempInput);
      reject(error);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyCtaVariant();

  document.querySelectorAll('[data-prefill-msg]').forEach(bindPrefillMessengerLink);

  const copyButtons = document.querySelectorAll('[data-copy-target]');

  copyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-copy-target');
      if (!targetId) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      copyTextToClipboard(target.innerText.trim())
        .then(() => {
          const openMessenger = button.getAttribute('data-open-messenger') === 'true';
          if (openMessenger) {
            showToast('Inquiry format copied. Opening Messenger...');
            setTimeout(() => {
              window.open(buildMessengerUrl(target.innerText.trim()), '_blank', 'noopener');
            }, 500);
            return;
          }
          showToast('Inquiry format copied. Paste it into Messenger.');
        })
        .catch(() => {
          showToast('Could not copy automatically. You can still copy the message manually.');
        });
    });
  });

  LiveSite.init();
});

// ─────────────────────────────────────────────────────────────────────────────
// LiveSite — live catalog/price hydration from /api/site-data
// ─────────────────────────────────────────────────────────────────────────────

const LiveSite = (() => {
  const CACHE_KEY = 'er_site_data_v1';
  const CACHE_TTL_MS = 60000;

  let siteData = null;

  function getCachedData() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed._cachedAt > CACHE_TTL_MS) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  }

  function setCachedData(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        _cachedAt: Date.now(),
        data,
      }));
    } catch {
      // sessionStorage might be full or unavailable
    }
  }

  async function fetchSiteData() {
    const cached = getCachedData();
    if (cached) {
      siteData = cached;
      return cached;
    }

    try {
      const response = await fetch('/api/site-data');
      if (!response.ok) {
        console.warn('[LiveSite] API error:', response.status);
        return null;
      }
      const data = await response.json();
      siteData = data;
      setCachedData(data);
      return data;
    } catch (error) {
      console.warn('[LiveSite] Fetch error:', error);
      return null;
    }
  }

  const DEFAULT_PAGE_PATHS = {
    'package-basic': 'wedding-package-basic-lipa-batangas.html',
    'package-standard': 'wedding-package-set-a-lipa-batangas.html',
    'package-premium': 'wedding-package-set-b-lipa-batangas.html',
    'package-combo': 'wedding-package-combo-lipa-batangas.html',
    'tent': 'tent-rental-lipa-batangas.html',
    'table-6ft': 'table-rental-lipa-batangas.html',
    'chair': 'tables-chairs-rental-batangas.html',
    'videoke': 'videoke-rental-lipa-batangas.html',
  };

  /** Static showcase images when catalog imageUrl is empty or fails to load. */
  const DEFAULT_CATALOG_IMAGES = {
    'tent': 'assets/easyrental_tent_showcase.png',
    'table-6ft': 'assets/easyrental_table_showcase.png',
    'chair': 'assets/easyrental_chair_showcase.png',
    'videoke': 'assets/easyrental_videoke_unit.jpg',
    'package-basic': 'assets/easyrental_table_showcase.png',
    'package-standard': 'assets/easyrental_tent_showcase.png',
    'package-premium': 'assets/easyrental_videoke_unit.png',
    'package-combo': 'assets/easyrental_videoke_unit.png',
  };

  const PAGE_SLUG_MAP = Object.fromEntries(
    Object.entries(DEFAULT_PAGE_PATHS).map(([slug, path]) => [path, slug])
  );

  let activeSlugMap = { ...PAGE_SLUG_MAP };

  function rebuildSlugMap() {
    activeSlugMap = { ...PAGE_SLUG_MAP };
    if (!siteData?.catalog) return;
    siteData.catalog.forEach((item) => {
      if (!item.websiteSlug || !item.websitePagePath) return;
      const path = item.websitePagePath.replace(/^\//, '');
      if (path) activeSlugMap[path] = item.websiteSlug;
    });
  }

  const CHECK_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

  function escapeHtml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getCatalogItem(slug) {
    if (!siteData?.catalog) return null;
    return siteData.catalog.find(item => item.websiteSlug === slug);
  }

  function getSortedCatalog(filterFn) {
    if (!siteData?.catalog) return [];
    return siteData.catalog
      .filter(filterFn)
      .sort((a, b) => (a.homepageSortOrder || 0) - (b.homepageSortOrder || 0));
  }

  function formatPrice(price) {
    if (typeof price !== 'number') return '';
    return '₱' + price.toLocaleString('en-PH');
  }

  function getPagePath(item) {
    if (item.websitePagePath) {
      return item.websitePagePath.replace(/^\//, '');
    }
    return DEFAULT_PAGE_PATHS[item.websiteSlug] || '#';
  }

  function getPageSlug() {
    const path = location.pathname.replace(/^\//, '');
    return activeSlugMap[path] || document.body.getAttribute('data-catalog-slug') || null;
  }

  function catalogImageAlt(item) {
    if (!item) return '';
    const custom = String(item.imageAltText || '').trim();
    if (custom) return custom;
    return item.name || '';
  }

  function extractDriveFileId(url) {
    if (!url) return null;
    const s = String(url);
    let m = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    m = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    m = s.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    return null;
  }

  /** Drive share links often fail in <img>; thumbnail endpoint is reliable. */
  function normalizeDriveImageUrl(url) {
    const id = extractDriveFileId(url);
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
    return String(url || '').trim();
  }

  function resolveCatalogImageUrl(item, options = {}) {
    if (!item) return '';
    const allowFallback = options.allowFallback !== false;
    const raw = String(item.imageUrl || '').trim();
    if (raw) return normalizeDriveImageUrl(raw);
    if (allowFallback) return DEFAULT_CATALOG_IMAGES[item.websiteSlug] || '';
    return '';
  }

  function buildCatalogImgHtml(item, options = {}) {
    const liveOpts = { allowFallback: false, ...options };
    const src = resolveCatalogImageUrl(item, liveOpts);
    if (!src) return '';
    const slug = escapeHtml(item.websiteSlug || '');
    const alt = escapeHtml(catalogImageAlt(item));
    return `<img src="${escapeHtml(src)}" alt="${alt}" class="catalog-card-img" data-catalog-slug="${slug}" loading="lazy" decoding="async">`;
  }

  function attachCatalogImageFallbacks(root) {
    if (!root) return;
    root.querySelectorAll('img.catalog-card-img[data-catalog-slug]').forEach((img) => {
      const slug = img.getAttribute('data-catalog-slug');
      const item = getCatalogItem(slug);
      const fallback = DEFAULT_CATALOG_IMAGES[slug];
      if (!fallback) return;
      img.addEventListener('error', () => {
        if (img.dataset.fallbackApplied === '1') return;
        if (item?.imageUrl?.trim()) return;
        img.dataset.fallbackApplied = '1';
        img.src = fallback;
      }, { once: true });
    });
  }

  /** Browsers prefer <source srcset> over img.src; unwrap so live Drive URLs apply. */
  function unwrapPictureForLiveImage(img) {
    const picture = img.closest('picture');
    if (!picture || !picture.parentNode) return img;
    picture.parentNode.insertBefore(img, picture);
    picture.remove();
    return img;
  }

  function hydrateLiveCatalogImage(el, item, slug) {
    if (!el || el.tagName !== 'IMG' || !item) return false;
    const src = resolveCatalogImageUrl(item, { allowFallback: false });
    if (!src) return false;

    unwrapPictureForLiveImage(el);
    el.src = src;
    el.setAttribute('data-catalog-slug', slug || item.websiteSlug || '');
    applyFocalStyles(el, item);
    attachCatalogImageFallbacks(el.parentElement || document);
    if (String(item.imageAltText || '').trim()) {
      el.alt = catalogImageAlt(item);
    }
    return true;
  }

  function applyFocalStyles(el, item) {
    if (!el || !item) return;
    const fit = (item.imageFitMode || 'fit') === 'fit';
    const liveRole = el.getAttribute('data-live') || '';
    const isFlyer = liveRole === 'packages-hub-flyer';
    const isHero = !!el.closest('.product-hero-frame, .package-hero-media');

    el.style.setProperty('--focal-x', `${item.imageFocalX ?? 50}%`);
    el.style.setProperty('--focal-y', `${item.imageFocalY ?? 50}%`);

    if (isFlyer) {
      el.style.objectFit = 'contain';
      el.style.width = '100%';
      el.style.height = 'auto';
      return;
    }

    if (isHero) {
      el.classList.add('catalog-hero-img');
      return;
    }

    el.classList.add('catalog-card-img');
    el.classList.toggle('catalog-card-img--fit', fit);
    el.classList.toggle('catalog-card-img--crop', !fit);
  }

  function deriveBullets(item) {
    if (item.type !== 'package' || !item.components?.length) return [];
    return item.components.map((c) => {
      const qty = c.quantity || 1;
      const cover = c.withCover ? ' with cover' : '';
      return `${qty}× ${c.itemName}${cover}`;
    });
  }

  function packageDisplayName(item) {
    return (item.name || '').replace(/\s+package$/i, '').trim() || item.name || '';
  }

  function buildMessengerPrefill(item) {
    const price = formatPrice(item.basePrice);
    const label = item.name || packageDisplayName(item);
    if (item.type === 'package') {
      return `Hi Easy Rental! I want to book the ${label} (${price}). Event date: ____. Venue/barangay: ____. Preferred delivery time: ____.`;
    }
    return `Hi Easy Rental! I want to inquire about ${label} (${price}). Event date: ____. Venue/barangay: ____. Quantity needed: ____.`;
  }

  function buildHomepageSingleCard(item) {
    const pagePath = getPagePath(item);
    const title = escapeHtml(item.name);
    const subtitle = escapeHtml(item.cardSubtitle || item.websiteDescription || '');
    const mediaClass = item.websiteSlug === 'videoke'
      ? 'unit-card-media unit-card-media--videoke'
      : 'unit-card-media';
    const linkClass = item.websiteSlug === 'videoke' ? 'catalog-card-link catalog-card-link--videoke' : 'catalog-card-link';
    const imgHtml = buildCatalogImgHtml(item);

    return `
      <div class="unit-card">
        <div class="${mediaClass}">${imgHtml}</div>
        <div class="catalog-card-body">
          <div class="catalog-card-title">${title}</div>
          ${subtitle ? `<div class="catalog-card-subtitle">${subtitle}</div>` : ''}
          <a href="${escapeHtml(pagePath)}" class="${linkClass}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            View Details &amp; Pricing
          </a>
        </div>
      </div>
    `;
  }

  function buildHomepagePackageCard(item) {
    const pagePath = getPagePath(item);
    const name = escapeHtml(item.name || packageDisplayName(item));
    const subtitle = escapeHtml(item.cardSubtitle || '');
    const badge = escapeHtml(item.cardBadge || '');
    const price = formatPrice(item.basePrice);
    const bullets = deriveBullets(item);
    const featuredClass = item.featuredOnHomepage ? ' catalog-card--featured' : '';
    const prefill = escapeHtml(buildMessengerPrefill(item));
    const promoImg = buildCatalogImgHtml(item);
    const imgHtml = promoImg
      ? `<div class="package-promo-media">${promoImg}</div>`
      : '';

    const bulletHtml = bullets.map((b) =>
      `<div class="catalog-card-bullet">${CHECK_ICON}<span>${escapeHtml(b)}</span></div>`
    ).join('');

    return `
      <div class="unit-card catalog-card--package${featuredClass}">
        ${imgHtml}
        <div class="catalog-card-promo-header">
          <div class="catalog-card-promo-header__main">
            <div class="catalog-card-promo-name">${name}</div>
            ${subtitle ? `<div class="catalog-card-promo-sub">${subtitle}</div>` : ''}
          </div>
          ${badge ? `<div class="catalog-card-promo-badge">${badge}</div>` : ''}
        </div>
        <div class="catalog-card-body catalog-card-body--package">
          <div class="catalog-card-price">${price}</div>
          ${bulletHtml ? `<div class="catalog-card-bullets">${bulletHtml}</div>` : ''}
          <a href="${escapeHtml(pagePath)}" class="catalog-card-cta catalog-card-cta--view">View Package</a>
          <a href="https://m.me/EasyRental.ngani" target="_blank" rel="noopener noreferrer" class="catalog-card-cta catalog-card-cta--book" data-prefill-msg="${prefill}">Book ${name} on Messenger</a>
        </div>
      </div>
    `;
  }

  function buildHubPackageCard(item) {
    const pagePath = getPagePath(item);
    const name = escapeHtml(item.name || packageDisplayName(item));
    const subtitle = escapeHtml(item.cardSubtitle || item.websiteDescription || '');
    const badge = escapeHtml(item.cardBadge || '');
    const price = formatPrice(item.basePrice);
    const bullets = deriveBullets(item);
    const featuredClass = item.featuredOnHomepage ? ' unit-card--featured' : '';
    const badgeClass = item.featuredOnHomepage ? ' unit-badge--best' : '';
    const hubImg = buildCatalogImgHtml(item);
    const imgHtml = hubImg
      ? `<div class="pkg-hub-media">${hubImg}</div>`
      : '<div class="pkg-hub-media pkg-hub-media--empty"></div>';
    const badgeHtml = badge
      ? `<div class="unit-badge${badgeClass}">${badge}</div>`
      : '';

    return `
      <div class="unit-card pkg-hub-card${featuredClass}" id="pkg-${escapeHtml(item.websiteSlug)}">
        ${badgeHtml}
        ${imgHtml}
        <div class="unit-info">
          <div class="pkg-hub-head">
            <h3>${name}</h3>
            ${subtitle ? `<p class="unit-subtitle">${subtitle}</p>` : ''}
          </div>
          <p class="unit-price">${price} <span class="price-note">· Delivery excl.</span></p>
          ${bullets.length ? `<ul class="unit-features">${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
          <a href="${escapeHtml(pagePath)}" class="btn btn-secondary pkg-hub-cta">View ${name}</a>
        </div>
      </div>
    `;
  }

  function renderHomepageCatalog() {
    const path = location.pathname;
    if (path !== '/' && path !== '/index.html') return;

    const grid = document.getElementById('catalog-home-grid');
    if (!grid) return;

    const singles = getSortedCatalog((item) => item.type === 'single');
    const packages = getSortedCatalog((item) => item.type === 'package');
    const cards = [...singles, ...packages];

    if (!cards.length) return;

    grid.innerHTML = cards.map((item) =>
      item.type === 'package'
        ? buildHomepagePackageCard(item)
        : buildHomepageSingleCard(item)
    ).join('');

    grid.querySelectorAll('.catalog-card-img').forEach((img) => {
      const card = img.closest('.unit-card');
      const idx = [...grid.children].indexOf(card);
      if (idx >= 0 && cards[idx]) applyFocalStyles(img, cards[idx]);
    });

    attachCatalogImageFallbacks(grid);

    grid.querySelectorAll('[data-prefill-msg]').forEach((el) => {
      if (typeof bindPrefillMessengerLink === 'function') bindPrefillMessengerLink(el);
    });
  }

  function renderOfferLadder() {
    const path = location.pathname;
    if (path !== '/' && path !== '/index.html') return;

    const ladder = document.getElementById('offer-ladder');
    if (!ladder) return;

    const packages = getSortedCatalog((item) => item.type === 'package');
    if (!packages.length) return;

    const grid = ladder.querySelector('.offer-ladder__grid');
    if (!grid) return;

    const qs = typeof attributionQueryString === 'function' ? attributionQueryString() : '';

    grid.innerHTML = packages.map((item) => {
      const featured = item.featuredOnHomepage;
      const tierLabel = escapeHtml(item.cardSubtitle || item.websiteDescription || item.name || packageDisplayName(item));
      const pkgName = escapeHtml(item.name || packageDisplayName(item));
      const note = escapeHtml(item.cardBadge || item.cardSubtitle || '');
      const href = escapeHtml(getPagePath(item));
      const price = formatPrice(item.basePrice);
      const badge = featured
        ? `<span class="offer-ladder__badge">${escapeHtml(item.cardBadge || 'Most booked')}</span>`
        : '';

      return `
        <a href="${href}${qs}" class="offer-ladder__card${featured ? ' offer-ladder__card--featured' : ''}" data-offer-tier="${escapeHtml(item.websiteSlug)}">
          ${badge}
          <span class="offer-ladder__tier-label">${tierLabel}</span>
          <span class="offer-ladder__package">${pkgName}</span>
          <span class="offer-ladder__price">${price}</span>
          <span class="offer-ladder__note">${note}</span>
        </a>
      `;
    }).join('');

    grid.querySelectorAll('.offer-ladder__card').forEach((card) => {
      card.addEventListener('click', () => {
        if (typeof trackGaEvent === 'function') {
          trackGaEvent('offer_ladder_click', {
            offer_tier: card.getAttribute('data-offer-tier'),
            page_path: location.pathname,
          });
        }
      });
    });
  }

  function hydratePackagesHubFlyer() {
    const path = location.pathname.replace(/^\//, '');
    if (path !== 'wedding-event-package-lipa-batangas.html') return;

    const img = document.querySelector('[data-live="packages-hub-flyer"]');
    const flyer = siteData?.packagesHubFlyer;
    if (!img || !flyer?.imageUrl?.trim()) return;

    const src = normalizeDriveImageUrl(flyer.imageUrl.trim());
    if (!src) return;

    unwrapPictureForLiveImage(img);
    img.src = src;
    applyFocalStyles(img, {
      imageFocalX: flyer.imageFocalX,
      imageFocalY: flyer.imageFocalY,
      imageFitMode: flyer.imageFitMode,
    });
    if (String(flyer.imageAltText || '').trim()) {
      img.alt = flyer.imageAltText.trim();
    }
  }

  function hydratePackageBreadcrumbs() {
    if (!siteData?.catalog) return;
    document.querySelectorAll('[data-live="breadcrumb"][data-catalog-slug]').forEach((el) => {
      const slug = el.getAttribute('data-catalog-slug');
      const item = getCatalogItem(slug);
      if (item?.name) el.textContent = item.name;
    });
  }

  function hydratePackagesHub() {
    const path = location.pathname.replace(/^\//, '');
    if (path !== 'wedding-event-package-lipa-batangas.html') return;

    const grid = document.getElementById('catalog-packages-grid');
    if (!grid) return;

    const packages = getSortedCatalog((item) => item.type === 'package');
    if (!packages.length) return;

    grid.innerHTML = packages.map(buildHubPackageCard).join('');
    grid.querySelectorAll('.catalog-card-img').forEach((img) => {
      const card = img.closest('.pkg-hub-card');
      const idx = card ? [...grid.children].indexOf(card) : -1;
      if (idx >= 0 && packages[idx]) applyFocalStyles(img, packages[idx]);
    });
    attachCatalogImageFallbacks(grid);
  }

  function hydratePageTitle() {
    const slug = getPageSlug();
    if (!slug) return;
    const item = getCatalogItem(slug);
    if (!item?.name) return;
    const suffix = ' | Easy Rental';
    if (!document.title.endsWith(suffix)) return;
    document.title = `${item.name}${suffix}`;
  }

  function hydratePackagePages() {
    const slug = getPageSlug();
    if (!slug) return;

    const item = getCatalogItem(slug);
    if (!item || item.type !== 'package') return;

    const chipsContainer = document.getElementById('catalog-component-chips');
    if (chipsContainer && item.components?.length) {
      const isBreakdown = chipsContainer.classList.contains('breakdown-grid');
      chipsContainer.innerHTML = item.components.map((c) => {
        const qty = escapeHtml(String(c.quantity || 1));
        const name = escapeHtml(c.itemName);
        if (isBreakdown) {
          return `
            <div class="breakdown-item">
              <span class="breakdown-qty">${qty}</span>
              <strong>${name}</strong>
              ${c.withCover ? '<span>With cover</span>' : ''}
            </div>
          `;
        }
        return `
          <div class="item-chip">
            <div class="item-qty">${qty}</div>
            <div>
              <div class="item-label">${name}</div>
              ${c.withCover ? '<div class="item-sub">With cover</div>' : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    hydrateCompareNav();
    hydratePackageBreadcrumbs();
    updateMessengerPrefills(item);
    hydratePageTitle();
  }

  function hydrateProductPages() {
    const slug = getPageSlug();
    if (!slug) return;

    const item = getCatalogItem(slug);
    if (!item || item.type !== 'single') return;

    updateMessengerPrefills(item);
    hydratePageTitle();
  }

  function hydrateCatalogLinks() {
    if (!siteData?.catalog) return;

    document.querySelectorAll('a[data-catalog-slug]').forEach((link) => {
      const slug = link.getAttribute('data-catalog-slug');
      const item = getCatalogItem(slug);
      if (!item) return;
      const path = getPagePath(item);
      if (path && path !== '#') link.setAttribute('href', path);
    });
  }

  function hydrateCompareNav() {
    if (!siteData?.catalog) return;

    document.querySelectorAll('a.nav-pkg[data-catalog-slug]').forEach((link) => {
      const slug = link.getAttribute('data-catalog-slug');
      const item = getCatalogItem(slug);
      if (!item) return;
      const path = getPagePath(item);
      if (path && path !== '#') link.setAttribute('href', path);
      const name = item.name || packageDisplayName(item);
      const svg = link.querySelector('svg');
      const svgClone = svg ? svg.cloneNode(true) : null;
      link.textContent = '';
      if (svgClone) link.appendChild(svgClone);
      link.append(` ${name} · ${formatPrice(item.basePrice)}`);
    });
  }

  function updateMessengerPrefills(item) {
    const prefill = buildMessengerPrefill(item);
    document.querySelectorAll('[data-prefill-msg]').forEach((el) => {
      const msg = el.getAttribute('data-prefill-msg') || '';
      if (/book the|inquire about|want to book/i.test(msg)) {
        el.setAttribute('data-prefill-msg', prefill);
        if (typeof bindPrefillMessengerLink === 'function') bindPrefillMessengerLink(el);
      }
    });
  }

  function hydrateRelatedCards() {
    if (!siteData?.catalog) return;

    document.querySelectorAll('.related-card[data-catalog-slug]').forEach((link) => {
      const slug = link.getAttribute('data-catalog-slug');
      const item = getCatalogItem(slug);
      if (!item) return;

      const path = getPagePath(item);
      if (path && path !== '#') link.setAttribute('href', path);

      const img = link.querySelector('img');
      if (img) {
        hydrateLiveCatalogImage(img, item, slug);
      }

      link.querySelectorAll('[data-live="name"][data-catalog-slug]').forEach((el) => {
        if (el.getAttribute('data-catalog-slug') === slug && item.name) {
          el.textContent = item.name;
        }
      });

      link.querySelectorAll('[data-live="subtitle"][data-catalog-slug]').forEach((el) => {
        if (el.getAttribute('data-catalog-slug') === slug && item.cardSubtitle) {
          el.textContent = item.cardSubtitle;
        }
      });

      link.querySelectorAll('[data-live="price"][data-catalog-slug]').forEach((el) => {
        if (el.getAttribute('data-catalog-slug') === slug) {
          el.textContent = formatPrice(item.basePrice);
        }
      });
    });
  }

  function hydrateElements() {
    if (!siteData?.catalog) return;

    document.querySelectorAll('[data-live="price"][data-catalog-slug]').forEach(el => {
      const slug = el.getAttribute('data-catalog-slug');
      const item = getCatalogItem(slug);
      if (!item) return;

      const useCover = el.hasAttribute('data-with-cover');
      const price = useCover && item.hasCoverOption && item.coverPrice
        ? item.coverPrice
        : item.basePrice;

      el.textContent = formatPrice(price);
    });

    document.querySelectorAll('[data-live="name"][data-catalog-slug]').forEach(el => {
      const slug = el.getAttribute('data-catalog-slug');
      const item = getCatalogItem(slug);
      if (item) el.textContent = item.name;
    });

    document.querySelectorAll('[data-live="description"][data-catalog-slug]').forEach(el => {
      const slug = el.getAttribute('data-catalog-slug');
      const item = getCatalogItem(slug);
      if (item?.websiteDescription) el.textContent = item.websiteDescription;
    });

    document.querySelectorAll('[data-live="subtitle"][data-catalog-slug]').forEach(el => {
      const slug = el.getAttribute('data-catalog-slug');
      const item = getCatalogItem(slug);
      if (item?.cardSubtitle) el.textContent = item.cardSubtitle;
    });

    document.querySelectorAll('[data-live="image"][data-catalog-slug]').forEach(el => {
      const slug = el.getAttribute('data-catalog-slug');
      const item = getCatalogItem(slug);
      if (el.tagName !== 'IMG') return;
      hydrateLiveCatalogImage(el, item, slug);
    });
  }

  function updateJsonLd() {
    if (!siteData?.catalog) return;

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        let modified = false;

        if (data['@type'] === 'Product' && data.offers?.price !== undefined) {
          const slug = script.getAttribute('data-catalog-slug');
          if (slug) {
            const item = getCatalogItem(slug);
            if (item) {
              data.offers.price = String(item.basePrice);
              if (item.name) data.name = item.name;
              if (item.websiteDescription) data.description = item.websiteDescription;
              const imageUrl = resolveCatalogImageUrl(item, { allowFallback: false });
              if (imageUrl) data.image = imageUrl;
              modified = true;
            }
          }
        }

        if (Array.isArray(data.makesOffer)) {
          data.makesOffer.forEach(offer => {
            if (offer.price !== undefined) {
              const priceSpec = offer.itemOffered?.['@id'];
              if (priceSpec) {
                const match = priceSpec.match(/#product-(.+)/);
                if (match) {
                  const slug = match[1];
                  const item = getCatalogItem(slug);
                  if (item) {
                    offer.price = String(item.basePrice);
                    modified = true;
                  }
                }
              }
            }
          });
        }

        if (modified) {
          script.textContent = JSON.stringify(data);
        }
      } catch {
        // Invalid JSON-LD, skip
      }
    });
  }

  function renderGallery() {
    if (!siteData?.gallery?.length) return;

    const container = document.getElementById('live-gallery');
    if (!container) return;

    container.innerHTML = siteData.gallery
      .filter(item => item.showOnWebsite !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(item => `
        <figure class="live-gallery__item">
          <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.altText || item.caption || 'Gallery image')}" loading="lazy" decoding="async">
          ${item.caption ? `<figcaption>${escapeHtml(item.caption)}</figcaption>` : ''}
        </figure>
      `)
      .join('');
  }

  async function init() {
    const data = await fetchSiteData();
    if (!data) return;

    rebuildSlugMap();
    hydrateElements();
    hydrateCatalogLinks();
    hydrateRelatedCards();
    hydrateCompareNav();
    hydratePackageBreadcrumbs();
    renderHomepageCatalog();
    renderOfferLadder();
    hydratePackagesHub();
    hydratePackagesHubFlyer();
    hydratePackagePages();
    hydrateProductPages();
    updateJsonLd();
    renderGallery();

    if (typeof bindPrefillMessengerLink === 'function') {
      document.querySelectorAll('[data-prefill-msg]').forEach(bindPrefillMessengerLink);
    }

    document.dispatchEvent(new CustomEvent('livesiteready', { detail: data }));
  }

  return {
    init,
    getData: () => siteData,
    getCatalogItem,
    formatPrice,
    refresh: fetchSiteData,
  };
})();
