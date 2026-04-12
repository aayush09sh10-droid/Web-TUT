const { generateSummaryFromNotesImage, generateSummaryFromStudyUploads } = require('../services/gemini')
const { getStudySourceFingerprint } = require('../services/sourceFingerprint')
const { getCachedNotesSummary } = require('../cache')
const {
  createHistoryEntry,
  updateHistoryEntry,
  findExistingHistoryEntryByFingerprint,
} = require('../../history/services/history')
const { sendSummarizeError, sendValidationError } = require('./errorResponse')
const { logger, serialiseError } = require('../../../utils/logger')

async function summarizeNotes(req, res) {
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

    if (req.user && !forceRegenerate && !historyId) {
      const existingEntry = await findExistingHistoryEntryByFingerprint(
        req.user._id,
        resolvedSourceType,
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

    const buildSummary = async () =>
      Array.isArray(uploads) && uploads.length
        ? generateSummaryFromStudyUploads(notesPayload)
        : generateSummaryFromNotesImage({ imageData, mimeType, fileName })

    const result = forceRegenerate
      ? await buildSummary()
      : req.user
        ? await getCachedNotesSummary(req.user._id, notesPayload, buildSummary)
        : await buildSummary()

    const historyEntry =
      req.user && historyId
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
      (req.user
        ? await createHistoryEntry({
            userId: req.user._id,
            sourceType: resolvedSourceType,
            sourceLabel: result.sourceLabel,
            sourceFingerprint,
            summary: result.summary,
          })
        : null)

    return res.json({
      success: true,
      sourceType: resolvedSourceType,
      sourceLabel: result.sourceLabel,
      historyId: resolvedHistoryEntry?.id || null,
      summary: result.summary,
    })
  } catch (error) {
    logger.error('Summarize notes error.', serialiseError(error))

    return sendSummarizeError(
      res,
      error,
      'Gemini could not summarize the uploaded study materials right now. Please try again.'
    )
  }
}

module.exports = {
  summarizeNotes,
}
