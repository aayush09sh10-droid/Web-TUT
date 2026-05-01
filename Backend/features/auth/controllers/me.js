const { serialiseUser } = require('../services/auth')
const { getCachedProfile } = require('../cache/profileCache')
const { getLearningSnapshot } = require('../../history/services/history')

async function me(req, res) {
  if (!req.user) {
    return res.json({
      success: true,
      user: null,
      learning: null,
    })
  }

  const payload = await getCachedProfile(req.user._id, async () => {
    const learning = await getLearningSnapshot(req.user._id)

    return {
      success: true,
      user: serialiseUser(req.user),
      learning,
    }
  })

  return res.json(payload)
}

module.exports = {
  me,
}
