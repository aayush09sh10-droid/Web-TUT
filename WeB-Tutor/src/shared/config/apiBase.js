const LOCAL_API_FALLBACK = 'http://localhost:5001'
const PRODUCTION_API_FALLBACK = 'https://web-tut-nixpacksnodeversion-18.up.railway.app'

function normaliseApiBase(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function getDefaultApiBase() {
  if (typeof window === 'undefined') {
    return normaliseApiBase(import.meta.env.VITE_API_BASE) || PRODUCTION_API_FALLBACK
  }

  const hostname = String(window.location.hostname || '').trim().toLowerCase()
  const isLocalHost =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0'

  return isLocalHost ? LOCAL_API_FALLBACK : PRODUCTION_API_FALLBACK
}

export const API_BASE = normaliseApiBase(import.meta.env.VITE_API_BASE) || getDefaultApiBase()

export function buildApiUrl(path) {
  const safePath = String(path || '').trim()
  if (!safePath) {
    return API_BASE
  }

  return `${API_BASE}${safePath.startsWith('/') ? safePath : `/${safePath}`}`
}
