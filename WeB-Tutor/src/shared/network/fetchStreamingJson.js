export async function fetchStreamingJson(url, options = {}, handlers = {}) {
  const response = await fetch(url, options)
  const contentType = String(response.headers.get('content-type') || '').toLowerCase()

  if (!contentType.includes('application/x-ndjson')) {
    return {
      mode: 'json',
      response,
      payload: await response.json().catch(() => ({})),
    }
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finalPayload = null
  let errorPayload = null

  while (reader) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      let event = null
      try {
        event = JSON.parse(trimmed)
      } catch {
        continue
      }

      if (event.type === 'progress') {
        handlers.onProgress?.(event)
      } else if (event.type === 'final') {
        finalPayload = event
      } else if (event.type === 'error') {
        errorPayload = event
      }
    }
  }

  if (errorPayload) {
    return {
      mode: 'stream',
      response,
      payload: errorPayload,
    }
  }

  return {
    mode: 'stream',
    response,
    payload: finalPayload || {},
  }
}
