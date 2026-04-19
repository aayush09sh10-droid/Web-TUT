import { queryClient } from './queryClient'
import { queryKeys } from './queryKeys'

export function setHistoryCache(authKey, historyItems) {
  queryClient.setQueryData(queryKeys.history(authKey), historyItems)
}

export function invalidateHistoryCache(authKey) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.history(authKey) })
}

export function setProfileCache(authKey, profile) {
  queryClient.setQueryData(queryKeys.profile(authKey), profile)
}
