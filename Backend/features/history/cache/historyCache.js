const { buildCacheKey, deleteMany, getOrSetJson } = require('../../../services/cache')

const HISTORY_CACHE_TTL = {
  list: 2 * 60,
  item: 2 * 60,
  learningSnapshot: 3 * 60,
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

async function invalidateUserHistoryCache(userId, historyId) {
  await deleteMany([
    getHistoryListCacheKey(userId),
    getLearningSnapshotCacheKey(userId),
    getProfileCacheKey(userId),
    historyId ? getHistoryItemCacheKey(userId, historyId) : null,
  ])
}

module.exports = {
  getCachedHistoryList,
  getCachedHistoryItem,
  getCachedLearningSnapshot,
  getProfileCacheKey,
  invalidateUserHistoryCache,
}
