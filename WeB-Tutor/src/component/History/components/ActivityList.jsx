import React from 'react'
import { Link } from 'react-router-dom'
import { selectHistoryItem } from '../store/historySlice'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'

export default function ActivityList({ onDelete }) {
  const dispatch = useAppDispatch()
  const history = useAppSelector((state) => state.history.items)

  if (history.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--text)] shadow-[var(--shadow)] backdrop-blur-xl">
        No activity yet. Summarize a video to populate this log.
      </div>
    )
  }

  return history.map((item) => (
    <div
      key={item.id || item.timestamp}
      className="flex flex-col gap-3 rounded-[1.4rem] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow)] backdrop-blur-xl sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <button type="button" onClick={() => dispatch(selectHistoryItem(item.id))} className="min-w-0 text-left">
          <div className="max-w-full break-all font-medium text-[var(--text)] sm:w-56 sm:truncate sm:break-normal">
            {item.result?.summary?.title || item.url}
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">{new Date(item.timestamp).toLocaleString()}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.result?.quiz && <span className="rounded-full border border-[var(--border)] bg-[var(--card-strong)] px-2.5 py-1 text-[11px] text-[var(--muted)]">Quiz</span>}
            {item.result?.teaching && <span className="rounded-full border border-[var(--border)] bg-[var(--card-strong)] px-2.5 py-1 text-[11px] text-[var(--muted)]">Teaching</span>}
            {item.result?.doubt && <span className="rounded-full border border-[var(--border)] bg-[var(--card-strong)] px-2.5 py-1 text-[11px] text-[var(--muted)]">Doubt</span>}
          </div>
        </button>
        {item.id && (
          <Link to={`/profile/learning/${item.id}`} className="mt-3 inline-flex rounded-full border border-[var(--border)] bg-[var(--card-strong)] px-3 py-2 text-xs font-medium text-[var(--text)] transition hover:-translate-y-0.5">
            Open full lesson
          </Link>
        )}
      </div>
      <button type="button" onClick={() => onDelete(item)} className="self-start text-xs font-medium text-[var(--text)] opacity-80 hover:text-red-500">
        Delete
      </button>
    </div>
  ))
}
