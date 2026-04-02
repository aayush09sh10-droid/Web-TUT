import { createSlice } from '@reduxjs/toolkit'

const headerSlice = createSlice({
  name: 'header',
  initialState: {
    isVisible: true,
    isMenuOpen: false,
  },
  reducers: {
    setHeaderVisible(state, action) {
      state.isVisible = action.payload
    },
    toggleHeaderMenu(state) {
      state.isMenuOpen = !state.isMenuOpen
    },
    closeHeaderMenu(state) {
      state.isMenuOpen = false
    },
  },
})

export const { setHeaderVisible, toggleHeaderMenu, closeHeaderMenu } = headerSlice.actions
export const headerReducer = headerSlice.reducer
