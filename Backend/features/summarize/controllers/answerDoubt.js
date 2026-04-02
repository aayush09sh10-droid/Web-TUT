const { answerDoubtFromSummary } = require('../services/gemini')
const { updateHistoryEntry } = require('../../history/services/history')
const { getOrSetJson } = require('../../../services/cache')
const { FEATURE_CACHE_TTL, getDoubtCacheKey } = require('../services/cache')

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

    const answer = await getOrSetJson(
      getDoubtCacheKey(req.user._id, doubtPayload),
      FEATURE_CACHE_TTL.doubt,
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
