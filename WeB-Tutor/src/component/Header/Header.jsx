import React from 'react'
import { Link, useLocation } from 'react-router-dom'

function Header({ theme, setTheme }) {
  const location = useLocation()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/history', label: 'History' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)] text-[var(--text)] shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-lg font-semibold">YouTube Summarizer</h1>
          <p className="text-xs text-[var(--muted)]">
            Paste a YouTube link to get a teaching-style summary with key concepts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <nav className="flex gap-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                  location.pathname === item.to
                    ? 'bg-[var(--text)] text-[var(--bg)]'
                    : 'bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--text)] hover:text-[var(--bg)]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setTheme(nextTheme)}
            className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)]"
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
