import React from 'react'
import { useAppSelector } from '../../../store/hooks'

export default function PasswordSettingsCard({ panelStyle, onToggle, onSubmit, onUpdateField }) {
  const {
    showPasswordForm,
    passwordForm,
    passwordLoading,
    passwordMessage,
    passwordError,
  } = useAppSelector((state) => state.profile)

  return (
    <div className="rounded-[1.9rem] border p-5 backdrop-blur-xl sm:p-6" style={panelStyle}>
      <h3 className="text-xl font-semibold">Password Settings</h3>
      <p className="mt-2 text-sm text-(--muted)">
        Open the password section only when you want to update your account security.
      </p>

      <button type="button" onClick={onToggle} className="mt-5 w-full rounded-2xl border border-(--border) bg-(--card-strong) px-4 py-3 text-sm font-semibold text-(--text) transition hover:-translate-y-0.5">
        {showPasswordForm ? 'Hide Change Password' : 'Change Password'}
      </button>

      {showPasswordForm && (
        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <input value={passwordForm.currentPassword} onChange={(e) => onUpdateField('currentPassword', e.target.value)} type="password" placeholder="Current password" className="w-full rounded-2xl border border-(--border) bg-(--card-strong) px-4 py-3 text-sm outline-none" />
          <input value={passwordForm.newPassword} onChange={(e) => onUpdateField('newPassword', e.target.value)} type="password" placeholder="New password" className="w-full rounded-2xl border border-(--border) bg-(--card-strong) px-4 py-3 text-sm outline-none" />
          <input value={passwordForm.confirmPassword} onChange={(e) => onUpdateField('confirmPassword', e.target.value)} type="password" placeholder="Confirm new password" className="w-full rounded-2xl border border-(--border) bg-(--card-strong) px-4 py-3 text-sm outline-none" />

          <button type="submit" disabled={passwordLoading} className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--bg)] transition disabled:opacity-60" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
            {passwordLoading ? 'Updating password...' : 'Update Password'}
          </button>
        </form>
      )}

      {passwordMessage && <p className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{passwordMessage}</p>}
      {passwordError && <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{passwordError}</p>}
    </div>
  )
}
