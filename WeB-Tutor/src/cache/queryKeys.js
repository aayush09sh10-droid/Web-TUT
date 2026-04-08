export const queryKeys = {
  history: (authToken) => ['history', authToken],
  profile: (authToken) => ['profile', authToken],
  learningDetails: (authToken, id) => ['learning-details', authToken, id],
}
