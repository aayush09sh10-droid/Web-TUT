import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { queryKeys } from '../../cache'
import { getAuthCacheKey } from '../../cache/queryKeys'
import {
  createSubject,
  fetchSubjects,
  removeHistoryItemFromSubject,
  reorderSubjectLessons,
} from '../History/api/historyApi'
import { hydrateHomeState } from '../Home/store/homeSlice'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { getProfilePanelStyle } from './utils/profileStyles'
import { buildLearningHomeState } from './utils/learningDetailsUtils'

function moveItem(items, fromIndex, toIndex) {
  const nextItems = [...items]
  const [movedItem] = nextItems.splice(fromIndex, 1)
  nextItems.splice(toIndex, 0, movedItem)
  return nextItems
}

export default function ProfileSubjects() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const authUser = useAppSelector((state) => state.auth.auth?.user)
  const authToken = useAppSelector((state) => state.auth.auth?.token)
  const authCacheKey = getAuthCacheKey(authUser)
  const theme = useAppSelector((state) => state.auth.theme)
  const isDark = theme === 'dark'
  const panelStyle = useMemo(() => getProfilePanelStyle(isDark), [isDark])
  const [newSubjectName, setNewSubjectName] = useState('')
  const [subjectSearchInput, setSubjectSearchInput] = useState('')
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('')
  const [error, setError] = useState('')

  const subjectsQuery = useQuery({
    queryKey: queryKeys.subjects(authCacheKey),
    enabled: Boolean(authUser),
    queryFn: ({ signal }) => fetchSubjects(authToken, signal),
  })
  const subjects = subjectsQuery.data || []
  const filteredSubjects = useMemo(() => {
    const query = subjectSearchQuery.trim().toLowerCase()

    if (!query) {
      return subjects
    }

    return subjects.filter((subject) => {
      const itemText = (subject.items || [])
        .map((item) =>
          [
            item.result?.summary?.title,
            item.sourceLabel,
            item.sourceType,
            item.url,
          ]
            .filter(Boolean)
            .join(' ')
        )
        .join(' ')

      return [subject.name, itemText]
        .some((field) => String(field || '').toLowerCase().includes(query))
    })
  }, [subjects, subjectSearchQuery])

  const createSubjectMutation = useMutation({
    mutationFn: (name) => createSubject(authToken, name),
    onSuccess: async () => {
      setNewSubjectName('')
      setError('')
      await queryClient.invalidateQueries({ queryKey: queryKeys.subjects(authCacheKey) })
    },
    onError: (mutationError) => {
      setError(mutationError.message || 'Failed to create subject.')
    },
  })

  const reorderMutation = useMutation({
    mutationFn: ({ subjectId, itemIds }) => reorderSubjectLessons(authToken, subjectId, itemIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.subjects(authCacheKey) })
    },
    onError: (mutationError) => {
      setError(mutationError.message || 'Failed to rearrange lessons.')
    },
  })

  const removeMutation = useMutation({
    mutationFn: ({ subjectId, historyId }) => removeHistoryItemFromSubject(authToken, subjectId, historyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.subjects(authCacheKey) })
    },
    onError: (mutationError) => {
      setError(mutationError.message || 'Failed to remove lesson from subject.')
    },
  })

  function handleOpenInHome(item) {
    dispatch(hydrateHomeState(buildLearningHomeState(item)))
    navigate('/')
  }

  async function handleCreateSubject(e) {
    e.preventDefault()
    if (!newSubjectName.trim()) {
      setError('Please enter a subject name.')
      return
    }

    await createSubjectMutation.mutateAsync(newSubjectName.trim())
  }

  function handleSearchSubjects(e) {
    e.preventDefault()
    setSubjectSearchQuery(subjectSearchInput)
  }

  async function handleMove(subject, currentIndex, nextIndex) {
    if (!subject?.items || nextIndex < 0 || nextIndex >= subject.items.length) {
      return
    }

    const reorderedItems = moveItem(subject.items, currentIndex, nextIndex)
    await reorderMutation.mutateAsync({
      subjectId: subject.id,
      itemIds: reorderedItems.map((item) => item.id),
    })
  }

  return (
    <main className="min-h-screen text-(--text)">
      <section className="mx-auto flex w-full max-w-5xl flex-col px-3 pb-10 pt-6 sm:px-4 sm:pt-8">
        <div className="rounded-[1.9rem] border p-5 shadow-(--shadow) backdrop-blur-xl sm:p-6" style={panelStyle}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Subjects</h2>
              <p className="mt-2 text-sm text-(--muted)">
                Build your own subject-wise study shelves and manually arrange lessons in the order you want.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to="/profile" className="rounded-full border border-(--border) bg-(--card) px-4 py-2 text-center text-xs font-medium transition hover:-translate-y-0.5">
                Back to Profile
              </Link>
              <Link to="/history" className="rounded-full border border-(--border) bg-(--card-strong) px-4 py-2 text-center text-xs font-medium transition hover:-translate-y-0.5">
                Open Activity Log
              </Link>
            </div>
          </div>

          <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleCreateSubject}>
            <input
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="Create a subject like Maths, History, Biology..."
              className="rounded-[1rem] border border-(--border) bg-[var(--input-bg)] px-4 py-3 text-sm text-(--text) focus:border-[rgba(99,102,241,0.3)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={createSubjectMutation.isPending}
              className="rounded-[1rem] border border-[rgba(99,102,241,0.18)] bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(56,189,248,0.1))] px-4 py-3 text-sm font-semibold text-(--text) shadow-[0_10px_24px_rgba(99,102,241,0.08)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createSubjectMutation.isPending ? 'Creating...' : 'Create Subject'}
            </button>
          </form>

          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        </div>

        <form className="mt-5 rounded-[1.4rem] border border-(--border) bg-(--card) p-3 shadow-(--shadow) backdrop-blur-xl" onSubmit={handleSearchSubjects}>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={subjectSearchInput}
              onChange={(e) => setSubjectSearchInput(e.target.value)}
              placeholder="Search subjects by name or saved lesson..."
              className="w-full rounded-[1rem] border border-(--border) bg-[var(--input-bg)] px-4 py-3 text-sm text-(--text) outline-none transition focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[color:rgba(99,102,241,0.12)]"
            />
            <button
              type="submit"
              className="rounded-[1rem] border border-[rgba(99,102,241,0.18)] bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(56,189,248,0.1))] px-5 py-3 text-sm font-semibold text-(--text) shadow-[0_10px_24px_rgba(99,102,241,0.08)] transition hover:-translate-y-0.5"
            >
              Search
            </button>
          </div>
          {subjectSearchQuery.trim() ? (
            <p className="mt-2 px-1 text-xs text-(--muted)">
              Showing {filteredSubjects.length} of {subjects.length} subjects.
            </p>
          ) : null}
        </form>

        <div className="mt-6 space-y-5">
          {subjectsQuery.isLoading || subjectsQuery.isFetching ? (
            <div className="rounded-[1.5rem] border border-(--border) bg-(--card) p-5 shadow-(--shadow) backdrop-blur-xl">
              <p className="text-sm text-(--muted)">Loading your subjects...</p>
            </div>
          ) : filteredSubjects.length > 0 ? (
            filteredSubjects.map((subject) => (
              <div key={subject.id} className="rounded-[1.5rem] border border-(--border) bg-(--card) p-5 shadow-(--shadow) backdrop-blur-xl">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-(--text)">{subject.name}</h3>
                    <p className="mt-1 text-sm text-(--muted)">
                      {subject.items.length} lesson{subject.items.length === 1 ? '' : 's'} saved here
                    </p>
                  </div>
                </div>

                {subject.items.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {subject.items.map((item, index) => (
                      <div key={item.id} className="rounded-[1.2rem] border border-(--border) bg-(--card-strong) p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-(--text)">
                              {item.result?.summary?.title || item.sourceLabel || 'Saved lesson'}
                            </p>
                            <p className="mt-1 text-xs text-(--muted)">
                              {item.sourceLabel}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleMove(subject, index, index - 1)}
                              disabled={index === 0 || reorderMutation.isPending}
                              className="rounded-full border border-(--border) bg-(--card) px-3 py-2 text-xs font-medium text-(--text) transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Move Up
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMove(subject, index, index + 1)}
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
                              Details
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeMutation.mutate({ subjectId: subject.id, historyId: item.id })}
                              disabled={removeMutation.isPending}
                              className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-(--muted)">
                    No lessons are saved in this subject yet. Use Activity Log to add topics manually.
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-(--border) bg-(--card) p-5 shadow-(--shadow) backdrop-blur-xl">
              <p className="text-sm text-(--muted)">
                {subjectSearchQuery.trim()
                  ? 'No matching subjects found.'
                  : 'No subjects created yet. Create one above, then add lessons from Activity Log.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
