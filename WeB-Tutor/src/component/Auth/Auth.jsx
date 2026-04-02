import React, { useMemo, useState } from 'react'
import { setAuth } from './store/authSlice'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'

function Auth() {
  const dispatch = useAppDispatch()
  const theme = useAppSelector((state) => state.auth.theme)
  const isDark = theme === 'dark'
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    identifier: '',
  })
  const [avatar, setAvatar] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cardStyle = useMemo(
    () => ({
      borderColor: isDark ? 'rgba(135,154,255,0.18)' : 'rgba(255,186,120,0.35)',
      background: isDark
        ? 'linear-gradient(135deg, rgba(22,27,46,0.96), rgba(16,20,35,0.98))'
        : 'linear-gradient(135deg, rgba(255,250,242,0.92), rgba(255,238,222,0.98), rgba(239,246,255,0.92))',
      boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.4)' : '0 20px 56px rgba(242,139,64,0.16)',
    }),
    [isDark]
  )

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const body = new FormData()
      body.append('name', form.name.trim())
      body.append('username', form.username.trim())
      body.append('email', form.email.trim())
      body.append('password', form.password)

      if (avatar) {
        body.append('avatar', avatar)
      }

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        body,
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to register.')
      }

      dispatch(setAuth({ token: payload.token, user: payload.user }))
    } catch (err) {
      setError(err.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: form.identifier.trim(),
          password: form.password,
        }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to login.')
      }

      dispatch(setAuth({ token: payload.token, user: payload.user }))
    } catch (err) {
      setError(err.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-12rem)] px-3 py-6 text-[var(--text)] sm:px-4 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border p-6 backdrop-blur-xl sm:p-8" style={cardStyle}>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Welcome</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Save your study space with your own account
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              Create one personal account to keep your summaries, quiz flow, and guided learning in one place. You can register with email and username, then log in using your username or email plus password.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {['Register with name, username, and email', 'Login using username or email'].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.3rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-4 text-sm leading-relaxed"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border p-5 backdrop-blur-xl sm:p-6" style={cardStyle}>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError('')
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === 'login'
                    ? 'bg-[var(--text)] text-[var(--bg)]'
                    : 'border border-[var(--border)] bg-[var(--card)] text-[var(--text)]'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register')
                  setError('')
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === 'register'
                    ? 'bg-[var(--text)] text-[var(--bg)]'
                    : 'border border-[var(--border)] bg-[var(--card)] text-[var(--text)]'
                }`}
              >
                Register
              </button>
            </div>

            {mode === 'register' ? (
              <form className="mt-5 space-y-3" onSubmit={handleRegister}>
                <input value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Full name" className="w-full rounded-[1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm outline-none" />
                <input value={form.username} onChange={(e) => updateField('username', e.target.value)} placeholder="Username" className="w-full rounded-[1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm outline-none" />
                <input value={form.email} onChange={(e) => updateField('email', e.target.value)} type="email" placeholder="Email" className="w-full rounded-[1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm outline-none" />
                <input value={form.password} onChange={(e) => updateField('password', e.target.value)} type="password" placeholder="Password" className="w-full rounded-[1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm outline-none" />
                <input value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} type="password" placeholder="Confirm password" className="w-full rounded-[1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm outline-none" />
                <label className="block rounded-[1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm">
                  <span className="font-medium">Profile image</span>
                  <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] || null)} className="mt-2 block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-[var(--text)] file:px-3 file:py-2 file:font-semibold file:text-[var(--bg)]" />
                </label>

                <button type="submit" disabled={loading} className="w-full rounded-[1rem] px-4 py-3 text-sm font-semibold text-[var(--bg)] transition disabled:opacity-60" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            ) : (
              <form className="mt-5 space-y-3" onSubmit={handleLogin}>
                <input value={form.identifier} onChange={(e) => updateField('identifier', e.target.value)} placeholder="Username or email" className="w-full rounded-[1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm outline-none" />
                <input value={form.password} onChange={(e) => updateField('password', e.target.value)} type="password" placeholder="Password" className="w-full rounded-[1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm outline-none" />

                <button type="submit" disabled={loading} className="w-full rounded-[1rem] px-4 py-3 text-sm font-semibold text-[var(--bg)] transition disabled:opacity-60" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
                  {loading ? 'Signing in...' : 'Login'}
                </button>
              </form>
            )}
            {error && (
              <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default Auth
