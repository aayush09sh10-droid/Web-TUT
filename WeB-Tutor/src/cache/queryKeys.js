export const queryKeys = {
  history: (authToken) => ['history', authToken],
  subjects: (authToken) => ['subjects', authToken],
  profile: (authToken) => ['profile', authToken],
  learningDetails: (authToken, id) => ['learning-details', authToken, id],
}
