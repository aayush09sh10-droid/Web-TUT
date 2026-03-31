const mongoose = require('mongoose')

let connectionPromise = null

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  if (!connectionPromise) {
    const mongoUri = String(process.env.MONGODB_URI || '').trim()

    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing in environment variables.')
    }

    connectionPromise = mongoose.connect(mongoUri).catch((error) => {
      connectionPromise = null
      throw error
    })
  }

  return connectionPromise
}

module.exports = {
  connectDB,
}
