const { updatePassword } = require('./changePassword')
const { login } = require('./login')
const { logout } = require('./logout')
const { me } = require('./me')
const { register } = require('./register')

module.exports = {
  register,
  login,
  logout,
  me,
  updatePassword,
}
