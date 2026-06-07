# Google Search Console — Vercel migration checklist

Use this during the 30–60 day overlap while GitHub Pages (`easyrental-dev.github.io/easyrental-ph/`) and Vercel (`easyrentalph.vercel.app`) both serve the site.

**Deployment flow:** Push to GitHub `main` → Vercel auto-deploys (production) + GitHub Actions deploys Pages (overlap).

## One-time setup

1. **Add Vercel property** in [Google Search Console](https://search.google.com/search-console)
   - Property type: **URL prefix**
   - URL: `https://easyrentalph.vercel.app`
   - Verify via HTML file upload (add verification file to repo root, push, remove after verified) or DNS TXT if using a custom domain later

2. **Submit sitemap** (on the **Vercel** property only — not the GitHub Pages property)
   - GSC → Sitemaps → Add new sitemap → enter: `sitemap.xml`
   - Full URL: `https://easyrentalph.vercel.app/sitemap.xml`
   - If GSC still shows **Couldn't fetch** / **Unknown** from an old attempt:
     1. Delete the failed sitemap entry in GSC
     2. Wait 5 minutes, then submit a cache-busted path: `sitemap.xml?v=20260607`
     3. In **URL Inspection**, paste `https://easyrentalph.vercel.app/sitemap.xml` → **Test live URL** → confirm **Page fetch: Successful**
   - Optional later: also submit `image-sitemap.xml` or `sitemap-index.xml` after `sitemap.xml` succeeds

3. **Enable GitHub Pages (repo settings)**
   - Settings → Pages → Build and deployment → Source: **GitHub Actions**
   - Confirm site URL: `https://easyrental-dev.github.io/easyrental-ph/`

4. **Keep the existing GitHub Pages GSC property** active during overlap — do not delete yet

## Weekly monitoring (4–8 weeks)

- [ ] GSC → **Pages**: indexed count shifting toward Vercel URLs
- [ ] GSC → **Sitemaps**: Vercel sitemap status **Success**
- [ ] GSC → **Indexing** → no spike in "Duplicate without user-selected canonical"
- [ ] URL Inspection on 5–10 top pages (homepage, packages hub, top product pages, `/blog`, `/contact.html`) — confirm Google-selected canonical is Vercel

## Do not

- Submit a GitHub Pages sitemap (canonicals and `robots.txt` already point to Vercel)
- Use GSC "Change of Address" (that is for domain moves like `easyrental.ph`, not github.io → vercel.app)
- Delete GitHub Pages until Vercel URLs are stably indexed

## After stable Vercel indexing (30–60 days)

1. GSC confirms most important URLs indexed on `easyrentalph.vercel.app`
2. GitHub repo → Settings → Pages → disable GitHub Pages
3. Optional: remove `.github/workflows/pages.yml` in a follow-up commit
4. Keep the GitHub Pages GSC property read-only for a few more weeks, then remove if unused

## Reference

- Canonical URLs and sitemaps target Vercel (`site-base-url.txt`)
- `robots.txt` Sitemap points to `sitemap.xml` (plain XML, no CSP headers)
- Sitemap XML files are excluded from Content-Security-Policy in `vercel.json`
- GitHub Pages deploy injects subpath `<base>` via `scripts/prepare_gh_pages.py`
