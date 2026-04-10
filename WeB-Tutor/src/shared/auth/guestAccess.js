const GUEST_SUMMARY_LIMIT_KEY = 'webtutor-guest-summary-used'

export function hasUsedGuestSummary() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(GUEST_SUMMARY_LIMIT_KEY) === 'true'
}

export function markGuestSummaryUsed() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(GUEST_SUMMARY_LIMIT_KEY, 'true')
}
