import { buildApiUrl } from '../../../shared/config/apiBase'
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
  const silentInUi = Boolean(payload?.silentInUi)
  const message =
    silentInUi
      ? ''
      : errorType === 'validation'
      ? payload?.error || fallbackMessage
      : payload?.errorType === 'gemini'
        ? payload?.error || DEFAULT_GEMINI_UI_ERROR
        : fallbackMessage || DEFAULT_GEMINI_UI_ERROR

  const error = new Error(message)
  error.silentInUi = silentInUi
  error.errorType = errorType || 'unknown'
  throw error
}

export async function fetchHomeHistory(headers, signal) {
  const res = await fetch(buildApiUrl('/api/history'), {
    headers,
    signal,
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load history.')
  }

  return Array.isArray(payload.history) ? payload.history : []
}

export async function requestVideoSummary(headers, url, options = {}) {
  const res = await fetch(buildApiUrl('/api/summarize'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      url,
      studyPrompt: options.studyPrompt,
      historyId: options.historyId,
      forceRegenerate: Boolean(options.forceRegenerate),
    }),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestStudySummary(headers, studyPayload, options = {}) {
  const res = await fetch(buildApiUrl('/api/summarize-notes'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      ...studyPayload,
      studyPrompt: options.studyPrompt,
      historyId: options.historyId,
      forceRegenerate: Boolean(options.forceRegenerate),
    }),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestAskAnything(headers, question, options = {}) {
  const res = await fetch(buildApiUrl('/api/ask-anything'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      question,
      studyPrompt: options.studyPrompt,
      historyId: options.historyId,
      forceRegenerate: Boolean(options.forceRegenerate),
    }),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestQuiz(headers, summary, historyId, options = {}) {
  const res = await fetch(buildApiUrl('/api/quiz'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      summary,
      historyId,
      forceRegenerate: Boolean(options.forceRegenerate),
    }),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestTeaching(headers, summary, historyId, options = {}) {
  const res = await fetch(buildApiUrl('/api/teaching'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      summary,
      historyId,
      forceRegenerate: Boolean(options.forceRegenerate),
    }),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestFormula(headers, summary, historyId, options = {}) {
  const res = await fetch(buildApiUrl('/api/formula'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      summary,
      historyId,
      forceRegenerate: Boolean(options.forceRegenerate),
    }),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestDoubtAnswer(headers, doubtPayload, options = {}) {
  const res = await fetch(buildApiUrl('/api/doubt'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      ...doubtPayload,
      forceRegenerate: Boolean(options.forceRegenerate),
    }),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function saveQuizProgress(headers, historyId, progress) {
  const res = await fetch(buildApiUrl(`/api/history/${historyId}/quiz-progress`), {
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
