function createRateLimiter({
  windowMs = 60 * 1000,
  maxRequests = 200,
  message = 'Too many requests. Please try again later.',
} = {}) {
  const hits = new Map()

  return (req, res, next) => {
    const now = Date.now()
    const key = String(req.ip || req.headers['x-forwarded-for'] || 'unknown')
    const currentEntry = hits.get(key)

    if (!currentEntry || currentEntry.expiresAt <= now) {
      hits.set(key, { count: 1, expiresAt: now + windowMs })
      return next()
    }   

    if (currentEntry.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((currentEntry.expiresAt - now) / 1000))

      res.set('Retry-After', String(retryAfterSeconds))
      return res.status(429).json({
        success: false,
        error: message,
      })
    }

    currentEntry.count += 1
    hits.set(key, currentEntry)
    return next()
  }
}

module.exports = {
  createRateLimiter,
}
