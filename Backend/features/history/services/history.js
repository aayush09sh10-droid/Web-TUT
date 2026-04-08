const mongoose = require('mongoose')

const StudyHistory = require('../models/StudyHistory')
const {
  getCachedHistoryItem,
  getCachedHistoryList,
  getCachedLearningSnapshot,
  invalidateUserHistoryCache,
} = require('../cache/historyCache')

function cleanTopicLabel(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTopics(entry) {
  const topicSet = new Set()

  if (entry?.summary?.title) {
    topicSet.add(cleanTopicLabel(entry.summary.title))
  }

  if (Array.isArray(entry?.summary?.timeline)) {
    entry.summary.timeline.forEach((item) => {
      if (item?.label) {
        topicSet.add(cleanTopicLabel(item.label))
      }
    })
  }

  if (Array.isArray(entry?.summary?.topics)) {
    entry.summary.topics.forEach((topic) => {
      if (topic?.title) {
        topicSet.add(cleanTopicLabel(topic.title))
      }
    })
  }

  if (entry?.quiz?.teaching?.topic) {
    topicSet.add(cleanTopicLabel(entry.quiz.teaching.topic))
  }

  if (Array.isArray(entry?.teaching?.topics)) {
    entry.teaching.topics.forEach((topic) => {
      if (topic?.title) {
        topicSet.add(cleanTopicLabel(topic.title))
      }
    })
  }

  if (Array.isArray(entry?.formula?.sections)) {
    entry.formula.sections.forEach((section) => {
      if (section?.title) {
        topicSet.add(cleanTopicLabel(section.title))
      }
    })
  }

  return Array.from(topicSet).filter(Boolean).slice(0, 8)
}

function serialiseHistoryEntry(entry) {
  return {
    id: String(entry._id),
    url: entry.sourceLabel,
    sourceLabel: entry.sourceLabel,
    sourceType: entry.sourceType,
    timestamp: new Date(entry.updatedAt || entry.createdAt).getTime(),
    result: {
      sourceType: entry.sourceType,
      sourceLabel: entry.sourceLabel,
      historyId: String(entry._id),
      summary: entry.summary,
      quiz: entry.quiz,
      teaching: entry.teaching,
      formula: entry.formula,
      doubt: entry.doubt,
      quizProgress: entry.quizProgress,
    },
  }
}

async function createHistoryEntry({ userId, sourceType, sourceLabel, summary }) {
  const entry = await StudyHistory.create({
    user: userId,
    sourceType,
    sourceLabel,
    summary,
  })

  await invalidateUserHistoryCache(userId, entry._id)
  return serialiseHistoryEntry(entry)
}

async function updateHistoryEntry({ historyId, userId, updates }) {
  if (!historyId || !mongoose.Types.ObjectId.isValid(historyId)) {
    return null
  }

  const entry = await StudyHistory.findOneAndUpdate(
    {
      _id: historyId,
      user: userId,
    },
    {
      $set: updates,
    },
    {
      new: true,
    }
  )

  if (!entry) {
    return null
  }

  await invalidateUserHistoryCache(userId, historyId)
  return serialiseHistoryEntry(entry)
}

async function listHistoryEntries(userId) {
  return getCachedHistoryList(userId, async () => {
    const entries = await StudyHistory.find({ user: userId }).sort({ updatedAt: -1 })
    return entries.map(serialiseHistoryEntry)
  })
}

async function getHistoryEntry(userId, historyId) {
  if (!historyId || !mongoose.Types.ObjectId.isValid(historyId)) {
    return null
  }

  return getCachedHistoryItem(userId, historyId, async () => {
    const entry = await StudyHistory.findOne({
      _id: historyId,
      user: userId,
    })

    return entry ? serialiseHistoryEntry(entry) : null
  })
}

async function deleteHistoryEntry(userId, historyId) {
  if (!historyId || !mongoose.Types.ObjectId.isValid(historyId)) {
    return false
  }

  const result = await StudyHistory.deleteOne({
    _id: historyId,
    user: userId,
  })

  if (result.deletedCount > 0) {
    await invalidateUserHistoryCache(userId, historyId)
  }

  return result.deletedCount > 0
}

async function clearHistoryEntries(userId) {
  await StudyHistory.deleteMany({ user: userId })
  await invalidateUserHistoryCache(userId)
}

async function getLearningSnapshot(userId) {
  return getCachedLearningSnapshot(userId, async () => {
      const entries = await StudyHistory.find({ user: userId }).sort({ updatedAt: -1 }).limit(6)
      const allEntries = await StudyHistory.find({ user: userId }).select(
        'summary quiz teaching formula doubt updatedAt createdAt quizProgress'
      )
      const topicCounts = new Map()

      allEntries.forEach((entry) => {
        extractTopics(entry).forEach((topic) => {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
        })
      })

      const topTopics = Array.from(topicCounts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 8)
        .map(([topic, count]) => ({
          topic,
          count,
        }))

      return {
        totalSummaries: await StudyHistory.countDocuments({ user: userId, summary: { $ne: null } }),
        totalQuizzes: await StudyHistory.countDocuments({ user: userId, quiz: { $ne: null } }),
        totalTeachingSessions: await StudyHistory.countDocuments({ user: userId, teaching: { $ne: null } }),
        totalFormulaSessions: await StudyHistory.countDocuments({ user: userId, formula: { $ne: null } }),
        totalDoubts: await StudyHistory.countDocuments({ user: userId, doubt: { $ne: null } }),
        topTopics,
        recentLearning: entries.map((entry) => ({
          id: String(entry._id),
          title: entry.summary?.title || 'Untitled learning session',
          topics: extractTopics(entry),
          hasQuiz: Boolean(entry.quiz),
          hasTeaching: Boolean(entry.teaching),
          hasFormula: Boolean(entry.formula),
          hasDoubt: Boolean(entry.doubt),
          quizProgress: entry.quizProgress || null,
          updatedAt: new Date(entry.updatedAt || entry.createdAt).getTime(),
        })),
      }
    })
}

module.exports = {
  createHistoryEntry,
  updateHistoryEntry,
  listHistoryEntries,
  getHistoryEntry,
  deleteHistoryEntry,
  clearHistoryEntries,
  getLearningSnapshot,
  invalidateUserHistoryCache,
}
