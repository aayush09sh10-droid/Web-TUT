import { queryClient } from './queryClient'
import { queryKeys } from './queryKeys'

export function setHistoryCache(authToken, historyItems) {
  queryClient.setQueryData(queryKeys.history(authToken), historyItems)
}

export function invalidateHistoryCache(authToken) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.history(authToken) })
}

export function setProfileCache(authToken, profile) {
  queryClient.setQueryData(queryKeys.profile(authToken), profile)
}
