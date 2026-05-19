const User = require('../features/auth/models/User')
const { verifyAuthToken } = require('../features/auth/services/auth/jwt')

function readSocketToken(socket) {
  const authToken = String(socket.handshake?.auth?.token || '').trim()

  if (authToken) {
    return authToken
  }

  const header = String(socket.handshake?.headers?.authorization || '').trim()
  return header.startsWith('Bearer ') ? header.slice(7).trim() : ''
}

async function resolveSocketUser(socket) {
  const token = readSocketToken(socket)

  if (!token) {
    return null
  }

  try {
    const decoded = verifyAuthToken(token)
    const user = await User.findById(decoded.sub)
    return user || null
  } catch {
    return null
  }
}

async function authenticateSocket(socket, next) {
  const user = await resolveSocketUser(socket)

  if (!user) {
    next(new Error('Authentication required.'))
    return
  }

  socket.data.user = {
    id: String(user._id),
    username: String(user.username || '').trim(),
  }

  next()
}

module.exports = {
  authenticateSocket,
  readSocketToken,
  resolveSocketUser,
}
