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
  const mobileMenuRef = useRef(null)

  const navItems = [
    { to: '/', label: 'Home', mobileLabel: 'Home' },
    { to: '/history', label: 'Activity Log', mobileLabel: 'Activity' },
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
      const clickedDesktopMenu = menuRef.current && menuRef.current.contains(event.target)
      const clickedMobileMenu = mobileMenuRef.current && mobileMenuRef.current.contains(event.target)

      if (!clickedDesktopMenu && !clickedMobileMenu) {
        dispatch(closeHeaderMenu())
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [dispatch, isMenuOpen])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 px-2 pt-2 text-(--text) transition-all duration-300 sm:px-4 sm:pt-4 ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-[135%] opacity-0'
        }`}
      >
        <div
          className="mx-auto flex max-w-5xl flex-col gap-2 rounded-[1.2rem] border px-2.5 py-2.5 backdrop-blur-xl sm:gap-3 sm:rounded-[1.35rem] sm:px-4 sm:py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:rounded-[1.5rem] md:px-5 md:py-4"
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
                className="h-8 w-8 rounded-xl border border-white/25 bg-white/70 p-1 shadow-[0_12px_24px_rgba(0,0,0,0.08)] sm:h-9 sm:w-9 md:h-11 md:w-11 md:rounded-2xl md:p-1.5"
              />
              <div className="min-w-0">
                <h1 className="text-sm font-extrabold tracking-[0.02em] sm:text-base md:text-lg">WeB-Tutor</h1>
                <p className="hidden text-xs text-(--muted) sm:block">
                  Learn, quiz, and revise from any video in a more playful way.
                </p>
              </div>
            </div>
          </div>

          <div className="hidden w-full md:flex md:w-auto md:flex-row md:items-center md:gap-2">
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

            {!authUser && (
              <>
                <Link
                  to="/?auth=login"
                  className="pressable-control rounded-full border px-4 py-2 text-xs font-medium transition hover:-translate-y-0.5"
                  style={{
                    borderColor: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.22)',
                    background: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.92)',
                    color: isDark ? '#f5f7ff' : 'var(--text)',
                  }}
                >
                  Login
                </Link>
                <Link
                  to="/?auth=register"
                  className="pressable-control rounded-full border px-4 py-2 text-xs font-medium transition hover:-translate-y-0.5"
                  style={{
                    borderColor: 'rgba(99,102,241,0.24)',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.16), rgba(56,189,248,0.14))',
                    color: isDark ? '#f5f7ff' : 'var(--text)',
                  }}
                >
                  Register
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              className="pressable-control rounded-full border px-4 py-2 text-xs font-medium transition hover:-translate-y-0.5"
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
                  className="pressable-control flex items-center justify-center gap-3 rounded-full border px-4 py-2 text-xs font-medium transition hover:-translate-y-0.5"
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

          <div className="md:hidden">
            <div className={`grid items-center gap-1.5 overflow-visible pb-1 ${authUser ? 'grid-cols-[1fr_1.45fr_1.25fr_0.9fr]' : 'grid-cols-[1fr_1fr_0.9fr]'}`}>
              {authUser &&
                navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`min-w-0 rounded-full px-2 py-2 text-center text-[11px] font-semibold transition ${
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
                    {item.mobileLabel}
                  </Link>
                ))}

              {authUser && (
                <div className="relative min-w-0" ref={mobileMenuRef}>
                  <button
                    type="button"
                    onClick={() => dispatch(toggleHeaderMenu())}
                    className="flex w-full min-w-0 items-center justify-center gap-1.5 rounded-full border px-2 py-2 text-[11px] font-semibold"
                    style={mobileActionButtonStyle}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-(--border) bg-(--card-strong) text-[9px] font-bold">
                      {authUser.avatarUrl ? (
                        <img src={authUser.avatarUrl} alt={authUser.name} className="h-full w-full object-cover" />
                      ) : (
                        String(authUser.name || authUser.username || 'U').charAt(0).toUpperCase()
                      )}
                    </span>
                    <span className="truncate">Profile</span>
                    <span aria-hidden="true">{isMenuOpen ? '^' : 'v'}</span>
                  </button>

                  {isMenuOpen && (
                    <div
                      className="absolute right-0 top-full z-50 mt-3 w-48 rounded-[1.1rem] border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
                      style={{
                        borderColor: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.22)',
                        background: isDark ? 'rgba(15,23,42,0.96)' : 'rgba(255,255,255,0.98)',
                      }}
                    >
                      <Link
                        to="/profile"
                        onClick={() => dispatch(closeHeaderMenu())}
                        className="block rounded-[0.9rem] px-3 py-2.5 text-sm font-medium text-(--text) transition hover:bg-(--card)"
                      >
                        Profile Page
                      </Link>
                      <Link
                        to="/profile/subjects"
                        onClick={() => dispatch(closeHeaderMenu())}
                        className="mt-1 block rounded-[0.9rem] px-3 py-2.5 text-sm font-medium text-(--text) transition hover:bg-(--card)"
                      >
                        Subjects
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 block w-full cursor-pointer rounded-[0.9rem] px-3 py-2.5 text-left text-sm font-medium text-(--text) transition hover:bg-(--card)"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!authUser && (
                <>
                  <Link
                    to="/?auth=login"
                    className="pressable-control min-w-0 rounded-full border px-2 py-2 text-center text-[11px] font-semibold"
                    style={mobileActionButtonStyle}
                  >
                    Login
                  </Link>
                  <Link
                    to="/?auth=register"
                    className="pressable-control min-w-0 rounded-full border px-2 py-2 text-center text-[11px] font-semibold"
                    style={{
                      borderColor: 'rgba(99,102,241,0.24)',
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.16), rgba(56,189,248,0.14))',
                      color: isDark ? '#f5f7ff' : 'var(--text)',
                    }}
                  >
                    Register
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={() => dispatch(toggleTheme())}
                className="pressable-control min-w-0 rounded-full border px-2 py-2 text-[11px] font-semibold"
                style={mobileActionButtonStyle}
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>

            </div>
          </div>
        </div>
      </header>
      <div aria-hidden="true" className="h-28 sm:h-30 lg:h-28" />
    </>
  )
}

export default Header
