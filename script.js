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
      const submitBtn = form.querySelector('[type="submit"]');
      const name = form.querySelector('[name="name"]')?.value?.trim() || '';
      const phone = form.querySelector('[name="phone"]')?.value?.trim() || '';
      const message = form.querySelector('[name="message"]')?.value?.trim() || '';
      const website = form.querySelector('[name="website"]')?.value?.trim() || '';

      if (!name || !phone || !message) {
        showToast('Please fill in name, phone, and message.');
        return;
      }

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
          form.reset();
          showToast('Message sent! We will reply on Messenger or phone soon.');
          trackGaEvent('generate_lead', { form_name: 'contact' });
        } else if (response.status === 429) {
          showToast('Too many attempts. Please message us on Messenger instead.');
        } else if (data.error === 'message_too_short') {
          showToast('Please add a bit more detail about your event.');
        } else {
          showToast('Could not send right now. Please message us on Messenger.');
        }
      } catch {
        showToast('Could not send right now. Please message us on Messenger.');
      } finally {
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
});
