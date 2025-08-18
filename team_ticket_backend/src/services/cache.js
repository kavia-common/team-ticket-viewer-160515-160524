const NodeCache = require('node-cache');

// Cache TTL in seconds, default 300s (5 minutes)
const DEFAULT_TTL = Number(process.env.CACHE_TTL_SECONDS || 300);
const cache = new NodeCache({ stdTTL: DEFAULT_TTL, checkperiod: Math.max(60, Math.floor(DEFAULT_TTL / 2)) });

// PUBLIC_INTERFACE
function getCache() {
  /** Returns the shared NodeCache instance. */
  return cache;
}

// PUBLIC_INTERFACE
function clearCache() {
  /** Clears the shared cache. */
  cache.flushAll();
}

module.exports = {
  cache,
  getCache,
  clearCache,
};
