const { getOrSetJson } = require('../../../services/cache')

const { FEATURE_CACHE_TTL } = require('./cacheConfig')
const { buildFeatureCacheKey } = require('./cacheUtils')

function getTeachingCacheKey(userId, summary) {
  return buildFeatureCacheKey('teaching', userId, summary)
}

async function getCachedTeaching(userId, summary, provider) {
  return getOrSetJson(
    getTeachingCacheKey(userId, summary),
    FEATURE_CACHE_TTL.teaching,
    provider
  )
}

module.exports = {
  getCachedTeaching,
}
