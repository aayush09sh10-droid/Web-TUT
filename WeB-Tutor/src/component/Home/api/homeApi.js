const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'
const DEFAULT_GEMINI_UI_ERROR = 'WebTutor AI is unavailable right now. Please try again in a moment.'

async function parseJsonResponse(res) {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

function throwAiRequestError(payload, fallbackMessage) {
  const errorType = payload?.errorType
  const message =
    errorType === 'validation'
      ? payload?.error || fallbackMessage
      : payload?.errorType === 'gemini'
        ? payload?.error || DEFAULT_GEMINI_UI_ERROR
        : fallbackMessage || DEFAULT_GEMINI_UI_ERROR

  throw new Error(message)
}

export async function fetchHomeHistory(headers, signal) {
  const res = await fetch(`${API_BASE}/api/history`, {
    headers,
    signal,
  })

  const payload = await parseJsonResponse(res)
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

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestStudySummary(headers, studyPayload) {
  const res = await fetch(`${API_BASE}/api/summarize-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(studyPayload),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestAskAnything(headers, question) {
  const res = await fetch(`${API_BASE}/api/ask-anything`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ question }),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestQuiz(headers, summary, historyId) {
  const res = await fetch(`${API_BASE}/api/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ summary, historyId }),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestTeaching(headers, summary, historyId) {
  const res = await fetch(`${API_BASE}/api/teaching`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ summary, historyId }),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestFormula(headers, summary, historyId) {
  const res = await fetch(`${API_BASE}/api/formula`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ summary, historyId }),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestDoubtAnswer(headers, doubtPayload) {
  const res = await fetch(`${API_BASE}/api/doubt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(doubtPayload),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function saveQuizProgress(headers, historyId, progress) {
  const res = await fetch(`${API_BASE}/api/history/${historyId}/quiz-progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(progress),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to save quiz progress.')
  }

  return payload
}
