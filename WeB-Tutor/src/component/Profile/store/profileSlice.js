import { createSlice } from '@reduxjs/toolkit'

const initialPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

const initialState = {
  profile: null,
  loading: true,
  error: '',
  showPasswordForm: false,
  passwordForm: initialPasswordForm,
  passwordLoading: false,
  passwordMessage: '',
  passwordError: '',
  learningItem: null,
  learningLoading: true,
  learningError: '',
}

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfileLoading(state, action) {
      state.loading = action.payload
    },
    setProfileError(state, action) {
      state.error = action.payload
    },
    setProfileData(state, action) {
      state.profile = action.payload
    },
    togglePasswordForm(state) {
      state.showPasswordForm = !state.showPasswordForm
      state.passwordError = ''
      state.passwordMessage = ''
    },
    updatePasswordField(state, action) {
      const { field, value } = action.payload
      state.passwordForm[field] = value
    },
    resetPasswordForm(state) {
      state.passwordForm = initialPasswordForm
    },
    setPasswordLoading(state, action) {
      state.passwordLoading = action.payload
    },
    setPasswordMessage(state, action) {
      state.passwordMessage = action.payload
    },
    setPasswordError(state, action) {
      state.passwordError = action.payload
    },
    setLearningLoading(state, action) {
      state.learningLoading = action.payload
    },
    setLearningError(state, action) {
      state.learningError = action.payload
    },
    setLearningItem(state, action) {
      state.learningItem = action.payload
    },
    resetProfileState() {
      return initialState
    },
  },
})

export const {
  setProfileLoading,
  setProfileError,
  setProfileData,
  togglePasswordForm,
  updatePasswordField,
  resetPasswordForm,
  setPasswordLoading,
  setPasswordMessage,
  setPasswordError,
  setLearningLoading,
  setLearningError,
  setLearningItem,
  resetProfileState,
} = profileSlice.actions
export const profileReducer = profileSlice.reducer
