import { createSlice } from '@reduxjs/toolkit'

const THEME_STORAGE_KEY = 'yt-summarizer-theme'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'dark' || stored === 'light' ? stored : 'light'
}

function getInitialAuth() {
  // Don't clear auth on initialization - let App.jsx verify session with server
  return null
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    theme: getInitialTheme(),
    auth: getInitialAuth(),
    isCheckingSession: true, // Track if we're verifying session with server
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
      state.isCheckingSession = false
    },
    clearAuth(state) {
      state.auth = null
      state.isCheckingSession = false
    },
    setSessionCheckComplete(state, action) {
      state.isCheckingSession = action.payload
    },
  },
})

export const { setTheme, toggleTheme, setAuth, clearAuth, setSessionCheckComplete } = authSlice.actions
export const authReducer = authSlice.reducer
export { THEME_STORAGE_KEY }
