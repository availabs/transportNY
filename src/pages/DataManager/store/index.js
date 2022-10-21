import { createSlice } from "@reduxjs/toolkit";

import get from "lodash.get";

const sliceName = "data_manager";

const defaultPgEnv = "npmrds";

const lclStoKeys = {
  pgEnv: `redux.${sliceName}.pgEnv`,
};

const onLoadPgEnv = localStorage.getItem(lclStoKeys.pgEnv);

const initialState = {
  falcorGraph: null,
  pgEnv: onLoadPgEnv || defaultPgEnv,
};

const reducers = {
  setFalcorGraph: (state, action) => {
    if (selectFalcorGraph(state) !== null) {
      return state;
    }

    return {
      ...state,
      falcorGraph: action.payload,
    };
  },

  setPgEnv: (state, action) => {
    const { payload: pgEnv } = action;

    const oldPgEnv = selectPgEnv(state);

    localStorage.setItem(lclStoKeys.pgEnv, pgEnv);

    return oldPgEnv === pgEnv ? state : { ...state, pgEnv };
  },
};

export const datamanagerSlice = createSlice({
  name: sliceName,
  initialState,
  reducers,
});

export const {
  actions: { setPgEnv, setFalcorGraph },
} = datamanagerSlice;

export const queryPgEnvs = () => ["dama-info", "pgEnvs"];

const selectFalcorGraph = (state) => {
  return get(state, [sliceName, "falcorGraph"], null);
};

export const selectPgEnv = (state) => {
  return get(state, [sliceName, "pgEnv"], null);
};

export const selectIsPwrUsr = (state) => {
  const { user } = state;

  const isPwrUsr =
    user && Array.isArray(user.groups) && user.groups.includes("AVAIL");

  return isPwrUsr;
};

export const selectUserId = (state) => {
  const { user } = state;

  return user ? user.id : null;
};

export const selectPgEnvs = (state) =>
  get(selectFalcorGraph(state), [...queryPgEnvs(), "value"], []);

export default datamanagerSlice.reducer;
