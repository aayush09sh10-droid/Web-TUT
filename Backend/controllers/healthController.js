const mongoose = require('mongoose')

const { getRedisClient, isRedisRequired } = require('../services/cache/redisClient')

function getMongoStatus() {
  const readyState = mongoose.connection.readyState

  if (readyState === 1) {
    return 'up'
  }

  if (readyState === 2) {
    return 'connecting'
  }

  return 'down'
}

async function getRedisStatus() {
  try {
    const client = await getRedisClient()

    if (!client) {
      return isRedisRequired() ? 'down' : 'disabled'
    }

    await client.ping()
    return 'up'
  } catch {
    return 'down'
  }
}

async function health(_req, res) {
  const mongo = getMongoStatus()
  const redis = await getRedisStatus()
  const status = mongo === 'up' && redis !== 'down' ? 'ok' : 'degraded'

  return res.status(status === 'ok' ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongo,
      redis,
    },
  })
}

async function ready(_req, res) {
  const mongo = getMongoStatus()
  const redis = await getRedisStatus()
  const redisReady = redis === 'up' || (!isRedisRequired() && redis === 'disabled')
  const isReady = mongo === 'up' && redisReady

  return res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongo,
      redis,
    },
  })
}

module.exports = {
  health,
  ready,
}
