const { getCachedDoubtAnswer } = require('./doubtCache')
const { getCachedFormula } = require('./formulaCache')
const { getCachedQuiz } = require('./quizCache')
const { getCachedAskSummary } = require('./summaryAskCache')
const { getCachedNotesSummary } = require('./summaryNotesCache')
const { getCachedVideoSummary } = require('./summaryVideoCache')
const { getCachedTeaching } = require('./teachingCache')

module.exports = {
  getCachedVideoSummary,
  getCachedNotesSummary,
  getCachedAskSummary,
  getCachedQuiz,
  getCachedTeaching,
  getCachedFormula,
  getCachedDoubtAnswer,
}
