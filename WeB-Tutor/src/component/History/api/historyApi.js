const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'

export async function fetchHistory(authToken, signal) {
  const res = await fetch(`${API_BASE}/api/history`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    signal,
  })

  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load history.')
  }

  return Array.isArray(payload.history) ? payload.history : []
}

export async function clearHistory(authToken) {
  const res = await fetch(`${API_BASE}/api/history`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })

  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to clear history.')
  }
}

export async function deleteHistoryItem(authToken, itemId) {
  const res = await fetch(`${API_BASE}/api/history/${itemId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })

  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to delete history item.')
  }
}
