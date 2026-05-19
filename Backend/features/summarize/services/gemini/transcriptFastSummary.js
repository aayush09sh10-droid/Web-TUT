const { buildFallbackTimeline, requestJsonFromGeminiParts, sanitiseSummaryShape } = require('./parser')
const { formatTimestamp, normaliseParagraph } = require('./text')

function buildLearningPreferencesBlock(options = {}) {
  const studyPrompt = normaliseParagraph(options.studyPrompt)

  if (!studyPrompt) {
    return ''
  }

  return `
Student preferences:
- Summary instructions: ${studyPrompt}
- Follow these instructions while keeping the summary accurate, concise, and easy to study.
`.trim()
}

function buildFastTranscriptPrompt(transcriptText, durationInSeconds, options = {}) {
  const preferencesBlock = buildLearningPreferencesBlock(options)

  return `
You are creating a fast, high-quality study summary from a YouTube transcript.

Rules:
- Rewrite in your own words.
- Remove filler words, subtitle noise, and repetition.
- Keep the language simple and clear.
- Focus on the ideas that matter most for learning.
- Write exactly three short paragraphs.
- Create short topic sections and a short timeline.

Video duration hint: ${formatTimestamp(durationInSeconds || 0)}

${preferencesBlock ? `${preferencesBlock}\n` : ''}

Transcript:
${transcriptText}

Return valid JSON only in this shape:
{
  "title": "short meaningful title",
  "timeline": [
    { "timestamp": "00:00", "label": "Introduction" }
  ],
  "paragraphs": {
    "overview": "short paragraph",
    "coreIdeas": "short paragraph",
    "exploreMore": "short paragraph"
  },
  "topics": [
    {
      "title": "topic title",
      "summary": "short topic explanation",
      "keyPoints": [
        "short point"
      ]
    }
  ]
}
`.trim()
}

async function generateFastSummaryFromTranscript(transcriptText, options = {}) {
  const safeTranscript = normaliseParagraph(transcriptText)
  const durationInSeconds = Number(options.durationInSeconds || 0)
  const finalSummary = await requestJsonFromGeminiParts([
    { text: buildFastTranscriptPrompt(safeTranscript, durationInSeconds, options) },
  ])

  const sanitised = sanitiseSummaryShape(finalSummary)

  if (!sanitised.timeline.length) {
    sanitised.timeline = buildFallbackTimeline([], durationInSeconds)
  }

  return sanitised
}

module.exports = {
  generateFastSummaryFromTranscript,
}
