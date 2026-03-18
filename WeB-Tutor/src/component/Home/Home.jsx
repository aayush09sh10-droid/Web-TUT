import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'
const HISTORY_STORAGE_KEY = 'yt-summarizer-history'

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

function Home() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  useEffect(() => {
    const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) return

      const normalized = parsed.map((item) => {
        if (!item) return item

        // New format: item.result contains the full structured summary.
        if (item.result) return item

        // Legacy format: previously stored summary + keyPoints.
        if (item.summary) {
          return {
            url: item.url,
            timestamp: item.timestamp || Date.now(),
            result: {
              overview: item.summary,
              topics: item.keyPoints || [],
              teachingMethod: '',
              timeline: [],
              detailedSummary: item.summary,
            },
          }
        }

        return item
      })

      setHistory(normalized.filter(Boolean))
    } catch {
      // ignore malformed stored value
    }
  }, [])

  function saveHistory(items) {
    setHistory(items)
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items))
  }

  function addToHistory(item) {
    const deduped = [item, ...history.filter((h) => h.url !== item.url)]
    saveHistory(deduped.slice(0, 12))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!url.trim()) {
      setError('Please paste a valid YouTube video URL.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to summarize.')
      }

      setResult(payload)
      setError('')

      addToHistory({
        url: url.trim(),
        result: payload,
        timestamp: Date.now(),
      })
    } catch (err) {
      setError(err.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  const showResult = Boolean(result)
  const normalizedSummary = normalizeSummaryPayload(result)
  const summaryParagraphs = [
    normalizedSummary.paragraphs.overview,
    normalizedSummary.paragraphs.coreIdeas,
    normalizedSummary.paragraphs.exploreMore,
  ].filter(Boolean)

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <section className="flex flex-1 flex-col overflow-hidden">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pt-8">
          <div>
            <h2 className="text-2xl font-semibold">Summarize a YouTube video</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Paste any YouTube link to get a concise, easy-to-read summary of the video.
            </p>
          </div>

          <div className="mt-6 flex flex-1 flex-col gap-4">
            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
              <div className="flex flex-1 flex-col gap-4 overflow-auto p-6 pb-24">
                {showResult ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                      <h3 className="text-lg font-semibold text-[var(--text)]">
                        {normalizedSummary.title}
                      </h3>
                    </div>

                    {normalizedSummary.timeline.length > 0 && (
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                        <h3 className="text-lg font-semibold text-[var(--text)]">Timeline</h3>
                        <div className="mt-3 space-y-2">
                          {normalizedSummary.timeline.map((item, index) => (
                            <div
                              key={`${item.timestamp}-${index}`}
                              className="flex gap-3 text-sm text-[var(--text)]"
                            >
                              <span className="min-w-16 font-semibold">{item.timestamp}</span>
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                      <h3 className="text-lg font-semibold text-[var(--text)]">Summary</h3>
                      <div className="mt-3 space-y-3">
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
                            No summary was returned by the model.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-center text-sm text-[var(--muted)]">
                    <p>
                      Paste a YouTube link above and click “Summarize” to get a clean, easy-to-read video summary.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <form
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--bg)] px-4 py-5 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
        onSubmit={handleSubmit}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text)] shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl bg-[#1b1b1b] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#111] disabled:cursor-not-allowed disabled:bg-[#444]"
          >
            {loading ? 'Summarizing…' : 'Summarize'}
          </button>
        </div>

        <div className="mx-auto mt-3 flex w-full max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--muted)]">
            Tip: For best results, paste a YouTube URL that has a transcript or subtitles available.
          </p>
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>
      </form>
    </main>
  )
}

export default Home
