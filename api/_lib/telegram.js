const TELEGRAM_API = 'https://api.telegram.org';

function getConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return null;
  }
  return { token, chatId };
}

async function sendTelegramMessage(text) {
  const config = getConfig();
  if (!config) {
    return { ok: false, skipped: true, reason: 'telegram_not_configured' };
  }

  const url = `${TELEGRAM_API}/bot${config.token}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: config.chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram HTTP ${response.status}`);
  }
  return { ok: true };
}

function jsonResponse(res, status, body) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(body);
}

function corsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function clientMeta(req, payload = {}) {
  return {
    page: payload.page || payload.path || 'unknown',
    referrer: payload.referrer || req.headers.referer || '',
    userAgent: (req.headers['user-agent'] || '').slice(0, 200),
    utmSource: payload.utm_source || payload.utmSource || '',
    utmMedium: payload.utm_medium || payload.utmMedium || '',
    utmCampaign: payload.utm_campaign || payload.utmCampaign || '',
    refPartner: payload.ref || payload.ref_partner || '',
    channel: payload.channel || '',
    at: new Date().toISOString(),
  };
}

const MESSENGER_INBOX_URL = 'https://m.me/EasyRental.ngani';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** E.164 for Philippines mobiles (09xx → +639xx) for tel: links in Telegram HTML. */
function phoneToTelHref(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('63')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length < 10) return '';
  return `+63${digits}`;
}

function formatLead(title, fields, meta) {
  const lines = [`🔔 ${title}`, ''];
  const phoneRaw = fields.Phone != null ? String(fields.Phone).trim() : '';
  const telHref = phoneToTelHref(phoneRaw);

  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null || String(value).trim() === '') return;
    if (key === 'Phone' && telHref) {
      lines.push(`Phone: <a href="tel:${telHref}">${escapeHtml(String(value))}</a>`);
      return;
    }
    lines.push(`${key}: ${escapeHtml(String(value))}`);
  });

  lines.push('', `Page: ${escapeHtml(meta.page)}`);
  if (meta.referrer) lines.push(`Referrer: ${escapeHtml(meta.referrer)}`);
  if (meta.channel) lines.push(`Channel: ${escapeHtml(meta.channel)}`);
  if (meta.utmSource) lines.push(`UTM source: ${escapeHtml(meta.utmSource)}`);
  if (meta.utmMedium) lines.push(`UTM medium: ${escapeHtml(meta.utmMedium)}`);
  if (meta.utmCampaign) lines.push(`UTM campaign: ${escapeHtml(meta.utmCampaign)}`);
  if (meta.refPartner) lines.push(`Partner ref: ${escapeHtml(meta.refPartner)}`);
  lines.push(`Time: ${meta.at}`);
  lines.push('');
  if (process.env.GAS_URL && process.env.API_SECRET) {
    lines.push('<b>ACTION:</b> Inquiry auto-logged to app — reply on Messenger');
  } else {
    lines.push('<b>ACTION:</b> Log as Inquiry in app within 15 min');
  }
  lines.push(`<a href="${MESSENGER_INBOX_URL}">Open Messenger inbox</a>`);
  return lines.join('\n');
}

module.exports = {
  sendTelegramMessage,
  jsonResponse,
  corsHeaders,
  parseBody,
  clientMeta,
  formatLead,
};
