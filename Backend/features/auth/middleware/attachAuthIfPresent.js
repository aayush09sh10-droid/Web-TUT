const User = require('../models/User')
const { getTokenFromRequest } = require('./authenticate')
const { verifyAuthToken } = require('../services/auth/jwt')

async function attachAuthIfPresent(req, _res, next) {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      req.user = null
      return next()
    }

    const decoded = verifyAuthToken(token)
    const sessionId = String(decoded?.sid || '').trim()

    if (!sessionId) {
      req.user = null
      return next()
    }

    const user = await User.findOne({
      _id: decoded.sub,
      authSessionId: sessionId,
    })

    req.user = user || null
    return next()
  } catch {
    req.user = null
    return next()
  }
}

module.exports = {
  attachAuthIfPresent,
}
