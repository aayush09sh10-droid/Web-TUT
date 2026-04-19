import { buildApiUrl } from '../../../shared/config/apiBase'

export async function fetchProfile(authToken, signal) {
  const res = await fetch(buildApiUrl('/api/auth/me'), {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    signal,
  })

  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load profile.')
  }

  return payload
}

export async function changePassword(authToken, passwordForm) {
  const res = await fetch(buildApiUrl('/api/auth/change-password'), {
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

  return payload
}
