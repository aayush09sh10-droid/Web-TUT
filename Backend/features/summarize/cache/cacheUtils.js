const { buildCacheKey, hashPayload } = require('../../../services/cache')

function normaliseUserId(userId) {
  return String(userId || '').trim()
}

function buildFeatureCacheKey(featureName, userId, payload) {
  return buildCacheKey([
    'feature',
    featureName,
    normaliseUserId(userId),
    hashPayload(payload),
  ])
}

module.exports = {
  buildFeatureCacheKey,
}
