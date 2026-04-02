const { buildCacheKey, hashPayload } = require('../../../services/cache')

const FEATURE_CACHE_TTL = {
  summaryVideo: 60 * 60,
  summaryNotes: 60 * 60,
  quiz: 60 * 60,
  teaching: 60 * 60,
  formula: 60 * 60,
  doubt: 30 * 60,
}

function normaliseUserId(userId) {
  return String(userId || '').trim()
}

function getVideoSummaryCacheKey(userId, url) {
  return buildCacheKey([
    'feature',
    'summary-video',
    normaliseUserId(userId),
    hashPayload({ url }),
  ])
}

function getNotesSummaryCacheKey(userId, payload) {
  return buildCacheKey([
    'feature',
    'summary-notes',
    normaliseUserId(userId),
    hashPayload(payload),
  ])
}

function getQuizCacheKey(userId, summary) {
  return buildCacheKey(['feature', 'quiz', normaliseUserId(userId), hashPayload(summary)])
}

function getTeachingCacheKey(userId, summary) {
  return buildCacheKey(['feature', 'teaching', normaliseUserId(userId), hashPayload(summary)])
}

function getFormulaCacheKey(userId, summary) {
  return buildCacheKey(['feature', 'formula', normaliseUserId(userId), hashPayload(summary)])
}

function getDoubtCacheKey(userId, payload) {
  return buildCacheKey(['feature', 'doubt', normaliseUserId(userId), hashPayload(payload)])
}

module.exports = {
  FEATURE_CACHE_TTL,
  getVideoSummaryCacheKey,
  getNotesSummaryCacheKey,
  getQuizCacheKey,
  getTeachingCacheKey,
  getFormulaCacheKey,
  getDoubtCacheKey,
}
