import { buildApiUrl } from '../../../shared/config/apiBase'

export async function fetchLearningDetails(authToken, id, signal) {
  const res = await fetch(buildApiUrl(`/api/history/${id}`), {
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
