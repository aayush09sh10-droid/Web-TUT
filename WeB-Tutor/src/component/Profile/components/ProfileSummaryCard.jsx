import React from 'react'
import { useAppSelector } from '../../../store/hooks'

export default function ProfileSummaryCard({ panelStyle }) {
  const authUser = useAppSelector((state) => state.auth.auth?.user)
  const { profile, loading } = useAppSelector((state) => state.profile)
  const user = profile?.user || authUser
  const learning = profile?.learning

  return (
    <div className="rounded-[1.9rem] border p-5 backdrop-blur-xl sm:p-6" style={panelStyle}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.6rem] border border-(--border) bg-(--card-strong)">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-(--muted)">{String(user?.name || 'U').charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="text-xl font-semibold">{user?.name || 'User'}</h3>
          <p className="mt-1 text-sm text-(--muted)">@{user?.username || 'username'}</p>
          <p className="mt-1 text-sm text-(--muted)">{user?.email || 'email@example.com'}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.2rem] border border-(--border) bg-(--card-strong) px-4 py-4">
          <p className="text-xs uppercase tracking-[0.14em] text-(--muted)">Summaries</p>
          <p className="mt-2 text-2xl font-bold">{loading ? '...' : learning?.totalSummaries || 0}</p>
        </div>
        <div className="rounded-[1.2rem] border border-(--border) bg-(--card-strong) px-4 py-4">
          <p className="text-xs uppercase tracking-[0.14em] text-(--muted)">Quizzes</p>
          <p className="mt-2 text-2xl font-bold">{loading ? '...' : learning?.totalQuizzes || 0}</p>
        </div>
        <div className="rounded-[1.2rem] border border-(--border) bg-(--card-strong) px-4 py-4">
          <p className="text-xs uppercase tracking-[0.14em] text-(--muted)">Teaching</p>
          <p className="mt-2 text-2xl font-bold">{loading ? '...' : learning?.totalTeachingSessions || 0}</p>
        </div>
        <div className="rounded-[1.2rem] border border-(--border) bg-(--card-strong) px-4 py-4">
          <p className="text-xs uppercase tracking-[0.14em] text-(--muted)">Doubts Solved</p>
          <p className="mt-2 text-2xl font-bold">{loading ? '...' : learning?.totalDoubts || 0}</p>
        </div>
      </div>
    </div>
  )
}
