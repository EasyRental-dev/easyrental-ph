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
});

// --- GA4 + Telegram lead tracking ---
const GA_MEASUREMENT_ID = 'G-ESVPGJL66K';

function trackGaEvent(eventName, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
  }
}

function notifyLead(endpoint, payload = {}) {
  const body = JSON.stringify({
    page: window.location.pathname,
    referrer: document.referrer || '',
    ...payload
  });

  const url = `/api/${endpoint}`;
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon(url, blob);
    return;
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true
  }).catch(() => {});
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
      notifyLead('messenger-click', { label, cta: label });
      if (isQuoteCta(messengerLink)) {
        trackGaEvent('quote_click', { link_text: label, page_path: location.pathname });
        notifyLead('quote-click', { label, cta: label });
      }
      return;
    }

    const callLink = e.target.closest('a[href^="tel:"]');
    if (callLink) {
      const label = linkLabel(callLink);
      trackGaEvent('call_click', { link_text: label, page_path: location.pathname });
      notifyLead('call-click', { label, cta: label });
      return;
    }

    const quoteBtn = e.target.closest('[data-track="quote"], .copy-template-btn');
    if (quoteBtn) {
      const label = linkLabel(quoteBtn);
      trackGaEvent('quote_click', { link_text: label, page_path: location.pathname });
      notifyLead('quote-click', { label, cta: label });
    }
  });

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const submitBtn = form.querySelector('[type="submit"]');
      const name = form.name?.value?.trim() || '';
      const phone = form.phone?.value?.trim() || '';
      const message = form.message?.value?.trim() || '';

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
          body: JSON.stringify({ name, phone, message, page: location.pathname })
        });
        const data = await response.json().catch(() => ({}));

        if (response.ok && data.ok) {
          form.reset();
          showToast('Message sent! We will reply on Messenger or phone soon.');
          trackGaEvent('generate_lead', { form_name: 'contact' });
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
  notifyLead('quote-click', { package: setName, label: `book_package:${setName}` });

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
  return `${base}?text=${encodeURIComponent(message)}`;
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

  const prefillLinks = document.querySelectorAll('[data-prefill-msg]');
  prefillLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const msg = link.getAttribute('data-prefill-msg');
      if (!msg) return;
      e.preventDefault();
      window.open(buildMessengerUrl(msg), '_blank', 'noopener');
    });
  });

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
