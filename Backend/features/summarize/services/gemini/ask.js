const { requestJsonFromGeminiParts, sanitiseSummaryShape } = require('./parser')
const { GeminiServiceError } = require('./errors')
const { normaliseParagraph } = require('./text')

function buildAskAnythingPrompt(question) {
  return `
You are an AI study assistant.

The student can ask about any topic they want to learn.

Follow these rules strictly:
- Answer the student's topic in a study-friendly way.
- Turn the topic into a proper learning summary, not just a casual reply.
- Keep the language simple and structured.
- Return exactly one short title.
- Create a logical topic flow or timeline.
- Write exactly three short paragraphs.
- Add 3 to 8 topic-wise study parts.
- Make the output suitable for later quiz, teaching path, and formula generation.

Student topic or question:
${question}

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

async function generateSummaryFromQuestion(question) {
  const safeQuestion = normaliseParagraph(question)

  if (!safeQuestion) {
    throw new GeminiServiceError('Please enter a topic or question first.', 400)
  }

  const summary = await requestJsonFromGeminiParts([
    {
      text: buildAskAnythingPrompt(safeQuestion),
    },
  ])

  return {
    summary: sanitiseSummaryShape(summary),
    sourceLabel: `Ask AI: ${safeQuestion}`,
  }
}

module.exports = {
  generateSummaryFromQuestion,
}
