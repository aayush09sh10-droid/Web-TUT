import { parseJsonResponse } from '../../../shared/auth/authSession'
import { buildAuthenticatedRequestOptions } from '../../../shared/auth/requestOptions'
import { buildApiUrl } from '../../../shared/config/apiBase'

export async function fetchLearningDetails(authToken, id, signal) {
  const res = await fetch(
    buildApiUrl(`/api/history/${id}`),
    buildAuthenticatedRequestOptions(authToken, { signal })
  )

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load learning details.')
  }

  return payload.item
}
