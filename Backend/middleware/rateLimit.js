function createRateLimiter({
  windowMs = 60 * 1000,
  maxRequests = 200,
  message = 'Too many requests. Please try again later.',
} = {}) {
  const hits = new Map()
  let nextCleanupAt = Date.now() + windowMs

  function cleanupExpiredEntries(now) {
    if (now < nextCleanupAt) {
      return
    }

    hits.forEach((entry, key) => {
      if (!entry || entry.expiresAt <= now) {
        hits.delete(key)
      }
    })

    nextCleanupAt = now + windowMs
  }

  return (req, res, next) => {
    const now = Date.now()
    cleanupExpiredEntries(now)
    const key = String(req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim()
    const currentEntry = hits.get(key)

    if (!currentEntry || currentEntry.expiresAt <= now) {
      hits.set(key, { count: 1, expiresAt: now + windowMs })
      setRateLimitHeaders(res, 1, maxRequests, windowMs)
      return next()
    }

    if (currentEntry.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((currentEntry.expiresAt - now) / 1000))
      setRateLimitHeaders(res, maxRequests, maxRequests, currentEntry.expiresAt - now)
      res.set('Retry-After', String(retryAfterSeconds))
      return res.status(429).json({
        success: false,
        error: message,
      })
    }

    currentEntry.count += 1
    hits.set(key, currentEntry)
    setRateLimitHeaders(res, currentEntry.count, maxRequests, currentEntry.expiresAt - now)
    return next()
  }
}

function setRateLimitHeaders(res, currentCount, maxRequests, windowMsRemaining) {
  res.set('X-RateLimit-Limit', String(maxRequests))
  res.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - currentCount)))
  res.set('X-RateLimit-Reset', String(Math.ceil(windowMsRemaining / 1000)))
}

module.exports = {
  createRateLimiter,
}
