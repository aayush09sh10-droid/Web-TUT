import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'

function Profile({ theme = 'light', authToken, authUser }) {
  const isDark = theme === 'dark'
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const panelStyle = useMemo(
    () => ({
      borderColor: isDark ? 'rgba(135,154,255,0.18)' : 'rgba(255,186,120,0.35)',
      background: isDark
        ? 'linear-gradient(135deg, rgba(22,27,46,0.96), rgba(16,20,35,0.98))'
        : 'linear-gradient(135deg, rgba(255,250,242,0.92), rgba(255,238,222,0.98), rgba(239,246,255,0.92))',
      boxShadow: isDark ? '0 20px 52px rgba(0,0,0,0.38)' : '0 18px 44px rgba(242,139,64,0.14)',
    }),
    [isDark]
  )

  useEffect(() => {
    if (!authToken) return

    const controller = new AbortController()

    async function loadProfile() {
      setLoading(true)
      setError('')

      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          signal: controller.signal,
        })

        const payload = await res.json()
        if (!res.ok) {
          throw new Error(payload?.error || 'Failed to load profile.')
        }

        setProfile(payload)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Unexpected error')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => controller.abort()
  }, [authToken])

  function updateField(field, value) {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handlePasswordToggle() {
    setShowPasswordForm((current) => !current)
    setPasswordError('')
    setPasswordMessage('')
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordError('')
    setPasswordMessage('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setPasswordLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to change password.')
      }

      setPasswordMessage(payload.message || 'Password updated successfully.')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      setPasswordError(err.message || 'Unexpected error')
    } finally {
      setPasswordLoading(false)
    }
  }

  const user = profile?.user || authUser
  const learning = profile?.learning

  return (
    <main className="min-h-screen text-[var(--text)]">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 pb-10 pt-6 sm:px-4 sm:pt-8">
        <div className="rounded-[1.9rem] border p-5 shadow-[var(--shadow)] backdrop-blur-xl sm:p-6" style={panelStyle}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Profile</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Review your saved lessons and manage your account in one place.
              </p>
            </div>
            <div className="rounded-full border border-[var(--border)] bg-[var(--card-strong)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Study archive
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.9rem] border p-5 backdrop-blur-xl sm:p-6" style={panelStyle}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.6rem] border border-[var(--border)] bg-[var(--card-strong)]">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-[var(--muted)]">
                    {String(user?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <h3 className="text-xl font-semibold">{user?.name || 'User'}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">@{user?.username || 'username'}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{user?.email || 'email@example.com'}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Summaries</p>
                <p className="mt-2 text-2xl font-bold">{loading ? '...' : learning?.totalSummaries || 0}</p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Quizzes</p>
                <p className="mt-2 text-2xl font-bold">{loading ? '...' : learning?.totalQuizzes || 0}</p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Teaching</p>
                <p className="mt-2 text-2xl font-bold">{loading ? '...' : learning?.totalTeachingSessions || 0}</p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Doubts Solved</p>
                <p className="mt-2 text-2xl font-bold">{loading ? '...' : learning?.totalDoubts || 0}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.3rem] border border-[var(--border)] bg-[var(--card-strong)] p-4">
              <h4 className="text-base font-semibold">What you have learnt</h4>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Open any saved lesson to see the full summary, teaching, doubts, and quiz progress.
              </p>
              {loading ? (
                <p className="mt-3 text-sm text-[var(--muted)]">Loading your recent learning...</p>
              ) : learning?.recentLearning?.length ? (
                <div className="mt-3 space-y-3">
                  {learning.recentLearning.map((item) => (
                    <Link
                      key={item.id}
                      to={`/profile/learning/${item.id}`}
                      className="block rounded-[1.2rem] border border-[var(--border)] bg-[var(--card)] px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(0,0,0,0.08)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{item.title}</p>
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            Click to open the full lesson details
                          </p>
                        </div>
                        <span className="rounded-full border border-[var(--border)] bg-[var(--card-strong)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted)]">
                          Open
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  No learning history yet. Start summarizing videos or notes to build your profile.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[1.9rem] border p-5 backdrop-blur-xl sm:p-6" style={panelStyle}>
            <h3 className="text-xl font-semibold">Password Settings</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Open the password section only when you want to update your account security.
            </p>

            <button
              type="button"
              onClick={handlePasswordToggle}
              className="mt-5 w-full rounded-[1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm font-semibold text-[var(--text)] transition hover:-translate-y-0.5"
            >
              {showPasswordForm ? 'Hide Change Password' : 'Change Password'}
            </button>

            {showPasswordForm && (
              <form className="mt-5 space-y-3" onSubmit={handleChangePassword}>
                <input
                  value={passwordForm.currentPassword}
                  onChange={(e) => updateField('currentPassword', e.target.value)}
                  type="password"
                  placeholder="Current password"
                  className="w-full rounded-[1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm outline-none"
                />
                <input
                  value={passwordForm.newPassword}
                  onChange={(e) => updateField('newPassword', e.target.value)}
                  type="password"
                  placeholder="New password"
                  className="w-full rounded-[1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm outline-none"
                />
                <input
                  value={passwordForm.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full rounded-[1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm outline-none"
                />

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full rounded-[1rem] px-4 py-3 text-sm font-semibold text-[var(--bg)] transition disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
                >
                  {passwordLoading ? 'Updating password...' : 'Update Password'}
                </button>
              </form>
            )}

            {passwordMessage && (
              <p className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {passwordMessage}
              </p>
            )}

            {passwordError && (
              <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {passwordError}
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default Profile
