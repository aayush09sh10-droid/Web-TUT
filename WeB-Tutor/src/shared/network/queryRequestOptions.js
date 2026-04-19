const DEV_DEDUP_TTL_MS = 1500
const inFlightGetRequests = new Map()

function buildRequestKey(url, options) {
  const method = String(options?.method || 'GET').toUpperCase()
  const credentials = options?.credentials || 'same-origin'
  return `${method}:${credentials}:${url}`
}

export async function fetchQueryRequest(url, options = {}, signal) {
  const method = String(options?.method || 'GET').toUpperCase()
  const nextOptions = { ...options }

  if (import.meta.env.PROD || method !== 'GET') {
    if (signal) {
      nextOptions.signal = signal
    }

    return fetch(url, nextOptions)
  }

  const requestKey = buildRequestKey(url, nextOptions)
  const cachedEntry = inFlightGetRequests.get(requestKey)

  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    const response = await cachedEntry.promise
    return response.clone()
  }

  const requestPromise = fetch(url, nextOptions)
  inFlightGetRequests.set(requestKey, {
    promise: requestPromise,
    expiresAt: Date.now() + DEV_DEDUP_TTL_MS,
  })

  try {
    const response = await requestPromise
    return response.clone()
  } finally {
    window.setTimeout(() => {
      const activeEntry = inFlightGetRequests.get(requestKey)
      if (activeEntry?.promise === requestPromise) {
        inFlightGetRequests.delete(requestKey)
      }
    }, DEV_DEDUP_TTL_MS)
  }
}
