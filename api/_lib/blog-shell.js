function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSiteHead({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage = 'https://easyrentalph.vercel.app/assets/easyrental_logo.png',
  extraHead = '',
}) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeCanonical = escapeHtml(canonical);
  const safeOgImage = escapeHtml(ogImage);

  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${safeCanonical}">

  <meta property="og:type" content="${escapeHtml(ogType)}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:url" content="${safeCanonical}">
  <meta property="og:image" content="${safeOgImage}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeOgImage}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/index.css">
  <link rel="icon" type="image/png" href="/assets/easyrental_logo.png">

  <script async src="https://www.googletagmanager.com/gtag/js?id=G-ESVPGJL66K"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-ESVPGJL66K');
  </script>
  ${extraHead}`;
}

function renderNavbar(activePage = '') {
  const blogActive = activePage === 'blog' ? ' aria-current="page"' : '';

  return `<div id="progress"></div>

<nav class="navbar" aria-label="Primary">
  <a href="/" class="nav-logo" title="Easy Rental - Tables, Chairs &amp; Tent Rentals Lipa">
    <img src="/assets/easyrental_logo.png" srcset="/assets/easyrental_logo_192.webp 192w, /assets/easyrental_logo_512.webp 512w" sizes="(max-width: 768px) 120px, 220px" alt="Easy Rental Lipa Batangas logo" title="Easy Rental Lipa" width="1024" height="1024" loading="lazy" decoding="async">
    <span class="display" style="font-weight:700;">Easy Rental Lipa</span>
  </a>
  <ul class="nav-links">
    <li><a href="/#services">Rentals</a></li>
    <li><a href="/#units">Rates</a></li>
    <li><a href="/wedding-event-package-lipa-batangas.html">Packages</a></li>
    <li><a href="/#how-booking-works">Booking</a></li>
    <li><a href="/#faq">FAQ</a></li>
    <li><a href="/blog"${blogActive}>Blog</a></li>
    <li><a href="/contact.html">Contact</a></li>
  </ul>
  <a href="https://m.me/EasyRental.ngani" class="btn btn-primary nav-cta" target="_blank" rel="noopener noreferrer" data-prefill-msg="Hi Easy Rental! I want to inquire for my event. Event date: ____. Venue/barangay: ____. Items/package needed: ____.">Message on Messenger</a>
  <button class="nav-toggle" aria-label="Toggle menu">&#9776;</button>
</nav>

<div class="mobile-menu">
  <ul>
    <li><a href="/#services">Rentals</a></li>
    <li><a href="/#units">Rates</a></li>
    <li><a href="/wedding-event-package-lipa-batangas.html">Packages</a></li>
    <li><a href="/#how-booking-works">Booking</a></li>
    <li><a href="/#faq">FAQ</a></li>
    <li><a href="/blog">Blog</a></li>
    <li><a href="/contact.html">Contact</a></li>
    <li><a href="https://m.me/EasyRental.ngani" target="_blank" rel="noopener noreferrer">Message on Messenger</a></li>
  </ul>
</div>`;
}

function renderBreadcrumb(items) {
  const crumbs = items.map((item, index) => {
    const isLast = index === items.length - 1;
    if (isLast) {
      return `<span style="color:var(--ink);font-weight:500;">${escapeHtml(item.label)}</span>`;
    }
    return `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>`;
  }).join('\n    ');

  return `<div style="background:#fff;border-bottom:1px solid #F1F5F9;">
  <nav class="blog-breadcrumb" aria-label="Breadcrumb">
    ${crumbs}
  </nav>
</div>`;
}

function renderFooter() {
  return `<footer class="site-footer">
  <div class="site-footer__inner">
    <div style="display:flex;align-items:center;gap:12px;">
      <img src="/assets/easyrental_logo.png" srcset="/assets/easyrental_logo_192.webp 192w, /assets/easyrental_logo_512.webp 512w" sizes="(max-width: 768px) 120px, 220px" alt="Easy Rental Lipa Batangas logo" title="Easy Rental Lipa" class="brand-logo-footer" width="1024" height="1024" loading="lazy" decoding="async">
      <div>
        <div class="display" style="font-size:1rem;font-weight:700;color:#fff;letter-spacing:-.02em;line-height:1.2;">Easy Rental Lipa</div>
        <div class="site-footer__brand-tagline">Easy Rental - Tables, Chairs &amp; Tent Rentals Lipa</div>
      </div>
    </div>
    <div class="site-footer__location">Lipa City, Batangas · Serving Batangas Province</div>
    <div class="site-footer__copy">&copy; 2026 Easy Rental. All Rights Reserved.</div>
  </div>
  <nav class="site-footer-nav" aria-label="Footer">
    <a href="/wedding-event-package-lipa-batangas.html">Event packages</a>
    <a href="/contact.html">Contact</a>
    <a href="/partner-referral.html">Partner program</a>
    <a href="/privacy.html">Privacy</a>
  </nav>
</footer>`;
}

function renderFab(prefillMsg) {
  const msg = escapeHtml(prefillMsg || 'Hi Easy Rental! I want to inquire for my event. Event date: ____. Venue/barangay: ____. Items/package needed: ____.');
  return `<a href="https://m.me/EasyRental.ngani" target="_blank" rel="noopener noreferrer" class="fab" title="Chat on Messenger" data-prefill-msg="${msg}">
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.908 1.452 5.506 3.732 7.205V22l3.405-1.869C10.012 20.371 10.992 20.5 12 20.5c5.523 0 10-4.145 10-9.257S17.523 2 12 2zm1.09 12.467-2.545-2.72-4.97 2.72 5.464-5.8 2.609 2.72 4.906-2.72-5.464 5.8z"/></svg>
</a>`;
}

function renderChromeEnd(prefillMsg) {
  return `${renderFooter()}
${renderFab(prefillMsg)}
<script src="/script.js"></script>`;
}

module.exports = {
  escapeHtml,
  renderSiteHead,
  renderNavbar,
  renderBreadcrumb,
  renderFooter,
  renderFab,
  renderChromeEnd,
};
