import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { queryKeys } from '../../cache'
import { fetchHistory } from '../History/api/historyApi'
import { hydrateHomeState } from '../Home/store/homeSlice'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { getProfilePanelStyle } from './utils/profileStyles'
import { buildLearningHomeState } from './utils/learningDetailsUtils'
import { getProfileFeatureConfig } from './utils/profileFeatureUtils'

export default function ProfileFeatureLibrary() {
  const { feature } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const theme = useAppSelector((state) => state.auth.theme)
  const isAuthenticated = Boolean(useAppSelector((state) => state.auth.auth?.user))
  const authCacheKey = isAuthenticated ? 'authenticated' : 'guest'
  const isDark = theme === 'dark'
  const panelStyle = useMemo(() => getProfilePanelStyle(isDark), [isDark])
  const config = getProfileFeatureConfig(feature)

  const historyQuery = useQuery({
    queryKey: queryKeys.history(authCacheKey),
    enabled: isAuthenticated,
    queryFn: ({ signal }) => fetchHistory(authCacheKey, signal),
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent duplicate calls
  })

  const filteredItems = useMemo(() => {
    if (!config || !Array.isArray(historyQuery.data)) {
      return []
    }

    return historyQuery.data.filter((item) => config.matches(item))
  }, [config, historyQuery.data])

  function handleOpenInHome(item) {
    dispatch(hydrateHomeState(buildLearningHomeState(item)))
    navigate('/')
  }

  if (!config) {
    return (
      <main className="min-h-screen text-(--text)">
        <section className="mx-auto flex w-full max-w-5xl flex-col px-3 pb-10 pt-6 sm:px-4 sm:pt-8">
          <div className="rounded-[1.8rem] border p-6 shadow-(--shadow) backdrop-blur-xl" style={panelStyle}>
            <h2 className="text-2xl font-bold">Feature not found</h2>
            <p className="mt-2 text-sm text-(--muted)">This profile section does not exist.</p>
            <div className="mt-4 flex gap-2">
              <Link to="/profile" className="rounded-full border border-(--border) bg-(--card) px-4 py-2 text-sm font-medium">
                Back to Profile
              </Link>
              <Link to="/" className="rounded-full border border-[rgba(99,102,241,0.18)] bg-[linear-gradient(135deg,rgba(99,102,241,0.14),rgba(56,189,248,0.12))] px-4 py-2 text-sm font-semibold text-(--text) shadow-[0_10px_24px_rgba(99,102,241,0.08)] transition hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.32)] hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.2),rgba(56,189,248,0.18))]">
                Open Home
              </Link>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen text-(--text)">
      <section className="mx-auto flex w-full max-w-5xl flex-col px-3 pb-10 pt-6 sm:px-4 sm:pt-8">
        <div className="rounded-[1.8rem] border p-6 shadow-(--shadow) backdrop-blur-xl" style={panelStyle}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{config.title}</h2>
              <p className="mt-2 text-sm text-(--muted)">{config.description}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to="/profile" className="rounded-full border border-(--border) bg-(--card) px-4 py-2 text-center text-xs font-medium transition hover:-translate-y-0.5">
                Back to Profile
              </Link>
              <Link to="/" className="rounded-full border border-(--border) bg-(--card-strong) px-4 py-2 text-center text-xs font-semibold text-(--text) transition hover:-translate-y-0.5">
                Open Home
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {historyQuery.isLoading || historyQuery.isFetching ? (
            <div className="rounded-[1.5rem] border border-(--border) bg-(--card) p-5 shadow-(--shadow) backdrop-blur-xl">
              <p className="text-sm text-(--muted)">Loading saved lessons...</p>
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div key={item.id} className="rounded-[1.5rem] border border-(--border) bg-(--card) p-5 shadow-(--shadow) backdrop-blur-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-(--text)">
                      {item.result?.summary?.title || item.sourceLabel || 'Saved lesson'}
                    </h3>
                    <p className="mt-1 text-sm text-(--muted)">{new Date(item.timestamp).toLocaleString()}</p>
                    <p className="mt-2 text-sm text-(--muted)">
                      {item.sourceLabel}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => handleOpenInHome(item)}
                      className="rounded-full border border-[rgba(99,102,241,0.18)] bg-[linear-gradient(135deg,rgba(99,102,241,0.14),rgba(56,189,248,0.12))] px-4 py-2 text-xs font-semibold text-(--text) shadow-[0_10px_24px_rgba(99,102,241,0.08)] transition hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.32)] hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.2),rgba(56,189,248,0.18))]"
                    >
                      Open in Home
                    </button>
                    <Link
                      to={`/profile/learning/${item.id}`}
                      className="rounded-full border border-(--border) bg-(--card-strong) px-4 py-2 text-center text-xs font-medium transition hover:-translate-y-0.5"
                    >
                      Open Details
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-(--border) bg-(--card) p-5 shadow-(--shadow) backdrop-blur-xl">
              <p className="text-sm text-(--muted)">No saved lessons are available for this feature yet.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
