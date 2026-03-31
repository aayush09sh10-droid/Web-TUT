const { requestJsonFromGeminiParts, sanitiseQuizShape, sanitiseSummaryShape } = require('./parser')

function buildQuizPrompt(summary) {
  return `
You are creating a short multiple-choice quiz from a YouTube video summary.

Follow these rules strictly:
- Use only the information provided in the summary.
- Rewrite everything in clear, simple language.
- Create exactly 5 multiple-choice questions.
- Each question must have exactly 4 options.
- Only one option can be correct.
- Provide the correct option using a zero-based "answerIndex".
- Add a short explanation for why the answer is correct.
- Add a short teaching section after the quiz to help the learner understand the topic better.

Use this summary:
${JSON.stringify(summary, null, 2)}

Return valid JSON only in this shape:
{
  "title": "short quiz title",
  "questions": [
    {
      "question": "What is ...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "short explanation"
    }
  ],
  "teaching": {
    "topic": "topic name",
    "explanation": "short teacher-style explanation of the topic",
    "keyTakeaways": [
      "important point"
    ],
    "studyTip": "short practical study advice"
  }
}
`.trim()
}

async function generateQuizFromSummary(summary) {
  const sanitisedSummary = sanitiseSummaryShape(summary)
  const quiz = await requestJsonFromGeminiParts([{ text: buildQuizPrompt(sanitisedSummary) }])
  return sanitiseQuizShape(quiz)
}

module.exports = {
  generateQuizFromSummary,
}
