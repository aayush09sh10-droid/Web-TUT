const { generateSummaryFromQuestion, generateTeachingFromSummary } = require('../services/gemini')
const { getCachedAskSummary, getCachedTeaching } = require('../cache')
const { createHistoryEntry, updateHistoryEntry } = require('../../history/services/history')
const { sendSummarizeError, sendValidationError } = require('./errorResponse')

async function askAnything(req, res) {
  try {
    const { question } = req.body

    if (!question) {
      return sendValidationError(res, 'Please enter a topic or question first.')
    }

    const result = await getCachedAskSummary(
      req.user._id,
      question,
      async () => generateSummaryFromQuestion(question)
    )

    const teaching = await getCachedTeaching(
      req.user._id,
      result.summary,
      async () => generateTeachingFromSummary(result.summary)
    )

    const historyEntry = await createHistoryEntry({
      userId: req.user._id,
      sourceType: 'ask-ai',
      sourceLabel: result.sourceLabel,
      summary: result.summary,
    })

    await updateHistoryEntry({
      historyId: historyEntry.id,
      userId: req.user._id,
      updates: {
        teaching,
      },
    })

    return res.json({
      success: true,
      sourceType: 'ask-ai',
      sourceLabel: result.sourceLabel,
      historyId: historyEntry.id,
      summary: result.summary,
      teaching,
    })
  } catch (error) {
    console.error('Ask anything error:', error)

    return sendSummarizeError(
      res,
      error,
      'Gemini could not prepare the study answer right now. Please try again.'
    )
  }
}

module.exports = {
  askAnything,
}
