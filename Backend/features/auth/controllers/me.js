const { serialiseUser } = require('../services/auth')
const { getLearningSnapshot } = require('../../history/services/history')
const { buildCacheKey, getOrSetJson } = require('../../../services/cache')

function getProfileCacheKey(userId) {
  return buildCacheKey(['auth', 'profile', String(userId || '')])
}

async function me(req, res) {
  const payload = await getOrSetJson(getProfileCacheKey(req.user._id), 2 * 60, async () => {
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
