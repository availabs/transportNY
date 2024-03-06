import { createSlice } from '@reduxjs/toolkit'
import get from 'lodash/get'

const now = new Date()
now.setMonth(now.getMonth() - 1)
const onLoad = {
  region:  localStorage.getItem('tsmo-dashboard-region') || 'REGION|1',
  month: localStorage.getItem('tsmo-dashboard-month') || `${ now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}`,
  fsystem:  localStorage.getItem('tsmo-dashboard-fsystem') || 'All'
}

// console.log('testing', onLoad)

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    region : get(onLoad,'region','REGION|1'),
    month: get(onLoad,'month',`${ now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}`),
    fsystem: get(onLoad,'fsystem','All')
  },
  reducers: {
    setRegion: (state,action) => {
      localStorage.setItem('tsmo-dashboard-region', action.payload);
      state.region = action.payload
    },
    setMonth: (state,action) => {
      localStorage.setItem('tsmo-dashboard-month', action.payload);
      state.month = action.payload
    },
    setFsystem: (state,action) => {
      localStorage.setItem('tsmo-dashboard-fsystem', action.payload);
      state.fsystem = action.payload
    }
  }
})

// Action creators are generated for each case reducer function
export const { setRegion, setMonth, setFsystem } = dashboardSlice.actions


export default dashboardSlice.reducer
