export function getProfilePanelStyle(isDark) {
  return {
    borderColor: isDark ? 'rgba(135,154,255,0.18)' : 'rgba(255,186,120,0.35)',
    background: isDark
      ? 'linear-gradient(135deg, rgba(22,27,46,0.96), rgba(16,20,35,0.98))'
      : 'linear-gradient(135deg, rgba(255,250,242,0.92), rgba(255,238,222,0.98), rgba(239,246,255,0.92))',
    boxShadow: isDark ? '0 20px 52px rgba(0,0,0,0.38)' : '0 18px 44px rgba(242,139,64,0.14)',
  }
}
