const { createSummaryProgressReporter } = require('../progress/summaryProgress')

function createRequestProgress(req, stream = null) {
  const socketProgress = createSummaryProgressReporter(req)

  function emit(step, extraPayload = {}) {
    socketProgress.emit(step, extraPayload)

    if (stream) {
      stream.progress(step, {
        jobId: socketProgress.jobId,
        ...extraPayload,
      })
    }
  }

  return {
    emit,
    jobId: socketProgress.jobId,
  }
}

module.exports = {
  createRequestProgress,
}
