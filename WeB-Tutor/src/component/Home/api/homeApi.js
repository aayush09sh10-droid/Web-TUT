import { buildApiUrl } from '../../../shared/config/apiBase'
import { handleProtectedResponse } from '../../../shared/auth/authSession'
import { fetchStreamingJson } from '../../../shared/network/fetchStreamingJson'
const DEFAULT_GEMINI_UI_ERROR = 'Web-Tut is unavailable right now. Please try again in a moment.'
const DEFAULT_VIDEO_UI_ERROR =
  'We could not process this video link. Try a public YouTube video URL and try again.'

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

function extractYouTubeVideoId(rawUrl) {
  const safeUrl = String(rawUrl || '').trim()

  if (!safeUrl) {
    return ''
  }

  try {
    const parsed = new URL(safeUrl.startsWith('http') ? safeUrl : `https://${safeUrl}`)
    const hostname = parsed.hostname.replace(/^www\./i, '').toLowerCase()
    const pathParts = parsed.pathname.split('/').filter(Boolean)

    if (hostname === 'youtu.be') {
      return /^[\w-]{11}$/.test(pathParts[0] || '') ? pathParts[0] : ''
    }

    if (
      !['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(
        hostname
      )
    ) {
      return ''
    }

    const watchId = String(parsed.searchParams.get('v') || '').trim()
    if (/^[\w-]{11}$/.test(watchId)) {
      return watchId
    }

    const embeddedId = String(pathParts[1] || '').trim()
    if (['shorts', 'embed', 'live', 'v'].includes(pathParts[0]) && /^[\w-]{11}$/.test(embeddedId)) {
      return embeddedId
    }
  } catch {
    return ''
  }

  return ''
}

function normalizeYouTubeUrl(rawUrl) {
  const videoId = extractYouTubeVideoId(rawUrl)

  if (!videoId) {
    const error = new Error('Please paste a valid YouTube video link.')
    error.errorType = 'validation'
    throw error
  }

  return `https://www.youtube.com/watch?v=${videoId}`
}

async function fetchWithSessionFallback(path, headers = {}, options = {}) {
  const requestUrl = buildApiUrl(path)
  const hasBearerToken = Boolean(headers?.Authorization)

  let res = await fetch(requestUrl, {
    credentials: 'include',
    headers,
    ...options,
  })

  if (res.status === 401 && hasBearerToken) {
    const { Authorization, ...cookieOnlyHeaders } = headers
    res = await fetch(requestUrl, {
      credentials: 'include',
      headers: cookieOnlyHeaders,
      ...options,
    })
  }

  handleProtectedResponse(res, { clearAuthOn401: false })
  return res
}

export async function fetchHomeHistory(headers, signal) {
  const res = await fetchWithSessionFallback('/api/history', headers, { signal })
  const payload = await parseJsonResponse(res)
  if (res.status === 401) {
    return []
  }

  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load history.')
  }

  return Array.isArray(payload.history) ? payload.history : []
}

export async function requestVideoSummary(headers, url, options = {}) {
  const normalizedUrl = normalizeYouTubeUrl(url)
  const result = await fetchStreamingJson(
    buildApiUrl('/api/summarize'),
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'x-webtutor-stream': '1', ...headers },
      body: JSON.stringify({
        url: normalizedUrl,
        studyPrompt: options.studyPrompt,
        historyId: options.historyId,
        forceRegenerate: Boolean(options.forceRegenerate),
      }),
    },
    {
      onProgress: options.onProgress,
    }
  )

  const res = result.response
  const payload = result.payload
  if (result.mode === 'json') {
    handleProtectedResponse(res, { clearAuthOn401: false })
  }

  if (!res.ok || payload?.type === 'error' || !payload?.success) {
    if (
      payload?.errorType === 'gemini' &&
      (!payload?.error ||
        /gemini could not summarize this video right now|web-tut is unavailable right now/i.test(
          payload.error
        ))
    ) {
      payload.error = DEFAULT_VIDEO_UI_ERROR
    }

    throwAiRequestError(payload, DEFAULT_VIDEO_UI_ERROR)
  }

  return {
    ...payload,
    videoUrl: payload?.videoUrl || normalizedUrl,
    sourceLabel: payload?.sourceLabel || normalizedUrl,
  }
}

export async function requestStudySummary(headers, studyPayload, options = {}) {
  const result = await fetchStreamingJson(buildApiUrl('/api/summarize-notes'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'x-webtutor-stream': '1', ...headers },
    body: JSON.stringify({
      ...studyPayload,
      studyPrompt: options.studyPrompt,
      historyId: options.historyId,
      forceRegenerate: Boolean(options.forceRegenerate),
    }),
  }, {
    onProgress: options.onProgress,
  })

  const res = result.response
  const payload = result.payload
  if (result.mode === 'json') {
    handleProtectedResponse(res, { clearAuthOn401: false })
  }

  if (!res.ok || payload?.type === 'error' || !payload?.success) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestAskAnything(headers, question, options = {}) {
  const result = await fetchStreamingJson(buildApiUrl('/api/ask-anything'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'x-webtutor-stream': '1', ...headers },
    body: JSON.stringify({
      question,
      studyPrompt: options.studyPrompt,
      historyId: options.historyId,
      forceRegenerate: Boolean(options.forceRegenerate),
    }),
  }, {
    onProgress: options.onProgress,
  })

  const res = result.response
  const payload = result.payload
  if (result.mode === 'json') {
    handleProtectedResponse(res, { clearAuthOn401: false })
  }

  if (!res.ok || payload?.type === 'error' || !payload?.success) {
    throwAiRequestError(payload, DEFAULT_GEMINI_UI_ERROR)
  }

  return payload
}

export async function requestQuiz(headers, summary, historyId, options = {}) {
  const res = await fetch(buildApiUrl('/api/quiz'), {
    method: 'POST',
    credentials: 'include',
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
    credentials: 'include',
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
    credentials: 'include',
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
    credentials: 'include',
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
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(progress),
  })

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to save quiz progress.')
  }

  return payload
}
