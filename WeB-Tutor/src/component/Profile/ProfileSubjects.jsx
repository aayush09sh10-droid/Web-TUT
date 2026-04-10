import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { queryKeys } from '../../cache'
import { createSubject, fetchSubjects } from '../History/api/historyApi'
import { useAppSelector } from '../../store/hooks'
import { getProfilePanelStyle } from './utils/profileStyles'

export default function ProfileSubjects() {
  const queryClient = useQueryClient()
  const isAuthenticated = Boolean(useAppSelector((state) => state.auth.auth?.user))
  const authCacheKey = isAuthenticated ? 'authenticated' : 'guest'
  const theme = useAppSelector((state) => state.auth.theme)
  const isDark = theme === 'dark'
  const panelStyle = useMemo(() => getProfilePanelStyle(isDark), [isDark])
  const [newSubjectName, setNewSubjectName] = useState('')
  const [error, setError] = useState('')

  const subjectsQuery = useQuery({
    queryKey: queryKeys.subjects(authCacheKey),
    enabled: isAuthenticated,
    queryFn: ({ signal }) => fetchSubjects(authCacheKey, signal),
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent duplicate calls
  })

  const createSubjectMutation = useMutation({
    mutationFn: (name) => createSubject(authCacheKey, name),
    onSuccess: async () => {
      setNewSubjectName('')
      setError('')
      await queryClient.invalidateQueries({ queryKey: queryKeys.subjects(authCacheKey) })
    },
    onError: (mutationError) => {
      setError(mutationError.message || 'Failed to create subject.')
    },
  })

  async function handleCreateSubject(e) {
    e.preventDefault()
    if (!newSubjectName.trim()) {
      setError('Please enter a subject name.')
      return
    }

    await createSubjectMutation.mutateAsync(newSubjectName.trim())
  }

  return (
    <main className="min-h-screen text-(--text)">
      <section className="mx-auto flex w-full max-w-5xl flex-col px-3 pb-10 pt-6 sm:px-4 sm:pt-8">
        <div className="rounded-[1.9rem] border p-5 shadow-(--shadow) backdrop-blur-xl sm:p-6" style={panelStyle}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Subjects</h2>
              <p className="mt-2 text-sm text-(--muted)">
                Keep your learning grouped subject-wise. Each subject opens its own page with topic-wise saved lessons.
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
              className="rounded-[1rem] border border-(--border) bg-(--card) px-4 py-3 text-sm text-(--text) focus:border-[rgba(99,102,241,0.3)] focus:outline-none"
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

        <div className="mt-6">
          {subjectsQuery.isLoading || subjectsQuery.isFetching ? (
            <div className="rounded-[1.5rem] border border-(--border) bg-(--card) p-5 shadow-(--shadow) backdrop-blur-xl">
              <p className="text-sm text-(--muted)">Loading your subjects...</p>
            </div>
          ) : (subjectsQuery.data || []).length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {subjectsQuery.data.map((subject) => (
                <Link
                  key={subject.id}
                  to={`/profile/subjects/${subject.id}`}
                  className="rounded-[1.35rem] border border-(--border) bg-(--card) p-4 shadow-(--shadow) backdrop-blur-xl transition hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-(--text)">{subject.name}</h3>
                      <p className="mt-1 text-xs text-(--muted)">
                        {subject.items.length} topic{subject.items.length === 1 ? '' : 's'} saved
                      </p>
                    </div>
                    <span className="rounded-full border border-(--border) bg-(--card-strong) px-2.5 py-1 text-[11px] font-medium text-(--muted)">
                      Open
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {subject.items.slice(0, 3).map((item, index) => (
                      <div key={item.id} className="rounded-xl border border-(--border) bg-(--card-strong) px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--muted)">
                          Topic {index + 1}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-(--text)">
                          {item.result?.summary?.title || item.sourceLabel || 'Saved topic'}
                        </p>
                      </div>
                    ))}
                    {subject.items.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-(--border) px-3 py-3 text-sm text-(--muted)">
                        No topics added yet
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-(--border) bg-(--card) p-5 shadow-(--shadow) backdrop-blur-xl">
              <p className="text-sm text-(--muted)">
                No subjects created yet. Create one above, then add topics from Activity Log.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
