const express = require('express')
const { attachAuthIfPresent } = require('../features/auth/middleware/attachAuthIfPresent')
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

router.post('/summarize', attachAuthIfPresent, summarizeVideo)
router.post('/summarize-notes', attachAuthIfPresent, summarizeNotes)
router.post('/ask-anything', attachAuthIfPresent, askAnything)
router.post('/quiz', attachAuthIfPresent, generateQuiz)
router.post('/teaching', attachAuthIfPresent, generateTeaching)
router.post('/formula', attachAuthIfPresent, generateFormula)
router.post('/doubt', attachAuthIfPresent, answerDoubt)

module.exports = router
