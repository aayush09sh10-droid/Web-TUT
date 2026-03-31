const { serialiseUser } = require('../services/auth')
const { getLearningSnapshot } = require('../../history/services/history')

async function me(req, res) {
  const learning = await getLearningSnapshot(req.user._id)

  return res.json({
    success: true,
    user: serialiseUser(req.user),
    learning,
  })
}

module.exports = {
  me,
}
