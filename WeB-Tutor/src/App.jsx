import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Header from './component/Header/Header'
import Home from './component/Home/Home'
import History from './component/History/History'
import Footer from './component/Footer/Footer'

const THEME_STORAGE_KEY = 'yt-summarizer-theme'

function App() {
  const [theme, setTheme] = useState('light')

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
  

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Router>
        <Header theme={theme} setTheme={setTheme} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
        </Routes>
        <Footer />
      </Router>
    </div>
  )
}

export default App
