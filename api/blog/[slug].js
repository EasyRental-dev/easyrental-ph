const { getPublicSiteData } = require('../_lib/gas');
const { marked } = require('marked');
const DOMPurify = require('isomorphic-dompurify');
const {
  escapeHtml,
  renderSiteHead,
  renderNavbar,
  renderBreadcrumb,
  renderChromeEnd,
} = require('../_lib/blog-shell');

const CACHE_MAX_AGE = 60;
const STALE_WHILE_REVALIDATE = 300;

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

  const bodyHtml = DOMPurify.sanitize(
    marked.parse(post.bodyMarkdown || '', { breaks: true, gfm: true })
  );
  const publishedDate = formatDate(post.publishedAt);

  const jsonLd = `
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
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://easyrentalph.vercel.app"},{"@type":"ListItem","position":2,"name":"Blog","item":"https://easyrentalph.vercel.app/blog"},{"@type":"ListItem","position":3,"name":${JSON.stringify(post.title)},"item":"${canonical}"}]}
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

${renderNavbar()}

${renderBreadcrumb([
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: post.title, href: canonical },
])}

<main class="blog-page blog-page--post">
  <article class="blog-post">
    ${post.featuredImageUrl ? `
    <figure class="blog-post__figure">
      <img src="${escapeHtml(post.featuredImageUrl)}" alt="${title}" loading="lazy" decoding="async">
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

${renderNavbar()}

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
