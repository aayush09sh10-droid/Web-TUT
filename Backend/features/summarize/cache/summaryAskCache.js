const { getOrSetJson } = require('../../../services/cache')

const { FEATURE_CACHE_TTL } = require('./cacheConfig')
const { buildFeatureCacheKey } = require('./cacheUtils')

function getSummaryAskCacheKey(userId, payload) {
  return buildFeatureCacheKey('summary-ask', userId, payload)
}

async function getCachedAskSummary(userId, payload, provider) {
  return getOrSetJson(
    getSummaryAskCacheKey(userId, payload),
    FEATURE_CACHE_TTL.summaryAsk,
    provider
  )
}

module.exports = {
  getCachedAskSummary,
}
