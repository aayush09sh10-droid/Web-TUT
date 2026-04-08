const { generateTeachingFromSummary } = require('../services/gemini')
const { getCachedTeaching } = require('../cache')
const { updateHistoryEntry } = require('../../history/services/history')
const { sendSummarizeError, sendValidationError } = require('./errorResponse')

async function generateTeaching(req, res) {
  try {
    const { summary, historyId } = req.body

    if (!summary) {
      return sendValidationError(res, 'Missing `summary` in request body.')
    }

    const teaching = await getCachedTeaching(
      req.user._id,
      summary,
      async () => generateTeachingFromSummary(summary)
    )
    await updateHistoryEntry({
      historyId,
      userId: req.user._id,
      updates: {
        teaching,
      },
    })

    return res.json({
      success: true,
      teaching,
    })
  } catch (error) {
    console.error('Generate teaching error:', error)

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
