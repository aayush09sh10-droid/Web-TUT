const mongoose = require('mongoose')
const { logger, serialiseError } = require('../utils/logger')

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI

    if (!mongoUri) {
      throw new Error('Missing MongoDB URI. Add MONGODB_URI to Backend/.env')
    }

    const options = {}

    if (process.env.DB_NAME) {
      options.dbName = process.env.DB_NAME
    }

    const conn = await mongoose.connect(mongoUri, options)
    logger.info(`MongoDB connected at ${conn.connection.host}/${conn.connection.name}`)
  } catch (error) {
    logger.error('MongoDB connection failed.', serialiseError(error))
    process.exit(1)
  }
}

module.exports = {
  connectDB,
}
