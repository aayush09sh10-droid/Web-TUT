const { generateSummaryFromQuestion } = require('../gemini')

async function runAskPipeline(question, options = {}) {
  const summaryResult = await generateSummaryFromQuestion(question, options)

  return {
    sourceLabel: summaryResult.sourceLabel,
    strategy: summaryResult.strategy || 'ask-fast',
    summary: summaryResult.summary,
  }
}

module.exports = {
  runAskPipeline,
}
