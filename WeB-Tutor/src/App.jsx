import { useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Auth from './component/Auth/Auth'
import { AUTH_STORAGE_KEY, THEME_STORAGE_KEY } from './component/Auth/store/authSlice'
import Footer from './component/Footer/Footer'
import Header from './component/Header/Header'
import History from './component/History/History'
import Home from './component/Home/Home'
import LearningDetails from './component/Profile/LearningDetails'
import Profile from './component/Profile/Profile'
import { useAppSelector } from './store/hooks'

function App() {
  const theme = useAppSelector((state) => state.auth.theme)
  const auth = useAppSelector((state) => state.auth.auth)

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
    if (auth?.token && auth?.user) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [auth])

  return (
    <div className="flex min-h-screen flex-col text-[var(--text)]">
      <Router>
        <Header />
        <div className="flex-1">
          {auth?.token ? (
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/history" element={<History />} />
              <Route path="/profile" element={<Profile />} />
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
