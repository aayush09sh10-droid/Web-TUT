const { generateFormulaGuideFromSummary } = require('../services/gemini')
const { updateHistoryEntry } = require('../../history/services/history')

async function generateFormula(req, res) {
  try {
    const { summary, historyId } = req.body

    if (!summary) {
      return res.status(400).json({
        success: false,
        error: 'Missing `summary` in request body.',
      })
    }

    const formula = await generateFormulaGuideFromSummary(summary)
    await updateHistoryEntry({
      historyId,
      userId: req.user._id,
      updates: {
        formula,
      },
    })

    return res.json({
      success: true,
      formula,
    })
  } catch (error) {
    console.error('Generate formula error:', error)

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to generate formula guide.',
    })
  }
}

module.exports = {
  generateFormula,
}
