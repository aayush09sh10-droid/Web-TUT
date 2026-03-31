const { updatePassword } = require('./changePassword')
const { login } = require('./login')
const { me } = require('./me')
const { register } = require('./register')

module.exports = {
  register,
  login,
  me,
  updatePassword,
}
