import { createSlice } from '@reduxjs/toolkit'

const historySlice = createSlice({
  name: 'history',
  initialState: {
    items: [],
    selectedId: null,
    loading: false,
    error: '',
  },
  reducers: {
    setHistoryLoading(state, action) {
      state.loading = action.payload
    },
    setHistoryError(state, action) {
      state.error = action.payload
    },
    setHistoryItems(state, action) {
      state.items = action.payload
    },
    selectHistoryItem(state, action) {
      state.selectedId = action.payload
    },
    clearSelectedHistoryItem(state) {
      state.selectedId = null
    },
    clearAllHistoryItems(state) {
      state.items = []
      state.selectedId = null
    },
    removeHistoryItemFromState(state, action) {
      state.items = state.items.filter((item) => item.id !== action.payload)
      if (state.selectedId === action.payload) {
        state.selectedId = null
      }
    },
  },
})

export const {
  setHistoryLoading,
  setHistoryError,
  setHistoryItems,
  selectHistoryItem,
  clearSelectedHistoryItem,
  clearAllHistoryItems,
  removeHistoryItemFromState,
} = historySlice.actions
export const historyReducer = historySlice.reducer
