require('dotenv').config()

const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const { connectDB } = require('./DB/dbconnect')
const { parseAllowedOrigins, createCorsOriginValidator } = require('./config/security')
const { createRateLimiter } = require('./middleware/rateLimit')
const { applySecurityHeaders } = require('./middleware/securityHeaders')

const authRouter = require('./Routes/auth')
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

app.use('/api/auth', authRateLimiter, authRouter)
app.use('/api/history', apiRateLimiter, historyRouter)
app.use('/api', apiRateLimiter, summarizeRouter)

// Create HTTP server and attach Socket.io
const server = http.createServer(app)
const io = new Server(server, {
  cors: corsOptions,
})

// Make the Socket.io instance available in Express controllers
app.set('io', io)

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 5001

connectDB()
  .then(() => {
    server
      .listen(PORT, () => {
        console.log(`Backend listening on http://localhost:${PORT}`)
        console.log('API HIT:', Date.now())
      })
      .on('error', (err) => {
        console.error('Failed to start backend server:', err.message)
      })
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error.message)
  })

