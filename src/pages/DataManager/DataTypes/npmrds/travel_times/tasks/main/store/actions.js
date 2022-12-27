import { createSimpleIdentityAction } from "pages/DataManager/utils/Reducks";
import RequestStatus from "../constants/RequestStatus";

export const updateDataState = createSimpleIdentityAction("dataState/UPDATE");

export const updateDataStartDate = createSimpleIdentityAction(
  "dataStartDate/UPDATE"
);

export const updateDataEndDate =
  createSimpleIdentityAction("dataEndDate/UPDATE");

export const updateExpandedMap =
  createSimpleIdentityAction("expandedMap/UPDATE");

export const updateEtlContextId = createSimpleIdentityAction(
  "etlContextId/UPDATE"
);

export const updateConfiguration = createSimpleIdentityAction(
  "configuration/UPDATE"
);

export const setRequestStatusToInitial = createSimpleIdentityAction(
  "requestStatus/UPDATE"
).bind(null, RequestStatus.INITIAL);

export const setRequestStatusToRequestingConfiguration =
  createSimpleIdentityAction("requestStatus/UPDATE").bind(
    null,
    RequestStatus.REQUESTING_CONFIGURATION
  );

export const setRequestStatusToSending = createSimpleIdentityAction(
  "requestStatus/UPDATE"
).bind(null, RequestStatus.SENDING);

export const setRequestStatusToReceived = createSimpleIdentityAction(
  "requestStatus/UPDATE"
).bind(null, RequestStatus.RECEIVED);

export const setRequestStatusToDone = createSimpleIdentityAction(
  "requestStatus/UPDATE"
).bind(null, RequestStatus.DONE);

export const setRequestStatusToError = createSimpleIdentityAction(
  "requestStatus/UPDATE"
).bind(null, RequestStatus.ERROR);

export const updateRequestErrMsg = createSimpleIdentityAction(
  "requestErrMsg/UPDATE"
);
