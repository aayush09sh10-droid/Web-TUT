import { createSlice } from '@reduxjs/toolkit'

const summaryTabsSlice = createSlice({
  name: 'summaryTabs',
  initialState: {
    activeTab: 'topics',
  },
  reducers: {
    setSummaryTab(state, action) {
      state.activeTab = action.payload
    },
  },
})

export const { setSummaryTab } = summaryTabsSlice.actions
export const summaryTabsReducer = summaryTabsSlice.reducer
