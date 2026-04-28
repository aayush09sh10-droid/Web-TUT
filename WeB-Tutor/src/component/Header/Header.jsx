import React, { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { clearAuth, toggleTheme } from '../Auth/store/authSlice'
import { closeHeaderMenu, setHeaderVisible, toggleHeaderMenu } from './store/headerSlice'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { buildAuthenticatedRequestOptions } from '../../shared/auth/requestOptions'
import { buildApiUrl } from '../../shared/config/apiBase'

function Header() {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const theme = useAppSelector((state) => state.auth.theme)
  const authToken = useAppSelector((state) => state.auth.auth?.token)
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

  async function handleLogout() {
    dispatch(closeHeaderMenu())

    try {
      await fetch(
        buildApiUrl('/api/auth/logout'),
        buildAuthenticatedRequestOptions(authToken, {
          method: 'POST',
        })
      )
    } catch {
      // Local logout should still happen if the backend request is interrupted.
    } finally {
      dispatch(clearAuth())
    }
  }

  const mobileActionButtonStyle = {
    borderColor: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.22)',
    background: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.92)',
    color: isDark ? '#f5f7ff' : 'var(--text)',
  }

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

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 px-3 pt-3 text-(--text) transition-all duration-300 sm:px-4 sm:pt-4 ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-[135%] opacity-0'
        }`}
      >
        <div
          className="mx-auto flex max-w-5xl flex-col gap-3 rounded-[1.35rem] border px-3 py-3 backdrop-blur-xl sm:px-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:rounded-[1.5rem] lg:px-5 lg:py-4"
          style={{
            borderColor: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.22)',
            background: isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)',
            boxShadow: isDark ? '0 14px 30px rgba(2,6,23,0.28)' : '0 10px 24px rgba(15,23,42,0.08)',
          }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 lg:gap-3">
              <img
                src="/web-tutor-mark.svg"
                alt="Web-Tutor logo"
                className="h-9 w-9 rounded-xl border border-white/25 bg-white/70 p-1 shadow-[0_12px_24px_rgba(0,0,0,0.08)] lg:h-11 lg:w-11 lg:rounded-2xl lg:p-1.5"
              />
              <div className="min-w-0">
                <h1 className="text-sm font-extrabold tracking-[0.02em] sm:text-base lg:text-lg">WeB-Tutor</h1>
                <p className="hidden text-xs text-(--muted) sm:block lg:block">
                  Learn, quiz, and revise from any video in a more playful way.
                </p>
              </div>
            </div>
          </div>

          <div className="hidden w-full lg:flex lg:w-auto lg:flex-row lg:items-center lg:gap-2">
            {authUser && (
              <nav className="flex w-auto items-center gap-2">
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
                              ? 'rgba(59,130,246,0.28)'
                              : 'rgba(37,99,235,0.12)',
                            color: isDark ? '#f5f7ff' : 'var(--text)',
                          }
                        : {
                            borderColor: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.22)',
                            background: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.92)',
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
              className="rounded-full border px-4 py-2 text-xs font-medium transition hover:-translate-y-0.5"
              style={{
                borderColor: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.22)',
                background: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.92)',
                color: isDark ? '#f5f7ff' : 'var(--text)',
              }}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>

            {authUser && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => dispatch(toggleHeaderMenu())}
                  className="flex items-center justify-center gap-3 rounded-full border px-4 py-2 text-xs font-medium transition hover:-translate-y-0.5"
                  style={{
                    borderColor: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.22)',
                    background: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.92)',
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
                    className="absolute right-0 mt-3 w-56 rounded-[1.2rem] border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
                    style={{
                      borderColor: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.22)',
                      background: isDark ? 'rgba(15,23,42,0.96)' : 'rgba(255,255,255,0.98)',
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
                      className="mt-1 block w-full cursor-pointer rounded-[0.95rem] px-4 py-3 text-left text-sm font-medium text-(--text) transition hover:bg-(--card)"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:hidden">
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
              {authUser &&
                navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${
                      location.pathname === item.to ? 'text-(--text) shadow-sm' : 'border'
                    }`}
                    style={
                      location.pathname === item.to
                        ? {
                            background: isDark
                              ? 'rgba(59,130,246,0.28)'
                              : 'rgba(37,99,235,0.12)',
                            color: isDark ? '#f5f7ff' : 'var(--text)',
                          }
                        : mobileActionButtonStyle
                    }
                  >
                    {item.label}
                  </Link>
                ))}

              {authUser && (
                <Link
                  to="/profile"
                  className="shrink-0 rounded-full border px-3 py-2 text-xs font-semibold"
                  style={mobileActionButtonStyle}
                >
                  Profile
                </Link>
              )}

              <button
                type="button"
                onClick={() => dispatch(toggleTheme())}
                className="shrink-0 rounded-full border px-3 py-2 text-xs font-semibold"
                style={mobileActionButtonStyle}
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>

              {authUser && (
                <>
                  <span
                    className="shrink-0 rounded-full border border-dashed px-3 py-2 text-[11px] font-medium text-(--muted)"
                    style={mobileActionButtonStyle}
                  >
                    Swipe to see more
                  </span>
                  <Link
                    to="/profile/subjects"
                    className="shrink-0 rounded-full border px-3 py-2 text-xs font-semibold"
                    style={mobileActionButtonStyle}
                  >
                    Subjects
                  </Link>
                  <div
                    className="flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold"
                    style={mobileActionButtonStyle}
                  >
                    <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-(--border) bg-(--card-strong) text-[10px] font-bold">
                      {authUser.avatarUrl ? (
                        <img src={authUser.avatarUrl} alt={authUser.name} className="h-full w-full object-cover" />
                    ) : (
                      String(authUser.name || authUser.username || 'U').charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="max-w-[110px] truncate">@{authUser.username}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="shrink-0 cursor-pointer rounded-full border px-3 py-2 text-xs font-semibold"
                    style={mobileActionButtonStyle}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <div aria-hidden="true" className="h-28 sm:h-30 lg:h-28" />
    </>
  )
}

export default Header
