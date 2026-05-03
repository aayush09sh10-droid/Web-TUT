const { generateQuizFromSummary } = require('../services/gemini')
const { getCachedQuiz } = require('../cache')
const { updateHistoryEntry } = require('../../history/services/history')
const { sendSummarizeError, sendValidationError } = require('./errorResponse')

async function generateQuiz(req, res) {
  try {
    const { summary, historyId, forceRegenerate } = req.body

    if (!summary) {
      return sendValidationError(res, 'Missing `summary` in request body.')
    }

    const buildQuiz = async () => generateQuizFromSummary(summary)
    const quiz = forceRegenerate
      ? await buildQuiz()
      : await getCachedQuiz(req.user._id, summary, buildQuiz)
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
      'Web-Tut could not generate the quiz right now. Please try again.'
    )
  }
}

module.exports = {
  generateQuiz,
}
