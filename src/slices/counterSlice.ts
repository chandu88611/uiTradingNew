import { createSlice } from '@reduxjs/toolkit'

interface CounterState { value: number }
const initialState: CounterState = { value: 0 }

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    inc: (s) => { s.value += 1 },
    dec: (s) => { s.value -= 1 },
    reset: (s) => { s.value = 0 }
  }
})

export const { inc, dec, reset } = counterSlice.actions
export default counterSlice.reducer
