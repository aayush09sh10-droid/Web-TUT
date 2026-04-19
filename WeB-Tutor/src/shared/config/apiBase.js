const LOCAL_API_FALLBACK = 'http://localhost:5001'

function normaliseApiBase(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

export const API_BASE = normaliseApiBase(import.meta.env.VITE_API_BASE) || LOCAL_API_FALLBACK

export function buildApiUrl(path) {
  const safePath = String(path || '').trim()
  if (!safePath) {
    return API_BASE
  }

  return `${API_BASE}${safePath.startsWith('/') ? safePath : `/${safePath}`}`
}
