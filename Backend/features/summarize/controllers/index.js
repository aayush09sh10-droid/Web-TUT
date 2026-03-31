const { answerDoubt } = require('./answerDoubt')
const { generateQuiz } = require('./generateQuiz')
const { generateTeaching } = require('./generateTeaching')
const { summarizeNotes } = require('./summarizeNotes')
const { summarizeVideo } = require('./summarizeVideo')

module.exports = {
  summarizeVideo,
  summarizeNotes,
  generateQuiz,
  generateTeaching,
  answerDoubt,
}
