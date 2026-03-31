class AudioServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.name = 'AudioServiceError'
    this.statusCode = statusCode
  }
}

module.exports = {
  AudioServiceError,
}
