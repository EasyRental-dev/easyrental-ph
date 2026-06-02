const {
  sendTelegramMessage,
  jsonResponse,
  corsHeaders,
  parseBody,
  clientMeta,
  formatLead,
} = require('./telegram');

const CONTACT_RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const CONTACT_RATE_LIMIT_MAX = 2;
const CONTACT_DEDUPE_WINDOW_MS = 60 * 60 * 1000; // 1 hour per phone
const contactRateLimitState = new Map();
const contactDedupeState = new Map();

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim();
  }
  return (
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    'unknown'
  );
}

function isContactRateLimited(req, res) {
  const now = Date.now();
  const ip = getClientIp(req);
  const record = contactRateLimitState.get(ip);

  if (!record || now >= record.resetAt) {
    contactRateLimitState.set(ip, { count: 1, resetAt: now + CONTACT_RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= CONTACT_RATE_LIMIT_MAX) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return true;
  }

  record.count += 1;
  return false;
}

// Clicks stay in GA4 only — no Telegram (avoids flooding on every CTA tap).
function createClickHandler() {
  return async function handler(req, res) {
    corsHeaders(req, res);

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    if (req.method !== 'POST') {
      return jsonResponse(res, 405, { ok: false, error: 'method_not_allowed' });
    }

    return jsonResponse(res, 200, { ok: true, notified: false });
  };
}

function isDuplicateContact(phone) {
  const key = normalizePhone(phone);
  if (key.length < 10) return false;

  const now = Date.now();
  const lastNotified = contactDedupeState.get(key);
  if (lastNotified && now - lastNotified < CONTACT_DEDUPE_WINDOW_MS) {
    return true;
  }

  contactDedupeState.set(key, now);
  return false;
}

async function contactHandler(req, res) {
  corsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return jsonResponse(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  if (isContactRateLimited(req, res)) {
    return jsonResponse(res, 429, { ok: false, error: 'rate_limited' });
  }

  try {
    const payload = parseBody(req);
    const name = String(payload.name || '').trim();
    const phone = String(payload.phone || '').trim();
    const message = String(payload.message || '').trim();
    const website = String(payload.website || '').trim();

    // Honeypot: bots often fill hidden fields; silently accept.
    if (website) {
      return jsonResponse(res, 200, { ok: true, notified: false });
    }

    if (!name || !phone || !message) {
      return jsonResponse(res, 400, { ok: false, error: 'missing_fields' });
    }

    if (message.length < 12) {
      return jsonResponse(res, 400, { ok: false, error: 'message_too_short' });
    }

    if (isDuplicateContact(phone)) {
      return jsonResponse(res, 200, { ok: true, notified: false, duplicate: true });
    }

    const meta = clientMeta(req, payload);
    const text = formatLead(
      'New contact form inquiry',
      {
        Name: name,
        Phone: phone,
        Message: message.slice(0, 1200),
        Channel: meta.channel || '',
      },
      meta
    );

    const result = await sendTelegramMessage(text);
    return jsonResponse(res, 200, { ok: true, notified: !result.skipped });
  } catch (error) {
    console.error('[contact]', error);
    return jsonResponse(res, 500, { ok: false, error: 'notification_failed' });
  }
}

module.exports = { createClickHandler, contactHandler };
