// FIXME: These functions should probably get all their props from the ctx.
//        However, if an operation is used in an useEffect hook,
//          then the hook's dependencies array must contain the operation's deps.
//        Not sure how to resolve this at the moment.

import { checkApiResponse, queueNpmrdsExportRequest } from "../../utils/api";
import { createEtlContextPropsProxy } from "pages/DataManager/utils/EtlContext";

import { getNpmrdsDataDateExtent } from "../../utils/api";

export async function configure(ctx = this) {
  const {
    actions: {
      setRequestStatusToRequestingConfiguration,
      updateConfiguration,
      setRequestStatusToError,
      updateRequestErrMsg,
    },
    dispatch,
  } = ctx;

  try {
    dispatch(setRequestStatusToRequestingConfiguration());

    const npmrdsDataDateExtent = await getNpmrdsDataDateExtent(ctx);

    dispatch(updateConfiguration({ npmrdsDataDateExtent }));
  } catch (err) {
    console.log("ERROR ".repeat(10));
    console.error(err);
    dispatch(setRequestStatusToError());
    dispatch(updateRequestErrMsg(err.message));
  }
}

export async function requestNpmrdsTravelTimesData(ctx = this) {
  const {
    actions: {
      updateEtlContextId,
      setRequestStatusToSending,
      setRequestStatusToReceived,
      setRequestStatusToError,
      updateRequestErrMsg,
    },
    dispatch,
  } = ctx;

  const { dataState, dataStartDate, dataEndDate } =
    createEtlContextPropsProxy(ctx);

  if (!(dataState && dataStartDate && dataEndDate)) {
    throw new Error("Incomplete data to throw request.");
  }

  try {
    dispatch(setRequestStatusToSending());

    const etlContextId = await queueNpmrdsExportRequest(ctx);

    dispatch(setRequestStatusToReceived());
    dispatch(updateEtlContextId(etlContextId));
  } catch (err) {
    console.error(err);
    dispatch(setRequestStatusToError());
    dispatch(updateRequestErrMsg(err.message));
  }
}
