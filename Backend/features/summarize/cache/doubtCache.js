const { getOrSetJson } = require('../../../services/cache')

const { FEATURE_CACHE_TTL } = require('./cacheConfig')
const { buildFeatureCacheKey } = require('./cacheUtils')

function getDoubtCacheKey(userId, doubtPayload) {
  return buildFeatureCacheKey('doubt', userId, doubtPayload)
}

async function getCachedDoubtAnswer(userId, doubtPayload, provider) {
  return getOrSetJson(
    getDoubtCacheKey(userId, doubtPayload),
    FEATURE_CACHE_TTL.doubt,
    provider
  )
}

module.exports = {
  getCachedDoubtAnswer,
}
