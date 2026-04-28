const { getAuthCookieName, getAuthCookieOptions, registerUser } = require('../services/auth')

async function register(req, res) {
  try {
    const result = await registerUser({
      ...req.body,
      file: req.file,
    })
    res.cookie(getAuthCookieName(), result.token, getAuthCookieOptions())

    return res.status(201).json({
      success: true,
      token: result.token,
      user: result.user,
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
