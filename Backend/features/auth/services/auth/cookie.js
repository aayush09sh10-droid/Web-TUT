function getAuthCookieName() {
  return 'webtutor_session'
}

function getAuthCookieOptions() {
  const maxAgeDays = Number(process.env.AUTH_COOKIE_DAYS || 30)

  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: String(process.env.NODE_ENV || '').toLowerCase() === 'production',
    path: '/',
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
  }
}

function clearAuthCookie(res) {
  res.clearCookie(getAuthCookieName(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: String(process.env.NODE_ENV || '').toLowerCase() === 'production',
    path: '/',
  })
}

module.exports = {
  getAuthCookieName,
  getAuthCookieOptions,
  clearAuthCookie,
}
