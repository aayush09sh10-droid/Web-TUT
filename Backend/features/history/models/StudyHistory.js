const mongoose = require('mongoose')

const studyHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sourceType: {
      type: String,
      default: 'youtube-video',
      trim: true,
    },
    sourceLabel: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    quiz: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    teaching: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    formula: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    doubt: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    quizProgress: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.models.StudyHistory || mongoose.model('StudyHistory', studyHistorySchema)
