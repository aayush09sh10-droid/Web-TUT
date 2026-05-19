const { Server } = require('socket.io')

const { authenticateSocket } = require('./socketAuth')
const { getUserRoom, getSummaryJobRoom } = require('./rooms')

function createSocketServer(server, corsOptions) {
  const io = new Server(server, {
    cors: corsOptions,
  })

  io.use(authenticateSocket)

  io.on('connection', (socket) => {
    const userId = socket.data?.user?.id
    const username = socket.data?.user?.username || 'unknown'

    if (userId) {
      socket.join(getUserRoom(userId))
    }

    socket.on('summary:subscribe', (payload = {}) => {
      const jobId = String(payload?.jobId || '').trim()

      if (!jobId) {
        return
      }

      socket.join(getSummaryJobRoom(jobId))
    })

    socket.on('summary:unsubscribe', (payload = {}) => {
      const jobId = String(payload?.jobId || '').trim()

      if (!jobId) {
        return
      }

      socket.leave(getSummaryJobRoom(jobId))
    })

    console.log(`Socket connected: ${socket.id} (${username})`)

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} (${username})`)
    })
  })

  return io
}

module.exports = {
  createSocketServer,
}
