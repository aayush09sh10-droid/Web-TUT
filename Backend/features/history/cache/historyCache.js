const { buildCacheKey, deleteMany, getOrSetJson } = require('../../../services/cache')

const HISTORY_CACHE_TTL = {
  list: 30,
  item: 2 * 60,
  learningSnapshot: 5 * 60,
}

function buildKey(...parts) {
  return parts.join(':')
}

function getHistoryListCacheKey(userId) {
  return buildCacheKey(['history', 'list', String(userId || '')])
}

function getHistoryItemCacheKey(userId, historyId) {
  return buildCacheKey(['history', 'item', String(userId || ''), String(historyId || '')])
}

function getLearningSnapshotCacheKey(userId) {
  return buildCacheKey(['history', 'learning-snapshot', String(userId || '')])
}

function getProfileCacheKey(userId) {
  return buildCacheKey(['auth', 'profile', String(userId || '')])
}

async function getCachedHistoryList(userId, provider) {
  return getOrSetJson(getHistoryListCacheKey(userId), HISTORY_CACHE_TTL.list, provider)
}

async function getCachedHistoryItem(userId, historyId, provider) {
  return getOrSetJson(getHistoryItemCacheKey(userId, historyId), HISTORY_CACHE_TTL.item, provider)
}

async function getCachedLearningSnapshot(userId, provider) {
  return getOrSetJson(
    getLearningSnapshotCacheKey(userId),
    HISTORY_CACHE_TTL.learningSnapshot,
    provider
  )
}

// ✅ Smart Invalidation (ONLY what is needed)
async function invalidateUserHistoryCache(userId, historyId = null) {
  const keysToDelete = [
    getHistoryListCacheKey(userId),
    getLearningSnapshotCacheKey(userId), // ✅ ADD THIS 
  ]

  // Only delete specific item if provided
  if (historyId) {
    keysToDelete.push(getHistoryItemCacheKey(userId, historyId))
  }

  await deleteMany(keysToDelete)
  // await invalidateUserHistoryCache(userId, newHistoryId)
}

module.exports = {
  getCachedHistoryList,
  getCachedHistoryItem,
  getCachedLearningSnapshot,
  getProfileCacheKey,
  invalidateUserHistoryCache,
}
