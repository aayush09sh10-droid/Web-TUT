import { createSlice } from '@reduxjs/toolkit'

const footerSlice = createSlice({
  name: 'footer',
  initialState: {
    brandName: 'YouTube Summarizer',
    tagline: 'Turn videos into a study playground with summaries, quizzes, and guided lessons.',
    badgeText: 'Built for playful learning',
  },
  reducers: {},
})

export const footerReducer = footerSlice.reducer
