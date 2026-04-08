const { clearHistory } = require('./clearHistory')
const { createSubject } = require('./createSubject')
const { deleteHistoryItem } = require('./deleteHistoryItem')
const { getHistoryItem } = require('./getHistoryItem')
const { addItemToSubject } = require('./addItemToSubject')
const { listHistory } = require('./listHistory')
const { listSubjects } = require('./listSubjects')
const { removeItemFromSubject } = require('./removeItemFromSubject')
const { reorderSubjectItemsController } = require('./reorderSubjectItems')
const { saveQuizProgress } = require('./saveQuizProgress')

module.exports = {
  listHistory,
  getHistoryItem,
  saveQuizProgress,
  deleteHistoryItem,
  clearHistory,
  listSubjects,
  createSubject,
  addItemToSubject,
  removeItemFromSubject,
  reorderSubjectItemsController,
}
