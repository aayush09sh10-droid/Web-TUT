const crypto = require('crypto')

const { getRedisClient } = require('./redisClient')

const CACHE_PREFIX = String(process.env.REDIS_CACHE_PREFIX || 'web-tutor').trim()
const memoryCache = new Map()
let hasLoggedMemoryFallback = false

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

function makePatternRegExp(pattern) {
  const escaped = pattern.replace(/[-\[\]{}()+?.,\\^$|#\s]/g, '\\$&')
  const regexString = escaped.replace(/\\\*/g, '.*')
  return new RegExp(`^${regexString}$`)
}

function logMemoryFallback() {
  if (!hasLoggedMemoryFallback) {
    hasLoggedMemoryFallback = true
    console.info('Redis unavailable: using in-memory cache fallback.')
  }
}

function getMemoryEntry(key) {
  const entry = memoryCache.get(key)
  if (!entry) {
    return null
  }

  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    memoryCache.delete(key)
    return null
  }

  return entry.value
}

function setMemoryEntry(key, value, ttlSeconds = 300) {
  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined
  memoryCache.set(key, { value, expiresAt })
  return value
}

function deleteMemoryEntry(key) {
  memoryCache.delete(key)
}

function deleteMemoryEntries(keys = []) {
  keys.forEach((key) => memoryCache.delete(key))
}

function deleteMemoryByPattern(pattern) {
  const matcher = makePatternRegExp(pattern)
  for (const key of Array.from(memoryCache.keys())) {
    if (matcher.test(key)) {
      memoryCache.delete(key)
    }
  }
}

async function getJson(key) {
  const client = await getRedisClient()

  if (!client) {
    logMemoryFallback()
    return getMemoryEntry(key)
  }

  try {
    const rawValue = await client.get(key)
    return rawValue ? JSON.parse(rawValue) : null
  } catch (error) {
    console.warn(`Cache read skipped for ${key}:`, error.message)
    return getMemoryEntry(key)
  }
}

async function setJson(key, value, ttlSeconds = 300) {
  const client = await getRedisClient()

  if (!client) {
    logMemoryFallback()
    return setMemoryEntry(key, value, ttlSeconds)
  }

  try {
    await client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    })
  } catch (error) {
    console.warn(`Cache write skipped for ${key}:`, error.message)
    return setMemoryEntry(key, value, ttlSeconds)
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
    logMemoryFallback()
    deleteMemoryEntry(key)
    return
  }

  try {
    await client.del(key)
  } catch (error) {
    console.warn(`Cache delete skipped for ${key}:`, error.message)
    deleteMemoryEntry(key)
  }
}

async function deleteMany(keys = []) {
  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)))

  if (!uniqueKeys.length) {
    return
  }

  const client = await getRedisClient()

  if (!client) {
    logMemoryFallback()
    deleteMemoryEntries(uniqueKeys)
    return
  }

  try {
    await client.del(uniqueKeys)
  } catch (error) {
    console.warn('Cache batch delete skipped:', error.message)
    deleteMemoryEntries(uniqueKeys)
  }
}

async function deleteByPattern(pattern) {
  const client = await getRedisClient()

  if (!client) {
    logMemoryFallback()
    deleteMemoryByPattern(pattern)
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
    deleteMemoryByPattern(pattern)
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
