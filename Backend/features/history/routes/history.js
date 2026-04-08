const express = require('express')

const { authenticate } = require('../../auth/middleware/authenticate')
const {
  addItemToSubject,
  clearHistory,
  createSubject,
  deleteHistoryItem,
  getHistoryItem,
  listHistory,
  listSubjects,
  removeItemFromSubject,
  reorderSubjectItemsController,
  saveQuizProgress,
} = require('../controllers')

const router = express.Router()

router.get('/', authenticate, listHistory)
router.get('/subjects', authenticate, listSubjects)
router.post('/subjects', authenticate, createSubject)
router.post('/subjects/:id/items', authenticate, addItemToSubject)
router.patch('/subjects/:id/items/reorder', authenticate, reorderSubjectItemsController)
router.delete('/subjects/:id/items/:historyId', authenticate, removeItemFromSubject)
router.get('/:id', authenticate, getHistoryItem)
router.post('/:id/quiz-progress', authenticate, saveQuizProgress)
router.delete('/', authenticate, clearHistory)
router.delete('/:id', authenticate, deleteHistoryItem)

module.exports = router
