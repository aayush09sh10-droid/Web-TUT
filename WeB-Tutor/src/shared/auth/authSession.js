import { clearAuth } from '../../component/Auth/store/authSlice'
import { store } from '../../store/store'

export function handleProtectedResponse(res) {
  if (!res) {
    return
  }

  if (res.status === 401) {
    store.dispatch(clearAuth())
  }
}

export async function parseJsonResponse(res) {
  try {
    return await res.json()
  } catch {
    return {}
  }
}
