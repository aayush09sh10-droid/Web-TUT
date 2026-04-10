import React, { useEffect, useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { queryKeys, setHistoryCache } from '../../cache'
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
  const isAuthenticated = Boolean(useAppSelector((state) => state.auth.auth?.user))
  const authCacheKey = isAuthenticated ? 'authenticated' : 'guest'
  const history = useAppSelector((state) => state.history.items)
  const selectedId = useAppSelector((state) => state.history.selectedId)
  const selected = useMemo(
    () => history.find((item) => item.id === selectedId) || null,
    [history, selectedId]
  )

  const historyQuery = useQuery({
    queryKey: queryKeys.history(authCacheKey),
    enabled: isAuthenticated,
    queryFn: ({ signal }) => fetchHistory(authCacheKey, signal),
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent duplicate calls
  })

  const clearHistoryMutation = useMutation({
    mutationFn: () => clearHistory(authCacheKey),
    onSuccess: () => {
      setHistoryCache(authCacheKey, [])
      dispatch(clearAllHistoryItems())
    },
  })

  const deleteHistoryMutation = useMutation({
    mutationFn: (itemId) => deleteHistoryItem(authCacheKey, itemId),
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

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-3">
            <ActivityList onDelete={handleRemoveItem} />
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
