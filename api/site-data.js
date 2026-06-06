const { getPublicSiteData, getGasConfig } = require('./_lib/gas');

const CACHE_MAX_AGE = 60;
const STALE_WHILE_REVALIDATE = 300;

let cachedData = null;
let cacheTime = 0;
const MEMORY_CACHE_TTL = 30000;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const config = getGasConfig();
  if (!config) {
    res.status(503).json({
      error: 'Site data not configured',
      message: 'GAS_URL and API_SECRET environment variables are required',
    });
    return;
  }

  try {
    const now = Date.now();
    if (cachedData && (now - cacheTime) < MEMORY_CACHE_TTL) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`);
      if (cachedData.updatedAt) {
        res.setHeader('ETag', `"${cachedData.updatedAt}"`);
      }
      res.status(200).json(cachedData);
      return;
    }

    const result = await getPublicSiteData();

    if (!result.ok) {
      console.error('[site-data] GAS error:', result.error);
      if (cachedData) {
        res.setHeader('X-Cache', 'STALE');
        res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`);
        res.status(200).json(cachedData);
        return;
      }
      res.status(502).json({
        error: 'Failed to fetch site data',
        details: result.error,
      });
      return;
    }

    const data = result.data?.data || result.data;
    cachedData = data;
    cacheTime = now;

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`);
    if (data.updatedAt) {
      res.setHeader('ETag', `"${data.updatedAt}"`);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('[site-data] Error:', error);
    if (cachedData) {
      res.setHeader('X-Cache', 'STALE');
      res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`);
      res.status(200).json(cachedData);
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};
