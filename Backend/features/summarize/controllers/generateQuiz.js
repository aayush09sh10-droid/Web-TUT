const { generateQuizFromSummary } = require('../services/gemini')
const { updateHistoryEntry } = require('../../history/services/history')

async function generateQuiz(req, res) {
  try {
    const { summary, historyId } = req.body

    if (!summary) {
      return res.status(400).json({
        success: false,
        error: 'Missing `summary` in request body.',
      })
    }

    const quiz = await generateQuizFromSummary(summary)
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

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to generate quiz.',
    })
  }
}

module.exports = {
  generateQuiz,
}
