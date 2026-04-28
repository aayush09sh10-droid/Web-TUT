export const HOME_STATE_STORAGE_KEY = 'yt-summarizer-home-state'
const HOME_STATE_MAX_AGE_MS = 1000 * 60 * 60 * 12
import { readStorageItem, removeStorageItem, writeStorageItem } from './browserStorage'

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
  const stored = readStorageItem('localStorage', HOME_STATE_STORAGE_KEY)
  if (!stored) return null

  try {
    const parsed = JSON.parse(stored)
    const savedAt = Number(parsed?.savedAt || 0)
    const isExpired = !savedAt || Date.now() - savedAt > HOME_STATE_MAX_AGE_MS

    if (isExpired) {
      removeStorageItem('localStorage', HOME_STATE_STORAGE_KEY)
      return null
    }

    if (ownerId && parsed?.ownerId && parsed.ownerId !== ownerId) {
      return null
    }

    return parsed?.state || null
  } catch {
    removeStorageItem('localStorage', HOME_STATE_STORAGE_KEY)
    return null
  }
}

export function writePersistedHomeState(state, ownerId) {
  if (!hasMeaningfulHomeState(state)) {
    removeStorageItem('localStorage', HOME_STATE_STORAGE_KEY)
    return
  }

  writeStorageItem(
    'localStorage',
    HOME_STATE_STORAGE_KEY,
    JSON.stringify({
      ownerId: ownerId || null,
      savedAt: Date.now(),
      state,
    })
  )
}

export function clearPersistedHomeState() {
  removeStorageItem('localStorage', HOME_STATE_STORAGE_KEY)
}
