import { createSlice } from "@reduxjs/toolkit";

import get from "lodash.get";

const initialState = {
  pgEnv: "dama_dev_1",
  falcorGraph: null,
};

const reducers = {
  setPgEnv: (state, action) => ({ ...state, pgEnv: action.payload }),
  setFalcorGraph: (state, action) => ({
    ...state,
    falcorGraph: action.payload,
  }),
};

export const datamanagerSlice = createSlice({
  name: "data_manager",
  initialState,
  reducers,
});

export const FalcorPaths = {
  PG_ENVS_LIST: ["dama-info", "pgEnvs"],
};

export const { setPgEnv, setFalcorGraph } = datamanagerSlice.actions;

export const selectPgEnv = (state) =>
  get(state, ["data_manager", "pgEnv"], null);

export const selectPgEnvs = (state) =>
  get(
    state,
    ["data_manager", "falcorGraph", "dama-info", "pgEnvs", "value"],
    []
  );

export default datamanagerSlice.reducer;
