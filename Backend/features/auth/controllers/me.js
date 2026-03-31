const { serialiseUser } = require('../services/auth')

async function me(req, res) {
  return res.json({
    success: true,
    user: serialiseUser(req.user),
  })
}

module.exports = {
  me,
}
