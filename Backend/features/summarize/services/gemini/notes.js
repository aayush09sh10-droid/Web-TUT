const { requestJsonFromGeminiParts, sanitiseSummaryShape } = require('./parser')
const { GeminiServiceError } = require('./errors')
const { normaliseParagraph } = require('./text')

function buildNotesSummaryPrompt() {
  return `
You are reading a photo of handwritten or typed study notes.

Follow these rules strictly:
- Read the notes carefully from the image.
- Rewrite everything in simple, clean language.
- If the notes are messy or partial, still extract the strongest ideas.
- Return exactly one short title.
- Create a short logical timeline or section flow based on the note topics.
- Write exactly three short paragraphs.
- Paragraph 1: overview of what the notes are about.
- Paragraph 2: core ideas explained simply.
- Paragraph 3: extra insights, revision help, or what to review next.

Return valid JSON only in this shape:
{
  "title": "short meaningful title",
  "timeline": [
    { "timestamp": "Part 1", "label": "Introduction" }
  ],
  "paragraphs": {
    "overview": "short paragraph",
    "coreIdeas": "short paragraph",
    "exploreMore": "short paragraph"
  }
}
`.trim()
}

function sanitiseNotesMimeType(mimeType) {
  const safeType = String(mimeType || '').trim().toLowerCase()

  if (!safeType.startsWith('image/')) {
    throw new GeminiServiceError('Please upload a valid notes image.', 400)
  }

  return safeType
}

async function generateSummaryFromNotesImage({ imageData, mimeType, fileName }) {
  const safeImageData = String(imageData || '').trim()
  const safeMimeType = sanitiseNotesMimeType(mimeType)
  const safeFileName = normaliseParagraph(fileName || 'Notes photo')

  if (!safeImageData) {
    throw new GeminiServiceError('Notes image data is required.', 400)
  }

  const summary = await requestJsonFromGeminiParts([
    { text: buildNotesSummaryPrompt() },
    {
      inlineData: {
        mimeType: safeMimeType,
        data: safeImageData,
      },
    },
  ])

  return {
    summary: sanitiseSummaryShape(summary),
    sourceLabel: `Notes Photo: ${safeFileName}`,
  }
}

module.exports = {
  generateSummaryFromNotesImage,
}
