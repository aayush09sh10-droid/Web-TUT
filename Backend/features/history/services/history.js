const mongoose = require('mongoose')

const StudyHistory = require('../models/StudyHistory')
const SubjectCollection = require('../models/SubjectCollection')
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
    sourceFingerprint: entry.sourceFingerprint || '',
    timestamp: new Date(entry.updatedAt || entry.createdAt).getTime(),
    result: {
      sourceType: entry.sourceType,
      sourceLabel: entry.sourceLabel,
      historyId: String(entry._id),
      sourceFingerprint: entry.sourceFingerprint || '',
      summary: entry.summary,
      quiz: entry.quiz,
      teaching: entry.teaching,
      formula: entry.formula,
      doubt: entry.doubt,
      quizProgress: entry.quizProgress,
    },
  }
}

function serialiseSubjectCollection(collection, historyEntries = []) {
  const entryMap = new Map(historyEntries.map((entry) => [String(entry.id), entry]))
  const orderedItems = collection.itemIds
    .map((itemId) => entryMap.get(String(itemId)))
    .filter(Boolean)

  return {
    id: String(collection._id),
    name: collection.name,
    itemIds: collection.itemIds.map((itemId) => String(itemId)),
    items: orderedItems,
    updatedAt: new Date(collection.updatedAt || collection.createdAt).getTime(),
    createdAt: new Date(collection.createdAt).getTime(),
  }
}

async function createHistoryEntry({ userId, sourceType, sourceLabel, sourceFingerprint = '', summary }) {
  const entry = await StudyHistory.create({
    user: userId,
    sourceType,
    sourceLabel,
    sourceFingerprint,
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

async function findExistingHistoryEntryByFingerprint(userId, sourceType, sourceFingerprint) {
  if (!sourceFingerprint) {
    return null
  }

  const entry = await StudyHistory.findOne({
    user: userId,
    sourceType,
    sourceFingerprint,
  }).sort({ updatedAt: -1 })

  return entry ? serialiseHistoryEntry(entry) : null
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
    await SubjectCollection.updateMany(
      { user: userId },
      { $pull: { itemIds: new mongoose.Types.ObjectId(historyId) } }
    )
    await invalidateUserHistoryCache(userId, historyId)
  }

  return result.deletedCount > 0
}

async function clearHistoryEntries(userId) {
  await StudyHistory.deleteMany({ user: userId })
  await SubjectCollection.updateMany({ user: userId }, { $set: { itemIds: [] } })
  await invalidateUserHistoryCache(userId)
}

async function listSubjectCollections(userId) {
  const [collections, entries] = await Promise.all([
    SubjectCollection.find({ user: userId }).sort({ updatedAt: -1 }),
    listHistoryEntries(userId),
  ])

  return collections.map((collection) => serialiseSubjectCollection(collection, entries))
}

async function createSubjectCollection(userId, name) {
  const cleanName = cleanTopicLabel(name)

  if (!cleanName) {
    const error = new Error('Please enter a subject name.')
    error.statusCode = 400
    throw error
  }

  let collection

  try {
    collection = await SubjectCollection.create({
      user: userId,
      name: cleanName,
      itemIds: [],
    })
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await SubjectCollection.findOne({ user: userId, name: cleanName })
      if (existing) {
        return serialiseSubjectCollection(existing, await listHistoryEntries(userId))
      }
    }

    throw error
  }

  return serialiseSubjectCollection(collection, await listHistoryEntries(userId))
}

async function addHistoryItemToSubject(userId, subjectId, historyId) {
  if (!subjectId || !mongoose.Types.ObjectId.isValid(subjectId)) {
    const error = new Error('Invalid subject id.')
    error.statusCode = 400
    throw error
  }

  if (!historyId || !mongoose.Types.ObjectId.isValid(historyId)) {
    const error = new Error('Invalid learning item id.')
    error.statusCode = 400
    throw error
  }

  const historyEntry = await StudyHistory.findOne({
    _id: historyId,
    user: userId,
  })

  if (!historyEntry) {
    const error = new Error('Learning item not found.')
    error.statusCode = 404
    throw error
  }

  const collection = await SubjectCollection.findOne({
    _id: subjectId,
    user: userId,
  })

  if (!collection) {
    const error = new Error('Subject not found.')
    error.statusCode = 404
    throw error
  }

  const nextItemIds = collection.itemIds
    .map((itemId) => String(itemId))
    .filter((itemId) => itemId !== historyId)
    .concat(historyId)
    .map((itemId) => new mongoose.Types.ObjectId(itemId))

  collection.itemIds = nextItemIds
  await collection.save()

  return serialiseSubjectCollection(collection, await listHistoryEntries(userId))
}

async function removeHistoryItemFromSubject(userId, subjectId, historyId) {
  if (!subjectId || !mongoose.Types.ObjectId.isValid(subjectId)) {
    const error = new Error('Invalid subject id.')
    error.statusCode = 400
    throw error
  }

  if (!historyId || !mongoose.Types.ObjectId.isValid(historyId)) {
    const error = new Error('Invalid learning item id.')
    error.statusCode = 400
    throw error
  }

  const collection = await SubjectCollection.findOneAndUpdate(
    { _id: subjectId, user: userId },
    { $pull: { itemIds: new mongoose.Types.ObjectId(historyId) } },
    { new: true }
  )

  if (!collection) {
    const error = new Error('Subject not found.')
    error.statusCode = 404
    throw error
  }

  return serialiseSubjectCollection(collection, await listHistoryEntries(userId))
}

async function reorderSubjectItems(userId, subjectId, itemIds = []) {
  if (!subjectId || !mongoose.Types.ObjectId.isValid(subjectId)) {
    const error = new Error('Invalid subject id.')
    error.statusCode = 400
    throw error
  }

  const collection = await SubjectCollection.findOne({ _id: subjectId, user: userId })

  if (!collection) {
    const error = new Error('Subject not found.')
    error.statusCode = 404
    throw error
  }

  const uniqueRequestedIds = Array.from(
    new Set(
      (Array.isArray(itemIds) ? itemIds : []).filter((itemId) => mongoose.Types.ObjectId.isValid(itemId))
    )
  )

  const currentIds = collection.itemIds.map((itemId) => String(itemId))
  const reorderedIds = uniqueRequestedIds.filter((itemId) => currentIds.includes(itemId))
  const missingIds = currentIds.filter((itemId) => !reorderedIds.includes(itemId))

  collection.itemIds = [...reorderedIds, ...missingIds].map((itemId) => new mongoose.Types.ObjectId(itemId))
  await collection.save()

  return serialiseSubjectCollection(collection, await listHistoryEntries(userId))
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
  findExistingHistoryEntryByFingerprint,
  deleteHistoryEntry,
  clearHistoryEntries,
  getLearningSnapshot,
  invalidateUserHistoryCache,
  listSubjectCollections,
  createSubjectCollection,
  addHistoryItemToSubject,
  removeHistoryItemFromSubject,
  reorderSubjectItems,
}
