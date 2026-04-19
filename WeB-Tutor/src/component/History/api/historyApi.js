import { parseJsonResponse } from '../../../shared/auth/authSession'
import { buildApiUrl } from '../../../shared/config/apiBase'

export async function fetchHistory(authToken, signal) {
  const res = await fetch(buildApiUrl('/api/history'), {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    signal,
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load history.')
  }

  return Array.isArray(payload.history) ? payload.history : []
}

export async function clearHistory(authToken) {
  const res = await fetch(buildApiUrl('/api/history'), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to clear history.')
  }
}

export async function deleteHistoryItem(authToken, itemId) {
  const res = await fetch(buildApiUrl(`/api/history/${itemId}`), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to delete history item.')
  }
}

export async function fetchSubjects(authToken, signal) {
  const res = await fetch(buildApiUrl('/api/history/subjects'), {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    signal,
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load subjects.')
  }

  return Array.isArray(payload.subjects) ? payload.subjects : []
}

export async function createSubject(authToken, name) {
  const res = await fetch(buildApiUrl('/api/history/subjects'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ name }),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to create subject.')
  }

  return payload.subject
}

export async function saveHistoryItemToSubject(authToken, subjectId, historyId) {
  const res = await fetch(buildApiUrl(`/api/history/subjects/${subjectId}/items`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ historyId }),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to save lesson into subject.')
  }

  return payload.subject
}

export async function reorderSubjectLessons(authToken, subjectId, itemIds) {
  const res = await fetch(buildApiUrl(`/api/history/subjects/${subjectId}/items/reorder`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ itemIds }),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to rearrange subject lessons.')
  }

  return payload.subject
}

export async function removeHistoryItemFromSubject(authToken, subjectId, historyId) {
  const res = await fetch(buildApiUrl(`/api/history/subjects/${subjectId}/items/${historyId}`), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to remove lesson from subject.')
  }

  return payload.subject
}
