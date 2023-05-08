import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { API_HOST } from 'config'
import { AUTH_HOST, PROJECT_NAME, CLIENT_HOST } from 'config'

import { Provider } from 'react-redux';
import store from 'store';

import PPDAF_THEME from "./theme"
import {
  FalcorProvider,
  ThemeContext
} from "modules/avl-components/src"

import reportWebVitals from './reportWebVitals';

import { falcorGraph } from "store/falcorGraph"

import {
  enableAuth
} from "@availabs/ams"

import 'index.css';

const AuthEnabledApp = enableAuth(App, { AUTH_HOST, PROJECT_NAME, CLIENT_HOST });


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
   	<Provider store={ store }>
  		<FalcorProvider falcor={ falcorGraph }>
        <ThemeContext.Provider value={PPDAF_THEME}>
          <AuthEnabledApp />
        </ThemeContext.Provider>
      </FalcorProvider>
  	</Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

reportWebVitals();
