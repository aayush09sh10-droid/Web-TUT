const { generateFormulaGuideFromSummary } = require('../services/gemini')
const { getCachedFormula } = require('../cache')
const { updateHistoryEntry } = require('../../history/services/history')
const { sendSummarizeError, sendValidationError } = require('./errorResponse')

async function generateFormula(req, res) {
  try {
    const { summary, historyId, forceRegenerate } = req.body

    if (!summary) {
      return sendValidationError(res, 'Missing `summary` in request body.')
    }

    const buildFormula = async () => generateFormulaGuideFromSummary(summary)
    const formula = forceRegenerate
      ? await buildFormula()
      : await getCachedFormula(req.user._id, summary, buildFormula)
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
      'Web-Tut could not generate the formula guide right now. Please try again.'
    )
  }
}

module.exports = {
  generateFormula,
}
