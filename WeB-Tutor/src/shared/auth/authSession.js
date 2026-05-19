import { clearAuth } from '../../component/Auth/store/authSlice'
import { resetHistoryState } from '../../component/History/store/historySlice'
import { resetHomeState } from '../../component/Home/store/homeSlice'
import { resetProfileState } from '../../component/Profile/store/profileSlice'
import { queryClient } from '../../cache/queryClient'
import { AUTH_STORAGE_KEY } from '../../component/Auth/store/authSlice'
import { clearPersistedHomeState } from '../storage/homeSession'
import { removeStorageItem } from '../storage/browserStorage'
import { store } from '../../store/store'

export function clearClientAuthSession() {
  removeStorageItem('localStorage', AUTH_STORAGE_KEY)
  removeStorageItem('sessionStorage', AUTH_STORAGE_KEY)
  clearPersistedHomeState()
  queryClient.clear()
  store.dispatch(clearAuth())
  store.dispatch(resetHomeState())
  store.dispatch(resetHistoryState())
  store.dispatch(resetProfileState())
}

export function handleProtectedResponse(res, options = {}) {
  if (!res) {
    return
  }

  const shouldClearAuth = Boolean(options.clearAuthOn401)

  if (res.status === 401 && shouldClearAuth) {
    clearClientAuthSession()
  }
}

export async function parseJsonResponse(res) {
  try {
    const rawText = await res.text()

    if (!rawText) {
      return {}
    }

    try {
      return JSON.parse(rawText)
    } catch {
      return {
        error: rawText,
        rawText,
      }
    }
  } catch {
    return {}
  }
}
