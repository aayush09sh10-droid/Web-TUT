const {
  requestJsonFromGeminiParts,
  sanitiseDoubtAnswerShape,
  sanitiseSummaryShape,
} = require('./parser')
const { GeminiServiceError } = require('./errors')
const { normaliseParagraph } = require('./text')

function buildDoubtPrompt({ summary, teaching, formula, question, sourceLabel, sourceType }) {
  return `
You are a highly accurate teacher who solves doubts from study material.

Follow these rules strictly:
- Use the provided study context first. Do not invent unsupported facts.
- The student can ask about concepts, formulas, code, or numericals.
- If the question is numerical, solve it step by step and show the final answer clearly.
- If the question is about a formula-lab style problem, use the formula context when available.
- If the question includes or requests code, return a separate code section with visible code and a short explanation of what the code does.
- Keep the answer structured and student-friendly.
- Keep the real-life example short.
- If some information is missing, say what assumption you made in the main body.

Source label:
${sourceLabel || 'Not provided'}

Source type:
${sourceType || 'Not provided'}

Summary context:
${JSON.stringify(summary, null, 2)}

Teaching context:
${JSON.stringify(teaching || null, null, 2)}

Formula context:
${JSON.stringify(formula || null, null, 2)}

Student question:
${question}

Return valid JSON only in this shape:
{
  "title": "short title",
  "concept": "short concept overview",
  "mainBody": "detailed explanation with reasoning and assumptions if needed",
  "conclusion": "short final conclusion",
  "realLifeExample": "short practical example",
  "steps": [
    "simple step"
  ],
  "numerical": {
    "isNumerical": true,
    "formulaUsed": "formula if relevant",
    "knownValues": [
      "value"
    ],
    "steps": [
      {
        "label": "Step 1",
        "detail": "substitute the values"
      }
    ],
    "finalAnswer": "final numerical answer"
  },
  "code": {
    "language": "javascript",
    "snippet": "code here",
    "explanation": "what this code does",
    "notes": [
      "extra code note"
    ]
  },
  "keyTakeaway": "short takeaway"
}
`.trim()
}

async function answerDoubtFromSummary({
  summary,
  teaching,
  formula,
  question,
  sourceLabel,
  sourceType,
}) {
  const sanitisedSummary = sanitiseSummaryShape(summary)
  const safeQuestion = normaliseParagraph(question)

  if (!safeQuestion) {
    throw new GeminiServiceError('Question is required.', 400)
  }

  const answer = await requestJsonFromGeminiParts([
    {
      text: buildDoubtPrompt({
        summary: sanitisedSummary,
        teaching,
        formula,
        question: safeQuestion,
        sourceLabel,
        sourceType,
      }),
    },
  ])

  return sanitiseDoubtAnswerShape(answer)
}

module.exports = {
  answerDoubtFromSummary,
}
