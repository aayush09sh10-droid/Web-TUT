export function getAuthCacheKey(auth) {
  if (!auth) {
    return 'guest'
  }

  if (typeof auth === 'string') {
    return auth || 'guest'
  }

  const user = auth.user || auth
  return String(user?.id || user?._id || user?.email || user?.username || 'guest').trim() || 'guest'
}

export const queryKeys = {
  history: (authKey) => ['history', getAuthCacheKey(authKey)],
  subjects: (authKey) => ['subjects', getAuthCacheKey(authKey)],
  profile: (authKey) => ['profile', getAuthCacheKey(authKey)],
  learningDetails: (authKey, id) => ['learning-details', getAuthCacheKey(authKey), id],
}
