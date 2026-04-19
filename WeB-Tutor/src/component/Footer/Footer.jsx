import React from 'react'
import { useAppSelector } from '../../store/hooks'

function Footer() {
  const theme = useAppSelector((state) => state.auth.theme)
  const { brandName, tagline, badgeText } = useAppSelector((state) => state.footer)
  const isDark = theme === 'dark'

  return (
    <footer className="px-3 pb-8 pt-12 text-(--muted) sm:px-4 sm:pt-14">
      <div className="mx-auto max-w-5xl">
        <div
          className="rounded-[2rem] border px-4 py-5 backdrop-blur-xl sm:px-6"
          style={{
            borderColor: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.22)',
            background: isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)',
            boxShadow: isDark ? '0 14px 30px rgba(2,6,23,0.28)' : '0 10px 24px rgba(15,23,42,0.08)',
          }}
        >
          <div className="flex flex-col items-center gap-4 text-center text-xs sm:flex-row sm:justify-between sm:text-left">
            <div className="max-w-md">
              <p className="text-sm font-bold text-(--text)">{brandName}</p>
              <p className="mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                {tagline}
              </p>
            </div>
            <div
              className="rounded-full border px-4 py-2 text-[11px] font-semibold"
              style={{
                borderColor: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.22)',
                background: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.92)',
                color: isDark ? '#f5f7ff' : 'var(--text)',
              }}
            >
              &copy; {new Date().getFullYear()} {badgeText}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
