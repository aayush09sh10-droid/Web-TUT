const { registerUser } = require('../services/auth')

async function register(req, res) {
  try {
    const result = await registerUser({
      ...req.body,
      file: req.file,
    })

    return res.status(201).json({
      success: true,
      ...result,
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to register user.',
    })
  }
}

module.exports = {
  register,
}
