import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { API_HOST, AUTH_HOST, PROJECT_NAME, CLIENT_HOST } from './config'

import PPDAF_THEME from "./theme"
import {
  FalcorProvider,
  falcorGraph,
  ThemeContext
} from "~/modules/avl-components/src"

import reportWebVitals from './reportWebVitals';

import "./index.css";

export const falcor = falcorGraph(API_HOST)



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
  		<FalcorProvider falcor={ falcor }>
        <ThemeContext.Provider value={PPDAF_THEME}>
          <App />
        </ThemeContext.Provider>
      </FalcorProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

reportWebVitals();
