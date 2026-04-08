const express = require('express')
const { authenticate } = require('../features/auth/middleware/authenticate')
const {
  summarizeVideo,
  summarizeNotes,
  askAnything,
  generateQuiz,
  generateTeaching,
  generateFormula,
  answerDoubt,
} = require('../controllers/summarizeController')

const router = express.Router()

router.post('/summarize', authenticate, summarizeVideo)
router.post('/summarize-notes', authenticate, summarizeNotes)
router.post('/ask-anything', authenticate, askAnything)
router.post('/quiz', authenticate, generateQuiz)
router.post('/teaching', authenticate, generateTeaching)
router.post('/formula', authenticate, generateFormula)
router.post('/doubt', authenticate, answerDoubt)

module.exports = router
