class AuthServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.name = 'AuthServiceError'
    this.statusCode = statusCode
  }
}

module.exports = {
  AuthServiceError,
}
