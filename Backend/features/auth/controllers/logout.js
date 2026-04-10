const User = require('../models/User')
const { clearAuthCookie } = require('../services/auth')
const { getTokenFromRequest } = require('../middleware/authenticate')
const { verifyAuthToken } = require('../services/auth/jwt')

async function logout(req, res) {
  try {
    const token = getTokenFromRequest(req)

    if (token) {
      try {
        const decoded = verifyAuthToken(token)
        const sessionId = String(decoded?.sid || '').trim()

        if (sessionId) {
          await User.updateOne(
            { _id: decoded.sub, authSessionId: sessionId },
            { $set: { authSessionId: '' } }
          )
        }
      } catch {}
    }

    clearAuthCookie(res)

    return res.json({
      success: true,
      message: 'Logged out successfully.',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to logout.',
    })
  }
}

module.exports = {
  logout,
}
