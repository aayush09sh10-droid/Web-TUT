const mongoose = require('mongoose')

const subjectCollectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    itemIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'StudyHistory',
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

subjectCollectionSchema.index({ user: 1, name: 1 }, { unique: true })

module.exports =
  mongoose.models.SubjectCollection || mongoose.model('SubjectCollection', subjectCollectionSchema)
