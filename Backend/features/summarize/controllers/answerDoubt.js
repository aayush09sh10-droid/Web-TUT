const { answerDoubtFromSummary } = require('../services/gemini')
const { getCachedDoubtAnswer } = require('../cache')
const { updateHistoryEntry } = require('../../history/services/history')

async function answerDoubt(req, res) {
  try {
    const { summary, question, historyId, formula, teaching, sourceLabel, sourceType } = req.body

    if (!summary) {
      return res.status(400).json({
        success: false,
        error: 'Missing `summary` in request body.',
      })
    }

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Missing `question` in request body.',
      })
    }

    const doubtPayload = {
      summary,
      teaching,
      formula,
      question,
      sourceLabel,
      sourceType,
    }

    const answer = await getCachedDoubtAnswer(
      req.user._id,
      doubtPayload,
      async () => answerDoubtFromSummary(doubtPayload)
    )

    if (historyId) {
      await updateHistoryEntry({
        historyId,
        userId: req.user._id,
        updates: {
          doubt: {
            question,
            answer,
          },
        },
      })
    }

    return res.json({
      success: true,
      answer,
    })
  } catch (error) {
    console.error('Answer doubt error:', error)

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to answer the doubt.',
    })
  }
}

module.exports = {
  answerDoubt,
}
