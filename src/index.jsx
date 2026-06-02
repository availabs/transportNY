import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import store from "./store";

<<<<<<< HEAD
import { NPMRDS_API_HOST } from './config'

=======
import { GRAPH_HOST } from "./config";
>>>>>>> 8357f1e941b5f6dee5ca66d42a367f6c1e374484

import PPDAF_THEME from "./theme";
import {
  FalcorProvider,
  falcorGraph,
  ThemeContext,
} from "~/modules/avl-components/src";

import reportWebVitals from "./reportWebVitals";

import "./index.css";

<<<<<<< HEAD

export const falcor = falcorGraph(NPMRDS_API_HOST)
=======
export const falcor = falcorGraph(GRAPH_HOST);
>>>>>>> 8357f1e941b5f6dee5ca66d42a367f6c1e374484

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <FalcorProvider falcor={falcor}>
        <ThemeContext.Provider value={PPDAF_THEME}>
          <App />
        </ThemeContext.Provider>
      </FalcorProvider>
    </Provider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

reportWebVitals();
