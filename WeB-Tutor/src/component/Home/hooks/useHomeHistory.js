import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../cache'
import { getAuthCacheKey } from '../../../cache/queryKeys'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchHomeHistory } from '../api/homeApi'
import { setHomeHistory } from '../store/homeSlice'

export function useHomeHistory(authToken) {
  const dispatch = useAppDispatch()
  const authUser = useAppSelector((state) => state.auth.auth?.user)
  const hasValidAuth = Boolean(authUser)
  const authCacheKey = getAuthCacheKey(authUser)
  const query = useQuery({
    queryKey: queryKeys.history(authCacheKey),
    enabled: hasValidAuth,
    queryFn: ({ signal }) =>
      fetchHomeHistory(
        authToken
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : {},
        signal
      ),
  })

  useEffect(() => {
    if (!hasValidAuth) {
      dispatch(setHomeHistory([]))
      return
    }

    if (query.data) {
      dispatch(setHomeHistory(query.data))
    }
  }, [dispatch, hasValidAuth, query.data])

  useEffect(() => {
    if (query.error && query.error.name !== 'AbortError') {
      console.error('History load error:', query.error)
    }
  }, [query.error])

  return query
}
