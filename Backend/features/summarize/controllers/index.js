const { answerDoubt } = require('./answerDoubt')
const { generateFormula } = require('./generateFormula')
const { generateQuiz } = require('./generateQuiz')
const { generateTeaching } = require('./generateTeaching')
const { summarizeNotes } = require('./summarizeNotes')
const { summarizeVideo } = require('./summarizeVideo')

module.exports = {
  summarizeVideo,
  summarizeNotes,
  generateQuiz,
  generateTeaching,
  generateFormula,
  answerDoubt,
}
