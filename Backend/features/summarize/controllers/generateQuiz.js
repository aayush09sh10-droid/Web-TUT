const { generateQuizFromSummary } = require('../services/gemini')
const { getCachedQuiz } = require('../cache')
const { updateHistoryEntry } = require('../../history/services/history')
const { sendSummarizeError, sendValidationError } = require('./errorResponse')
const { logger, serialiseError } = require('../../../utils/logger')

async function generateQuiz(req, res) {
  try {
    const { summary, historyId, forceRegenerate } = req.body
    const userId = req.user?._id || null

    if (!summary) {
      return sendValidationError(res, 'Missing `summary` in request body.')
    }

    const buildQuiz = async () => generateQuizFromSummary(summary)
    const quiz = forceRegenerate
      ? await buildQuiz()
      : await getCachedQuiz(userId, summary, buildQuiz)

    if (historyId && userId) {
      await updateHistoryEntry({
        historyId,
        userId,
        updates: {
          quiz,
        },
      })
    }

    return res.json({
      success: true,
      quiz,
    })
  } catch (error) {
    logger.error('Generate quiz error.', serialiseError(error))

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
