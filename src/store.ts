import { configureStore } from '@reduxjs/toolkit'
import { baseApi } from './services/baseApi'
import counterReducer from './slices/counterSlice'

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    [baseApi.reducerPath]: baseApi.reducer
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
