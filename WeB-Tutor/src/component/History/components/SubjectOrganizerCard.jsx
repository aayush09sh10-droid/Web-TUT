import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../cache'
import {
  createSubject,
  fetchSubjects,
  saveHistoryItemToSubject,
} from '../api/historyApi'
import { useAppSelector } from '../../../store/hooks'

export default function SubjectOrganizerCard({ selectedItem }) {
  const authUser = useAppSelector((state) => state.auth.auth?.user)
  const authToken = useAppSelector((state) => state.auth.auth?.token)
  const queryClient = useQueryClient()
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [newSubjectName, setNewSubjectName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const subjectsQuery = useQuery({
    queryKey: queryKeys.subjects(authToken),
    enabled: Boolean(authUser),
    queryFn: ({ signal }) => fetchSubjects(authToken, signal),
  })

  const createSubjectMutation = useMutation({
    mutationFn: (name) => createSubject(authToken, name),
    onSuccess: async (subject) => {
      setMessage(`Created subject "${subject.name}".`)
      setError('')
      setNewSubjectName('')
      setSelectedSubjectId(subject.id)
      await queryClient.invalidateQueries({ queryKey: queryKeys.subjects(authToken) })
    },
    onError: (mutationError) => {
      setError(mutationError.message || 'Failed to create subject.')
      setMessage('')
    },
  })

  const saveToSubjectMutation = useMutation({
    mutationFn: ({ subjectId, historyId }) => saveHistoryItemToSubject(authToken, subjectId, historyId),
    onSuccess: async (subject) => {
      setMessage(`Saved this lesson in "${subject.name}".`)
      setError('')
      await queryClient.invalidateQueries({ queryKey: queryKeys.subjects(authToken) })
    },
    onError: (mutationError) => {
      setError(mutationError.message || 'Failed to save lesson into subject.')
      setMessage('')
    },
  })

  const savedSubjects =
    !selectedItem?.id || !Array.isArray(subjectsQuery.data)
      ? []
      : subjectsQuery.data.filter((subject) => subject.itemIds?.includes(selectedItem.id))

  if (!selectedItem) {
    return null
  }

  async function handleCreateSubject(e) {
    e.preventDefault()
    if (!newSubjectName.trim()) {
      setError('Please enter a subject name first.')
      setMessage('')
      return
    }

    await createSubjectMutation.mutateAsync(newSubjectName.trim())
  }

  async function handleSaveToSubject() {
    if (!selectedSubjectId) {
      setError('Please select a subject first.')
      setMessage('')
      return
    }

    await saveToSubjectMutation.mutateAsync({
      subjectId: selectedSubjectId,
      historyId: selectedItem.id,
    })
  }

  return (
    <div className="mt-4 rounded-[1.2rem] border border-(--border) bg-(--card-strong) p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-base font-semibold text-(--text)">Organize by subject</h4>
          <p className="mt-1 text-sm text-(--muted)">
            Create your own subjects and manually save this lesson into any subject folder.
          </p>
        </div>
        {savedSubjects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {savedSubjects.map((subject) => (
              <span key={subject.id} className="rounded-full border border-(--border) bg-(--card) px-3 py-1.5 text-xs font-medium text-(--text)">
                {subject.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_auto]">
        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="rounded-[1rem] border border-(--border) bg-(--card) px-4 py-3 text-sm text-(--text) focus:border-[rgba(99,102,241,0.3)] focus:outline-none"
        >
          <option value="">Select subject</option>
          {(subjectsQuery.data || []).map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSaveToSubject}
          disabled={saveToSubjectMutation.isPending}
          className="rounded-[1rem] border border-[rgba(99,102,241,0.18)] bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(56,189,248,0.1))] px-4 py-3 text-sm font-semibold text-(--text) shadow-[0_10px_24px_rgba(99,102,241,0.08)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveToSubjectMutation.isPending ? 'Saving...' : 'Save into Subject'}
        </button>
      </div>

      <form className="mt-3 grid gap-3 md:grid-cols-[1.2fr_auto]" onSubmit={handleCreateSubject}>
        <input
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          placeholder="Create a subject like Physics, DSA, Chemistry..."
          className="rounded-[1rem] border border-(--border) bg-(--card) px-4 py-3 text-sm text-(--text) focus:border-[rgba(99,102,241,0.3)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={createSubjectMutation.isPending}
          className="rounded-[1rem] border border-(--border) bg-(--card) px-4 py-3 text-sm font-medium text-(--text) transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createSubjectMutation.isPending ? 'Creating...' : 'Create Subject'}
        </button>
      </form>

      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  )
}
