let createClient = null
const { logger } = require('../../utils/logger')

try {
  ;({ createClient } = require('redis'))
} catch {
  createClient = null
}

let clientPromise = null
let hasLoggedUnavailableDependency = false
let hasLoggedConnectionFailure = false

function isRedisRequired() {
  return ['1', 'true', 'yes', 'on'].includes(
    String(process.env.REDIS_REQUIRED || '').trim().toLowerCase()
  )
}

function getRedisConfig() {
  const url = String(process.env.REDIS_URL || '').trim()
  const connectTimeout = Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 15000)

  if (url) {
    return {
      url,
      socket: {
        connectTimeout,
        keepAlive: true,
      },
    }
  }

  const host = String(process.env.REDIS_HOST || '').trim()

  if (!host) {
    return null
  }

  const port = Number(process.env.REDIS_PORT || 6379)
  const password = String(process.env.REDIS_PASSWORD || '').trim()

  return {
    socket: {
      host,
      port,
      connectTimeout,
      keepAlive: true,
    },
    password: password || undefined,
  }
}

async function getRedisClient() {
  const config = getRedisConfig()

  if (!config) {
    if (isRedisRequired()) {
      throw new Error('Redis is required but REDIS_URL or REDIS_HOST is not configured.')
    }

    return null
  }

  if (!createClient) {
    if (!hasLoggedUnavailableDependency) {
      hasLoggedUnavailableDependency = true
      logger.warn('Redis caching disabled: install the `redis` package to enable cache support.')
    }

    if (isRedisRequired()) {
      throw new Error('Redis is required but the `redis` package is unavailable.')
    }

    return null
  }

  if (!clientPromise) {
    clientPromise = (async () => {
      const client = createClient(config)

      client.on('error', (error) => {
        if (!hasLoggedConnectionFailure) {
          hasLoggedConnectionFailure = true
          logger.warn('Redis client error.', { message: error.message })
        }
      })

      try {
        if (!client.isOpen) {
          await client.connect()
        }

        await client.ping()
        return client
      } catch (error) {
        hasLoggedConnectionFailure = true
        logger.warn('Redis caching disabled.', { message: error.message })
        clientPromise = null

        if (isRedisRequired()) {
          throw new Error(`Redis connection failed: ${error.message}`)
        }

        return null
      }
    })()
  }

  return clientPromise
}

async function ensureRedisReady() {
  const client = await getRedisClient()

  if (isRedisRequired() && !client) {
    throw new Error('Redis is required but no Redis client is available.')
  }

  return client
}

module.exports = {
  ensureRedisReady,
  getRedisClient,
  isRedisRequired,
}
