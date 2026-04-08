import { useEffect, useRef } from 'react'
import { useAppDispatch } from '../../../store/hooks'
import { hydrateHomeState } from '../store/homeSlice'
import { readPersistedHomeState, writePersistedHomeState } from '../../../shared/storage/homeSession'

export function useHomePersistence(state, ownerId) {
  const dispatch = useAppDispatch()
  const hasHydratedHomeState = useRef(false)

  useEffect(() => {
    const stored = readPersistedHomeState(ownerId)
    if (stored) {
      dispatch(hydrateHomeState(stored))
    }
    hasHydratedHomeState.current = true
  }, [dispatch, ownerId])

  useEffect(() => {
    if (!hasHydratedHomeState.current) return
    writePersistedHomeState(state, ownerId)
  }, [ownerId, state])
}
