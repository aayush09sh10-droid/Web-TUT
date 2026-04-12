require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { Server } = require('socket.io')
const { connectDB } = require('./DB/dbconnect')
const { createServer } = require('./config/server')
const { parseAllowedOrigins, createCorsOriginValidator } = require('./config/security')
const { createRateLimiter } = require('./middleware/rateLimit')
const { applySecurityHeaders } = require('./middleware/securityHeaders')
const { logger, serialiseError } = require('./utils/logger')
const { ensureRedisReady } = require('./services/cache/redisClient')
const { getSessionRoom, getUserRoom } = require('./services/socketRooms')
const User = require('./features/auth/models/User')
const { getAuthCookieName } = require('./features/auth/services/auth')
const { verifyAuthToken } = require('./features/auth/services/auth/jwt')

const authRouter = require('./Routes/auth')
const healthRouter = require('./Routes/health')
const historyRouter = require('./Routes/history')
const summarizeRouter = require('./Routes/summarize')

const app = express()
const allowedOrigins = parseAllowedOrigins()
const corsOptions = {
  origin: createCorsOriginValidator(allowedOrigins),
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many authentication attempts. Please try again later.',
})
const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
})

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(applySecurityHeaders)
app.use(cors(corsOptions))
app.use(express.json({ limit: '35mb' }))
app.use(express.urlencoded({ extended: true, limit: '35mb' }))

app.use('/', healthRouter)
app.use('/api/auth', authRateLimiter, authRouter)
app.use('/api/history', apiRateLimiter, historyRouter)
app.use('/api', apiRateLimiter, summarizeRouter)

let server
let protocol

try {
  const serverConfig = createServer(app)
  server = serverConfig.server
  protocol = serverConfig.protocol
} catch (error) {
  logger.error('Failed to configure backend transport.', serialiseError(error))
  process.exit(1)
}

const io = new Server(server, {
  cors: corsOptions,
})

// Make the Socket.io instance available in Express controllers
app.set('io', io)

function getSocketToken(socket) {
  const authHeader = String(socket.handshake.auth?.token || socket.handshake.headers?.authorization || '')
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }

  if (authHeader && !authHeader.includes('=')) {
    return authHeader.trim()
  }

  const cookieHeader = String(socket.handshake.headers?.cookie || '')
  const cookieName = getAuthCookieName()
  const cookieParts = cookieHeader.split(';').map((part) => part.trim())
  const targetCookie = cookieParts.find((part) => part.startsWith(`${cookieName}=`))

  return targetCookie ? decodeURIComponent(targetCookie.slice(cookieName.length + 1).trim()) : ''
}

io.use(async (socket, next) => {
  try {
    const token = getSocketToken(socket)

    if (!token) {
      socket.data.authenticatedUser = null
      return next()
    }

    const decoded = verifyAuthToken(token)
    const sessionId = String(decoded?.sid || '').trim()

    if (!sessionId) {
      socket.data.authenticatedUser = null
      return next()
    }

    const user = await User.findOne({
      _id: decoded.sub,
      authSessionId: sessionId,
    }).select('_id authSessionId')

    if (!user) {
      socket.data.authenticatedUser = null
      return next()
    }

    socket.data.authenticatedUser = {
      userId: String(user._id),
      sessionId: String(user.authSessionId),
    }

    return next()
  } catch (error) {
    logger.warn('Socket authentication failed.', { message: error.message })
    socket.data.authenticatedUser = null
    return next()
  }
})

io.on('connection', (socket) => {
  if (String(process.env.NODE_ENV || '').toLowerCase() !== 'production') {
    logger.debug('Socket connected.', { socketId: socket.id })
  }

  const authenticatedUser = socket.data.authenticatedUser
  if (authenticatedUser?.userId) {
    socket.join(getUserRoom(authenticatedUser.userId))
  }

  if (authenticatedUser?.sessionId) {
    socket.join(getSessionRoom(authenticatedUser.sessionId))
  }

  socket.on('disconnect', () => {
    logger.debug('Socket disconnected.', { socketId: socket.id })
  })
})

const PORT = process.env.PORT || 5001
const HOST = String(process.env.HOST || '0.0.0.0').trim()

connectDB()
  .then(() => ensureRedisReady())
  .then(() => {
    server
      .listen(PORT, HOST, () => {
        logger.info(`Backend listening on ${protocol}://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`)
      })
      .on('error', (err) => {
        logger.error('Failed to start backend server.', serialiseError(err))
      })
  })
  .catch((error) => {
    logger.error('Failed to connect to MongoDB.', serialiseError(error))
  })

