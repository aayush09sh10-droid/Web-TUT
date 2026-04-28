import { createSlice } from '@reduxjs/toolkit'
import { readStorageItem, removeStorageItem } from '../../../shared/storage/browserStorage'

const THEME_STORAGE_KEY = 'yt-summarizer-theme'
const AUTH_STORAGE_KEY = 'yt-summarizer-auth'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  const stored = readStorageItem('localStorage', THEME_STORAGE_KEY)
  return stored === 'dark' || stored === 'light' ? stored : 'light'
}

function getInitialAuth() {
  if (typeof window === 'undefined') return null
  const stored =
    readStorageItem('localStorage', AUTH_STORAGE_KEY) ||
    readStorageItem('sessionStorage', AUTH_STORAGE_KEY)

  if (!stored) {
    removeStorageItem('sessionStorage', AUTH_STORAGE_KEY)
    return null
  }

  try {
    const parsed = JSON.parse(stored)
    return parsed?.user && parsed?.token ? parsed : null
  } catch {
    removeStorageItem('localStorage', AUTH_STORAGE_KEY)
    removeStorageItem('sessionStorage', AUTH_STORAGE_KEY)
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
