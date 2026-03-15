import React from 'react'

function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg)] py-6 text-[var(--muted)]">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 text-center text-xs sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} YouTube Summarizer</span>
        <span>Powered by YouTube transcripts + AI.</span>
      </div>
    </footer>
  )
}

export default Footer
