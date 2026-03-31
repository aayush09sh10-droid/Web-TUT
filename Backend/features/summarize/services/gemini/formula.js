const {
  requestJsonFromGeminiParts,
  sanitiseFormulaShape,
  sanitiseSummaryShape,
} = require('./parser')

function buildFormulaPrompt(summary) {
  return `
You are creating a focused formula learning guide from a study summary.

Follow these rules strictly:
- First decide whether formulas, equations, rules, or calculation patterns are important in this topic.
- If formulas are not important, still return one short section explaining that the topic is concept-based.
- If formulas are important, divide the guide into 2 to 6 sections depending on the size and importance of the topic.
- Each section should feel like one formula lesson part.
- For every section include a clear formula name, the formula itself, when to use it, a simple explanation, and 1 to 3 practice questions.
- Practice questions should be for applying the formula, not just memorizing it.
- Write in simple teacher style for students.

Use this summary:
${JSON.stringify(summary, null, 2)}

Return valid JSON only in this shape:
{
  "title": "short formula guide title",
  "intro": "short introduction",
  "sections": [
    {
      "title": "part title",
      "formulaName": "formula name",
      "formula": "actual formula or rule",
      "importance": "why this formula matters",
      "whenToUse": "when to apply it",
      "explanation": "simple explanation",
      "practiceQuestions": [
        "question"
      ]
    }
  ]
}
`.trim()
}

async function generateFormulaGuideFromSummary(summary) {
  const sanitisedSummary = sanitiseSummaryShape(summary)
  const formula = await requestJsonFromGeminiParts([{ text: buildFormulaPrompt(sanitisedSummary) }])
  return sanitiseFormulaShape(formula)
}

module.exports = {
  generateFormulaGuideFromSummary,
}
