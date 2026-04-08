const { hashPayload } = require('../../../services/cache')

function getVideoSourceFingerprint(url) {
  return hashPayload({
    kind: 'youtube-video',
    url: String(url || '').trim(),
  })
}

function getAskSourceFingerprint(question) {
  return hashPayload({
    kind: 'ask-ai',
    question: String(question || '').trim(),
  })
}

function getStudySourceFingerprint({ uploads = [], sourceMode = 'files' }) {
  return hashPayload({
    kind: sourceMode,
    uploads: Array.isArray(uploads)
      ? uploads.map((upload) => ({
          fileName: String(upload?.fileName || '').trim(),
          mimeType: String(upload?.mimeType || '').trim(),
          data: String(upload?.data || upload?.imageData || '').trim(),
        }))
      : [],
  })
}

module.exports = {
  getVideoSourceFingerprint,
  getAskSourceFingerprint,
  getStudySourceFingerprint,
}
