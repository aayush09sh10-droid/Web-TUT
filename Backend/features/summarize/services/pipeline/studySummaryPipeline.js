const {
  generateSummaryFromNotesImage,
  generateSummaryFromStudyUploads,
} = require('../gemini')

async function runStudySummaryPipeline(payload) {
  const hasUploads = Array.isArray(payload?.uploads) && payload.uploads.length

  if (hasUploads) {
    const result = await generateSummaryFromStudyUploads(payload)
    return {
      sourceLabel: result.sourceLabel,
      strategy: result.strategy || 'study-multipart',
      summary: result.summary,
    }
  }

  const result = await generateSummaryFromNotesImage(payload)
  return {
    sourceLabel: result.sourceLabel,
    strategy: result.strategy || 'study-photo-fast',
    summary: result.summary,
  }
}

module.exports = {
  runStudySummaryPipeline,
}
