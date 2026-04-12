const { answerDoubtFromSummary } = require('../services/gemini')
const { getCachedDoubtAnswer } = require('../cache')
const { updateHistoryEntry } = require('../../history/services/history')
const { sendSummarizeError, sendValidationError } = require('./errorResponse')
const { logger, serialiseError } = require('../../../utils/logger')

async function answerDoubt(req, res) {
  try {
    const { summary, question, historyId, formula, teaching, sourceLabel, sourceType, forceRegenerate } = req.body

    if (!summary) {
      return sendValidationError(res, 'Missing `summary` in request body.')
    }

    if (!question) {
      return sendValidationError(res, 'Missing `question` in request body.')
    }

    const doubtPayload = {
      summary,
      teaching,
      formula,
      question,
      sourceLabel,
      sourceType,
    }

    const buildDoubtAnswer = async () => answerDoubtFromSummary(doubtPayload)
    const answer = forceRegenerate
      ? await buildDoubtAnswer()
      : await getCachedDoubtAnswer(req.user._id, doubtPayload, buildDoubtAnswer)

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
    logger.error('Answer doubt error.', serialiseError(error))

    return sendSummarizeError(
      res,
      error,
      'Gemini could not answer this doubt right now. Please try again.'
    )
  }
}

module.exports = {
  answerDoubt,
}
