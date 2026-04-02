const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'

export async function fetchLearningDetails(authToken, id, signal) {
  const res = await fetch(`${API_BASE}/api/history/${id}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    signal,
  })

  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load learning details.')
  }

  return payload.item
}
