const DEV_PROXY_BASE = ''

function normaliseApiBase(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function getDefaultApiBase() {
  return DEV_PROXY_BASE
}

export const API_BASE = normaliseApiBase(import.meta.env.VITE_API_BASE) || getDefaultApiBase()

export function buildApiUrl(path) {
  const safePath = String(path || '').trim()
  if (!safePath) {
    return API_BASE
  }

  return `${API_BASE}${safePath.startsWith('/') ? safePath : `/${safePath}`}`
}
