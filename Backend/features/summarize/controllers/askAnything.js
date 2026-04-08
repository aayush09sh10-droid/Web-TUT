const { generateSummaryFromQuestion, generateTeachingFromSummary } = require('../services/gemini')
const { getAskSourceFingerprint } = require('../services/sourceFingerprint')
const { getCachedAskSummary, getCachedTeaching } = require('../cache')
const {
  createHistoryEntry,
  updateHistoryEntry,
  findExistingHistoryEntryByFingerprint,
} = require('../../history/services/history')
const { sendSummarizeError, sendValidationError } = require('./errorResponse')

async function askAnything(req, res) {
  try {
    const {
      question,
      historyId,
      forceRegenerate,
      studyPrompt = '',
    } = req.body

    if (!question) {
      return sendValidationError(res, 'Please enter a topic or question first.')
    }

    const sourceFingerprint = getAskSourceFingerprint(question)

    if (!forceRegenerate && !historyId) {
      const existingEntry = await findExistingHistoryEntryByFingerprint(
        req.user._id,
        'ask-ai',
        sourceFingerprint
      )

      if (existingEntry?.result?.summary) {
        return res.json({
          success: true,
          reusedExisting: true,
          sourceType: existingEntry.sourceType,
          sourceLabel: existingEntry.sourceLabel,
          historyId: existingEntry.id,
          summary: existingEntry.result.summary,
          quiz: existingEntry.result.quiz,
          teaching: existingEntry.result.teaching,
          formula: existingEntry.result.formula,
          doubt: existingEntry.result.doubt,
          quizProgress: existingEntry.result.quizProgress,
        })
      }
    }

    const askPayload = {
      question,
      studyPrompt: String(studyPrompt || '').trim(),
    }

    const buildSummary = async () => generateSummaryFromQuestion(question, {
      studyPrompt,
    })
    const result = forceRegenerate
      ? await buildSummary()
      : await getCachedAskSummary(req.user._id, askPayload, buildSummary)

    const buildTeaching = async () => generateTeachingFromSummary(result.summary)
    const teaching = forceRegenerate
      ? await buildTeaching()
      : await getCachedTeaching(req.user._id, result.summary, buildTeaching)

    const historyEntry =
      historyId
        ? await updateHistoryEntry({
            historyId,
            userId: req.user._id,
            updates: {
              sourceType: 'ask-ai',
              sourceLabel: result.sourceLabel,
              sourceFingerprint,
              summary: result.summary,
              teaching,
              quiz: null,
              formula: null,
              doubt: null,
              quizProgress: null,
            },
          })
        : null

    const resolvedHistoryEntry =
      historyEntry ||
      (await createHistoryEntry({
        userId: req.user._id,
        sourceType: 'ask-ai',
        sourceLabel: result.sourceLabel,
        sourceFingerprint,
        summary: result.summary,
      }))

    if (!historyEntry) {
      await updateHistoryEntry({
        historyId: resolvedHistoryEntry.id,
        userId: req.user._id,
        updates: {
          teaching,
        },
      })
    }

    return res.json({
      success: true,
      sourceType: 'ask-ai',
      sourceLabel: result.sourceLabel,
      historyId: resolvedHistoryEntry.id,
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
