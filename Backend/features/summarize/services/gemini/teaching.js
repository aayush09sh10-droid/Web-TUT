const {
  requestJsonFromGeminiParts,
  sanitiseSummaryShape,
  sanitiseTeachingShape,
} = require('./parser')

function buildTeachingPrompt(summary) {
  return `
You are creating a guided teaching experience from a YouTube video summary.

Follow these rules strictly:
- Analyze the summary and split it into 3 to 6 meaningful learning topics.
- Each topic should feel like one lesson part or section.
- Write in a warm teacher style that is simple, structured, and easy to study.
- For each topic, include a short summary, a teaching lesson, helpful notes, and one reflection question.
- Make the lessons readable for a student who wants to revise and take notes.

Use this summary:
${JSON.stringify(summary, null, 2)}

Return valid JSON only in this shape:
{
  "title": "short teaching title",
  "intro": "short introduction to the learning path",
  "topics": [
    {
      "title": "topic name",
      "summary": "one short summary line",
      "lesson": "teacher-style explanation for this topic",
      "notes": [
        "short note"
      ],
      "reflectionQuestion": "one short self-check question"
    }
  ]
}
`.trim()
}

async function generateTeachingFromSummary(summary) {
  const sanitisedSummary = sanitiseSummaryShape(summary)
  const teaching = await requestJsonFromGeminiParts([{ text: buildTeachingPrompt(sanitisedSummary) }])
  return sanitiseTeachingShape(teaching)
}

module.exports = {
  generateTeachingFromSummary,
}
