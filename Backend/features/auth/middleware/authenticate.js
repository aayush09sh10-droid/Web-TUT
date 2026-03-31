const User = require('../models/User')
const { verifyAuthToken } = require('../services/auth/jwt')

async function authenticate(req, res, next) {
  try {
    const header = String(req.headers.authorization || '')
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      })
    }

    const decoded = verifyAuthToken(token)
    const user = await User.findById(decoded.sub)

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      })
    }

    req.user = user
    return next()
  } catch {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
    })
  }
}

module.exports = {
  authenticate,
}
