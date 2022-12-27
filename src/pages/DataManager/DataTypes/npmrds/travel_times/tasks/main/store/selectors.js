import _ from "lodash";

import { createSimpleSelector } from "pages/DataManager/utils/Reducks";

export const selectDataMinDate = (state) =>
  _.get(state, ["npmrdsDataDateExtent", 0], null);

export const selectDataMaxDate = (state) =>
  _.get(state, ["npmrdsDataDateExtent", 1], null);

export const selectDataState = createSimpleSelector("dataState");

export const selectDataStartDate = createSimpleSelector("dataStartDate");

export const selectDataEndDate = createSimpleSelector("dataEndDate");

export const selectExpandedMap = createSimpleSelector("expandedMap");

export const selectRequestStatus = createSimpleSelector("requestStatus");

export const selectEtlContextId = createSimpleSelector("etlContextId");

export const selectRequestErrMsg = createSimpleSelector("requestErrMsg");
