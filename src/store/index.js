/*import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'*/

import { messages } from "modules/avl-components/src"

import { Reducers } from "@availabs/ams"

import dashboard from 'pages/Dashboards/components/dashboardSlice'

import { configureStore } from '@reduxjs/toolkit'


// const reducer = combineReducers({
//   ...Reducers,
//   messages
// });

// export default createStore(reducer, applyMiddleware(thunk))
export default configureStore({
  reducer: {
    dashboard,
    ...Reducers,
    messages
  }
})