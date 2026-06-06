const { getPublicSiteData } = require('../_lib/gas');
const { marked } = require('marked');

const CACHE_MAX_AGE = 60;
const STALE_WHILE_REVALIDATE = 300;

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function renderPost(post, siteData) {
  const title = escapeHtml(post.seoTitle || post.title);
  const description = escapeHtml(post.seoDescription || post.excerpt || '');
  const businessName = escapeHtml(siteData.businessName || 'Easy Rental');
  const canonical = `https://easyrentalph.vercel.app/blog/${encodeURIComponent(post.slug)}`;
  const featuredImage = post.featuredImageUrl || 'https://easyrentalph.vercel.app/assets/easyrental_logo.png';

  const bodyHtml = marked.parse(post.bodyMarkdown || '', { breaks: true, gfm: true });
  const publishedDate = formatDate(post.publishedAt);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ${businessName} Blog</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">

  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${escapeHtml(featuredImage)}">
  <meta property="article:published_time" content="${escapeHtml(post.publishedAt || '')}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${escapeHtml(featuredImage)}">

  <link rel="stylesheet" href="/index.css">
  <link rel="icon" type="image/png" href="/assets/easyrental_logo.png">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${title}",
    "description": "${description}",
    "image": "${escapeHtml(featuredImage)}",
    "datePublished": "${escapeHtml(post.publishedAt || '')}",
    "dateModified": "${escapeHtml(post.updatedAt || post.publishedAt || '')}",
    "author": {
      "@type": "Organization",
      "name": "${businessName}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "${businessName}",
      "logo": {
        "@type": "ImageObject",
        "url": "https://easyrentalph.vercel.app/assets/easyrental_logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "${canonical}"
    }
  }
  </script>
</head>
<body>

<header class="site-header">
  <nav class="container nav">
    <a href="/" class="brand">
      <img src="/assets/easyrental_logo.png" alt="${businessName}" width="36" height="36">
      <span>${businessName}</span>
    </a>
    <ul class="nav-links">
      <li><a href="/#packages">Packages</a></li>
      <li><a href="/#delivery-zones">Delivery</a></li>
      <li><a href="/blog">Blog</a></li>
      <li><a href="/#faq">FAQ</a></li>
    </ul>
    <a href="https://m.me/EasyRental.ngani" class="btn btn-primary nav-cta" target="_blank" rel="noopener">Message on Messenger</a>
    <button class="nav-toggle" aria-label="Toggle menu">&#9776;</button>
  </nav>
</header>

<main style="padding-top: 80px;">
  <article class="blog-post" style="max-width: 800px; margin: 0 auto; padding: 40px 24px;">
    ${post.featuredImageUrl ? `
    <figure style="margin: 0 0 32px; border-radius: 16px; overflow: hidden;">
      <img src="${escapeHtml(post.featuredImageUrl)}" alt="${title}" style="width: 100%; height: auto; display: block;">
    </figure>
    ` : ''}

    <header style="margin-bottom: 32px;">
      <h1 style="font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 700; letter-spacing: -0.02em; margin-bottom: 16px; color: var(--ink);">${escapeHtml(post.title)}</h1>
      ${publishedDate ? `<time datetime="${escapeHtml(post.publishedAt)}" style="color: var(--muted); font-size: 0.9rem;">${publishedDate}</time>` : ''}
      ${post.tags?.length ? `
      <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;">
        ${post.tags.map(tag => `<span style="background: var(--brand-light); color: var(--brand-dark); padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 600;">${escapeHtml(tag)}</span>`).join('')}
      </div>
      ` : ''}
    </header>

    <div class="blog-content" style="font-size: 1.05rem; line-height: 1.8; color: var(--ink);">
      ${bodyHtml}
    </div>

    <footer style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #E2E8F0;">
      <a href="/blog" style="display: inline-flex; align-items: center; gap: 8px; color: var(--brand-dark); font-weight: 600; text-decoration: none;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Blog
      </a>
    </footer>
  </article>
</main>

<footer class="site-footer">
  <div class="container" style="padding: 48px 24px; text-align: center;">
    <p style="color: var(--muted); font-size: 0.88rem;">&copy; ${new Date().getFullYear()} ${businessName}. Tables, chairs, tents, and videoke rental in Lipa City and Batangas.</p>
  </div>
</footer>

<script src="/script.js"></script>
</body>
</html>`;
}

function render404() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Post Not Found | Easy Rental Blog</title>
  <link rel="stylesheet" href="/index.css">
</head>
<body style="display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 24px;">
  <div>
    <h1 style="font-size: 2rem; margin-bottom: 16px;">Post Not Found</h1>
    <p style="color: var(--muted); margin-bottom: 24px;">The blog post you're looking for doesn't exist or has been removed.</p>
    <a href="/blog" class="pill">Back to Blog</a>
  </div>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    res.status(400).send('Missing slug');
    return;
  }

  try {
    const result = await getPublicSiteData();

    if (!result.ok) {
      res.status(502).send('Failed to fetch data');
      return;
    }

    const siteData = result.data?.data || result.data;
    const posts = siteData.posts || [];
    const post = posts.find(p => p.slug === slug && p.status === 'published');

    if (!post) {
      res.status(404).send(render404());
      return;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`);
    res.status(200).send(renderPost(post, siteData));
  } catch (error) {
    console.error('[blog/[slug]] Error:', error);
    res.status(500).send('Internal server error');
  }
};
