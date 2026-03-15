import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const HISTORY_STORAGE_KEY = 'yt-summarizer-history'

export default function History() {
  const [history, setHistory] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        setHistory(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  function saveHistory(items) {
    setHistory(items)
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items))
  }

  function clearHistory() {
    saveHistory([])
    setSelected(null)
  }

  function selectItem(item) {
    setSelected(item)
  }

  function removeItem(item) {
    const remaining = history.filter((h) => h.timestamp !== item.timestamp)
    saveHistory(remaining)
    if (selected?.timestamp === item.timestamp) {
      setSelected(null)
    }
  }

  const selectedResult = selected?.result
  const summaryText =
    selectedResult?.summary || selectedResult?.detailedSummary || selectedResult?.overview || ''

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-10 pt-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Search History</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              View previously summarized videos. Click an item to review its summary.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="rounded-full border border-[var(--text)] px-4 py-2 text-xs font-medium hover:bg-[var(--text)] hover:text-[var(--bg)]"
            >
              Back to Home
            </Link>
            <button
              type="button"
              onClick={clearHistory}
              className="rounded-full border border-[var(--text)] px-4 py-2 text-xs font-medium hover:bg-[var(--text)] hover:text-[var(--bg)]"
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="rounded-2xl border border-[var(--text)] bg-[var(--card)] p-6 text-sm text-[var(--text)]">
                No history yet. Summarize a video to populate this list.
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.timestamp}
                  className="flex items-start justify-between rounded-2xl border border-[var(--text)] bg-[var(--card)] p-4"
                >
                  <button
                    type="button"
                    onClick={() => selectItem(item)}
                    className="text-left"
                  >
                    <div className="font-medium text-[var(--text)] truncate w-56">
                      {item.url}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    className="text-xs font-medium text-[var(--text)] opacity-80 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedResult ? (
              <div className="rounded-2xl border border-[var(--text)] bg-[var(--card)] p-6">
                <h3 className="text-lg font-semibold">Summary details</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  The summary is displayed below.
                </p>

                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                  <h4 className="text-base font-semibold text-[var(--text)]">Summary</h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">
                    {summaryText || 'No summary was available for this item.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--text)] bg-[var(--card)] p-6 text-sm text-[var(--text)]">
                Select a history item to view its summary.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

