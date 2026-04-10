const { AuthServiceError } = require('./errors')
const { changePassword } = require('./changePassword')
const { clearAuthCookie, getAuthCookieName, getAuthCookieOptions } = require('./cookie')
const { loginUser } = require('./login')
const { registerUser } = require('./register')
const { serialiseUser } = require('./userSerializer')

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  serialiseUser,
  AuthServiceError,
  getAuthCookieName,
  getAuthCookieOptions,
  clearAuthCookie,
}
