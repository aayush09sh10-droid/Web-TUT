require('dotenv').config()

const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')

const summarizeRouter = require('./routes/summarize')

const app = express()

app.use(cors())
app.use(express.json())

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
server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
}).on('error', (err) => {
  console.error('Failed to start backend server:', err.message)
})

