export function getProfilePanelStyle(isDark) {
  return {
    borderColor: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.22)',
    background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.94)',
    boxShadow: isDark ? '0 16px 36px rgba(2,6,23,0.28)' : '0 12px 28px rgba(15,23,42,0.08)',
  }
}
