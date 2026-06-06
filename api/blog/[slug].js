const { getPublicSiteData } = require('../_lib/gas');
const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');
const {
  escapeHtml,
  renderSiteHead,
  renderNavbar,
  renderBreadcrumb,
  renderChromeEnd,
} = require('../_lib/blog-shell');

const CACHE_MAX_AGE = 60;
const STALE_WHILE_REVALIDATE = 300;

const SANITIZE_OPTIONS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'br', 'hr', 'figure', 'figcaption',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
    a: ['href', 'name', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
};

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

function renderMarkdown(markdown) {
  const raw = marked.parse(String(markdown || ''), { breaks: true, gfm: true });
  return sanitizeHtml(raw, SANITIZE_OPTIONS);
}

function renderPostBody(post) {
  const bodyHtml = renderMarkdown(post.bodyMarkdown);
  if (bodyHtml.trim()) return bodyHtml;
  const fallback = String(post.excerpt || '').trim();
  if (fallback) return `<p>${escapeHtml(fallback)}</p>`;
  return '<p class="blog-content__empty">Full article text is coming soon. Message us on Messenger for package details and pricing.</p>';
}

function renderPost(post, siteData) {
  const title = escapeHtml(post.seoTitle || post.title);
  const description = escapeHtml(post.seoDescription || post.excerpt || post.title || '');
  const businessName = escapeHtml(siteData.businessName || 'Easy Rental');
  const canonical = `https://easyrentalph.vercel.app/blog/${encodeURIComponent(post.slug)}`;
  const featuredImage = post.featuredImageUrl || 'https://easyrentalph.vercel.app/assets/easyrental_logo.png';
  const featuredAlt = escapeHtml(post.featuredImageAlt || post.seoTitle || post.title || 'Blog post image');

  const bodyHtml = renderPostBody(post);
  const publishedDate = formatDate(post.publishedAt);

  const jsonLd = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": ${JSON.stringify(post.seoTitle || post.title || '')},
    "description": ${JSON.stringify(post.seoDescription || post.excerpt || post.title || '')},
    "image": ${JSON.stringify(featuredImage)},
    "datePublished": ${JSON.stringify(post.publishedAt || '')},
    "dateModified": ${JSON.stringify(post.updatedAt || post.publishedAt || '')},
    "author": {
      "@type": "Organization",
      "name": ${JSON.stringify(siteData.businessName || 'Easy Rental')}
    },
    "publisher": {
      "@type": "Organization",
      "name": ${JSON.stringify(siteData.businessName || 'Easy Rental')},
      "logo": {
        "@type": "ImageObject",
        "url": "https://easyrentalph.vercel.app/assets/easyrental_logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": ${JSON.stringify(canonical)}
    }
  }
  </script>
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://easyrentalph.vercel.app"},{"@type":"ListItem","position":2,"name":"Blog","item":"https://easyrentalph.vercel.app/blog"},{"@type":"ListItem","position":3,"name":${JSON.stringify(post.title)},"item":${JSON.stringify(canonical)}}]}
  </script>`;

  return `<!DOCTYPE html>
<html lang="en-PH">
<head>
  ${renderSiteHead({
    title: `${title} | ${businessName} Blog`,
    description,
    canonical,
    ogType: 'article',
    ogImage: featuredImage,
    extraHead: `${jsonLd}
  <meta property="article:published_time" content="${escapeHtml(post.publishedAt || '')}">`,
  })}
</head>
<body>

${renderNavbar('blog')}

${renderBreadcrumb([
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: post.title, href: canonical },
])}

<main class="blog-page blog-page--post">
  <article class="blog-post">
    ${post.featuredImageUrl ? `
    <figure class="blog-post__figure">
      <img src="${escapeHtml(post.featuredImageUrl)}" alt="${featuredAlt}" loading="lazy" decoding="async">
    </figure>
    ` : ''}

    <header class="blog-post__header">
      <h1 class="blog-post__title">${escapeHtml(post.title)}</h1>
      ${publishedDate ? `<time class="blog-post__date" datetime="${escapeHtml(post.publishedAt)}">${publishedDate}</time>` : ''}
      ${post.tags?.length ? `
      <div class="blog-post__tags">
        ${post.tags.map(tag => `<span class="blog-post__tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
      ` : ''}
    </header>

    <div class="blog-content">
      ${bodyHtml}
    </div>

    <footer class="blog-post__footer">
      <a href="/blog" class="blog-back-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Blog
      </a>
    </footer>
  </article>
</main>

${renderChromeEnd('Hi Easy Rental! I read your blog and want to inquire for my event. Event date: ____. Venue/barangay: ____. Items/package needed: ____.')}
</body>
</html>`;
}

function render404() {
  return `<!DOCTYPE html>
<html lang="en-PH">
<head>
  ${renderSiteHead({
    title: 'Post Not Found | Easy Rental Blog',
    description: 'The blog post you are looking for does not exist or has been removed.',
    canonical: 'https://easyrentalph.vercel.app/blog',
    ogType: 'website',
  })}
</head>
<body>

${renderNavbar('blog')}

<main class="blog-not-found">
  <div class="blog-not-found__inner">
    <h1>Post Not Found</h1>
    <p>The blog post you're looking for doesn't exist or has been removed.</p>
    <a href="/blog" class="pill pill-lg">Back to Blog</a>
  </div>
</main>

${renderChromeEnd()}
</body>
</html>`;
}

function renderError(title, message) {
  return `<!DOCTYPE html>
<html lang="en-PH">
<head>
  ${renderSiteHead({
    title: `${title} | Easy Rental Blog`,
    description: message,
    canonical: 'https://easyrentalph.vercel.app/blog',
    ogType: 'website',
  })}
</head>
<body>
${renderNavbar('blog')}
<main class="blog-not-found">
  <div class="blog-not-found__inner">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <a href="/blog" class="pill pill-lg">Back to Blog</a>
  </div>
</main>
${renderChromeEnd()}
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  const slugRaw = req.query?.slug;
  const slug = decodeURIComponent(String(Array.isArray(slugRaw) ? slugRaw[0] : slugRaw || '')).trim();

  if (!slug) {
    res.status(400).setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderError('Missing post', 'No blog post slug was provided.'));
    return;
  }

  try {
    const result = await getPublicSiteData();

    if (!result.ok) {
      console.error('[blog/[slug]] GAS error:', result.error || result.reason);
      res.status(502).setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(renderError('Temporarily unavailable', 'Blog content could not be loaded. Please try again in a moment.'));
      return;
    }

    const siteData = result.data?.data || result.data;
    const posts = siteData.posts || [];
    const post = posts.find(p => p.slug === slug && p.status === 'published');

    if (!post) {
      res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(render404());
      return;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`);
    res.status(200).send(renderPost(post, siteData));
  } catch (error) {
    console.error('[blog/[slug]] Error:', error);
    res.status(500).setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderError('Something went wrong', 'This blog page could not be rendered. Please try again later.'));
  }
};
