import { useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Auth from './component/Auth/Auth'
import { AUTH_STORAGE_KEY, THEME_STORAGE_KEY } from './component/Auth/store/authSlice'
import Footer from './component/Footer/Footer'
import Header from './component/Header/Header'
import History from './component/History/History'
import Home from './component/Home/Home'
import ProfileFeatureLibrary from './component/Profile/ProfileFeatureLibrary'
import LearningDetails from './component/Profile/LearningDetails'
import Profile from './component/Profile/Profile'
import ProfileSubjectDetails from './component/Profile/ProfileSubjectDetails'
import ProfileSubjects from './component/Profile/ProfileSubjects'
import { setAuth, setSessionCheckComplete } from './component/Auth/store/authSlice'
import { useAppDispatch, useAppSelector } from './store/hooks'

function App() {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'
  const dispatch = useAppDispatch()
  const theme = useAppSelector((state) => state.auth.theme)
  const auth = useAppSelector((state) => state.auth.auth)
  const isCheckingSession = useAppSelector((state) => state.auth.isCheckingSession)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  // Restore session from server on app load
  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function restoreAuthFromCookie() {
      // Skip if user is already authenticated
      if (auth?.user) {
        if (isMounted) {
          dispatch(setSessionCheckComplete(false))
        }
        return
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: 'include',
          signal: controller.signal,
        })

        if (!res.ok) {
          // User is not authenticated
          if (isMounted) {
            dispatch(setSessionCheckComplete(false))
          }
          return
        }

        const payload = await res.json()

        // Only restore if response contains valid user
        if (isMounted && payload?.user) {
          dispatch(setAuth({ user: payload.user }))
        } else if (isMounted) {
          dispatch(setSessionCheckComplete(false))
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Auth restore error:', error)
        }
        if (isMounted) {
          dispatch(setSessionCheckComplete(false))
        }
      }
    }

    // Only check session once at app load
    if (isCheckingSession) {
      restoreAuthFromCookie()
    }

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  // Show loading while checking session
  if (isCheckingSession) {
    return <div className="min-h-screen bg-(--bg)" />
  }

  return (
    <div className="flex min-h-screen flex-col text-(--text)">
      <Router>
        <Header />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={auth?.user ? <History /> : <Auth />} />
            <Route path="/profile" element={auth?.user ? <Profile /> : <Auth />} />
            <Route path="/profile/subjects" element={auth?.user ? <ProfileSubjects /> : <Auth />} />
            <Route path="/profile/subjects/:subjectId" element={auth?.user ? <ProfileSubjectDetails /> : <Auth />} />
            <Route path="/profile/library/:feature" element={auth?.user ? <ProfileFeatureLibrary /> : <Auth />} />
            <Route path="/profile/learning/:id" element={auth?.user ? <LearningDetails /> : <Auth />} />
          </Routes>
        </div>
        <Footer />
      </Router>
    </div>
  )
}

export default App
