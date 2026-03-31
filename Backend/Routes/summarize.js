const express = require('express')
const { authenticate } = require('../features/auth/middleware/authenticate')
const {
  summarizeVideo,
  summarizeNotes,
  generateQuiz,
  generateTeaching,
  answerDoubt,
} = require('../controllers/summarizeController')

const router = express.Router()

router.post('/summarize', authenticate, summarizeVideo)
router.post('/summarize-notes', authenticate, summarizeNotes)
router.post('/quiz', authenticate, generateQuiz)
router.post('/teaching', authenticate, generateTeaching)
router.post('/doubt', authenticate, answerDoubt)

module.exports = router
