const { generateSummaryFromNotesImage, generateSummaryFromStudyUploads } = require('../services/gemini')
const { getCachedNotesSummary } = require('../cache')
const { createHistoryEntry } = require('../../history/services/history')
const { sendSummarizeError, sendValidationError } = require('./errorResponse')

async function summarizeNotes(req, res) {
  try {
    const { imageData, mimeType, fileName, uploads, sourceMode } = req.body

    if (!imageData && (!Array.isArray(uploads) || !uploads.length)) {
      return sendValidationError(res, 'Upload at least one image or study file.')
    }

    const notesPayload = Array.isArray(uploads) && uploads.length
      ? {
          uploads,
          sourceMode,
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
        }

    const result = await getCachedNotesSummary(
      req.user._id,
      notesPayload,
      async () =>
        Array.isArray(uploads) && uploads.length
          ? generateSummaryFromStudyUploads(notesPayload)
          : generateSummaryFromNotesImage({ imageData, mimeType, fileName })
    )

    const resolvedSourceType =
      notesPayload.sourceMode === 'photos' ? 'study-photos' : 'study-files'

    const historyEntry = await createHistoryEntry({
      userId: req.user._id,
      sourceType: resolvedSourceType,
      sourceLabel: result.sourceLabel,
      summary: result.summary,
    })

    return res.json({
      success: true,
      sourceType: resolvedSourceType,
      sourceLabel: result.sourceLabel,
      historyId: historyEntry.id,
      summary: result.summary,
    })
  } catch (error) {
    console.error('Summarize notes error:', error)

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
