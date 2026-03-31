function serialiseUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatar?.url || '',
  }
}

module.exports = {
  serialiseUser,
}
