function wantsNdjsonStream(req) {
  return String(req.headers['x-webtutor-stream'] || '').trim() === '1'
}

function createNdjsonStream(res) {
  res.status(200)
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders()
  }

  function write(type, payload = {}) {
    if (res.writableEnded) {
      return
    }

    res.write(`${JSON.stringify({ type, ...payload })}\n`)
  }

  return {
    error(payload = {}) {
      write('error', payload)
      res.end()
    },
    final(payload = {}) {
      write('final', payload)
      res.end()
    },
    progress(step, extraPayload = {}) {
      write('progress', {
        step: String(step || '').trim(),
        ...extraPayload,
      })
    },
    write,
  }
}

module.exports = {
  createNdjsonStream,
  wantsNdjsonStream,
}
