import React, { useEffect, useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { queryKeys, setProfileCache } from '../../cache'
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
  const authUser = useAppSelector((state) => state.auth.auth?.user)
  const authToken = useAppSelector((state) => state.auth.auth?.token)
  const {
    error,
    passwordForm,
  } = useAppSelector((state) => state.profile)
  const isDark = theme === 'dark'
  const panelStyle = useMemo(() => getProfilePanelStyle(isDark), [isDark])

  const profileQuery = useQuery({
    queryKey: queryKeys.profile(authToken),
    enabled: Boolean(authUser),
    queryFn: ({ signal }) => fetchProfile(authToken, signal),
  })

  const changePasswordMutation = useMutation({
    mutationFn: (nextPasswordForm) => changePassword(authToken, nextPasswordForm),
  })

  useEffect(() => {
    dispatch(setProfileLoading(profileQuery.isLoading || profileQuery.isFetching))
  }, [dispatch, profileQuery.isFetching, profileQuery.isLoading])

  useEffect(() => {
    if (profileQuery.data) {
      dispatch(setProfileError(''))
      dispatch(setProfileData(profileQuery.data))
      setProfileCache(authToken, profileQuery.data)
    }
  }, [authToken, dispatch, profileQuery.data])

  useEffect(() => {
    if (profileQuery.error && profileQuery.error.name !== 'AbortError') {
      dispatch(setProfileError(profileQuery.error.message || 'Unexpected error'))
    }
  }, [dispatch, profileQuery.error])

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
      const payload = await changePasswordMutation.mutateAsync(passwordForm)
      dispatch(setPasswordMessage(payload.message || 'Password updated successfully.'))
      dispatch(resetPasswordForm())
    } catch (err) {
      dispatch(setPasswordError(err.message || 'Unexpected error'))
    } finally {
      dispatch(setPasswordLoading(false))
    }
  }

  return (
    <main className="min-h-screen text-(--text)">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 pb-10 pt-6 sm:px-4 sm:pt-8">
        <div className="rounded-[1.9rem] border p-5 shadow-(--shadow) backdrop-blur-xl sm:p-6" style={panelStyle}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Profile</h2>
              <p className="mt-2 text-sm text-(--muted)">
                Review your saved lessons and manage your account in one place.
              </p>
            </div>
            <div className="rounded-full border border-(--border) bg-(--card-strong) px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-(--muted)">
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
