const { answerDoubtFromSummary } = require('../services/gemini')
const { updateHistoryEntry } = require('../../history/services/history')

async function answerDoubt(req, res) {
  try {
    const { summary, question, historyId } = req.body

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

    const answer = await answerDoubtFromSummary(summary, question)
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
