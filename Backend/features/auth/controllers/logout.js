function logout(req, res) {
  return res.status(200).json({
    ok: true,
    message: 'Logged out successfully.',
  })
}

module.exports = {
  logout,
}
