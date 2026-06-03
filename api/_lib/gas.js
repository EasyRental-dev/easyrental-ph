const crypto = require('crypto');

const DEFAULT_DEVICE_ID = 'WEB-FORM-BOT';
const GAS_TIMEOUT_MS = 25000;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function getGasConfig() {
  const baseUrl = String(process.env.GAS_URL || '').trim();
  const secret = String(process.env.API_SECRET || '').trim();
  if (!baseUrl || !secret) {
    return null;
  }
  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    secret,
    deviceId: String(process.env.GAS_DEVICE_ID || DEFAULT_DEVICE_ID).trim() || DEFAULT_DEVICE_ID,
  };
}

function signPostRequest(timestamp, deviceId, base64Payload, secret) {
  const dataToSign = `${timestamp}|${deviceId}|${base64Payload}`;
  return crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');
}

async function fetchWithTimeout(url, options, timeoutMs = GAS_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * POST to tenant GAS with HMAC auth (mirrors Flutter ApiService._post).
 * Body is base64-encoded JSON; GAS doPost decodes and verifies signature.
 */
async function gasPost(payload) {
  const config = getGasConfig();
  if (!config) {
    return { ok: false, skipped: true, reason: 'gas_not_configured' };
  }

  const timestamp = String(Date.now());
  const payloadStr = JSON.stringify(payload);
  const base64Payload = Buffer.from(payloadStr, 'utf8').toString('base64');
  const signature = signPostRequest(timestamp, config.deviceId, base64Payload, config.secret);

  const url = new URL(config.baseUrl);
  url.searchParams.set('t', timestamp);
  url.searchParams.set('d', config.deviceId);
  url.searchParams.set('s', signature);

  let response = await fetchWithTimeout(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: base64Payload,
    redirect: 'manual',
  });

  for (let i = 0; i < 5 && REDIRECT_STATUSES.has(response.status); i += 1) {
    const location = response.headers.get('location');
    if (!location) break;
    response = await fetchWithTimeout(location, { method: 'GET', redirect: 'manual' });
  }

  const body = await response.text();
  if (body.trimStart().startsWith('<')) {
    return { ok: false, error: 'gas_html_response', status: response.status };
  }

  let data;
  try {
    data = JSON.parse(body);
  } catch {
    return { ok: false, error: 'gas_invalid_json', body: body.slice(0, 200) };
  }

  if (data.success !== true) {
    return { ok: false, error: data.error || 'gas_request_failed', data };
  }

  return { ok: true, data };
}

/**
 * Append a Pending inquiry for a website contact form submission.
 */
async function logWebsiteInquiry({ name, phone, message, meta = {} }) {
  const rawData = JSON.stringify({
    clientName: name,
    phone,
    page: meta.page || '',
    utmSource: meta.utmSource || '',
    utmMedium: meta.utmMedium || '',
    utmCampaign: meta.utmCampaign || '',
    refPartner: meta.refPartner || '',
    channel: 'Website Form',
  });

  return gasPost({
    action: 'logInquiry',
    message: String(message || '').slice(0, 2000),
    type: 'C',
    score: 5,
    source: 'Website Form',
    status: 'Pending',
    rawData,
  });
}

module.exports = {
  getGasConfig,
  gasPost,
  logWebsiteInquiry,
  DEFAULT_DEVICE_ID,
};
