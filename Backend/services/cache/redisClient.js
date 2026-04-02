let createClient = null

try {
  ;({ createClient } = require('redis'))
} catch {
  createClient = null
}

let clientPromise = null
let hasLoggedUnavailableDependency = false
let hasLoggedConnectionFailure = false

function getRedisConfig() {
  const url = String(process.env.REDIS_URL || '').trim()

  if (url) {
    return { url }
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
    },
    password: password || undefined,
  }
}

async function getRedisClient() {
  const config = getRedisConfig()

  if (!config) {
    return null
  }

  if (!createClient) {
    if (!hasLoggedUnavailableDependency) {
      hasLoggedUnavailableDependency = true
      console.warn('Redis caching disabled: install the `redis` package to enable cache support.')
    }

    return null
  }

  if (!clientPromise) {
    clientPromise = (async () => {
      const client = createClient(config)

      client.on('error', (error) => {
        if (!hasLoggedConnectionFailure) {
          hasLoggedConnectionFailure = true
          console.warn('Redis client error:', error.message)
        }
      })

      try {
        if (!client.isOpen) {
          await client.connect()
        }

        return client
      } catch (error) {
        hasLoggedConnectionFailure = true
        console.warn('Redis caching disabled:', error.message)
        clientPromise = null
        return null
      }
    })()
  }

  return clientPromise
}

module.exports = {
  getRedisClient,
}
