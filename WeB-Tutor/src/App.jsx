import { useEffect, useRef } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { queryClient } from './cache/queryClient'
import Auth from './component/Auth/Auth'
import { AUTH_STORAGE_KEY, THEME_STORAGE_KEY } from './component/Auth/store/authSlice'
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
import { clearPersistedHomeState } from './shared/storage/homeSession'
import { useAppDispatch, useAppSelector } from './store/hooks'

function App() {
  const dispatch = useAppDispatch()
  const theme = useAppSelector((state) => state.auth.theme)
  const auth = useAppSelector((state) => state.auth.auth)
  const isAuthenticated = Boolean(auth?.user && auth?.token)
  const currentOwnerKey = String(auth?.user?.id || auth?.user?._id || auth?.user?.email || auth?.user?.username || '').trim()
  const previousOwnerKeyRef = useRef(currentOwnerKey)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (auth?.user && auth?.token) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [auth])

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
          {isAuthenticated ? (
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
