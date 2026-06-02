# EasyRental Project Status

Last updated: 2026-06-02

## Project
- Repo: `c:\src\easyrental_landing_page`
- Live base URL: `https://easyrentalph.vercel.app`
- Goal: grow into sustainable 6-digit monthly revenue with zero-cost tooling.

## Business constraint (delivery pricing)
- **Delivery fees are auto-calculated in the booking app** (distance, vehicle routing, venue, schedule, items, setup)—not published as fixed web rates.
- The site explains the **process and inputs**, not town/zone price tables. Do not add “starting from” delivery amounts to the website.

## Completed Work

### Phase 2 - CRO (implemented)
- Added package-specific Messenger prefill flows (`data-prefill-msg`) across homepage and major service/package pages.
- Added direct "Book on Messenger" CTAs on package cards.
- Added homepage quick inquiry form (uses `/api/contact`) for users who prefer not to open Messenger first.
- Reduced friction: copy inquiry template now supports copy + open Messenger.
- Added sticky desktop CTA and mobile CTA consistency improvements.
- Added A/B-ready CTA label support in `script.js` (`cta_variant` support + GA event `cta_variant_assigned`).

### Phase 3 - SEO (quick wins implemented)
- Added robust homepage robots meta directives.
- Added `hreflang` (`en-PH`, `x-default`) on homepage.
- Added `CommunicateAction` in JSON-LD for Messenger contact intent.
- Added footer internal link cluster to key service pages.
- Updated `sitemap-index.xml` `lastmod`.
- Added `Host` entry in `robots.txt`.
- **BreadcrumbList JSON-LD** on money pages via `scripts/inject_breadcrumb_schema.py` + `scripts/breadcrumb_pages.json`.

### Phase 4 - Technical (implemented batches)
- Removed `https://cdn.tailwindcss.com` script tags from HTML pages.
- Added/strengthened Vercel security headers (CSP enforced, HSTS, etc.).
- Added HTML cache revalidation headers in `vercel.json`.
- Logo WebP `srcset`/`sizes` across site.
- Honeypot + per-IP rate limiting on `/api/contact`.
- Fixed invalid nested `<picture>` markup and duplicate `width`/`height` on homepage proof images.

### Phase 5 - Revenue Engineering (implemented)
- Offer ladder, contextual upsell bars, partner/referral page, UTM + `ref` attribution (GA4 + Telegram).

### Copy alignment (2026-06-02)
- Homepage delivery section + FAQ + JSON-LD aligned with **app-calculated delivery** (no fixed web rates).
- Offer ladder subcopy updated to match.

## Current Security/Performance Notes
- CSP is enforced and includes GA + Google Fonts domains.
- Messenger prefill links rely on `window.open`; behavior verified by implementation.

## Remaining Recommended Work

### Ops / growth (highest impact, no code)
- Search Console + Bing: submit `sitemap-index.xml`, monitor indexing.
- GBP: post-event review asks; weekly posts.
- Activate 10 partners with `?ref=` codes.
- Messenger SLA &lt;15 min replies on peak days.

### Phase 3 medium wins (optional next)
- 2–3 SEO guide articles (chair counts, tent sizing)—not delivery price lists.
- Custom domain when ready: edit `site-base-url.txt`, run `python scripts/sync_site.py`.

### Phase 4 closeout (optional next)
- CSP tightening (reduce `'unsafe-inline'`).
- Hero/OG WebP pass for non-logo assets.

## Maintainer scripts
| Script | Purpose |
|--------|---------|
| `python scripts/sync_site.py` | Update canonical/OG URLs after domain change |
| `python scripts/inject_breadcrumb_schema.py` | Refresh BreadcrumbList JSON-LD from `breadcrumb_pages.json` |
| `python scripts/convert_webp.py` | Generate WebP assets |

## Quick Resume Prompt (for next chat)
```text
Continue EasyRental optimization from PROJECT_STATUS.md.
Delivery is app-calculated—do not publish fixed delivery rates on the site.

Start by reading PROJECT_STATUS.md, then propose the next highest-impact batch
(partners, SEO content, Search Console, CRO tests—not delivery price tables).
```
