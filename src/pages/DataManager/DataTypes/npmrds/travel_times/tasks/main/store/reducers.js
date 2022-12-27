import deepFreeze from "deep-freeze-strict";
import _ from "lodash";

import { assign, cloneDeep } from "lodash";
import RequestStatus from "../constants/RequestStatus";

export const initialState = deepFreeze({
  etlContextId: null,

  // The min/max dates available from RITIS.
  npmrdsDataDateExtent: null,

  dataState: "ny",
  dataStartDate: null,
  dataEndDate: null,
  expandedMap: true,

  requestStatus: RequestStatus.INITIAL,
  requestErrMsg: null,
});

export function init(config) {
  const clone = cloneDeep(initialState);

  const state = assign(clone, config);

  return state;
}

export default function reducer(state, action) {
  const { type, payload } = action;

  console.log({ reducer: { action } });

  switch (type) {
    case "configuration/UPDATE": {
      const {
        npmrdsDataDateExtent: [,dataMaxDate],
      } = payload;

      const requestStatus =
        state.requestStatus < RequestStatus.CONFIGURED
          ? RequestStatus.CONFIGURED
          : state.requestStatus;

      let { dataStartDate } = state;
      const dataEndDate = state.dataEndDate || dataMaxDate;

      if (dataStartDate === null) {
        const d = new Date(dataMaxDate);
        d.setDate(d.getDate() - 7);
        dataStartDate = d.toISOString().replace(/T.*/, "");
      }

      return _.isEqual(state.npmrdsDataDateExtent, payload)
        ? state
        : {
            ...state,
            dataStartDate,
            dataEndDate,
            requestStatus,
            npmrdsDataDateExtent: payload.npmrdsDataDateExtent,
          };
    }

    case "dataState/UPDATE":
      return state.dataState === payload
        ? state
        : { ...state, dataState: payload };

    case "dataStartDate/UPDATE":
      return state.dataStartDate === payload
        ? state
        : { ...state, dataStartDate: payload };

    case "dataEndDate/UPDATE":
      return state.dataEndDate === payload
        ? state
        : { ...state, dataEndDate: payload };

    case "expandedMap/UPDATE":
      return state.expandedMap === payload
        ? state
        : { ...state, expandedMap: payload };

    case "etlContextId/UPDATE":
      return state.etlContextId === payload
        ? state
        : { ...state, etlContextId: payload };

    case "requestStatus/UPDATE":
      return state.requestStatus === payload
        ? state
        : { ...state, requestStatus: payload };

    case "requestErrMsg/UPDATE":
      return state.requestErrMsg === payload
        ? state
        : { ...state, requestErrMsg: payload };

    default:
      return state;
  }
}
