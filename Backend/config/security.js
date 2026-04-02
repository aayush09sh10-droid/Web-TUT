const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
]

function parseAllowedOrigins() {
  const configuredOrigins = String(
    process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN || ''
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return configuredOrigins.length ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS
}

function normaliseOrigin(origin) {
  return String(origin || '').trim().replace(/\/+$/, '')
}

function isOriginAllowed(origin, allowedOrigins = parseAllowedOrigins()) {
  if (!origin) {
    return true
  }

  const safeOrigin = normaliseOrigin(origin)

  return allowedOrigins.some((allowedOrigin) => normaliseOrigin(allowedOrigin) === safeOrigin)
}

function createCorsOriginValidator(allowedOrigins = parseAllowedOrigins()) {
  return (origin, callback) => {
    if (isOriginAllowed(origin, allowedOrigins)) {
      callback(null, true)
      return
    }

    callback(new Error('Origin not allowed by CORS'))
  }
}

module.exports = {
  createCorsOriginValidator,
  isOriginAllowed,
  parseAllowedOrigins,
}
