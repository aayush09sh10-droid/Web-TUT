const User = require('../models/User')
const { getAuthCookieName } = require('../services/auth')
const { verifyAuthToken } = require('../services/auth/jwt')

function getTokenFromRequest(req) {
  const header = String(req.headers.authorization || '')
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim()
  }

  const cookieHeader = String(req.headers.cookie || '')
  const cookieName = getAuthCookieName()
  const cookieParts = cookieHeader.split(';').map((part) => part.trim())
  const targetCookie = cookieParts.find((part) => part.startsWith(`${cookieName}=`))

  return targetCookie ? decodeURIComponent(targetCookie.slice(cookieName.length + 1).trim()) : ''
}

async function authenticate(req, res, next) {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      })
    }

    const decoded = verifyAuthToken(token)
    const sessionId = String(decoded?.sid || '').trim()

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      })
    }

    const user = await User.findOne({
      _id: decoded.sub,
      authSessionId: sessionId,
    })

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
  getTokenFromRequest,
}
