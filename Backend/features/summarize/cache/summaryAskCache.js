const { getOrSetJson } = require('../../../services/cache')

const { FEATURE_CACHE_TTL } = require('./cacheConfig')
const { buildFeatureCacheKey } = require('./cacheUtils')

function getSummaryAskCacheKey(userId, question) {
  return buildFeatureCacheKey('summary-ask', userId, { question })
}

async function getCachedAskSummary(userId, question, provider) {
  return getOrSetJson(
    getSummaryAskCacheKey(userId, question),
    FEATURE_CACHE_TTL.summaryAsk,
    provider
  )
}

module.exports = {
  getCachedAskSummary,
}
