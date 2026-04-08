const {
  requestJsonFromGeminiParts,
  sanitiseSummaryShape,
  sanitiseTeachingShape,
} = require('./parser')

function buildTeachingPrompt(summary) {
  return `
You are creating a guided teaching experience from a WebTutor study summary.

Follow these rules strictly:
- Analyze the summary and split it into 4 to 8 meaningful learning topics.
- Each topic should feel like one lesson part or section.
- Write in a warm teacher style that is simple, structured, and easy to study.
- For each topic, include:
  - a short summary
  - why the topic matters
  - a clear teaching lesson
  - 2 to 4 step-by-step learning points
  - helpful notes
  - one practice task
  - one reflection question
- If a topic would be easier to learn with a picture, diagram, flow, cycle, layers, comparison, or process view, include one visualAid object for that topic.
- Only include visualAid when it is truly useful for understanding.
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
      "whyItMatters": "why this topic matters in simple words",
      "lesson": "teacher-style explanation for this topic",
      "steps": [
        "step 1",
        "step 2"
      ],
      "notes": [
        "short note"
      ],
      "practiceTask": "one short practice task",
      "visualAid": {
        "needed": true,
        "title": "short visual title",
        "type": "flow",
        "items": [
          "first item",
          "second item",
          "third item"
        ],
        "caption": "what this visual is showing"
      },
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
