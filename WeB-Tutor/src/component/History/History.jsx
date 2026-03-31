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
  const quiz = selectedResult?.quiz
  const teaching = selectedResult?.teaching
  const doubt = selectedResult?.doubt
  const selectedTopicTitles = teaching?.topics?.map((topic) => topic.title).filter(Boolean) || []

  return (
    <main className="min-h-screen text-[var(--text)]">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 pb-10 pt-6 sm:px-4 sm:pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Search History</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Open any saved item to review the full learning session, including summary, quiz, teaching, and doubts.
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
                      {item.result?.summary?.title || item.url}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.result?.quiz && (
                        <span className="rounded-full border border-[var(--border)] bg-[var(--card-strong)] px-2.5 py-1 text-[11px] text-[var(--muted)]">
                          Quiz
                        </span>
                      )}
                      {item.result?.teaching && (
                        <span className="rounded-full border border-[var(--border)] bg-[var(--card-strong)] px-2.5 py-1 text-[11px] text-[var(--muted)]">
                          Teaching
                        </span>
                      )}
                      {item.result?.doubt && (
                        <span className="rounded-full border border-[var(--border)] bg-[var(--card-strong)] px-2.5 py-1 text-[11px] text-[var(--muted)]">
                          Doubt
                        </span>
                      )}
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
                <h3 className="text-lg font-semibold">Learning details</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Everything you explored in this study session is saved below.
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

                {quiz?.questions?.length > 0 && (
                  <div className="mt-4 rounded-[1.2rem] border border-[var(--border)] bg-[var(--card-strong)] p-4">
                    <h4 className="text-base font-semibold text-[var(--text)]">
                      {quiz.title || 'Saved Quiz'}
                    </h4>
                    <div className="mt-4 space-y-4">
                      {quiz.questions.map((question, index) => (
                        <div
                          key={question.id || index}
                          className="rounded-[1rem] border border-[var(--border)] bg-[var(--card)] p-4"
                        >
                          <p className="text-sm font-semibold text-[var(--text)]">
                            {index + 1}. {question.question}
                          </p>
                          <div className="mt-3 space-y-2">
                            {question.options?.map((option, optionIndex) => (
                              <div
                                key={`${question.id || index}-${optionIndex}`}
                                className={`rounded-xl border px-3 py-2 text-sm ${
                                  question.answerIndex === optionIndex
                                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                                    : 'border-[var(--border)] bg-[var(--card-strong)] text-[var(--text)]'
                                }`}
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                          {question.explanation && (
                            <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
                              Explanation: {question.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {teaching?.topics?.length > 0 && (
                  <div className="mt-4 rounded-[1.2rem] border border-[var(--border)] bg-[var(--card-strong)] p-4">
                    <h4 className="text-base font-semibold text-[var(--text)]">
                      {teaching.title || 'Teaching Path'}
                    </h4>
                    {teaching.intro && (
                      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{teaching.intro}</p>
                    )}
                    {selectedTopicTitles.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedTopicTitles.map((topic) => (
                          <span
                            key={topic}
                            className="rounded-full border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 text-[11px] text-[var(--muted)]"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 space-y-4">
                      {teaching.topics.map((topic, index) => (
                        <div
                          key={topic.id || index}
                          className="rounded-[1rem] border border-[var(--border)] bg-[var(--card)] p-4"
                        >
                          <p className="text-sm font-semibold text-[var(--text)]">{topic.title}</p>
                          {topic.summary && (
                            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{topic.summary}</p>
                          )}
                          {topic.lesson && (
                            <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">{topic.lesson}</p>
                          )}
                          {Array.isArray(topic.notes) && topic.notes.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {topic.notes.map((note, noteIndex) => (
                                <p
                                  key={`${topic.id || index}-note-${noteIndex}`}
                                  className="rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-3 py-2 text-sm text-[var(--text)]"
                                >
                                  {note}
                                </p>
                              ))}
                            </div>
                          )}
                          {topic.reflectionQuestion && (
                            <p className="mt-3 text-xs font-medium text-[var(--muted)]">
                              Reflection: {topic.reflectionQuestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {doubt?.answer && (
                  <div className="mt-4 rounded-[1.2rem] border border-[var(--border)] bg-[var(--card-strong)] p-4">
                    <h4 className="text-base font-semibold text-[var(--text)]">
                      {doubt.answer.title || 'Saved Doubt'}
                    </h4>
                    {doubt.question && (
                      <p className="mt-2 text-sm text-[var(--muted)]">Question: {doubt.question}</p>
                    )}
                    {doubt.answer.explanation && (
                      <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">
                        {doubt.answer.explanation}
                      </p>
                    )}
                    {Array.isArray(doubt.answer.steps) && doubt.answer.steps.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {doubt.answer.steps.map((step, index) => (
                          <p
                            key={`step-${index}`}
                            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)]"
                          >
                            {step}
                          </p>
                        ))}
                      </div>
                    )}
                    {doubt.answer.keyTakeaway && (
                      <p className="mt-3 text-xs font-medium text-[var(--muted)]">
                        Key takeaway: {doubt.answer.keyTakeaway}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--text)] shadow-[var(--shadow)] backdrop-blur-xl sm:p-6">
                Select a history item to view its full learning session.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

