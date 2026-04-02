const { generateSummaryFromNotesImage } = require('../services/gemini')
const { getCachedNotesSummary } = require('../cache')
const { createHistoryEntry } = require('../../history/services/history')

async function summarizeNotes(req, res) {
  try {
    const { imageData, mimeType, fileName } = req.body

    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: 'Missing `imageData` in request body.',
      })
    }

    const notesPayload = {
      imageData,
      mimeType,
      fileName,
    }

    const result = await getCachedNotesSummary(
      req.user._id,
      notesPayload,
      async () => generateSummaryFromNotesImage(notesPayload)
    )

    const historyEntry = await createHistoryEntry({
      userId: req.user._id,
      sourceType: 'notes-image',
      sourceLabel: result.sourceLabel,
      summary: result.summary,
    })

    return res.json({
      success: true,
      sourceType: 'notes-image',
      sourceLabel: result.sourceLabel,
      historyId: historyEntry.id,
      summary: result.summary,
    })
  } catch (error) {
    console.error('Summarize notes error:', error)

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to summarize the notes image.',
    })
  }
}

module.exports = {
  summarizeNotes,
}
