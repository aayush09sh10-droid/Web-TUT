import { useEffect, useRef, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { queryClient } from './cache/queryClient'
import Auth from './component/Auth/Auth'
import { AUTH_STORAGE_KEY, THEME_STORAGE_KEY, setAuth } from './component/Auth/store/authSlice'
import Footer from './component/Footer/Footer'
import Header from './component/Header/Header'
import History from './component/History/History'
import Home from './component/Home/Home'
import ProfileFeatureLibrary from './component/Profile/ProfileFeatureLibrary'
import LearningDetails from './component/Profile/LearningDetails'
import Profile from './component/Profile/Profile'
import ProfileSubjects from './component/Profile/ProfileSubjects'
import { resetHistoryState } from './component/History/store/historySlice'
import { resetHomeState } from './component/Home/store/homeSlice'
import { resetProfileState } from './component/Profile/store/profileSlice'
import { parseJsonResponse } from './shared/auth/authSession'
import { buildAuthenticatedRequestOptions } from './shared/auth/requestOptions'
import { buildApiUrl } from './shared/config/apiBase'
import { readStorageItem, removeStorageItem, writeStorageItem } from './shared/storage/browserStorage'
import { clearPersistedHomeState } from './shared/storage/homeSession'
import { useAppDispatch, useAppSelector } from './store/hooks'

function readPersistedAuthToken() {
  const storedAuth =
    readStorageItem('localStorage', AUTH_STORAGE_KEY) ||
    readStorageItem('sessionStorage', AUTH_STORAGE_KEY)

  if (!storedAuth) {
    return ''
  }

  try {
    const parsed = JSON.parse(storedAuth)
    return String(parsed?.token || '').trim()
  } catch {
    return ''
  }
}

function App() {
  const dispatch = useAppDispatch()
  const theme = useAppSelector((state) => state.auth.theme)
  const auth = useAppSelector((state) => state.auth.auth)
  const [isRestoringSession, setIsRestoringSession] = useState(false)
  const currentOwnerKey = String(auth?.user?.id || auth?.user?._id || auth?.user?.email || auth?.user?.username || '').trim()
  const previousOwnerKeyRef = useRef(currentOwnerKey)
  const hasAttemptedSessionRestoreRef = useRef(false)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    writeStorageItem('localStorage', THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (auth?.user) {
      writeStorageItem('localStorage', AUTH_STORAGE_KEY, JSON.stringify(auth))
      removeStorageItem('sessionStorage', AUTH_STORAGE_KEY)
      return
    }

    if (!hasAttemptedSessionRestoreRef.current || isRestoringSession) {
      return
    }

    if (!auth?.user) {
      removeStorageItem('localStorage', AUTH_STORAGE_KEY)
      removeStorageItem('sessionStorage', AUTH_STORAGE_KEY)
    }
  }, [auth])

  useEffect(() => {
    if (auth?.user || hasAttemptedSessionRestoreRef.current) {
      return
    }

    const persistedToken = readPersistedAuthToken()
    if (!persistedToken) {
      hasAttemptedSessionRestoreRef.current = true
      return
    }

    hasAttemptedSessionRestoreRef.current = true
    setIsRestoringSession(true)

    ;(async () => {
      try {
        const res = await fetch(
          buildApiUrl('/api/auth/me'),
          buildAuthenticatedRequestOptions(persistedToken, {
            method: 'GET',
          })
        )

        const payload = await parseJsonResponse(res)
        if (!res.ok || !payload?.user) {
          return
        }

        dispatch(
          setAuth({
            token: persistedToken,
            user: payload.user,
          })
        )
      } catch {
        // Ignore restore errors and keep the signed-out UI.
      } finally {
        setIsRestoringSession(false)
      }
    })()
  }, [auth?.user, dispatch])

  useEffect(() => {
    const previousOwnerKey = previousOwnerKeyRef.current

    if (previousOwnerKey !== currentOwnerKey) {
      queryClient.clear()
      clearPersistedHomeState()
      dispatch(resetHomeState())
      dispatch(resetHistoryState())
      dispatch(resetProfileState())
    }

    previousOwnerKeyRef.current = currentOwnerKey
  }, [currentOwnerKey, dispatch])

  return (
    <div className="flex min-h-screen flex-col text-(--text)">
      <Router>
        <Header />
        <div className="flex-1">
          {isRestoringSession ? (
            <main className="min-h-[calc(100vh-12rem)] px-3 py-6 text-(--text) sm:px-4 sm:py-10">
              <div className="mx-auto max-w-5xl">
                <div className="rounded-[2rem] border border-(--border) bg-(--card) p-6 shadow-(--shadow) backdrop-blur-xl sm:p-8">
                  <p className="text-sm font-medium text-(--muted)">Restoring your session...</p>
                </div>
              </div>
            </main>
          ) : auth?.user ? (
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/history" element={<History />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/subjects" element={<ProfileSubjects />} />
              <Route path="/profile/library/:feature" element={<ProfileFeatureLibrary />} />
              <Route path="/profile/learning/:id" element={<LearningDetails />} />
            </Routes>
          ) : (
            <Auth />
          )}
        </div>
        <Footer />
      </Router>
    </div>
  )
}

export default App
