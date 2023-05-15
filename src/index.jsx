import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import { API_HOST, AUTH_HOST, PROJECT_NAME, CLIENT_HOST } from '~/config'

import { Provider } from 'react-redux';
import store from '~/store';

import PPDAF_THEME from "./theme"
import {
  FalcorProvider,
  falcorGraph,
  ThemeContext
} from "~/modules/avl-components/src"

import reportWebVitals from './reportWebVitals';

//import { falcorGraph as falcor } from "~/store/falcorGraph"

import {
  enableAuth
} from "@availabs/ams"

import "~/index.css";

export const falcor = falcorGraph(API_HOST)

const AuthEnabledApp = enableAuth(App, { AUTH_HOST, PROJECT_NAME, CLIENT_HOST });


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
   	<Provider store={ store }>
  		<FalcorProvider falcor={ falcor }>
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
