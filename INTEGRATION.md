# Landing Page ↔ Rental App Integration

Web form submissions can auto-create **Inquiry** rows in the rental app's Google Sheet via the tenant GAS API. Booking dispatch alerts can fire from GAS when the **Bookings** tab changes.

## Sheet alignment (required, per tenant)

Each tenant gets their own spreadsheet **automatically** — you do not create it by hand for daily ops.

On first **Google Sign-In** in the rental app, `SheetSyncService` finds or creates **"Rental Booking Data"** in that tenant's Google Drive and stores the ID locally as `sync_sheet_id`. The URL looks like:

```
https://docs.google.com/spreadsheets/d/{SYNC_SHEET_ID}/edit
```

That `{SYNC_SHEET_ID}` is **unique per tenant** (per Google account / business).

GAS reads/writes **`SPREADSHEET_ID`** in Script Properties (one GAS deployment per tenant). **It must equal that tenant's auto `{SYNC_SHEET_ID}`** or web-form inquiries will not appear in the app.

### One-time setup per tenant

1. **Activate the tenant** in the app and complete **Google Sign-In** once (creates or links **Rental Booking Data**).
2. **Copy `{SYNC_SHEET_ID}`** from the sheet URL in Drive or from the app's sync/backup settings.
3. **Set GAS Script Property** `SPREADSHEET_ID` = `{SYNC_SHEET_ID}` (Apps Script → Project Settings → Script Properties).
4. **Tabs** — the app seeds `Bookings`, `Inquiries`, `Config`, etc. on first sync. If using GAS before the app has run once, ensure an **Inquiries** tab exists (21 columns A–U, `Inquiry ID` in column U).

### Easy Rental landing page (single tenant)

Vercel `GAS_URL` + `API_SECRET` point at **this tenant's** GAS Web App only. There is one `{SYNC_SHEET_ID}` for Easy Rental — not shared across other license holders.

### Verify

Submit the contact form on `/contact.html`. After the next app sync, a **Pending** inquiry with source **Website Form** should appear in Inquiry log.

### If inquiries don't show in the app

Update GAS `SPREADSHEET_ID` to the tenant's current **Rental Booking Data** `{SYNC_SHEET_ID}` (e.g. after re-sign-in or import). Do not maintain a separate manual spreadsheet for ops.

## Vercel environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Yes (alerts) | Telegram Bot API |
| `TELEGRAM_CHAT_ID` | Yes (alerts) | Team chat id |
| `GAS_URL` | For auto-inquiry | Tenant GAS Web App URL (same as Flutter `--dart-define=GAS_URL`) |
| `API_SECRET` | For auto-inquiry | HMAC secret (same as Flutter `--dart-define=API_SECRET`) |
| `GAS_DEVICE_ID` | Optional | Stable device id for HMAC; default `WEB-FORM-BOT` |

If `GAS_URL` or `API_SECRET` is unset, the contact API still sends Telegram alerts but skips `logInquiry` (graceful degradation).

## API flow

```
POST /api/contact
  → validate + rate limit
  → Telegram alert (team buzzer)
  → GAS POST action=logInquiry (HMAC-signed, base64 body)
  → Inquiries tab append
  → Flutter app pulls on next sync
```

## Booking dispatch (optional)

See [`rental_booking_system/gas/telegram_dispatch.gs`](../rental_booking_system/gas/telegram_dispatch.gs). Install in the **same** Apps Script project as `Code.gs`, set Script Properties `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`, and run `installBookingDispatchTrigger()` once.

## Deferred (by design)

Full Telegram bot for creating quotations or bookings is **not** implemented. Bookings require deposit confirmation and availability checks in the Flutter app. See [OPERATIONS.md](OPERATIONS.md).

## Messenger auto-inquiry (rental app GAS)

Same sheet as web-form inquiries: customer messages the Facebook Page -> GAS webhook -> **Inquiries** tab -> app sync.

Setup: see rental app DEPLOYMENT.md section 8. Log-only (no bot replies).

### Meta app (Live mode)

| Meta field | URL |
|------------|-----|
| Privacy Policy URL | `https://easyrentalph.vercel.app/privacy` |
| User data deletion instructions (optional) | `https://easyrentalph.vercel.app/privacy#data-deletion` |
| App domain | `easyrentalph.vercel.app` |

Deploy the landing page after adding `privacy.html` so the URL is publicly reachable before switching the Meta app to Live.

