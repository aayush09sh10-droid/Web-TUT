const LOG_LEVELS = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
}

function getLogLevel() {
  const configuredLevel = String(process.env.LOG_LEVEL || '').trim().toLowerCase()

  if (configuredLevel && LOG_LEVELS[configuredLevel] != null) {
    return configuredLevel
  }

  return String(process.env.NODE_ENV || '').toLowerCase() === 'production' ? 'info' : 'debug'
}

function shouldLog(level) {
  return LOG_LEVELS[level] <= LOG_LEVELS[getLogLevel()]
}

function write(level, message, meta) {
  if (!shouldLog(level)) {
    return
  }

  const timestamp = new Date().toISOString()
  const line = `[${timestamp}] ${level.toUpperCase()} ${message}`

  if (meta == null) {
    console[level === 'debug' ? 'log' : level](line)
    return
  }

  console[level === 'debug' ? 'log' : level](line, meta)
}

function serialiseError(error) {
  if (!error) {
    return null
  }

  return {
    name: error.name,
    message: error.message,
    stack: String(process.env.NODE_ENV || '').toLowerCase() === 'production' ? undefined : error.stack,
    status: error.status || error.statusCode,
  }
}

const logger = {
  error(message, meta) {
    write('error', message, meta)
  },
  warn(message, meta) {
    write('warn', message, meta)
  },
  info(message, meta) {
    write('info', message, meta)
  },
  debug(message, meta) {
    write('debug', message, meta)
  },
}

module.exports = {
  logger,
  serialiseError,
}
