import React, { useEffect, useMemo } from 'react'
import { changePassword, fetchProfile } from './api/profileApi'
import PasswordSettingsCard from './components/PasswordSettingsCard'
import ProfileSummaryCard from './components/ProfileSummaryCard'
import {
  resetPasswordForm,
  setPasswordError,
  setPasswordLoading,
  setPasswordMessage,
  setProfileData,
  setProfileError,
  setProfileLoading,
  togglePasswordForm,
  updatePasswordField,
} from './store/profileSlice'
import { getProfilePanelStyle } from './utils/profileStyles'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

function Profile() {
  const dispatch = useAppDispatch()
  const theme = useAppSelector((state) => state.auth.theme)
  const authToken = useAppSelector((state) => state.auth.auth?.token)
  const {
    error,
    passwordForm,
  } = useAppSelector((state) => state.profile)
  const isDark = theme === 'dark'
  const panelStyle = useMemo(() => getProfilePanelStyle(isDark), [isDark])

  useEffect(() => {
    if (!authToken) return

    const controller = new AbortController()

    async function loadProfile() {
      dispatch(setProfileLoading(true))
      dispatch(setProfileError(''))

      try {
        dispatch(setProfileData(await fetchProfile(authToken, controller.signal)))
      } catch (err) {
        if (err.name !== 'AbortError') {
          dispatch(setProfileError(err.message || 'Unexpected error'))
        }
      } finally {
        if (!controller.signal.aborted) {
          dispatch(setProfileLoading(false))
        }
      }
    }

    loadProfile()
    return () => controller.abort()
  }, [authToken, dispatch])

  async function handleChangePassword(e) {
    e.preventDefault()
    dispatch(setPasswordError(''))
    dispatch(setPasswordMessage(''))

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      dispatch(setPasswordError('New passwords do not match.'))
      return
    }

    dispatch(setPasswordLoading(true))

    try {
      const payload = await changePassword(authToken, passwordForm)
      dispatch(setPasswordMessage(payload.message || 'Password updated successfully.'))
      dispatch(resetPasswordForm())
    } catch (err) {
      dispatch(setPasswordError(err.message || 'Unexpected error'))
    } finally {
      dispatch(setPasswordLoading(false))
    }
  }

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

        {error && <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <ProfileSummaryCard panelStyle={panelStyle} />
          <PasswordSettingsCard panelStyle={panelStyle} onSubmit={handleChangePassword} onToggle={() => dispatch(togglePasswordForm())} onUpdateField={(field, value) => dispatch(updatePasswordField({ field, value }))} />
        </div>
      </section>
    </main>
  )
}

export default Profile
