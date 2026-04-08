import React, { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { queryKeys } from '../../cache'
import { fetchLearningDetails } from './api/learningDetailsApi'
import LearningDoubtCard from './components/LearningDoubtCard'
import { hydrateHomeState } from '../Home/store/homeSlice'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  setLearningError,
  setLearningItem,
  setLearningLoading,
} from './store/profileSlice'
import { getProfilePanelStyle } from './utils/profileStyles'
import {
  buildLearningHomeState,
  extractLearningTopics,
  normalizeLearningSummary,
} from './utils/learningDetailsUtils'

export default function LearningDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const theme = useAppSelector((state) => state.auth.theme)
  const authToken = useAppSelector((state) => state.auth.auth?.token)
  const { learningItem: item, learningLoading: loading, learningError: error } = useAppSelector((state) => state.profile)
  const isDark = theme === 'dark'
  const panelStyle = useMemo(() => getProfilePanelStyle(isDark), [isDark])

  const learningDetailsQuery = useQuery({
    queryKey: queryKeys.learningDetails(authToken, id),
    enabled: Boolean(authToken && id),
    queryFn: ({ signal }) => fetchLearningDetails(authToken, id, signal),
  })

  useEffect(() => {
    dispatch(setLearningLoading(learningDetailsQuery.isLoading || learningDetailsQuery.isFetching))
  }, [dispatch, learningDetailsQuery.isFetching, learningDetailsQuery.isLoading])

  useEffect(() => {
    if (learningDetailsQuery.data) {
      dispatch(setLearningError(''))
      dispatch(setLearningItem(learningDetailsQuery.data))
    }
  }, [dispatch, learningDetailsQuery.data])

  useEffect(() => {
    if (learningDetailsQuery.error && learningDetailsQuery.error.name !== 'AbortError') {
      dispatch(setLearningError(learningDetailsQuery.error.message || 'Unexpected error'))
    }
  }, [dispatch, learningDetailsQuery.error])

  const topicsLearnt = extractLearningTopics(item)
  const normalizedSummary = normalizeLearningSummary(item?.result)
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
    dispatch(hydrateHomeState(buildLearningHomeState(item)))
    navigate('/')
  }

  return (
    <main className="min-h-screen text-(--text)">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 pb-10 pt-6 sm:px-4 sm:pt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {item?.result?.summary?.title || 'Learning details'}
            </h2>
            <p className="mt-2 text-sm text-(--muted)">
              Everything saved for this lesson is here: summary, taught topics, doubts, and quiz performance.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={handleOpenInHome} className="rounded-full px-4 py-2 text-center text-xs font-semibold text-[var(--bg)] transition hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
              Open in Home
            </button>
            <Link to="/history" className="rounded-full border border-(--border) bg-(--card) px-4 py-2 text-center text-xs font-medium transition hover:-translate-y-0.5">
              Back to Activity Log
            </Link>
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.9rem] border p-5 backdrop-blur-xl sm:p-6" style={panelStyle}>
            <h3 className="text-xl font-semibold">What you have learnt</h3>
            {loading ? (
              <p className="mt-3 text-sm text-(--muted)">Loading your topics...</p>
            ) : topicsLearnt.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {topicsLearnt.map((topic) => (
                  <span key={topic} className="rounded-full border border-(--border) bg-(--card) px-3 py-2 text-sm text-(--text)">
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-(--muted)">No topic details are available for this learning session yet.</p>
            )}

            <div className="mt-6 rounded-[1.3rem] border border-(--border) bg-(--card-strong) p-4">
              <h4 className="text-base font-semibold">What to learn next</h4>
              {wrongQuestions.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {wrongQuestions.map((question) => (
                    <p key={question} className="rounded-xl border border-(--border) bg-(--card) px-3 py-2 text-sm text-(--text)">
                      Revise: {question}
                    </p>
                  ))}
                </div>
              ) : teachingTopics.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {teachingTopics.slice(0, 4).map((topic) => (
                    <p key={topic.id || topic.title} className="rounded-xl border border-(--border) bg-(--card) px-3 py-2 text-sm text-(--text)">
                      Practice more: {topic.title}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-(--muted)">Generate teaching or complete a quiz to get your next study targets.</p>
              )}
            </div>

            <div className="mt-6 rounded-[1.3rem] border border-(--border) bg-(--card-strong) p-4">
              <h4 className="text-base font-semibold">{normalizedSummary.title}</h4>
              {normalizedSummary.timeline.length > 0 && (
                <div className="mt-4 space-y-2 border-b border-(--border) pb-4">
                  <h5 className="text-sm font-semibold text-(--text)">Summary timeline</h5>
                  {normalizedSummary.timeline.map((entry, index) => (
                    <div key={`${entry.timestamp}-${index}`} className="flex flex-col gap-1 text-sm text-(--text) sm:flex-row sm:gap-3">
                      <span className="font-semibold sm:min-w-16">{entry.timestamp}</span>
                      <span>{entry.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 space-y-3">
                {summaryParagraphs.length > 0 ? (
                  summaryParagraphs.map((paragraph, index) => (
                    <p key={index} className="text-sm leading-relaxed text-(--text)">{paragraph}</p>
                  ))
                ) : (
                  <p className="text-sm text-(--muted)">The saved summary text is not available for this lesson.</p>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-[1.3rem] border border-(--border) bg-(--card-strong) p-4">
              <h4 className="text-base font-semibold">Formula learning</h4>
              {item?.result?.formula?.intro && <p className="mt-2 text-sm text-(--muted)">{item.result.formula.intro}</p>}
              {formulaSections.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {formulaSections.map((section, index) => (
                    <div key={section.id || index} className="rounded-2xl border border-(--border) bg-(--card) p-4">
                      <p className="text-sm font-semibold text-(--text)">{section.title}</p>
                      <p className="mt-2 text-sm font-medium text-(--muted)">{section.formulaName}</p>
                      <p className="mt-2 rounded-xl border border-(--border) bg-(--card-strong) px-3 py-2 text-sm text-(--text)">{section.formula}</p>
                      {section.explanation && <p className="mt-3 text-sm leading-relaxed text-(--text)">{section.explanation}</p>}
                      {Array.isArray(section.practiceQuestions) && section.practiceQuestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {section.practiceQuestions.map((question, questionIndex) => (
                            <p key={`${section.id || index}-${questionIndex}`} className="rounded-xl border border-(--border) bg-(--card-strong) px-3 py-2 text-sm text-(--text)">
                              Practice {questionIndex + 1}: {question}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-(--muted)">No formula guide was saved for this lesson.</p>
              )}
            </div>
          </div>

          <div className="rounded-[1.9rem] border p-5 backdrop-blur-xl sm:p-6" style={panelStyle}>
            <h3 className="text-xl font-semibold">What was taught</h3>
            {loading ? (
              <p className="mt-3 text-sm text-(--muted)">Loading teaching notes...</p>
            ) : teachingTopics.length > 0 ? (
              <div className="mt-4 space-y-4">
                {teachingTopics.map((topic, index) => (
                  <div key={topic.id || index} className="rounded-[1.2rem] border border-(--border) bg-(--card-strong) p-4">
                    <p className="text-sm font-semibold text-(--text)">{topic.title}</p>
                    {topic.summary && <p className="mt-2 text-sm leading-relaxed text-(--muted)">{topic.summary}</p>}
                    {topic.lesson && <p className="mt-3 text-sm leading-relaxed text-(--text)">{topic.lesson}</p>}
                    {Array.isArray(topic.notes) && topic.notes.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {topic.notes.map((note, noteIndex) => (
                          <p key={`${topic.id || index}-${noteIndex}`} className="rounded-xl border border-(--border) bg-(--card) px-3 py-2 text-sm text-(--text)">
                            {note}
                          </p>
                        ))}
                      </div>
                    )}
                    {topic.reflectionQuestion && <p className="mt-3 text-xs font-medium text-(--muted)">Reflection: {topic.reflectionQuestion}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-(--muted)">No teaching lesson was saved for this topic yet.</p>
            )}

            <div className="mt-6 rounded-[1.3rem] border border-(--border) bg-(--card-strong) p-4">
              <h4 className="text-base font-semibold">Quiz performance</h4>
              {loading ? (
                <p className="mt-3 text-sm text-(--muted)">Loading quiz performance...</p>
              ) : totalQuestions > 0 ? (
                <>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.2rem] border border-(--border) bg-(--card-strong) px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-(--muted)">Correct answers</p>
                      <p className="mt-2 text-2xl font-bold">{correctCount}</p>
                    </div>
                    <div className="rounded-[1.2rem] border border-(--border) bg-(--card-strong) px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-(--muted)">Total questions</p>
                      <p className="mt-2 text-2xl font-bold">{totalQuestions}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-(--muted)">Score: {quizProgress?.scorePercent || 0}%</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-(--muted)">No quiz result yet. Complete the quiz from Home to track correct answers here.</p>
              )}
            </div>

            <div className="mt-6 rounded-[1.3rem] border border-(--border) bg-(--card-strong) p-4">
              <h4 className="text-base font-semibold">Asked doubts</h4>
              <LearningDoubtCard doubt={item?.result?.doubt} />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
