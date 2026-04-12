import React from 'react'
import { Link } from 'react-router-dom'
import { selectHistoryItem } from '../store/historySlice'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'

export default function ActivityList({ onDelete }) {
  const dispatch = useAppDispatch()
  const history = useAppSelector((state) => state.history.items)
  const recentHistory = [...history].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

  function handleSelectItem(itemId) {
    dispatch(selectHistoryItem(itemId))
  }

  if (recentHistory.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-(--border) bg-(--card) p-6 text-sm text-(--text) shadow-(--shadow) backdrop-blur-xl">
        No activity yet. Summarize a video to populate this log.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[1.2rem] border border-(--border) bg-(--card) px-4 py-3 text-sm shadow-(--shadow) backdrop-blur-xl">
        <p className="font-semibold text-(--text)">Recent summaries</p>
        <p className="mt-1 text-xs text-(--muted)">Your latest learning sessions are shown first.</p>
      </div>

      {recentHistory.map((item) => (
        <div
          key={item.id || item.timestamp}
          className="flex flex-col gap-3 rounded-[1.4rem] border border-(--border) bg-(--card) p-4 shadow-(--shadow) backdrop-blur-xl"
        >
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => handleSelectItem(item.id)}
              className="min-w-0 w-full text-left"
            >
              <div className="text-sm font-semibold text-(--text)">
                {item.result?.summary?.title || item.url}
              </div>
              <div className="mt-1 text-xs text-(--muted)">{new Date(item.timestamp).toLocaleString()}</div>
              <div className="mt-2 text-xs text-(--muted)">
                {item.sourceLabel || item.url}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.result?.summary && <span className="rounded-full border border-(--border) bg-(--card-strong) px-2.5 py-1 text-[11px] text-(--muted)">Summary</span>}
                {item.result?.quiz && <span className="rounded-full border border-(--border) bg-(--card-strong) px-2.5 py-1 text-[11px] text-(--muted)">Quiz</span>}
                {item.result?.teaching && <span className="rounded-full border border-(--border) bg-(--card-strong) px-2.5 py-1 text-[11px] text-(--muted)">Teaching</span>}
                {item.result?.formula && <span className="rounded-full border border-(--border) bg-(--card-strong) px-2.5 py-1 text-[11px] text-(--muted)">Formula</span>}
                {item.result?.doubt && <span className="rounded-full border border-(--border) bg-(--card-strong) px-2.5 py-1 text-[11px] text-(--muted)">Doubt</span>}
              </div>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {item.id && (
              <Link to={`/profile/learning/${item.id}`} className="inline-flex rounded-full border border-(--border) bg-(--card-strong) px-3 py-2 text-xs font-medium text-(--text) transition hover:-translate-y-0.5">
                Open full lesson
              </Link>
            )}
            <button type="button" onClick={() => onDelete(item)} className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:-translate-y-0.5">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
