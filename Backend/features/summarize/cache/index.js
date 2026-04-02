const { getCachedDoubtAnswer } = require('./doubtCache')
const { getCachedFormula } = require('./formulaCache')
const { getCachedQuiz } = require('./quizCache')
const { getCachedNotesSummary } = require('./summaryNotesCache')
const { getCachedVideoSummary } = require('./summaryVideoCache')
const { getCachedTeaching } = require('./teachingCache')

module.exports = {
  getCachedVideoSummary,
  getCachedNotesSummary,
  getCachedQuiz,
  getCachedTeaching,
  getCachedFormula,
  getCachedDoubtAnswer,
}
