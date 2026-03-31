import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'

function normalizeSummaryPayload(result) {
  const summary = result?.summary

  if (summary && typeof summary === 'object') {
    return {
      title: summary.title || 'Video Summary',
      timeline: Array.isArray(summary.timeline) ? summary.timeline : [],
      paragraphs: summary.paragraphs || {},
    }
  }

  const fallbackText = result?.summary || result?.detailedSummary || result?.overview || ''

  return {
    title: 'Video Summary',
    timeline: [],
    paragraphs: {
      overview: fallbackText,
      coreIdeas: '',
      exploreMore: '',
    },
  }
}

export default function History({ authToken }) {
  const [history, setHistory] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!authToken) return

    const controller = new AbortController()

    async function loadHistory() {
      try {
        const res = await fetch(`${API_BASE}/api/history`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          signal: controller.signal,
        })

        const payload = await res.json()
        if (!res.ok) {
          throw new Error(payload?.error || 'Failed to load history.')
        }

        setHistory(Array.isArray(payload.history) ? payload.history : [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('History load error:', err)
        }
      }
    }

    loadHistory()

    return () => controller.abort()
  }, [authToken])

  function saveHistory(items) {
    setHistory(items)
  }

  async function clearHistory() {
    const res = await fetch(`${API_BASE}/api/history`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    const payload = await res.json()
    if (!res.ok) {
      throw new Error(payload?.error || 'Failed to clear history.')
    }

    saveHistory([])
    setSelected(null)
  }

  function selectItem(item) {
    setSelected(item)
  }

  async function removeItem(item) {
    const res = await fetch(`${API_BASE}/api/history/${item.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    const payload = await res.json()
    if (!res.ok) {
      throw new Error(payload?.error || 'Failed to delete history item.')
    }

    const remaining = history.filter((h) => h.id !== item.id)
    saveHistory(remaining)
    if (selected?.id === item.id) {
      setSelected(null)
    }
  }

  const selectedResult = selected?.result
  const normalizedSummary = normalizeSummaryPayload(selectedResult)
  const summaryParagraphs = [
    normalizedSummary.paragraphs.overview,
    normalizedSummary.paragraphs.coreIdeas,
    normalizedSummary.paragraphs.exploreMore,
  ].filter(Boolean)

  return (
    <main className="min-h-screen text-[var(--text)]">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 pb-10 pt-6 sm:px-4 sm:pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Search History</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              View previously summarized videos. Click an item to review its summary.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex">
            <Link
              to="/"
              className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-center text-xs font-medium transition hover:-translate-y-0.5"
            >
              Back to Home
            </Link>
            <button
              type="button"
              onClick={clearHistory}
              className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-center text-xs font-medium transition hover:-translate-y-0.5"
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--text)] shadow-[var(--shadow)] backdrop-blur-xl">
                No history yet. Summarize a video to populate this list.
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.timestamp}
                  className="flex flex-col gap-3 rounded-[1.4rem] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow)] backdrop-blur-xl sm:flex-row sm:items-start sm:justify-between"
                >
                  <button
                    type="button"
                    onClick={() => selectItem(item)}
                    className="min-w-0 text-left"
                  >
                    <div className="max-w-full break-all font-medium text-[var(--text)] sm:w-56 sm:truncate sm:break-normal">
                      {item.url}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    className="self-start text-xs font-medium text-[var(--text)] opacity-80 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedResult ? (
              <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow)] backdrop-blur-xl sm:p-6">
                <h3 className="text-lg font-semibold">Summary details</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  The summary is displayed below.
                </p>

                <div className="mt-4 rounded-[1.2rem] border border-[var(--border)] bg-[var(--card-strong)] p-4">
                  <h4 className="text-base font-semibold text-[var(--text)]">
                    {normalizedSummary.title}
                  </h4>

                  {normalizedSummary.timeline.length > 0 && (
                    <div className="mt-4 space-y-2 border-b border-[var(--border)] pb-4">
                      <h5 className="text-sm font-semibold text-[var(--text)]">Timeline</h5>
                      {normalizedSummary.timeline.map((item, index) => (
                        <div
                          key={`${item.timestamp}-${index}`}
                          className="flex flex-col gap-1 text-sm text-[var(--text)] sm:flex-row sm:gap-3"
                        >
                          <span className="font-semibold sm:min-w-16">{item.timestamp}</span>
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 space-y-3">
                    {summaryParagraphs.length > 0 ? (
                      summaryParagraphs.map((paragraph, index) => (
                        <p
                          key={index}
                          className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]"
                        >
                          {paragraph}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm leading-relaxed text-[var(--text)]">
                        No summary was available for this item.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--text)] shadow-[var(--shadow)] backdrop-blur-xl sm:p-6">
                Select a history item to view its summary.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

