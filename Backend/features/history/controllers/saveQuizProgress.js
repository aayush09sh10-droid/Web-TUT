const { updateHistoryEntry } = require('../services/history')

async function saveQuizProgress(req, res) {
  try {
    const { correctCount, totalQuestions, scorePercent, selectedAnswers, wrongQuestions } = req.body

    const updated = await updateHistoryEntry({
      historyId: req.params.id,
      userId: req.user._id,
      updates: {
        quizProgress: {
          correctCount: Number(correctCount) || 0,
          totalQuestions: Number(totalQuestions) || 0,
          scorePercent: Number(scorePercent) || 0,
          selectedAnswers: selectedAnswers && typeof selectedAnswers === 'object' ? selectedAnswers : {},
          wrongQuestions: Array.isArray(wrongQuestions) ? wrongQuestions.filter(Boolean).slice(0, 10) : [],
          submittedAt: Date.now(),
        },
      },
    })

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'History item not found.',
      })
    }

    return res.json({
      success: true,
      item: updated,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to save quiz progress.',
    })
  }
}

module.exports = {
  saveQuizProgress,
}
