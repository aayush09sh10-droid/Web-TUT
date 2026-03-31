import React from 'react'

function Footer({ theme }) {
  const isDark = theme === 'dark'

  return (
    <footer className="px-3 pb-8 pt-12 text-[var(--muted)] sm:px-4 sm:pt-14">
      <div className="mx-auto max-w-5xl">
        <div
          className="rounded-[2rem] border px-4 py-5 backdrop-blur-xl sm:px-6"
          style={{
            borderColor: isDark ? 'rgba(135,154,255,0.18)' : 'rgba(255,186,120,0.35)',
            background: isDark
              ? 'linear-gradient(135deg, rgba(22,27,46,0.92), rgba(16,20,35,0.96))'
              : 'linear-gradient(135deg, rgba(255,250,242,0.9), rgba(255,238,222,0.96), rgba(239,246,255,0.9))',
            boxShadow: isDark
              ? '0 20px 46px rgba(0,0,0,0.38)'
              : '0 20px 52px rgba(242,139,64,0.16)',
          }}
        >
          <div className="flex flex-col items-center gap-4 text-center text-xs sm:flex-row sm:justify-between sm:text-left">
            <div className="max-w-md">
              <p className="text-sm font-bold text-[var(--text)]">YouTube Summarizer</p>
              <p
                className="mt-1 leading-relaxed"
                style={{ color: isDark ? '#dbe5ff' : 'var(--muted)' }}
              >
                Turn videos into a study playground with summaries, quizzes, and guided lessons.
              </p>
            </div>
            <div
              className="rounded-full border px-4 py-2 text-[11px] font-semibold"
              style={{
                borderColor: isDark ? 'rgba(160,176,255,0.16)' : 'rgba(122,91,81,0.12)',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.68)',
                color: isDark ? '#f5f7ff' : 'var(--text)',
              }}
            >
              &copy; {new Date().getFullYear()} Built for playful learning
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
