import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  inputMode: 'video',
  url: '',
  studyUploads: [],
  askPrompt: '',
  summaryPrompt: '',
  result: null,
  loading: false,
  error: '',
  history: [],
  activeView: 'summary',
  quizLoading: false,
  quizError: '',
  teachingLoading: false,
  teachingError: '',
  formulaLoading: false,
  formulaError: '',
  selectedAnswers: {},
  quizSubmitted: false,
  activeTopicId: '',
  activeFormulaSectionId: '',
  activeFormulaPanel: 'explanation',
  showComposer: true,
  doubtQuestion: '',
  doubtLoading: false,
  doubtError: '',
}

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    hydrateHomeState(state, action) {
      return {
        ...state,
        ...action.payload,
      }
    },
    setHomeField(state, action) {
      const { field, value } = action.payload
      state[field] = value
    },
    setHomeFields(state, action) {
      Object.assign(state, action.payload)
    },
    setHomeHistory(state, action) {
      state.history = action.payload
    },
    addHistoryItem(state, action) {
      const item = action.payload
      const deduped = [item, ...state.history.filter((historyItem) => historyItem.url !== item.url)]
      state.history = deduped.slice(0, 12)
    },
    updateHistoryResultInState(state, action) {
      const { nextResult, currentSourceLabel, getSourceLabel } = action.payload
      state.history = state.history.map((item) =>
        item.result?.historyId === nextResult?.historyId || item.url === currentSourceLabel
          ? {
              ...item,
              url: getSourceLabel || item.url,
              result: nextResult,
              timestamp: Date.now(),
            }
          : item
      )
    },
    resetHomeForNewSummary(state) {
      state.url = ''
      state.studyUploads = []
      state.askPrompt = ''
      state.summaryPrompt = ''
      state.loading = false
      state.error = ''
      state.doubtLoading = false
      state.doubtError = ''
      state.showComposer = true
    },
    setSelectedAnswer(state, action) {
      const { questionId, optionIndex } = action.payload
      state.selectedAnswers[questionId] = optionIndex
    },
    resetQuizSelections(state) {
      state.selectedAnswers = {}
      state.quizSubmitted = false
    },
    resetHomeState() {
      return initialState
    },
  },
})

export const {
  hydrateHomeState,
  setHomeField,
  setHomeFields,
  setHomeHistory,
  addHistoryItem,
  updateHistoryResultInState,
  resetHomeForNewSummary,
  setSelectedAnswer,
  resetQuizSelections,
  resetHomeState,
} = homeSlice.actions
export const homeReducer = homeSlice.reducer
