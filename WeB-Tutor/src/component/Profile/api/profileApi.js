import { parseJsonResponse } from '../../../shared/auth/authSession'
import { buildAuthenticatedRequestOptions } from '../../../shared/auth/requestOptions'
import { buildApiUrl } from '../../../shared/config/apiBase'

async function fetchWithSessionFallback(path, authToken, options = {}) {
  const requestUrl = buildApiUrl(path)
  let res = await fetch(
    requestUrl,
    buildAuthenticatedRequestOptions(authToken, options)
  )

  if (res.status === 401 && authToken) {
    res = await fetch(
      requestUrl,
      buildAuthenticatedRequestOptions('', options)
    )
  }

  return res
}

export async function fetchProfile(authToken, signal) {
  const res = await fetchWithSessionFallback('/api/auth/me', authToken, { signal })

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
