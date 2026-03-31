const { changePassword } = require('../services/auth')

async function updatePassword(req, res) {
  try {
    await changePassword({
      userId: req.user._id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    })

    return res.json({
      success: true,
      message: 'Password updated successfully.',
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to update password.',
    })
  }
}

module.exports = {
  updatePassword,
}
