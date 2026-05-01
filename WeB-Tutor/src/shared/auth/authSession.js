import { clearAuth } from '../../component/Auth/store/authSlice'
import { store } from '../../store/store'

export function handleProtectedResponse(res, options = {}) {
  if (!res) {
    return
  }

  const shouldClearAuth = Boolean(options.clearAuthOn401)

  if (res.status === 401 && shouldClearAuth) {
    store.dispatch(clearAuth())
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
