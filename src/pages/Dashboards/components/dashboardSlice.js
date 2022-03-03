import { createSlice } from '@reduxjs/toolkit'

const now = new Date()

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    region : 'REGION|1',
    month: '2020-12',//`${ now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}`,
    fsystem: 'All' // [1, 2, 3, 4, 5, 6, 7] 
  },
  reducers: {
    setRegion: (state,action) => {
      state.region = action.payload
    },
    setMonth: (state,action) => {
      state.month = action.payload
    },
    setFsystem: (state,action) => {
      state.fsystem = action.payload
    }
  }
})

// Action creators are generated for each case reducer function
export const { setRegion, setMonth, setFsystem } = dashboardSlice.actions


export default dashboardSlice.reducer