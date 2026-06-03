# Easy Rental — Lead-to-Booking Operations

Single source of truth:

| What | Where |
|------|--------|
| Customer conversation | **Facebook Messenger** (`m.me/EasyRental.ngani`) |
| Lead status & pipeline | **Rental app → Inquiry log** |
| Confirmed booking, stock, delivery fee | **Rental app → Bookings** |
| Marketing attribution | **GA4** + site UTM/ref (sessionStorage) |
| Instant team alert (form only) | **Telegram** (notification only — not a CRM) |
| Web form → app Inquiry | **Vercel `/api/contact` → GAS `logInquiry`** (when `GAS_URL` + `API_SECRET` set) |
| Backup / BI | **Google Sheets** (synced from app — read-only for daily ops) |

**Rules**

1. Every Messenger or web-form lead → **Inquiry in app within 15 minutes** (status `Pending`). Web form inquiries are **auto-logged** when Vercel has `GAS_URL` + `API_SECRET` configured (see [INTEGRATION.md](INTEGRATION.md)).
2. Every deposit received → **Booking in app the same day** (check availability first).
3. Telegram = buzzer. Messenger = where you sell. App = what you ship.

---

## Response SLA

| Window | Target |
|--------|--------|
| Business hours (8:00–20:00) | First Messenger reply **within 5 minutes** |
| Outside hours | Facebook **Away message** within 15 minutes; human reply next business day |

Phone: **0948 512 1132** (`tel:+639485121132`)

---

## Facebook Page notifications (one-time setup)

Do this on the phone that answers inquiries:

1. Install **Meta Business Suite** (or Facebook Pages Manager).
2. Open page **Easy Rental - Tables, Chairs & Tent Rentals Lipa**.
3. **Settings → Notifications** → enable **Messages** (sound + push).
4. On the device: allow notification permissions for the app; disable Do Not Disturb for Business Suite during business hours.
5. Pin the Page inbox at the top of Meta Business Suite.
6. Assign **one owner per shift** who acknowledges new threads within 5 minutes.

Optional Away message (Page Settings → Messaging):

> Salamat sa message! Basahin namin ito sa lalong madaling panahon (within 15 min off-hours). Para mas mabilis ang quote, pakisend: **event date, complete venue address, items/package, at contact number**. — Easy Rental Lipa

---

## Lead workflow (every inquiry)

```text
New message (Messenger or form alert)
  → Reply within 5 min (ack + ask for missing fields if needed)
  → Log Inquiry in app (Pending) — name, phone, date, venue, items
  → Quick Quote or AI Chat Reply in app → paste quote to Messenger
  → Note in inquiry: "Quoted" + total + deposit amount
  → Customer approves → GCash/Maya deposit screenshot
  → Create Booking in app + record payment
  → Send confirmation template on Messenger (below)
  → After event: ask for Google review
```

### Inquiry statuses (app)

| Status | When |
|--------|------|
| `Pending` | New lead, not quoted yet |
| (note) Quoted | Quote sent on Messenger — use inquiry notes |
| `Closed` | Converted to booking or resolved without sale |
| `Ghosted` | No reply after follow-up cadence |
| `Lost` | Chose competitor / cancelled / out of area |

### Quote checklist (before sending total)

- [ ] Event date confirmed in app **availability**
- [ ] Complete venue address (for delivery calc)
- [ ] Package / items and quantities
- [ ] Delivery + setup requirements
- [ ] Quick Quote or zone/distance delivery fee in app
- [ ] Deposit amount stated (“deposit reserves your date”)

### Messenger quote template (paste-ready)

```text
Hi [Name]! Here's your Easy Rental quote:

Date: [date]
Venue: [address]
Package/Items: [list]
Equipment: ₱[amount]
Delivery & setup: ₱[amount] (from app calculation)
Total: ₱[total]

To secure this date: send ₱[deposit] via GCash/Maya to [number].
We'll confirm once received. Balance ₱[balance] due before delivery.

Reply YES to confirm or ask if you need changes.
```

### Booking confirmation template (after deposit)

```text
Confirmed — Easy Rental

Booking ref: [app ID]
Date: [date]
Venue: [address]
Items: [list]
Delivery window: [time]
Deposit received: ₱[amount]
Balance due: ₱[amount] by [date]
Contact: 0948 512 1132

We'll coordinate setup/pickup on this thread. Salamat!
```

