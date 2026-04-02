const { getOrSetJson } = require('../../../services/cache')

const { FEATURE_CACHE_TTL } = require('./cacheConfig')
const { buildFeatureCacheKey } = require('./cacheUtils')

function getQuizCacheKey(userId, summary) {
  return buildFeatureCacheKey('quiz', userId, summary)
}

async function getCachedQuiz(userId, summary, provider) {
  return getOrSetJson(getQuizCacheKey(userId, summary), FEATURE_CACHE_TTL.quiz, provider)
}

module.exports = {
  getCachedQuiz,
}
