import React, { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearAuth, toggleTheme } from '../Auth/store/authSlice'
import { closeHeaderMenu, setHeaderVisible, toggleHeaderMenu } from './store/headerSlice'
import { queryClient } from '../../cache'
import { buildApiUrl } from '../../shared/config/apiBase'
import { logger } from '../../shared/utils/logger'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const theme = useAppSelector((state) => state.auth.theme)
  const authUser = useAppSelector((state) => state.auth.auth?.user)
  const { isVisible, isMenuOpen } = useAppSelector((state) => state.header)
  const isDark = theme === 'dark'
  const lastScrollYRef = useRef(0)
  const upwardTravelRef = useRef(0)
  const menuRef = useRef(null)

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/history', label: 'Activity Log' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || 0
      const delta = currentScrollY - lastScrollYRef.current

      if (currentScrollY <= 24) {
        dispatch(setHeaderVisible(true))
        upwardTravelRef.current = 0
        lastScrollYRef.current = currentScrollY
        return
      }

      if (delta > 12) {
        upwardTravelRef.current = 0
        dispatch(setHeaderVisible(false))
      } else if (delta < -12) {
        upwardTravelRef.current += Math.abs(delta)

        if (upwardTravelRef.current >= 96) {
          dispatch(setHeaderVisible(true))
        }
      }

      lastScrollYRef.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [dispatch])

  useEffect(() => {
    if (!isMenuOpen) return

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        dispatch(closeHeaderMenu())
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [dispatch, isMenuOpen])

  async function handleLogout() {
    try {
      await fetch(buildApiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      logger.error('Logout error:', error)
    } finally {
      queryClient.clear()
      dispatch(closeHeaderMenu())
      dispatch(clearAuth())
    }
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 px-3 pt-3 text-(--text) transition-all duration-300 sm:px-4 sm:pt-4 ${
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
            boxShadow: isDark ? '0 20px 46px rgba(0,0,0,0.38)' : '0 16px 42px rgba(242,139,64,0.16)',
          }}
        >
          <div className="min-w-0">
            <h1 className="text-base font-extrabold tracking-[0.02em] sm:text-lg">WeB-Tutor</h1>
            <p className="text-xs text-(--muted)">
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
                        ? 'text-(--text) shadow-sm'
                        : 'border text-(--text) hover:-translate-y-0.5'
                    }`}
                    style={
                      location.pathname === item.to
                        ? {
                            background: isDark
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

            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              className="w-full rounded-full border px-4 py-2 text-xs font-medium transition hover:-translate-y-0.5 sm:w-auto"
              style={{
                borderColor: isDark ? 'rgba(160,176,255,0.16)' : 'rgba(122,91,81,0.12)',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.68)',
                color: isDark ? '#f5f7ff' : 'var(--text)',
              }}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>

            {!authUser && (
              <button
                type="button"
                onClick={() => navigate('/history')}
                className="w-full rounded-full px-4 py-2 text-center text-xs font-medium transition hover:-translate-y-0.5 sm:w-auto text-(--bg)"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(108,129,255,0.72), rgba(255,179,107,0.34))'
                    : 'linear-gradient(135deg, rgba(255,213,138,0.95), rgba(200,221,255,0.95))',
                }}
              >
                Login
              </button>
            )}

            {authUser && (
              <div className="relative w-full sm:w-auto" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => dispatch(toggleHeaderMenu())}
                  className="flex w-full items-center justify-center gap-3 rounded-full border px-4 py-2 text-xs font-medium transition hover:-translate-y-0.5 sm:w-auto"
                  style={{
                    borderColor: isDark ? 'rgba(160,176,255,0.16)' : 'rgba(122,91,81,0.12)',
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.68)',
                    color: isDark ? '#f5f7ff' : 'var(--text)',
                  }}
                >
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-(--border) bg-(--card-strong) text-[10px] font-bold">
                    {authUser.avatarUrl ? (
                      <img src={authUser.avatarUrl} alt={authUser.name} className="h-full w-full object-cover" />
                    ) : (
                      String(authUser.name || authUser.username || 'U').charAt(0).toUpperCase()
                    )}
                  </span>
                  <span>@{authUser.username}</span>
                  <span aria-hidden="true">{isMenuOpen ? '^' : 'v'}</span>
                </button>

                {isMenuOpen && (
                  <div
                    className="mt-2 w-full rounded-[1.2rem] border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.14)] sm:absolute sm:right-0 sm:mt-3 sm:w-56"
                    style={{
                      borderColor: isDark ? 'rgba(160,176,255,0.16)' : 'rgba(122,91,81,0.12)',
                      background: isDark ? 'rgba(18,22,36,0.96)' : 'rgba(255,250,244,0.98)',
                    }}
                  >
                    <Link
                      to="/profile"
                      onClick={() => dispatch(closeHeaderMenu())}
                      className="block rounded-[0.95rem] px-4 py-3 text-sm font-medium text-(--text) transition hover:bg-(--card)"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/profile/subjects"
                      onClick={() => dispatch(closeHeaderMenu())}
                      className="mt-1 block rounded-[0.95rem] px-4 py-3 text-sm font-medium text-(--text) transition hover:bg-(--card)"
                    >
                      Subjects
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 block w-full rounded-[0.95rem] px-4 py-3 text-left text-sm font-medium text-(--text) transition hover:bg-(--card)"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <div aria-hidden="true" className="h-36 sm:h-28" />
    </>
  )
}

export default Header
