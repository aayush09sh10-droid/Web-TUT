import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'
const HOME_STATE_STORAGE_KEY = 'yt-summarizer-home-state'

function normalizeSummaryPayload(result) {
  const summary = result?.summary

  if (summary && typeof summary === 'object') {
    return {
      title: summary.title || 'Saved Summary',
      timeline: Array.isArray(summary.timeline) ? summary.timeline : [],
      paragraphs: summary.paragraphs || {},
    }
  }

  return {
    title: 'Saved Summary',
    timeline: [],
    paragraphs: {
      overview: '',
      coreIdeas: '',
      exploreMore: '',
    },
  }
}

function extractTopics(item) {
  const topicSet = new Set()

  if (item?.result?.summary?.title) {
    topicSet.add(item.result.summary.title)
  }

  if (Array.isArray(item?.result?.summary?.timeline)) {
    item.result.summary.timeline.forEach((entry) => {
      if (entry?.label) {
        topicSet.add(entry.label)
      }
    })
  }

  if (Array.isArray(item?.result?.teaching?.topics)) {
    item.result.teaching.topics.forEach((topic) => {
      if (topic?.title) {
        topicSet.add(topic.title)
      }
    })
  }

  return Array.from(topicSet).filter(Boolean)
}

export default function LearningDetails({ theme = 'light', authToken }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isDark = theme === 'dark'
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const panelStyle = useMemo(
    () => ({
      borderColor: isDark ? 'rgba(135,154,255,0.18)' : 'rgba(255,186,120,0.35)',
      background: isDark
        ? 'linear-gradient(135deg, rgba(22,27,46,0.96), rgba(16,20,35,0.98))'
        : 'linear-gradient(135deg, rgba(255,250,242,0.92), rgba(255,238,222,0.98), rgba(239,246,255,0.92))',
      boxShadow: isDark ? '0 20px 52px rgba(0,0,0,0.38)' : '0 18px 44px rgba(242,139,64,0.14)',
    }),
    [isDark]
  )

  useEffect(() => {
    if (!authToken || !id) return

    const controller = new AbortController()

    async function loadItem() {
      setLoading(true)
      setError('')

      try {
        const res = await fetch(`${API_BASE}/api/history/${id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          signal: controller.signal,
        })

        const payload = await res.json()
        if (!res.ok) {
          throw new Error(payload?.error || 'Failed to load learning details.')
        }

        setItem(payload.item)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Unexpected error')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadItem()

    return () => controller.abort()
  }, [authToken, id])

  const topicsLearnt = extractTopics(item)
  const normalizedSummary = normalizeSummaryPayload(item?.result)
  const summaryParagraphs = [
    normalizedSummary.paragraphs.overview,
    normalizedSummary.paragraphs.coreIdeas,
    normalizedSummary.paragraphs.exploreMore,
  ].filter(Boolean)
  const teachingTopics = item?.result?.teaching?.topics || []
  const formulaSections = item?.result?.formula?.sections || []
  const quizQuestions = item?.result?.quiz?.questions || []
  const quizProgress = item?.result?.quizProgress
  const wrongQuestions = quizProgress?.wrongQuestions || []
  const correctCount = quizProgress?.correctCount || 0
  const totalQuestions = quizProgress?.totalQuestions || quizQuestions.length || 0

  function handleOpenInHome() {
    if (!item?.result) return

    const nextState = {
      url: item.sourceLabel || '',
      inputMode: item.sourceType === 'notes-photo' ? 'notes' : 'video',
      result: item.result,
      activeView: 'summary',
      selectedAnswers: quizProgress?.selectedAnswers || {},
      quizSubmitted: Boolean(quizProgress?.submittedAt),
      activeTopicId: item.result?.teaching?.topics?.[0]?.id || '',
      showComposer: false,
      doubtQuestion: item.result?.doubt?.question || '',
    }

    window.localStorage.setItem(HOME_STATE_STORAGE_KEY, JSON.stringify(nextState))
    navigate('/')
  }

  return (
    <main className="min-h-screen text-[var(--text)]">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 pb-10 pt-6 sm:px-4 sm:pt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {item?.result?.summary?.title || 'Learning details'}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Everything saved for this lesson is here: summary, taught topics, doubts, and quiz performance.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleOpenInHome}
              className="rounded-full px-4 py-2 text-center text-xs font-semibold text-[var(--bg)] transition hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
            >
              Open in Home
            </button>
            <Link
              to="/profile"
              className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-center text-xs font-medium transition hover:-translate-y-0.5"
            >
              Back to Profile
            </Link>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.9rem] border p-5 backdrop-blur-xl sm:p-6" style={panelStyle}>
            <h3 className="text-xl font-semibold">What you have learnt</h3>
            {loading ? (
              <p className="mt-3 text-sm text-[var(--muted)]">Loading your topics...</p>
            ) : topicsLearnt.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {topicsLearnt.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)]"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--muted)]">
                No topic details are available for this learning session yet.
              </p>
            )}

            <div className="mt-6 rounded-[1.3rem] border border-[var(--border)] bg-[var(--card-strong)] p-4">
              <h4 className="text-base font-semibold">What to learn next</h4>
              {wrongQuestions.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {wrongQuestions.map((question) => (
                    <p
                      key={question}
                      className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)]"
                    >
                      Revise: {question}
                    </p>
                  ))}
                </div>
              ) : teachingTopics.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {teachingTopics.slice(0, 4).map((topic) => (
                    <p
                      key={topic.id || topic.title}
                      className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)]"
                    >
                      Practice more: {topic.title}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Generate teaching or complete a quiz to get your next study targets.
                </p>
              )}
            </div>

            <div className="mt-6 rounded-[1.3rem] border border-[var(--border)] bg-[var(--card-strong)] p-4">
              <h4 className="text-base font-semibold">{normalizedSummary.title}</h4>
              {normalizedSummary.timeline.length > 0 && (
                <div className="mt-4 space-y-2 border-b border-[var(--border)] pb-4">
                  <h5 className="text-sm font-semibold text-[var(--text)]">Summary timeline</h5>
                  {normalizedSummary.timeline.map((entry, index) => (
                    <div
                      key={`${entry.timestamp}-${index}`}
                      className="flex flex-col gap-1 text-sm text-[var(--text)] sm:flex-row sm:gap-3"
                    >
                      <span className="font-semibold sm:min-w-16">{entry.timestamp}</span>
                      <span>{entry.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 space-y-3">
                {summaryParagraphs.length > 0 ? (
                  summaryParagraphs.map((paragraph, index) => (
                    <p key={index} className="text-sm leading-relaxed text-[var(--text)]">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-[var(--muted)]">
                    The saved summary text is not available for this lesson.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-[1.3rem] border border-[var(--border)] bg-[var(--card-strong)] p-4">
              <h4 className="text-base font-semibold">Formula learning</h4>
              {item?.result?.formula?.intro && (
                <p className="mt-2 text-sm text-[var(--muted)]">{item.result.formula.intro}</p>
              )}
              {formulaSections.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {formulaSections.map((section, index) => (
                    <div
                      key={section.id || index}
                      className="rounded-[1rem] border border-[var(--border)] bg-[var(--card)] p-4"
                    >
                      <p className="text-sm font-semibold text-[var(--text)]">{section.title}</p>
                      <p className="mt-2 text-sm font-medium text-[var(--muted)]">{section.formulaName}</p>
                      <p className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-3 py-2 text-sm text-[var(--text)]">
                        {section.formula}
                      </p>
                      {section.explanation && (
                        <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">{section.explanation}</p>
                      )}
                      {Array.isArray(section.practiceQuestions) && section.practiceQuestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {section.practiceQuestions.map((question, questionIndex) => (
                            <p
                              key={`${section.id || index}-${questionIndex}`}
                              className="rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-3 py-2 text-sm text-[var(--text)]"
                            >
                              Practice {questionIndex + 1}: {question}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  No formula guide was saved for this lesson.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[1.9rem] border p-5 backdrop-blur-xl sm:p-6" style={panelStyle}>
            <h3 className="text-xl font-semibold">What was taught</h3>
            {loading ? (
              <p className="mt-3 text-sm text-[var(--muted)]">Loading teaching notes...</p>
            ) : teachingTopics.length > 0 ? (
              <div className="mt-4 space-y-4">
                {teachingTopics.map((topic, index) => (
                  <div
                    key={topic.id || index}
                    className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--card-strong)] p-4"
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
                            key={`${topic.id || index}-${noteIndex}`}
                            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)]"
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
            ) : (
              <p className="mt-3 text-sm text-[var(--muted)]">
                No teaching lesson was saved for this topic yet.
              </p>
            )}

            <div className="mt-6 rounded-[1.3rem] border border-[var(--border)] bg-[var(--card-strong)] p-4">
              <h4 className="text-base font-semibold">Quiz performance</h4>
            {loading ? (
                <p className="mt-3 text-sm text-[var(--muted)]">Loading quiz performance...</p>
            ) : totalQuestions > 0 ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Correct answers</p>
                    <p className="mt-2 text-2xl font-bold">{correctCount}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Total questions</p>
                    <p className="mt-2 text-2xl font-bold">{totalQuestions}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-[var(--muted)]">
                  Score: {quizProgress?.scorePercent || 0}%
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-[var(--muted)]">
                No quiz result yet. Complete the quiz from Home to track correct answers here.
              </p>
            )}
            </div>

            <div className="mt-6 rounded-[1.3rem] border border-[var(--border)] bg-[var(--card-strong)] p-4">
              <h4 className="text-base font-semibold">Asked doubts</h4>
              {item?.result?.doubt?.answer ? (
                <>
                  {item.result.doubt.question && (
                    <p className="mt-3 text-sm text-[var(--muted)]">
                      Your doubt: {item.result.doubt.question}
                    </p>
                  )}
                  <p className="mt-3 text-sm font-semibold text-[var(--text)]">
                    {item.result.doubt.answer.title || 'Saved explanation'}
                  </p>
                  {item.result.doubt.answer.explanation && (
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">
                      {item.result.doubt.answer.explanation}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  No doubt explanation was saved for this lesson.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
