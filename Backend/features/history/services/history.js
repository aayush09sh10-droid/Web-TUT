const mongoose = require('mongoose')

const StudyHistory = require('../models/StudyHistory')

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
      doubt: entry.doubt,
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

  return entry ? serialiseHistoryEntry(entry) : null
}

async function listHistoryEntries(userId) {
  const entries = await StudyHistory.find({ user: userId }).sort({ updatedAt: -1 })
  return entries.map(serialiseHistoryEntry)
}

async function deleteHistoryEntry(userId, historyId) {
  if (!historyId || !mongoose.Types.ObjectId.isValid(historyId)) {
    return false
  }

  const result = await StudyHistory.deleteOne({
    _id: historyId,
    user: userId,
  })

  return result.deletedCount > 0
}

async function clearHistoryEntries(userId) {
  await StudyHistory.deleteMany({ user: userId })
}

module.exports = {
  createHistoryEntry,
  updateHistoryEntry,
  listHistoryEntries,
  deleteHistoryEntry,
  clearHistoryEntries,
}
