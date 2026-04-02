const { generateTeachingFromSummary } = require('../services/gemini')
const { updateHistoryEntry } = require('../../history/services/history')
const { getOrSetJson } = require('../../../services/cache')
const { FEATURE_CACHE_TTL, getTeachingCacheKey } = require('../services/cache')

async function generateTeaching(req, res) {
  try {
    const { summary, historyId } = req.body

    if (!summary) {
      return res.status(400).json({
        success: false,
        error: 'Missing `summary` in request body.',
      })
    }

    const teaching = await getOrSetJson(
      getTeachingCacheKey(req.user._id, summary),
      FEATURE_CACHE_TTL.teaching,
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

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to generate teaching content.',
    })
  }
}

module.exports = {
  generateTeaching,
}
