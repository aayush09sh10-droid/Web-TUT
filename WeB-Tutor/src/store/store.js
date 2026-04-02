import { configureStore } from '@reduxjs/toolkit'
import { authReducer } from '../component/Auth/store/authSlice'
import { footerReducer } from '../component/Footer/store/footerSlice'
import { headerReducer } from '../component/Header/store/headerSlice'
import { historyReducer } from '../component/History/store/historySlice'
import { homeReducer } from '../component/Home/store/homeSlice'
import { profileReducer } from '../component/Profile/store/profileSlice'
import { summaryTabsReducer } from '../component/SummaryTabs/store/summaryTabsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    header: headerReducer,
    footer: footerReducer,
    history: historyReducer,
    home: homeReducer,
    profile: profileReducer,
    summaryTabs: summaryTabsReducer,
  },
})
