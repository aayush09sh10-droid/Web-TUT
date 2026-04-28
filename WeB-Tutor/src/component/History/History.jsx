import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { queryKeys, setHistoryCache } from '../../cache'
import { getAuthCacheKey } from '../../cache/queryKeys'
import ActivityDetails from './components/ActivityDetails'
import ActivityList from './components/ActivityList'
import { clearHistory, deleteHistoryItem, fetchHistory } from './api/historyApi'
import {
  clearAllHistoryItems,
  removeHistoryItemFromState,
  setHistoryError,
  setHistoryItems,
  setHistoryLoading,
} from './store/historySlice'
import {
  getSelectedTopicTitles,
  getSummaryParagraphs,
  normalizeSummaryPayload,
} from './utils/historyUtils'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

export default function History() {
  const dispatch = useAppDispatch()
  const authUser = useAppSelector((state) => state.auth.auth?.user)
  const authToken = useAppSelector((state) => state.auth.auth?.token)
  const authCacheKey = getAuthCacheKey(authUser)
  const history = useAppSelector((state) => state.history.items)
  const selectedId = useAppSelector((state) => state.history.selectedId)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const selected = useMemo(
    () => history.find((item) => item.id === selectedId) || null,
    [history, selectedId]
  )
  const filteredHistory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return history
    }

    return history.filter((item) => {
      const summary = item.result?.summary
      const topics = Array.isArray(summary?.topics)
        ? summary.topics.map((topic) => topic?.title || topic?.label || '').join(' ')
        : ''
      const fields = [
        summary?.title,
        item.sourceLabel,
        item.url,
        item.sourceType,
        topics,
        item.result?.doubt?.question,
        item.timestamp ? new Date(item.timestamp).toLocaleString() : '',
      ]

      return fields.some((field) => String(field || '').toLowerCase().includes(query))
    })
  }, [history, searchQuery])

  const historyQuery = useQuery({
    queryKey: queryKeys.history(authCacheKey),
    enabled: Boolean(authUser),
    queryFn: ({ signal }) => fetchHistory(authToken, signal),
  })

  const clearHistoryMutation = useMutation({
    mutationFn: () => clearHistory(authToken),
    onSuccess: () => {
      setHistoryCache(authCacheKey, [])
      dispatch(clearAllHistoryItems())
    },
  })

  const deleteHistoryMutation = useMutation({
    mutationFn: (itemId) => deleteHistoryItem(authToken, itemId),
    onSuccess: (_, itemId) => {
      const nextItems = history.filter((item) => item.id !== itemId)
      setHistoryCache(authCacheKey, nextItems)
      dispatch(removeHistoryItemFromState(itemId))
    },
  })

  useEffect(() => {
    dispatch(setHistoryLoading(historyQuery.isLoading || historyQuery.isFetching))
  }, [dispatch, historyQuery.isFetching, historyQuery.isLoading])

  useEffect(() => {
    if (historyQuery.data) {
      dispatch(setHistoryError(''))
      dispatch(setHistoryItems(historyQuery.data))
    }
  }, [dispatch, historyQuery.data])

  useEffect(() => {
    if (historyQuery.error && historyQuery.error.name !== 'AbortError') {
      console.error('History load error:', historyQuery.error)
      dispatch(setHistoryError(historyQuery.error.message || 'Failed to load history.'))
    }
  }, [dispatch, historyQuery.error])

  async function handleClearHistory() {
    await clearHistoryMutation.mutateAsync()
  }

  async function handleRemoveItem(item) {
    await deleteHistoryMutation.mutateAsync(item.id)
  }

  function handleSearchActivity(event) {
    event.preventDefault()
    setSearchQuery(searchInput)
  }

  const selectedResult = selected?.result
  const normalizedSummary = normalizeSummaryPayload(selectedResult)
  const summaryParagraphs = getSummaryParagraphs(normalizedSummary)
  const quiz = selectedResult?.quiz
  const teaching = selectedResult?.teaching
  const doubt = selectedResult?.doubt
  const selectedTopicTitles = getSelectedTopicTitles(teaching)

  return (
    <main className="min-h-screen text-(--text)">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 pb-10 pt-6 sm:px-4 sm:pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Activity Log</h2>
            <p className="mt-1 text-sm text-(--muted)">
              Open any saved item to review the full learning session, including what you learnt, summary, quiz, teaching, and doubts.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex">
            <Link to="/" className="rounded-full border border-(--border) bg-(--card) px-4 py-2 text-center text-xs font-medium transition hover:-translate-y-0.5">
              Back to Home
            </Link>
            <button type="button" onClick={handleClearHistory} className="rounded-full border border-(--border) bg-(--card) px-4 py-2 text-center text-xs font-medium transition hover:-translate-y-0.5">
              Clear all
            </button>
          </div>
        </div>

        <form className="mt-5 rounded-[1.4rem] border border-(--border) bg-(--card) p-3 shadow-(--shadow) backdrop-blur-xl" onSubmit={handleSearchActivity}>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search activity by title, source, topic, date..."
              className="w-full rounded-[1rem] border border-(--border) bg-[var(--input-bg)] px-4 py-3 text-sm text-(--text) outline-none transition focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[color:rgba(99,102,241,0.12)]"
            />
            <button
              type="submit"
              className="rounded-[1rem] border border-[rgba(99,102,241,0.18)] bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(56,189,248,0.1))] px-5 py-3 text-sm font-semibold text-(--text) shadow-[0_10px_24px_rgba(99,102,241,0.08)] transition hover:-translate-y-0.5"
            >
              Search
            </button>
          </div>
          {searchQuery.trim() ? (
            <p className="mt-2 px-1 text-xs text-(--muted)">
              Showing {filteredHistory.length} of {history.length} saved activities.
            </p>
          ) : null}
        </form>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-3">
            <ActivityList items={filteredHistory} searchQuery={searchQuery} onDelete={handleRemoveItem} />
          </div>

          <div className="lg:col-span-2">
            <ActivityDetails
              selectedItem={selected}
              selectedResult={selectedResult}
              selectedTopicTitles={selectedTopicTitles}
              normalizedSummary={normalizedSummary}
              summaryParagraphs={summaryParagraphs}
              quiz={quiz}
              teaching={teaching}
              doubt={doubt}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
