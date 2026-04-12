function shouldLog() {
  return import.meta.env.DEV
}

export const logger = {
  error(message, meta) {
    if (shouldLog()) {
      console.error(message, meta)
    }
  },
  warn(message, meta) {
    if (shouldLog()) {
      console.warn(message, meta)
    }
  },
  info(message, meta) {
    if (shouldLog()) {
      console.info(message, meta)
    }
  },
}
