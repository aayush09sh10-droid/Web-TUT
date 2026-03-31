const { GeminiServiceError } = require('./errors')
const { answerDoubtFromSummary } = require('./doubt')
const { generateFormulaGuideFromSummary } = require('./formula')
const { generateSummaryFromNotesImage } = require('./notes')
const { generateQuizFromSummary } = require('./quiz')
const { generateSummaryFromAudioChunks } = require('./summary')
const { generateTeachingFromSummary } = require('./teaching')

module.exports = {
  generateSummaryFromAudioChunks,
  generateSummaryFromNotesImage,
  generateQuizFromSummary,
  generateTeachingFromSummary,
  generateFormulaGuideFromSummary,
  answerDoubtFromSummary,
  GeminiServiceError,
}
