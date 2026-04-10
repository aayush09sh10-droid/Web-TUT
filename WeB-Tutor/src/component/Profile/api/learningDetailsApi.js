const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'
import { handleProtectedResponse, parseJsonResponse } from '../../../shared/auth/authSession'

export async function fetchLearningDetails(_authToken, id, signal) {
  const res = await fetch(`${API_BASE}/api/history/${id}`, {
    credentials: 'include',
    signal,
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load learning details.')
  }

  return payload.item
}
