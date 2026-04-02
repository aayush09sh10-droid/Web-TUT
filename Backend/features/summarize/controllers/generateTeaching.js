const { generateTeachingFromSummary } = require('../services/gemini')
const { getCachedTeaching } = require('../cache')
const { updateHistoryEntry } = require('../../history/services/history')

async function generateTeaching(req, res) {
  try {
    const { summary, historyId } = req.body

    if (!summary) {
      return res.status(400).json({
        success: false,
        error: 'Missing `summary` in request body.',
      })
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

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to generate teaching content.',
    })
  }
}

module.exports = {
  generateTeaching,
}
