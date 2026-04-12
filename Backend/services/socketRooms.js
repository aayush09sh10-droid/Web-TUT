function getUserRoom(userId) {
  return `user:${String(userId || '').trim()}`
}

function getSessionRoom(sessionId) {
  return `session:${String(sessionId || '').trim()}`
}

module.exports = {
  getSessionRoom,
  getUserRoom,
}
