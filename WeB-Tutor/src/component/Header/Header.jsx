import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

function Header({ theme, setTheme, authUser, onLogout }) {
  const location = useLocation()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  const isDark = theme === 'dark'
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollYRef = useRef(0)
  const upwardTravelRef = useRef(0)

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/history', label: 'History' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || 0
      const delta = currentScrollY - lastScrollYRef.current

      if (currentScrollY <= 24) {
        setIsVisible(true)
        upwardTravelRef.current = 0
        lastScrollYRef.current = currentScrollY
        return
      }

      if (delta > 12) {
        upwardTravelRef.current = 0
        setIsVisible(false)
      } else if (delta < -12) {
        upwardTravelRef.current += Math.abs(delta)

        if (upwardTravelRef.current >= 96) {
          setIsVisible(true)
        }
      }

      lastScrollYRef.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 px-3 pt-3 text-[var(--text)] transition-all duration-300 sm:px-4 sm:pt-4 ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-[135%] opacity-0'
        }`}
      >
      <div
        className="mx-auto flex max-w-5xl flex-col gap-3 rounded-[1.5rem] border px-4 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-5"
        style={{
          borderColor: isDark ? 'rgba(135,154,255,0.18)' : 'rgba(255,186,120,0.35)',
          background: isDark
            ? 'linear-gradient(135deg, rgba(22,27,46,0.92), rgba(16,20,35,0.96))'
            : 'linear-gradient(135deg, rgba(255,250,242,0.88), rgba(255,238,222,0.96), rgba(239,246,255,0.88))',
          boxShadow: isDark
            ? '0 20px 46px rgba(0,0,0,0.38)'
            : '0 16px 42px rgba(242,139,64,0.16)',
        }}
      >
        <div className="min-w-0">
          <h1 className="text-base font-extrabold tracking-[0.02em] sm:text-lg">YouTube Summarizer</h1>
          <p className="text-xs text-[var(--muted)]">
            Learn, quiz, and revise from any video in a more playful way.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {authUser && (
            <nav className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-full px-4 py-2 text-center text-xs font-medium transition ${
                    location.pathname === item.to
                      ? 'text-[var(--text)] shadow-sm'
                      : 'border text-[var(--text)] hover:-translate-y-0.5'
                  }`}
                  style={
                    location.pathname === item.to
                      ? {
                          background:
                            isDark
                              ? 'linear-gradient(135deg, rgba(108,129,255,0.72), rgba(255,179,107,0.34))'
                              : 'linear-gradient(135deg, rgba(255,213,138,0.95), rgba(200,221,255,0.95))',
                          color: isDark ? '#f5f7ff' : 'var(--text)',
                        }
                      : {
                          borderColor: isDark ? 'rgba(160,176,255,0.16)' : 'rgba(122,91,81,0.12)',
                          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.68)',
                          color: isDark ? '#dbe5ff' : 'var(--text)',
                        }
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {authUser && (
            <div className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-center text-xs font-semibold text-[var(--text)]">
              @{authUser.username}
            </div>
          )}

          <button
            type="button"
            onClick={() => setTheme(nextTheme)}
            className="w-full rounded-full border px-4 py-2 text-xs font-medium transition hover:-translate-y-0.5 sm:w-auto"
            style={{
              borderColor: isDark ? 'rgba(160,176,255,0.16)' : 'rgba(122,91,81,0.12)',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.68)',
              color: isDark ? '#f5f7ff' : 'var(--text)',
            }}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>

          {authUser && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full rounded-full border px-4 py-2 text-xs font-medium transition hover:-translate-y-0.5 sm:w-auto"
              style={{
                borderColor: isDark ? 'rgba(160,176,255,0.16)' : 'rgba(122,91,81,0.12)',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.68)',
                color: isDark ? '#f5f7ff' : 'var(--text)',
              }}
            >
              Logout
            </button>
          )}
        </div>
      </div>
      </header>
      <div aria-hidden="true" className="h-36 sm:h-28" />
    </>
  )
}

export default Header
