const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');

const post = {
  slug: 'premium-package',
  title: 'Premium Package',
  bodyMarkdown: '',
  featuredImageUrl: 'https://drive.google.com/thumbnail?id=1FmqddC',
  publishedAt: '2026-06-06T18:52:14.240782',
  tags: [],
};

const raw = marked.parse(post.bodyMarkdown || '', { breaks: true, gfm: true });
const bodyHtml = sanitizeHtml(raw, {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'img']),
});
console.log('render ok, body length:', bodyHtml.length);
