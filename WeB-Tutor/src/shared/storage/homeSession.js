export const HOME_STATE_STORAGE_KEY = 'yt-summarizer-home-state'
const HOME_STATE_MAX_AGE_MS = 1000 * 60 * 60 * 12

function isBrowser() {
  return typeof window !== 'undefined'
}

function hasMeaningfulHomeState(state) {
  return Boolean(
    state?.result ||
      state?.url?.trim() ||
      state?.studyUploads?.length ||
      state?.askPrompt?.trim() ||
      state?.doubtQuestion?.trim()
  )
}

export function readPersistedHomeState(ownerId) {
  if (!isBrowser()) return null

  const stored = window.localStorage.getItem(HOME_STATE_STORAGE_KEY)
  if (!stored) return null

  try {
    const parsed = JSON.parse(stored)
    const savedAt = Number(parsed?.savedAt || 0)
    const isExpired = !savedAt || Date.now() - savedAt > HOME_STATE_MAX_AGE_MS

    if (isExpired) {
      window.localStorage.removeItem(HOME_STATE_STORAGE_KEY)
      return null
    }

    if (ownerId && parsed?.ownerId && parsed.ownerId !== ownerId) {
      return null
    }

    return parsed?.state || null
  } catch {
    window.localStorage.removeItem(HOME_STATE_STORAGE_KEY)
    return null
  }
}

export function writePersistedHomeState(state, ownerId) {
  if (!isBrowser()) return

  if (!hasMeaningfulHomeState(state)) {
    window.localStorage.removeItem(HOME_STATE_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(
    HOME_STATE_STORAGE_KEY,
    JSON.stringify({
      ownerId: ownerId || null,
      savedAt: Date.now(),
      state,
    })
  )
}

export function clearPersistedHomeState() {
  if (!isBrowser()) return
  window.localStorage.removeItem(HOME_STATE_STORAGE_KEY)
}
