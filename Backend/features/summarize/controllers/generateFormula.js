const { generateFormulaGuideFromSummary } = require('../services/gemini')
const { getCachedFormula } = require('../cache')
const { updateHistoryEntry } = require('../../history/services/history')
const { sendSummarizeError, sendValidationError } = require('./errorResponse')

async function generateFormula(req, res) {
  try {
    const { summary, historyId } = req.body

    if (!summary) {
      return sendValidationError(res, 'Missing `summary` in request body.')
    }

    const formula = await getCachedFormula(
      req.user._id,
      summary,
      async () => generateFormulaGuideFromSummary(summary)
    )
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

    return sendSummarizeError(
      res,
      error,
      'Gemini could not generate the formula guide right now. Please try again.'
    )
  }
}

module.exports = {
  generateFormula,
}
