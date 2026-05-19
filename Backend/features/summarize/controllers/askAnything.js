const { getAskSourceFingerprint } = require('../services/sourceFingerprint')
const { getCachedAskSummary } = require('../cache')
const { runAskPipeline } = require('../services/pipeline/askPipeline')
const { createNdjsonStream, wantsNdjsonStream } = require('../services/streaming/ndjsonStream')
const { createRequestProgress } = require('../services/streaming/requestProgress')
const {
  createHistoryEntry,
  updateHistoryEntry,
  findExistingHistoryEntryByFingerprint,
} = require('../../history/services/history')
const { buildSummarizeErrorPayload, sendSummarizeError, sendValidationError } = require('./errorResponse')

async function askAnything(req, res) {
  const stream = wantsNdjsonStream(req) ? createNdjsonStream(res) : null

  try {
    const {
      question,
      historyId,
      forceRegenerate,
      studyPrompt = '',
    } = req.body

    const progress = createRequestProgress(req, stream)

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
        const payload = {
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
        }

        if (stream) {
          return stream.final(payload)
        }

        return res.json(payload)
      }
    }

    const askPayload = {
      question,
      studyPrompt: String(studyPrompt || '').trim(),
    }

    const buildSummary = async () => {
      progress.emit('Thinking about your question')
      return runAskPipeline(question, {
        studyPrompt,
      })
    }
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

    const payload = {
      success: true,
      jobId: progress.jobId,
      summaryStrategy: result.strategy || 'ask-fast',
      sourceType: 'ask-ai',
      sourceLabel: result.sourceLabel,
      historyId: resolvedHistoryEntry.id,
      summary: result.summary,
      teaching: null,
    }

    if (stream) {
      progress.emit('Answer ready')
      return stream.final(payload)
    }

    return res.json(payload)
  } catch (error) {
    console.error('Ask anything error:', error)

    const fallbackMessage = 'Web-Tut could not prepare the study answer right now. Please try again.'

    if (stream) {
      const { payload } = buildSummarizeErrorPayload(error, fallbackMessage)
      return stream.error(payload)
    }

    return sendSummarizeError(res, error, fallbackMessage)
  }
}

module.exports = {
  askAnything,
}
