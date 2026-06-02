# Easy Rental PH — Vercel migration checklist

## 1. Telegram bot (one-time)

1. Open [@BotFather](https://t.me/BotFather) → `/newbot` → save the **bot token**.
2. Start a chat with your bot, then open:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Copy your **chat id** from the JSON (`message.chat.id`).

## 2. Deploy on Vercel

1. Push this repo to GitHub.
2. [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Framework preset: **Other** (static site + `/api` functions).
4. Environment variables (Production + Preview):

   | Name | Value |
   |------|--------|
   | `TELEGRAM_BOT_TOKEN` | From BotFather |
   | `TELEGRAM_CHAT_ID` | Your numeric chat id |

5. Deploy. Test:

   - Submit the contact form on `/contact.html` or the homepage — you should get **one** Telegram message with name, phone, and event details.
   - Messenger / call / CTA clicks are tracked in **GA4 only** (no Telegram), so browsing the site does not flood your bot.

## 3. Custom domain (when ready)

1. **Hobby (free) plan:** your site lives at `https://easyrentalph.vercel.app` — no custom domain required. Optional later: Vercel → **Domains** → add `easyrental.ph` (or another domain).
2. Production URL is set in **`site-base-url.txt`** (currently `https://easyrentalph.vercel.app`). After any domain change, run `python scripts/sync_site.py`.
3. Submit `https://easyrentalph.vercel.app/sitemap-index.xml` in Google Search Console.
4. Keep GitHub Pages live for 30–60 days; `vercel.json` already 301-redirects `/easyrental-ph/*` → `/`.

## 4. GitHub Pages overlap

- Do **not** delete the GitHub Pages site until Search Console shows stable indexing on the new host.
- Optional: add a `CNAME` or meta refresh on GitHub only after Vercel is verified.

## 5. WebP assets (optional, local)

```bash
python scripts/convert_webp.py
```

Then add `<picture>` elements with `source type="image/webp"` for large photos when you are ready to wire them in HTML.

## 6. Cost

Vercel Hobby + GA4 + Telegram = **$0** at typical landing-page traffic.
