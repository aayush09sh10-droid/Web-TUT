const { AuthServiceError } = require('./errors')
const { changePassword } = require('./changePassword')
const { loginUser } = require('./login')
const { registerUser } = require('./register')
const { serialiseUser } = require('./userSerializer')

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  serialiseUser,
  AuthServiceError,
}
