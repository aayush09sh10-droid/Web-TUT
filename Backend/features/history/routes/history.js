const express = require('express')

const { authenticate } = require('../../auth/middleware/authenticate')
const { clearHistory, deleteHistoryItem, listHistory } = require('../controllers')

const router = express.Router()

router.get('/', authenticate, listHistory)
router.delete('/', authenticate, clearHistory)
router.delete('/:id', authenticate, deleteHistoryItem)

module.exports = router
