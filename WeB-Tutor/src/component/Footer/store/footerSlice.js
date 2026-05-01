import { createSlice } from '@reduxjs/toolkit'

const footerSlice = createSlice({
  name: 'footer',
  initialState: {
    brandName: 'WebTut',
    tagline: 'Learn from videos, files, and questions with summaries, quizzes, and guided lessons.',
    badgeText: 'Built for playful learning',
  },
  reducers: {},
})

export const footerReducer = footerSlice.reducer