### Ghosted follow-up (Messenger Saved Replies)

| Day | Message |
|-----|---------|
| 0 | (quote sent — wait 24h) |
| +1 | "Hi! Checking if you still need tables/chairs/tent for [date] — date is still open for now." |
| +3 | "Last check — want us to hold [date]? Reply anytime." |
| +5 | Mark **Ghosted** in app if no reply |

---

## Channel-specific steps

### Messenger (primary — ~90% of leads)

1. Customer taps `m.me/EasyRental.ngani` (often with pre-filled event details).
2. Reply within 5 minutes.
3. Log **Inquiry** in app immediately (copy phone from thread).
4. Use **AI Chat Reply** for draft → **Quick Quote** for delivery → send on Messenger.
5. Deposit → **Booking** same day.

### Web contact form (secondary)

1. Team gets **Telegram** alert (name, phone, message, attribution).
2. **Inquiry auto-logged** to app sheet when GAS env vars are configured; otherwise **ACTION:** log Inquiry in app within 15 min.
3. Call or message customer on **Messenger** (preferred) or phone — do not rely on Telegram thread for the sale.
4. If customer used "Continue on Messenger" on the site, thread may already exist — merge into one Inquiry.

### Phone (`tel:+639485121132`)

1. Answer / return missed call within 15 minutes when possible.
2. Log Inquiry in app before ending call.
3. Send summary quote on Messenger if customer uses Facebook.

---

## Web form → Telegram alert fields

Alerts include: name, phone (tap-to-call on mobile Telegram), message, page, UTM/partner ref, and:

- `ACTION: Log as Inquiry in app within 15 min`
- Link to Messenger inbox

---

## Weekly funnel reconcile (Fridays, ~10 minutes)

No new dashboard. Copy one row into Google Sheets or Notes:

| Week of | GA4 sessions | `quote_click` | `generate_lead` (form) | App new inquiries | App new bookings | Deposits ₱ | Notes |
|---------|----------------|---------------|------------------------|-------------------|------------------|------------|-------|
| YYYY-MM-DD | | | | | | | |

**Where to read numbers**

- **GA4:** Reports → Engagement → Events (`quote_click`, `generate_lead`); Users for sessions.
- **App:** Inquiry log (new Pending that week); Bookings list (created that week); revenue/unpaid metrics on home screen.

**Targets (improve week over week)**

| Metric | Target |
|--------|--------|
| Median first Messenger reply (business hours) | < 5 min |
| Inquiries logged in app within 24h | > 90% |
| Quote sent within 1h of complete info | > 80% |
| Deposit → Booking created same day | 100% |

---

## Growth: Rental app → Telegram (booking dispatch)

**Purpose:** Dispatch alert when a new booking is created or payment/status is recorded — not for marketing leads.

**Implemented:** [`gas/telegram_dispatch.gs`](../rental_booking_system/gas/telegram_dispatch.gs) in the rental app GAS project.

1. Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to GAS Script Properties (same bot as landing page).
2. Ensure `SPREADSHEET_ID` matches the app's **Rental Booking Data** sheet ([INTEGRATION.md](INTEGRATION.md)).
3. For standalone GAS deployments, run `installBookingDispatchTrigger()` once in the Apps Script editor.

**Telegram message example:**

```text
📅 Booking confirmed
ID: ER-1234 | Sat Jun 14 | Premium package
Venue: [barangay], Lipa
Delivery: 2:00 PM | Balance unpaid: ₱1,500
```

Requires same env vars as the landing page: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

---

## Do not use Telegram for

- CRM / pipeline tracking (use app Inquiry log)
- Booking or inventory management (use app Bookings)
- **Creating quotations or bookings via bot** (deferred — requires deposit + availability in app)
- Logging every Messenger CTA click (GA4 only — avoids alert fatigue)

---

## Related technical docs

- Telegram env setup: [VERCEL_SETUP.md](VERCEL_SETUP.md)
- GAS ↔ app integration: [INTEGRATION.md](INTEGRATION.md)
- Contact API: `POST /api/contact` → `api/_lib/handler.js`
