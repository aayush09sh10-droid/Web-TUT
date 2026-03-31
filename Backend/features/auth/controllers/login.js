const { loginUser } = require('../services/auth')

async function login(req, res) {
  try {
    const result = await loginUser(req.body)

    return res.json({
      success: true,
      ...result,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to login.',
    })
  }
}

module.exports = {
  login,
}
