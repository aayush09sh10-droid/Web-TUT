import { createSlice } from '@reduxjs/toolkit'

const THEME_STORAGE_KEY = 'yt-summarizer-theme'
const AUTH_STORAGE_KEY = 'yt-summarizer-auth'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'dark' || stored === 'light' ? stored : 'light'
}

function getInitialAuth() {
  if (typeof window === 'undefined') return null
  const stored =
    window.localStorage.getItem(AUTH_STORAGE_KEY) || window.sessionStorage.getItem(AUTH_STORAGE_KEY)

  if (!stored) {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }

  try {
    const parsed = JSON.parse(stored)
    return parsed?.user && parsed?.token ? parsed : null
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    theme: getInitialTheme(),
    auth: getInitialAuth(),
  },
  reducers: {
    setTheme(state, action) {
      state.theme = action.payload
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
    },
    setAuth(state, action) {
      state.auth = action.payload
    },
    clearAuth(state) {
      state.auth = null
    },
  },
})

export const { setTheme, toggleTheme, setAuth, clearAuth } = authSlice.actions
export const authReducer = authSlice.reducer
export { AUTH_STORAGE_KEY, THEME_STORAGE_KEY }
