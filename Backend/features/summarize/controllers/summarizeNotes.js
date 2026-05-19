const { getStudySourceFingerprint } = require('../services/sourceFingerprint')
const { getCachedNotesSummary } = require('../cache')
const { runStudySummaryPipeline } = require('../services/pipeline/studySummaryPipeline')
const { createNdjsonStream, wantsNdjsonStream } = require('../services/streaming/ndjsonStream')
const { createRequestProgress } = require('../services/streaming/requestProgress')
const {
  createHistoryEntry,
  updateHistoryEntry,
  findExistingHistoryEntryByFingerprint,
} = require('../../history/services/history')
const { buildSummarizeErrorPayload, sendSummarizeError, sendValidationError } = require('./errorResponse')

async function summarizeNotes(req, res) {
  const stream = wantsNdjsonStream(req) ? createNdjsonStream(res) : null

  try {
    const {
      imageData,
      mimeType,
      fileName,
      uploads,
      sourceMode,
      historyId,
      forceRegenerate,
      studyPrompt = '',
    } = req.body

    const progress = createRequestProgress(req, stream)

    if (!imageData && (!Array.isArray(uploads) || !uploads.length)) {
      return sendValidationError(res, 'Upload at least one image or study file.')
    }

    const notesPayload = Array.isArray(uploads) && uploads.length
      ? {
          uploads,
          sourceMode,
          studyPrompt,
        }
      : {
          uploads: [
            {
              data: imageData,
              mimeType,
              fileName,
            },
          ],
          sourceMode: 'photos',
          studyPrompt,
        }

    const resolvedSourceType =
      notesPayload.sourceMode === 'photos' ? 'study-photos' : 'study-files'
    const sourceFingerprint = getStudySourceFingerprint(notesPayload)

    if (!forceRegenerate && !historyId) {
      const existingEntry = await findExistingHistoryEntryByFingerprint(
        req.user._id,
        resolvedSourceType,
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

    const buildSummary = async () => {
      progress.emit('Reading study materials')
      return runStudySummaryPipeline(
        Array.isArray(uploads) && uploads.length
          ? notesPayload
          : { imageData, mimeType, fileName }
      )
    }

    const result = forceRegenerate
      ? await buildSummary()
      : await getCachedNotesSummary(req.user._id, notesPayload, buildSummary)

    const historyEntry =
      historyId
        ? await updateHistoryEntry({
            historyId,
            userId: req.user._id,
            updates: {
              sourceType: resolvedSourceType,
              sourceLabel: result.sourceLabel,
              sourceFingerprint,
              summary: result.summary,
              quiz: null,
              teaching: null,
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
        sourceType: resolvedSourceType,
        sourceLabel: result.sourceLabel,
        sourceFingerprint,
        summary: result.summary,
      }))

    const payload = {
      success: true,
      jobId: progress.jobId,
      summaryStrategy: result.strategy || 'study-unknown',
      sourceType: resolvedSourceType,
      sourceLabel: result.sourceLabel,
      historyId: resolvedHistoryEntry.id,
      summary: result.summary,
    }

    if (stream) {
      progress.emit('Summary ready')
      return stream.final(payload)
    }

    return res.json(payload)
  } catch (error) {
    console.error('Summarize notes error:', error)

    const fallbackMessage =
      'Web-Tut could not summarize the uploaded study materials right now. Please try again.'

    if (stream) {
      const { payload } = buildSummarizeErrorPayload(error, fallbackMessage)
      return stream.error(payload)
    }

    return sendSummarizeError(res, error, fallbackMessage)
  }
}

module.exports = {
  summarizeNotes,
}
