import React, { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
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
  const authToken = useAppSelector((state) => state.auth.auth?.token)
  const history = useAppSelector((state) => state.history.items)
  const selectedId = useAppSelector((state) => state.history.selectedId)
  const selected = useMemo(
    () => history.find((item) => item.id === selectedId) || null,
    [history, selectedId]
  )

  useEffect(() => {
    if (!authToken) return

    const controller = new AbortController()

    async function loadHistory() {
      try {
        dispatch(setHistoryLoading(true))
        dispatch(setHistoryError(''))
        dispatch(setHistoryItems(await fetchHistory(authToken, controller.signal)))
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('History load error:', err)
          dispatch(setHistoryError(err.message || 'Failed to load history.'))
        }
      } finally {
        if (!controller.signal.aborted) {
          dispatch(setHistoryLoading(false))
        }
      }
    }

    loadHistory()
    return () => controller.abort()
  }, [authToken, dispatch])

  async function handleClearHistory() {
    await clearHistory(authToken)
    dispatch(clearAllHistoryItems())
  }

  async function handleRemoveItem(item) {
    await deleteHistoryItem(authToken, item.id)
    dispatch(removeHistoryItemFromState(item.id))
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
