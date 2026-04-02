const { getOrSetJson } = require('../../../services/cache')

const { FEATURE_CACHE_TTL } = require('./cacheConfig')
const { buildFeatureCacheKey } = require('./cacheUtils')

function getSummaryNotesCacheKey(userId, notesPayload) {
  return buildFeatureCacheKey('summary-notes', userId, notesPayload)
}

async function getCachedNotesSummary(userId, notesPayload, provider) {
  return getOrSetJson(
    getSummaryNotesCacheKey(userId, notesPayload),
    FEATURE_CACHE_TTL.summaryNotes,
    provider
  )
}

module.exports = {
  getCachedNotesSummary,
}
