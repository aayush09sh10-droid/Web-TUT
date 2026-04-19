import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { queryKeys } from '../../cache'
import { getAuthCacheKey } from '../../cache/queryKeys'
import {
  fetchSubjects,
  removeHistoryItemFromSubject,
  reorderSubjectLessons,
} from '../History/api/historyApi'
import { hydrateHomeState } from '../Home/store/homeSlice'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { buildLearningHomeState } from './utils/learningDetailsUtils'
import { getProfilePanelStyle } from './utils/profileStyles'

function moveItem(items, fromIndex, toIndex) {
  const nextItems = [...items]
  const [movedItem] = nextItems.splice(fromIndex, 1)
  nextItems.splice(toIndex, 0, movedItem)
  return nextItems
}

export default function ProfileSubjectDetails() {
  const { subjectId } = useParams()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const auth = useAppSelector((state) => state.auth.auth)
  const isAuthenticated = Boolean(auth?.user)
  const authCacheKey = getAuthCacheKey(auth)
  const theme = useAppSelector((state) => state.auth.theme)
  const isDark = theme === 'dark'
  const panelStyle = useMemo(() => getProfilePanelStyle(isDark), [isDark])
  const [activeItemId, setActiveItemId] = useState('')
  const [error, setError] = useState('')

  const subjectsQuery = useQuery({
    queryKey: queryKeys.subjects(authCacheKey),
    enabled: isAuthenticated,
    queryFn: ({ signal }) => fetchSubjects(auth?.token, signal),
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent duplicate calls
  })

  const reorderMutation = useMutation({
    mutationFn: ({ itemIds }) => reorderSubjectLessons(auth?.token, subjectId, itemIds),
    onSuccess: async () => {
      setError('')
      await queryClient.invalidateQueries({ queryKey: queryKeys.subjects(authCacheKey) })
    },
    onError: (mutationError) => {
      setError(mutationError.message || 'Failed to rearrange lessons.')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (historyId) => removeHistoryItemFromSubject(auth?.token, subjectId, historyId),
    onSuccess: async () => {
      setError('')
      await queryClient.invalidateQueries({ queryKey: queryKeys.subjects(authCacheKey) })
    },
    onError: (mutationError) => {
      setError(mutationError.message || 'Failed to remove lesson from subject.')
    },
  })

  const subject = useMemo(
    () => (subjectsQuery.data || []).find((item) => item.id === subjectId) || null,
    [subjectId, subjectsQuery.data]
  )

  function handleOpenInHome(item) {
    dispatch(hydrateHomeState(buildLearningHomeState(item)))
    navigate('/')
  }

  async function handleMove(currentIndex, nextIndex) {
    if (!subject?.items || nextIndex < 0 || nextIndex >= subject.items.length) {
      return
    }

    const reorderedItems = moveItem(subject.items, currentIndex, nextIndex)
    await reorderMutation.mutateAsync({
      itemIds: reorderedItems.map((item) => item.id),
    })
  }

  if (!subject && !subjectsQuery.isLoading && !subjectsQuery.isFetching) {
    return (
      <main className="min-h-screen text-(--text)">
        <section className="mx-auto flex w-full max-w-5xl flex-col px-3 pb-10 pt-6 sm:px-4 sm:pt-8">
          <div className="rounded-[1.8rem] border p-6 shadow-(--shadow) backdrop-blur-xl" style={panelStyle}>
            <h2 className="text-2xl font-bold">Subject not found</h2>
            <p className="mt-2 text-sm text-(--muted)">This subject does not exist or has been removed.</p>
            <Link to="/profile/subjects" className="mt-4 inline-flex rounded-full border border-(--border) bg-(--card) px-4 py-2 text-sm font-medium">
              Back to Subjects
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen text-(--text)">
      <section className="mx-auto flex w-full max-w-5xl flex-col px-3 pb-10 pt-6 sm:px-4 sm:pt-8">
        <div className="rounded-[1.9rem] border p-5 shadow-(--shadow) backdrop-blur-xl sm:p-6" style={panelStyle}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{subject?.name || 'Subject'}</h2>
              <p className="mt-2 text-sm text-(--muted)">
                Manually arranged topic-wise learning for this subject. Click any topic card to open its saved learning details.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to="/profile/subjects" className="rounded-full border border-(--border) bg-(--card) px-4 py-2 text-center text-xs font-medium transition hover:-translate-y-0.5">
                Back to Subjects
              </Link>
              <Link to="/history" className="rounded-full border border-(--border) bg-(--card-strong) px-4 py-2 text-center text-xs font-medium transition hover:-translate-y-0.5">
                Open Activity Log
              </Link>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        </div>

        <div className="mt-6 space-y-4">
          {subjectsQuery.isLoading || subjectsQuery.isFetching ? (
            <div className="rounded-[1.5rem] border border-(--border) bg-(--card) p-5 shadow-(--shadow) backdrop-blur-xl">
              <p className="text-sm text-(--muted)">Loading this subject...</p>
            </div>
          ) : subject?.items?.length ? (
            subject.items.map((item, index) => {
              const isActive = activeItemId === item.id
              const topicTitle = item.result?.summary?.title || item.sourceLabel || `Topic ${index + 1}`

              return (
                <div key={item.id} className="rounded-[1.5rem] border border-(--border) bg-(--card) p-5 shadow-(--shadow) backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={() => setActiveItemId(isActive ? '' : item.id)}
                    className="flex w-full items-start justify-between gap-4 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--muted)">
                        Topic {index + 1}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-(--text)">{topicTitle}</h3>
                      <p className="mt-1 text-sm text-(--muted)">{item.sourceLabel}</p>
                    </div>
                    <span className="rounded-full border border-(--border) bg-(--card-strong) px-3 py-1 text-xs font-medium text-(--text)">
                      {isActive ? 'Hide' : 'Open'}
                    </span>
                  </button>

                  {isActive ? (
                    <div className="mt-4 rounded-[1.2rem] border border-(--border) bg-(--card-strong) p-4">
                      <div className="space-y-3">
                        {item.result?.summary?.paragraphs?.overview ? (
                          <p className="text-sm leading-relaxed text-(--text)">
                            {item.result.summary.paragraphs.overview}
                          </p>
                        ) : (
                          <p className="text-sm text-(--muted)">Open the lesson to see the full saved learning details.</p>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleMove(index, index - 1)}
                          disabled={index === 0 || reorderMutation.isPending}
                          className="rounded-full border border-(--border) bg-(--card) px-3 py-2 text-xs font-medium text-(--text) transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Move Up
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, index + 1)}
                          disabled={index === subject.items.length - 1 || reorderMutation.isPending}
                          className="rounded-full border border-(--border) bg-(--card) px-3 py-2 text-xs font-medium text-(--text) transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Move Down
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenInHome(item)}
                          className="rounded-full border border-[rgba(99,102,241,0.18)] bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(56,189,248,0.1))] px-3 py-2 text-xs font-semibold text-(--text) shadow-[0_10px_24px_rgba(99,102,241,0.08)] transition hover:-translate-y-0.5"
                        >
                          Open in Home
                        </button>
                        <Link
                          to={`/profile/learning/${item.id}`}
                          className="rounded-full border border-(--border) bg-(--card) px-3 py-2 text-xs font-medium text-(--text) transition hover:-translate-y-0.5"
                        >
                          Open Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeMutation.mutate(item.id)}
                          disabled={removeMutation.isPending}
                          className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })
          ) : (
            <div className="rounded-[1.5rem] border border-(--border) bg-(--card) p-5 shadow-(--shadow) backdrop-blur-xl">
              <p className="text-sm text-(--muted)">
                No topics are saved in this subject yet. Add them from Activity Log.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
