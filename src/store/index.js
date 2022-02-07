import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import { messages } from "modules/avl-components/src"

import { Reducers } from "@availabs/ams"

const reducer = combineReducers({
  ...Reducers,
  messages
});

export default createStore(reducer, applyMiddleware(thunk))
