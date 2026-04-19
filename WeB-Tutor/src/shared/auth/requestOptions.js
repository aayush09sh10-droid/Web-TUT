export function buildAuthenticatedRequestOptions(authToken, options = {}) {
  const nextOptions = {
    credentials: 'include',
    ...options,
  }

  const nextHeaders = {
    ...(options.headers || {}),
  }

  if (authToken) {
    nextHeaders.Authorization = `Bearer ${authToken}`
  }

  nextOptions.headers = nextHeaders
  return nextOptions
}
