import { parseJsonResponse } from '../../../shared/auth/authSession'
import { buildAuthenticatedRequestOptions } from '../../../shared/auth/requestOptions'
import { buildApiUrl } from '../../../shared/config/apiBase'

export async function fetchHistory(authToken, signal) {
  const res = await fetch(
    buildApiUrl('/api/history'),
    buildAuthenticatedRequestOptions(authToken, { signal })
  )

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load history.')
  }

  return Array.isArray(payload.history) ? payload.history : []
}

export async function clearHistory(authToken) {
  const res = await fetch(
    buildApiUrl('/api/history'),
    buildAuthenticatedRequestOptions(authToken, {
      method: 'DELETE',
    })
  )

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to clear history.')
  }
}

export async function deleteHistoryItem(authToken, itemId) {
  const res = await fetch(
    buildApiUrl(`/api/history/${itemId}`),
    buildAuthenticatedRequestOptions(authToken, {
      method: 'DELETE',
    })
  )

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to delete history item.')
  }
}

export async function fetchSubjects(authToken, signal) {
  const res = await fetch(
    buildApiUrl('/api/history/subjects'),
    buildAuthenticatedRequestOptions(authToken, { signal })
  )

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load subjects.')
  }

  return Array.isArray(payload.subjects) ? payload.subjects : []
}

export async function createSubject(authToken, name) {
  const res = await fetch(
    buildApiUrl('/api/history/subjects'),
    buildAuthenticatedRequestOptions(authToken, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })
  )

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to create subject.')
  }

  return payload.subject
}

export async function saveHistoryItemToSubject(authToken, subjectId, historyId) {
  const res = await fetch(
    buildApiUrl(`/api/history/subjects/${subjectId}/items`),
    buildAuthenticatedRequestOptions(authToken, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ historyId }),
    })
  )

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to save lesson into subject.')
  }

  return payload.subject
}

export async function reorderSubjectLessons(authToken, subjectId, itemIds) {
  const res = await fetch(
    buildApiUrl(`/api/history/subjects/${subjectId}/items/reorder`),
    buildAuthenticatedRequestOptions(authToken, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemIds }),
    })
  )

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to rearrange subject lessons.')
  }

  return payload.subject
}

export async function removeHistoryItemFromSubject(authToken, subjectId, historyId) {
  const res = await fetch(
    buildApiUrl(`/api/history/subjects/${subjectId}/items/${historyId}`),
    buildAuthenticatedRequestOptions(authToken, {
      method: 'DELETE',
    })
  )

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to remove lesson from subject.')
  }

  return payload.subject
}
