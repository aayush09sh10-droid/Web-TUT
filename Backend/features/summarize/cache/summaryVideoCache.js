const { getOrSetJson } = require('../../../services/cache')

const { FEATURE_CACHE_TTL } = require('./cacheConfig')
const { buildFeatureCacheKey } = require('./cacheUtils')

function getSummaryVideoCacheKey(userId, url) {
  return buildFeatureCacheKey('summary-video', userId, { url })
}

async function getCachedVideoSummary(userId, url, provider) {
  return getOrSetJson(
    getSummaryVideoCacheKey(userId, url),
    FEATURE_CACHE_TTL.summaryVideo,
    provider
  )
}

module.exports = {
  getCachedVideoSummary,
}
