import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Auth from './component/Auth/Auth'
import Header from './component/Header/Header'
import Home from './component/Home/Home'
import History from './component/History/History'
import Footer from './component/Footer/Footer'

const THEME_STORAGE_KEY = 'yt-summarizer-theme'
const AUTH_STORAGE_KEY = 'yt-summarizer-auth'

function App() {
  const [theme, setTheme] = useState('light')
  const [auth, setAuth] = useState(null)

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored)
    }
  }, [])

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
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      if (parsed?.token && parsed?.user) {
        setAuth(parsed)
      }
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [])

  function handleAuthSuccess(payload) {
    const nextAuth = {
      token: payload.token,
      user: payload.user,
    }

    setAuth(nextAuth)
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth))
  }

  function handleLogout() {
    setAuth(null)
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  return (
    <div className="flex min-h-screen flex-col text-[var(--text)]">
      <Router>
        <Header theme={theme} setTheme={setTheme} authUser={auth?.user} onLogout={handleLogout} />
        <div className="flex-1">
          {auth?.token ? (
            <Routes>
              <Route path="/" element={<Home theme={theme} authToken={auth.token} authUser={auth.user} />} />
              <Route path="/history" element={<History authToken={auth.token} />} />
            </Routes>
          ) : (
            <Auth theme={theme} onAuthSuccess={handleAuthSuccess} />
          )}
        </div>
        <Footer theme={theme} />
      </Router>
    </div>
  )
}

export default App
