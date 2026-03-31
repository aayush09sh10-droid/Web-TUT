class GeminiServiceError extends Error {
  constructor(message, statusCode = 502) {
    super(message)
    this.name = 'GeminiServiceError'
    this.statusCode = statusCode
  }
}

module.exports = {
  GeminiServiceError,
}
