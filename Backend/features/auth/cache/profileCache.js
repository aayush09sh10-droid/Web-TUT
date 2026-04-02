const { getOrSetJson } = require('../../../services/cache')
const { getProfileCacheKey } = require('../../history/cache/historyCache')

const PROFILE_CACHE_TTL_SECONDS = 2 * 60

async function getCachedProfile(userId, provider) {
  return getOrSetJson(getProfileCacheKey(userId), PROFILE_CACHE_TTL_SECONDS, provider)
}

module.exports = {
  getCachedProfile,
}
