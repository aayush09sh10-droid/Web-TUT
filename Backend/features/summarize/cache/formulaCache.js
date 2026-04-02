const { getOrSetJson } = require('../../../services/cache')

const { FEATURE_CACHE_TTL } = require('./cacheConfig')
const { buildFeatureCacheKey } = require('./cacheUtils')

function getFormulaCacheKey(userId, summary) {
  return buildFeatureCacheKey('formula', userId, summary)
}

async function getCachedFormula(userId, summary, provider) {
  return getOrSetJson(
    getFormulaCacheKey(userId, summary),
    FEATURE_CACHE_TTL.formula,
    provider
  )
}

module.exports = {
  getCachedFormula,
}
