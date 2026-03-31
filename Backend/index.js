require('dotenv').config()

const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const { connectDB } = require('./DB/dbconnect')

const authRouter = require('./routes/auth')
const historyRouter = require('./routes/history')
const summarizeRouter = require('./routes/summarize')

const app = express()

app.use(cors())
app.use(express.json({ limit: '15mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRouter)
app.use('/api/history', historyRouter)
app.use('/api', summarizeRouter)

// Create HTTP server and attach Socket.io
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*'
  }
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
      })
      .on('error', (err) => {
        console.error('Failed to start backend server:', err.message)
      })
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error.message)
  })

