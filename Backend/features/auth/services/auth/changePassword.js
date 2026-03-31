const bcrypt = require('bcryptjs')

const User = require('../../models/User')
const { AuthServiceError } = require('./errors')

async function changePassword({ userId, currentPassword, newPassword }) {
  const safeCurrentPassword = String(currentPassword || '')
  const safeNewPassword = String(newPassword || '')

  if (!safeCurrentPassword || !safeNewPassword) {
    throw new AuthServiceError('Current password and new password are required.', 400)
  }

  if (safeNewPassword.length < 6) {
    throw new AuthServiceError('New password must be at least 6 characters long.', 400)
  }

  const user = await User.findById(userId)

  if (!user?.passwordHash) {
    throw new AuthServiceError('Password change is not available for this account.', 400)
  }

  const isValid = await bcrypt.compare(safeCurrentPassword, user.passwordHash)

  if (!isValid) {
    throw new AuthServiceError('Current password is incorrect.', 401)
  }

  user.passwordHash = await bcrypt.hash(safeNewPassword, 10)
  await user.save()
}

module.exports = {
  changePassword,
}
