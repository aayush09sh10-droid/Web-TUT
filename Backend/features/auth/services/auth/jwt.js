const jwt = require('jsonwebtoken')

const { AuthServiceError } = require('./errors')

function getJwtSecret() {
  const secret = String(process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || '').trim()

  if (!secret) {
    throw new AuthServiceError('JWT_SECRET is missing in environment variables.', 500)
  }

  return secret
}

function signAuthToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      username: user.username,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.ACCESS_TOKEN_ENTRY || process.env.JWT_EXPIRES_IN || '7d',
    }
  )
}

function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret())
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
}
