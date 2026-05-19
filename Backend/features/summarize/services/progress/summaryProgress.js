const crypto = require('crypto')

const { getSummaryJobRoom, getUserRoom } = require('../../../../realtime/rooms')

function resolveSummaryJobId(req) {
  const candidateJobId =
    req.body?.jobId ||
    req.headers['x-summary-job-id'] ||
    req.headers['x-request-id']

  const safeJobId = String(candidateJobId || '').trim()
  return safeJobId || crypto.randomUUID()
}

function createSummaryProgressReporter(req) {
  const io = req.app.get('io')
  const userId = String(req.user?._id || '').trim()
  const jobId = resolveSummaryJobId(req)

  function emit(step, extraPayload = {}) {
    if (!io || !userId || !step) {
      return
    }

    const payload = {
      jobId,
      step: String(step).trim(),
      ...extraPayload,
    }

    io.to(getUserRoom(userId)).to(getSummaryJobRoom(jobId)).emit('summary-progress', payload)
  }

  return {
    emit,
    jobId,
  }
}

module.exports = {
  createSummaryProgressReporter,
  resolveSummaryJobId,
}
