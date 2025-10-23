/*import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'*/
// import { Reducers, messages } from "@availabs/ams";
// import { Reducers, messages } from "~/modules/ams/src"

import dashboard from "~/sites/tsmo/pages/Dashboards/components/dashboardSlice";

import { configureStore } from "@reduxjs/toolkit";

import report from "~/sites/npmrds/pages/analysis/reports/store"

// const reducer = combineReducers({
//   ...Reducers,
//   messages
// });

// export default createStore(reducer, applyMiddleware(thunk))
export default configureStore({
  reducer: {
    dashboard,
    report
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false
    })
});
