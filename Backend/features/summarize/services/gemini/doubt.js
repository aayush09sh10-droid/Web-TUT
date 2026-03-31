const {
  requestJsonFromGeminiParts,
  sanitiseDoubtAnswerShape,
  sanitiseSummaryShape,
} = require('./parser')
const { GeminiServiceError } = require('./errors')
const { normaliseParagraph } = require('./text')

function buildDoubtPrompt(summary, question) {
  return `
You are a friendly teacher helping a student understand a YouTube video summary.

Follow these rules strictly:
- Answer only using the summary context below.
- Explain clearly in simple teaching language.
- Be encouraging and helpful.
- Give one short title.
- Give one main explanation.
- Add 2 to 4 simple learning steps.
- End with one short key takeaway.

Summary:
${JSON.stringify(summary, null, 2)}

Student question:
${question}

Return valid JSON only in this shape:
{
  "title": "short title",
  "explanation": "clear teacher-style answer",
  "steps": [
    "simple step"
  ],
  "keyTakeaway": "short takeaway"
}
`.trim()
}

async function answerDoubtFromSummary(summary, question) {
  const sanitisedSummary = sanitiseSummaryShape(summary)
  const safeQuestion = normaliseParagraph(question)

  if (!safeQuestion) {
    throw new GeminiServiceError('Question is required.', 400)
  }

  const answer = await requestJsonFromGeminiParts([
    { text: buildDoubtPrompt(sanitisedSummary, safeQuestion) },
  ])

  return sanitiseDoubtAnswerShape(answer)
}

module.exports = {
  answerDoubtFromSummary,
}
