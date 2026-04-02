import { useEffect, useRef } from 'react'
import { useAppDispatch } from '../../../store/hooks'
import { hydrateHomeState } from '../store/homeSlice'

export const HOME_STATE_STORAGE_KEY = 'yt-summarizer-home-state'

export function useHomePersistence(state) {
  const dispatch = useAppDispatch()
  const hasHydratedHomeState = useRef(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(HOME_STATE_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        dispatch(hydrateHomeState(parsed))
      } catch {
        // ignore malformed stored value
      }
    }
    hasHydratedHomeState.current = true
  }, [dispatch])

  useEffect(() => {
    if (!hasHydratedHomeState.current) return
    window.localStorage.setItem(HOME_STATE_STORAGE_KEY, JSON.stringify(state))
  }, [state])
}
