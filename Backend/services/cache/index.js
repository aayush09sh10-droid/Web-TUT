const crypto = require('crypto')

const { getRedisClient } = require('./redisClient')

const CACHE_PREFIX = String(process.env.REDIS_CACHE_PREFIX || 'web-tutor').trim()

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue)
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = sortValue(value[key])
        return accumulator
      }, {})
  }

  return value
}

function stableStringify(value) {
  return JSON.stringify(sortValue(value))
}

function hashPayload(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex')
}

function buildCacheKey(parts = []) {
  const safeParts = parts
    .flat()
    .map((part) => String(part || '').trim())
    .filter(Boolean)

  return [CACHE_PREFIX, ...safeParts].join(':')
}

async function getJson(key) {
  const client = await getRedisClient()

  if (!client) {
    return null
  }

  try {
    const rawValue = await client.get(key)
    return rawValue ? JSON.parse(rawValue) : null
  } catch (error) {
    console.warn(`Cache read skipped for ${key}:`, error.message)
    return null
  }
}

async function setJson(key, value, ttlSeconds = 300) {
  const client = await getRedisClient()

  if (!client) {
    return value
  }

  try {
    await client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    })
  } catch (error) {
    console.warn(`Cache write skipped for ${key}:`, error.message)
  }

  return value
}

async function getOrSetJson(key, ttlSeconds, provider) {
  const cachedValue = await getJson(key)

  if (cachedValue !== null) {
    return cachedValue
  }

  const freshValue = await provider()
  await setJson(key, freshValue, ttlSeconds)
  return freshValue
}

async function deleteKey(key) {
  const client = await getRedisClient()

  if (!client) {
    return
  }

  try {
    await client.del(key)
  } catch (error) {
    console.warn(`Cache delete skipped for ${key}:`, error.message)
  }
}

async function deleteMany(keys = []) {
  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)))

  if (!uniqueKeys.length) {
    return
  }

  const client = await getRedisClient()

  if (!client) {
    return
  }

  try {
    await client.del(uniqueKeys)
  } catch (error) {
    console.warn('Cache batch delete skipped:', error.message)
  }
}

async function deleteByPattern(pattern) {
  const client = await getRedisClient()

  if (!client) {
    return
  }

  try {
    const matchedKeys = []

    for await (const key of client.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      matchedKeys.push(key)
    }

    if (matchedKeys.length) {
      await client.del(matchedKeys)
    }
  } catch (error) {
    console.warn(`Cache pattern delete skipped for ${pattern}:`, error.message)
  }
}

module.exports = {
  buildCacheKey,
  deleteByPattern,
  deleteKey,
  deleteMany,
  getJson,
  getOrSetJson,
  hashPayload,
  setJson,
  stableStringify,
}
