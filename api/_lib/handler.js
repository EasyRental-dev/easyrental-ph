const {
  sendTelegramMessage,
  jsonResponse,
  corsHeaders,
  parseBody,
  clientMeta,
  formatLead,
} = require('./telegram');

function createClickHandler(eventName, title) {
  return async function handler(req, res) {
    corsHeaders(req, res);

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    if (req.method !== 'POST') {
      return jsonResponse(res, 405, { ok: false, error: 'method_not_allowed' });
    }

    try {
      const payload = parseBody(req);
      const meta = clientMeta(req, payload);
      const text = formatLead(
        title,
        {
          Event: eventName,
          Label: payload.label || payload.cta || '',
          Package: payload.package || '',
          Phone: payload.phone || '',
        },
        meta
      );

      const result = await sendTelegramMessage(text);
      return jsonResponse(res, 200, { ok: true, notified: !result.skipped });
    } catch (error) {
      console.error(`[${eventName}]`, error);
      return jsonResponse(res, 500, { ok: false, error: 'notification_failed' });
    }
  };
}

async function contactHandler(req, res) {
  corsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return jsonResponse(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  try {
    const payload = parseBody(req);
    const name = String(payload.name || '').trim();
    const phone = String(payload.phone || '').trim();
    const message = String(payload.message || '').trim();

    if (!name || !phone || !message) {
      return jsonResponse(res, 400, { ok: false, error: 'missing_fields' });
    }

    const meta = clientMeta(req, payload);
    const text = formatLead(
      'New contact form inquiry',
      {
        Name: name,
        Phone: phone,
        Message: message.slice(0, 1200),
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
