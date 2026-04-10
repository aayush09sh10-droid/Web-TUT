const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'
import { handleProtectedResponse, parseJsonResponse } from '../../../shared/auth/authSession'

export async function fetchHistory(_authToken, signal) {
  const res = await fetch(`${API_BASE}/api/history`, {
    credentials: 'include',
    signal,
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load history.')
  }

  return Array.isArray(payload.history) ? payload.history : []
}

export async function clearHistory() {
  const res = await fetch(`${API_BASE}/api/history`, {
    method: 'DELETE',
    credentials: 'include',
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to clear history.')
  }
}

export async function deleteHistoryItem(_authToken, itemId) {
  const res = await fetch(`${API_BASE}/api/history/${itemId}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to delete history item.')
  }
}

export async function fetchSubjects(_authToken, signal) {
  const res = await fetch(`${API_BASE}/api/history/subjects`, {
    credentials: 'include',
    signal,
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load subjects.')
  }

  return Array.isArray(payload.subjects) ? payload.subjects : []
}

export async function createSubject(_authToken, name) {
  const res = await fetch(`${API_BASE}/api/history/subjects`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to create subject.')
  }

  return payload.subject
}

export async function saveHistoryItemToSubject(_authToken, subjectId, historyId) {
  const res = await fetch(`${API_BASE}/api/history/subjects/${subjectId}/items`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ historyId }),
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to save lesson into subject.')
  }

  return payload.subject
}

export async function reorderSubjectLessons(_authToken, subjectId, itemIds) {
  const res = await fetch(`${API_BASE}/api/history/subjects/${subjectId}/items/reorder`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ itemIds }),
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to rearrange subject lessons.')
  }

  return payload.subject
}

export async function removeHistoryItemFromSubject(_authToken, subjectId, historyId) {
  const res = await fetch(`${API_BASE}/api/history/subjects/${subjectId}/items/${historyId}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to remove lesson from subject.')
  }

  return payload.subject
}
