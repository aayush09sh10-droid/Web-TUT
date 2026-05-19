function normaliseRoomKey(value, fallback = 'anonymous') {
  return String(value || '').trim() || fallback
}

function getUserRoom(userId) {
  return `user:${normaliseRoomKey(userId)}`
}

function getSummaryJobRoom(jobId) {
  return `summary-job:${normaliseRoomKey(jobId)}`
}

module.exports = {
  getSummaryJobRoom,
  getUserRoom,
}
