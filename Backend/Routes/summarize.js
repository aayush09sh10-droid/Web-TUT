const express = require('express')
const { summarizeVideo } = require('../controllers/summarizeController')

const router = express.Router()

router.post('/summarize', summarizeVideo)

module.exports = router
