const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const User = require('../../models/User')
const { AuthServiceError } = require('./errors')
const { signAuthToken } = require('./jwt')
const { serialiseUser } = require('./userSerializer')

async function loginUser({ identifier, password }) {
  const safeIdentifier = String(identifier || '').trim().toLowerCase()
  const safePassword = String(password || '')

  if (!safeIdentifier || !safePassword) {
    throw new AuthServiceError('Username or email and password are required.', 400)
  }

  const user = await User.findOne({
    $or: [{ email: safeIdentifier }, { username: safeIdentifier }],
  })

  if (!user?.passwordHash) {
    throw new AuthServiceError('Invalid login credentials.', 401)
  }

  const isValid = await bcrypt.compare(safePassword, user.passwordHash)

  if (!isValid) {
    throw new AuthServiceError('Invalid login credentials.', 401)
  }

  const sessionId = crypto.randomUUID()
  user.authSessionId = sessionId
  user.authUsesRemaining = 0
  await user.save()

  return {
    token: signAuthToken(user, sessionId),
    user: serialiseUser(user),
  }
}

module.exports = {
  loginUser,
}
