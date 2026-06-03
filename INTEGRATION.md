# Landing Page ↔ Rental App Integration

Web form submissions can auto-create **Inquiry** rows in the rental app's Google Sheet via the tenant GAS API. Booking dispatch alerts can fire from GAS when the **Bookings** tab changes.

## Sheet alignment (required)

The Flutter app syncs to a client-owned spreadsheet titled **"Rental Booking Data"** (`SheetSyncService`). GAS reads/writes **`SPREADSHEET_ID`** in Script Properties. **These must be the same spreadsheet** or web-form inquiries will not appear in the app.

### Verify alignment

1. **App sheet ID** — In the rental app: open backup/sync settings (or check Google Drive) and open **Rental Booking Data**. Copy the ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/{SYNC_SHEET_ID}/edit
   ```
   The app stores this as `sync_sheet_id` in SharedPreferences after Google Sign-In.

2. **GAS sheet ID** — In the spreadsheet bound to `Code.gs`: **Extensions → Apps Script → Project Settings → Script Properties**. Confirm `SPREADSHEET_ID` equals `{SYNC_SHEET_ID}` from step 1.

3. **Tabs** — The sheet must include at least:
   - `Bookings` — headers per [`gas/Code.gs`](../rental_booking_system/gas/Code.gs) `EXPECTED_HEADERS`
   - `Inquiries` — 21 columns (A–U), including `Inquiry ID` in column U

4. **Smoke test** — Submit the contact form on `/contact.html`. Within one app sync, a new **Pending** inquiry with source **Website Form** should appear in Inquiry log.

### If IDs differ

Update GAS Script Property `SPREADSHEET_ID` to the app's **Rental Booking Data** sheet ID, redeploy the Web App, and re-run the smoke test. Do not maintain two spreadsheets for daily ops.

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
