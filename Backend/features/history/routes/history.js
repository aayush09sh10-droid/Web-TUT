const express = require('express')

const { authenticate } = require('../../auth/middleware/authenticate')
const { clearHistory, deleteHistoryItem, getHistoryItem, listHistory, saveQuizProgress } = require('../controllers')

const router = express.Router()

router.get('/', authenticate, listHistory)
router.get('/:id', authenticate, getHistoryItem)
router.post('/:id/quiz-progress', authenticate, saveQuizProgress)
router.delete('/', authenticate, clearHistory)
router.delete('/:id', authenticate, deleteHistoryItem)

module.exports = router
