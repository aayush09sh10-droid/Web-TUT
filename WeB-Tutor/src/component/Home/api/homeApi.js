const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'

export async function fetchHomeHistory(headers, signal) {
  const res = await fetch(`${API_BASE}/api/history`, {
    headers,
    signal,
  })

  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load history.')
  }

  return Array.isArray(payload.history) ? payload.history : []
}

export async function requestVideoSummary(headers, url) {
  const res = await fetch(`${API_BASE}/api/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ url }),
  })

  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to summarize.')
  }

  return payload
}

export async function requestNotesSummary(headers, notesImage) {
  const res = await fetch(`${API_BASE}/api/summarize-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(notesImage),
  })

  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to summarize.')
  }

  return payload
}

export async function requestQuiz(headers, summary, historyId) {
  const res = await fetch(`${API_BASE}/api/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ summary, historyId }),
  })

  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to generate quiz.')
  }

  return payload
}

export async function requestTeaching(headers, summary, historyId) {
  const res = await fetch(`${API_BASE}/api/teaching`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ summary, historyId }),
  })

  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to generate teaching content.')
  }

  return payload
}

export async function requestFormula(headers, summary, historyId) {
  const res = await fetch(`${API_BASE}/api/formula`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ summary, historyId }),
  })

  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to generate formula guide.')
  }

  return payload
}

export async function requestDoubtAnswer(headers, doubtPayload) {
  const res = await fetch(`${API_BASE}/api/doubt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(doubtPayload),
  })

  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to answer the doubt.')
  }

  return payload
}

export async function saveQuizProgress(headers, historyId, progress) {
  const res = await fetch(`${API_BASE}/api/history/${historyId}/quiz-progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(progress),
  })

  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to save quiz progress.')
  }

  return payload
}
