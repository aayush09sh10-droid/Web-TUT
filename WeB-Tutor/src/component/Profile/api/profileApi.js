const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'
import { handleProtectedResponse, parseJsonResponse } from '../../../shared/auth/authSession'

export async function fetchProfile(authUser, signal) {
  // If we already have auth user data, return it immediately without API call
  if (authUser && authUser._id) {
    return authUser
  }
  
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    credentials: 'include',
    signal,
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to load profile.')
  }

  return payload
}

export async function changePassword(_authToken, passwordForm) {
  const res = await fetch(`${API_BASE}/api/auth/change-password`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    }),
  })

  handleProtectedResponse(res)
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to change password.')
  }

  return payload
}
