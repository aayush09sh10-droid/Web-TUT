import { handleProtectedResponse, parseJsonResponse } from '../../../shared/auth/authSession'
import { buildApiUrl } from '../../../shared/config/apiBase'
import { fetchQueryRequest } from '../../../shared/network/queryRequestOptions'

export async function fetchLearningDetails(_authToken, id, signal) {
  const res = await fetchQueryRequest(
    buildApiUrl(`/api/history/${id}`),
    {
      credentials: 'include',
    },
    signal
  )

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load learning details.')
  }

  return payload.item
}
