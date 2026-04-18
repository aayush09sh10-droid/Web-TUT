function getAuthCookieName() {
  return 'webtutor_session'
}

function isProduction() {
  return String(process.env.NODE_ENV || '').toLowerCase() === 'production'
}

function hasCrossSiteFrontendOrigin() {
  const configuredOrigins = String(
    process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN || ''
  )
    .split(',')
    .map((origin) => origin.trim().toLowerCase())
    .filter(Boolean)

  return configuredOrigins.some(
    (origin) =>
      (origin.startsWith('https://') || origin.startsWith('http://')) &&
      !origin.includes('localhost') &&
      !origin.includes('127.0.0.1')
  )
}

function getCookieSameSite() {
  const configuredSameSite = String(process.env.AUTH_COOKIE_SAME_SITE || '').trim().toLowerCase()

  if (['strict', 'lax', 'none'].includes(configuredSameSite)) {
    return configuredSameSite
  }

  if (isProduction() && hasCrossSiteFrontendOrigin()) {
    return 'none'
  }

  return 'lax'
}

function getCookieSecureValue(sameSite) {
  const configuredSecure = String(process.env.AUTH_COOKIE_SECURE || '').trim().toLowerCase()

  if (['true', '1', 'yes', 'on'].includes(configuredSecure)) {
    return true
  }

  if (['false', '0', 'no', 'off'].includes(configuredSecure)) {
    return false
  }

  // SameSite=None requires Secure in browsers.
  return sameSite === 'none' ? true : isProduction()
}

function getCookieDomain() {
  const configuredDomain = String(process.env.AUTH_COOKIE_DOMAIN || '').trim()
  return configuredDomain || undefined
}

function getAuthCookieOptions() {
  const maxAgeDays = Number(process.env.AUTH_COOKIE_DAYS || 30)
  const sameSite = getCookieSameSite()
  const secure = getCookieSecureValue(sameSite)

  return {
    httpOnly: true,
    sameSite,
    secure,
    domain: getCookieDomain(),
    path: '/',
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
  }
}

function clearAuthCookie(res) {
  const sameSite = getCookieSameSite()
  const secure = getCookieSecureValue(sameSite)

  res.clearCookie(getAuthCookieName(), {
    httpOnly: true,
    sameSite,
    secure,
    domain: getCookieDomain(),
    path: '/',
  })
}

module.exports = {
  getAuthCookieName,
  getAuthCookieOptions,
  clearAuthCookie,
}
