const { getAskSourceFingerprint } = require('../services/sourceFingerprint')
const { getCachedAskSummary } = require('../cache')
const { runAskPipeline } = require('../services/pipeline/askPipeline')
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
          summaryStrategy: 'history-reused',
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

    const buildSummary = async () =>
      runAskPipeline(question, {
        studyPrompt,
      })
    const result = forceRegenerate
      ? await buildSummary()
      : await getCachedAskSummary(req.user._id, askPayload, buildSummary)

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
              teaching: null,
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
      // Teaching is intentionally generated on demand to keep the first answer fast.
    }

    return res.json({
      success: true,
      summaryStrategy: result.strategy || 'ask-fast',
      sourceType: 'ask-ai',
      sourceLabel: result.sourceLabel,
      historyId: resolvedHistoryEntry.id,
      summary: result.summary,
      teaching: null,
    })
  } catch (error) {
    console.error('Ask anything error:', error)

    return sendSummarizeError(
      res,
      error,
      'Web-Tut could not prepare the study answer right now. Please try again.'
    )
  }
}

module.exports = {
  askAnything,
}
