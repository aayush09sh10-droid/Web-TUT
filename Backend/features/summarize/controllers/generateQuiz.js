const { generateQuizFromSummary } = require('../services/gemini')
const { getCachedQuiz } = require('../cache')
const { updateHistoryEntry } = require('../../history/services/history')
const { sendSummarizeError, sendValidationError } = require('./errorResponse')

async function generateQuiz(req, res) {
  try {
    const { summary, historyId } = req.body

    if (!summary) {
      return sendValidationError(res, 'Missing `summary` in request body.')
    }

    const quiz = await getCachedQuiz(req.user._id, summary, async () => generateQuizFromSummary(summary))
    await updateHistoryEntry({
      historyId,
      userId: req.user._id,
      updates: {
        quiz,
      },
    })

    return res.json({
      success: true,
      quiz,
    })
  } catch (error) {
    console.error('Generate quiz error:', error)

    return sendSummarizeError(
      res,
      error,
      'Gemini could not generate the quiz right now. Please try again.'
    )
  }
}

module.exports = {
  generateQuiz,
}
