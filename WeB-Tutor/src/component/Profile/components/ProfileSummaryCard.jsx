import React from 'react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '../../../store/hooks'
import { PROFILE_FEATURE_CONFIG } from '../utils/profileFeatureUtils'

export default function ProfileSummaryCard({ panelStyle }) {
  const authUser = useAppSelector((state) => state.auth.auth?.user)
  const { profile, loading } = useAppSelector((state) => state.profile)
  const user = profile?.user || authUser
  const learning = profile?.learning
  const featureCards = [
    { key: 'summaries', label: 'Summaries' },
    { key: 'quizzes', label: 'Quizzes' },
    { key: 'teaching', label: 'Teaching' },
    { key: 'doubts', label: 'Doubts Solved' },
  ]

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
        {featureCards.map((card) => {
          const config = PROFILE_FEATURE_CONFIG[card.key]
          const count = learning?.[config?.countKey] || 0

          return (
            <Link
              key={card.key}
              to={`/profile/library/${card.key}`}
              className="rounded-[1.2rem] border border-(--border) bg-(--card-strong) px-4 py-4 transition hover:-translate-y-0.5"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-(--muted)">{card.label}</p>
              <p className="mt-2 text-2xl font-bold">{loading ? '...' : count}</p>
              <p className="mt-2 text-xs text-(--muted)">Open this feature page</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
