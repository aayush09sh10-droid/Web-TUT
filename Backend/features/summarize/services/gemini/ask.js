const { requestJsonFromGeminiParts, sanitiseSummaryShape } = require('./parser')
const { GeminiServiceError } = require('./errors')
const { normaliseParagraph } = require('./text')

function buildAskAnythingPrompt(question, options = {}) {
  return `
You are WebTutor AI.

The student can ask about anything they want to know, research, understand, compare, or generate.

Follow these rules strictly:
- Treat the student's main prompt as the full instruction.
- Answer in a rich, helpful, research-friendly way while still keeping it structured.
- If the student asks for explanation, comparison, research, notes, teaching path, quiz direction, formula focus, or visual ideas, reflect that in the result.
- Turn the request into a proper WebTutor response, not just a casual reply.
- Keep the language clear, useful, and structured.
- Return exactly one short title.
- Create a logical topic flow or timeline.
- Write exactly three short paragraphs.
- Add 3 to 8 topic-wise study parts.
- Make the output suitable for later quiz, teaching path, and formula generation.
- If the student asks for a visual or image-style part, make the answer suitable for a later visual study guide.

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

async function generateSummaryFromQuestion(question, options = {}) {
  const safeQuestion = normaliseParagraph(question)

  if (!safeQuestion) {
    throw new GeminiServiceError('Please enter a topic or question first.', 400)
  }

  const summary = await requestJsonFromGeminiParts([
    {
      text: buildAskAnythingPrompt(safeQuestion, options),
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
