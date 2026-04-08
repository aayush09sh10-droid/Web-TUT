const { getOrSetJson } = require('../../../services/cache')

const { FEATURE_CACHE_TTL } = require('./cacheConfig')
const { buildFeatureCacheKey } = require('./cacheUtils')

function getSummaryVideoCacheKey(userId, payload) {
  return buildFeatureCacheKey('summary-video', userId, payload)
}

async function getCachedVideoSummary(userId, payload, provider) {
  return getOrSetJson(
    getSummaryVideoCacheKey(userId, payload),
    FEATURE_CACHE_TTL.summaryVideo,
    provider
  )
}

module.exports = {
  getCachedVideoSummary,
}
