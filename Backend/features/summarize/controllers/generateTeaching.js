const { generateTeachingFromSummary } = require('../services/gemini')
const { getCachedTeaching } = require('../cache')
const { updateHistoryEntry } = require('../../history/services/history')
const { sendSummarizeError, sendValidationError } = require('./errorResponse')
const { logger, serialiseError } = require('../../../utils/logger')

async function generateTeaching(req, res) {
  try {
    const { summary, historyId, forceRegenerate } = req.body
    const userId = req.user?._id || null

    if (!summary) {
      return sendValidationError(res, 'Missing `summary` in request body.')
    }

    const buildTeaching = async () => generateTeachingFromSummary(summary)
    const teaching = forceRegenerate
      ? await buildTeaching()
      : await getCachedTeaching(userId, summary, buildTeaching)

    if (historyId && userId) {
      await updateHistoryEntry({
        historyId,
        userId,
        updates: {
          teaching,
        },
      })
    }

    return res.json({
      success: true,
      teaching,
    })
  } catch (error) {
    logger.error('Generate teaching error.', serialiseError(error))

    return sendSummarizeError(
      res,
      error,
      'Gemini could not generate the teaching path right now. Please try again.'
    )
  }
}

module.exports = {
  generateTeaching,
}
