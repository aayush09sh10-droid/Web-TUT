const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'
const DEFAULT_GEMINI_UI_ERROR = 'WebTutor AI is unavailable right now. Please try again in a moment.'
import { handleProtectedResponse, parseJsonResponse } from '../../../shared/auth/authSession'

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

export async function fetchHomeHistory(signal) {
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

export async function requestVideoSummary(url, options = {}) {
  const res = await fetch(`${API_BASE}/api/summarize`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      studyPrompt: options.studyPrompt,
      historyId: options.historyId,
      forceRegenerate: Boolean(options.forceRegenerate),
    }),
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestStudySummary(studyPayload, options = {}) {
  const res = await fetch(`${API_BASE}/api/summarize-notes`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...studyPayload,
      studyPrompt: options.studyPrompt,
      historyId: options.historyId,
      forceRegenerate: Boolean(options.forceRegenerate),
    }),
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestAskAnything(question, options = {}) {
  const res = await fetch(`${API_BASE}/api/ask-anything`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      studyPrompt: options.studyPrompt,
      historyId: options.historyId,
      forceRegenerate: Boolean(options.forceRegenerate),
    }),
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestQuiz(summary, historyId, options = {}) {
  const res = await fetch(`${API_BASE}/api/quiz`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary,
      historyId,
      forceRegenerate: Boolean(options.forceRegenerate),
    }),
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestTeaching(summary, historyId, options = {}) {
  const res = await fetch(`${API_BASE}/api/teaching`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary,
      historyId,
      forceRegenerate: Boolean(options.forceRegenerate),
    }),
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestFormula(summary, historyId, options = {}) {
  const res = await fetch(`${API_BASE}/api/formula`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary,
      historyId,
      forceRegenerate: Boolean(options.forceRegenerate),
    }),
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestDoubtAnswer(doubtPayload, options = {}) {
  const res = await fetch(`${API_BASE}/api/doubt`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...doubtPayload,
      forceRegenerate: Boolean(options.forceRegenerate),
    }),
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function saveQuizProgress(historyId, progress) {
  const res = await fetch(`${API_BASE}/api/history/${historyId}/quiz-progress`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(progress),
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to save quiz progress.')
  }

  return payload
}
