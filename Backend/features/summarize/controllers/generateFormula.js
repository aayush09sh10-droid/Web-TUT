const { generateFormulaGuideFromSummary } = require('../services/gemini')
const { getCachedFormula } = require('../cache')
const { updateHistoryEntry } = require('../../history/services/history')
const { sendSummarizeError, sendValidationError } = require('./errorResponse')
const { logger, serialiseError } = require('../../../utils/logger')

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
    logger.error('Generate formula error.', serialiseError(error))

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
