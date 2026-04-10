const { getAuthCookieName, getAuthCookieOptions, loginUser } = require('../services/auth')

async function login(req, res) {
  try {
    const result = await loginUser(req.body)
    res.cookie(getAuthCookieName(), result.token, getAuthCookieOptions())

    return res.json({
      success: true,
      user: result.user,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to login.',
    })
  }
}

module.exports = {
  login,
}
