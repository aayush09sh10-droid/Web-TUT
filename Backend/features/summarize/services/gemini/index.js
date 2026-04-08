const { GeminiServiceError } = require('./errors')
const { generateSummaryFromQuestion } = require('./ask')
const { answerDoubtFromSummary } = require('./doubt')
const { generateFormulaGuideFromSummary } = require('./formula')
const { generateSummaryFromNotesImage, generateSummaryFromStudyUploads } = require('./notes')
const { generateQuizFromSummary } = require('./quiz')
const { generateSummaryFromAudioChunks } = require('./summary')
const { generateTeachingFromSummary } = require('./teaching')

module.exports = {
  generateSummaryFromAudioChunks,
  generateSummaryFromQuestion,
  generateSummaryFromNotesImage,
  generateSummaryFromStudyUploads,
  generateQuizFromSummary,
  generateTeachingFromSummary,
  generateFormulaGuideFromSummary,
  answerDoubtFromSummary,
  GeminiServiceError,
}
