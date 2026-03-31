const { clearHistory } = require('./clearHistory')
const { deleteHistoryItem } = require('./deleteHistoryItem')
const { getHistoryItem } = require('./getHistoryItem')
const { listHistory } = require('./listHistory')
const { saveQuizProgress } = require('./saveQuizProgress')

module.exports = {
  listHistory,
  getHistoryItem,
  saveQuizProgress,
  deleteHistoryItem,
  clearHistory,
}
