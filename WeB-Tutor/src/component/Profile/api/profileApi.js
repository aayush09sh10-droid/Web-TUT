import { parseJsonResponse } from '../../../shared/auth/authSession'
import { buildAuthenticatedRequestOptions } from '../../../shared/auth/requestOptions'
import { buildApiUrl } from '../../../shared/config/apiBase'

export async function fetchProfile(authToken, signal) {
  const res = await fetch(
    buildApiUrl('/api/auth/me'),
    buildAuthenticatedRequestOptions(authToken, { signal })
  )

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load profile.')
  }

  return payload
}

export async function changePassword(authToken, passwordForm) {
  const res = await fetch(
    buildApiUrl('/api/auth/change-password'),
    buildAuthenticatedRequestOptions(authToken, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }),
    })
  )

  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to change password.')
  }

  return payload
}
