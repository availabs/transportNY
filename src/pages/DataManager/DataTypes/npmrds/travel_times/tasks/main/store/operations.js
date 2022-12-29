// FIXME: These functions should probably get all their props from the ctx.
//        However, if an operation is used in an useEffect hook,
//          then the hook's dependencies array must contain the operation's deps.
//        Not sure how to resolve this at the moment.

import { createEtlContextPropsProxy } from "pages/DataManager/utils/EtlContext";

import {
  checkApiResponse,
  getNpmrdsDataDateExtent,
  queueNpmrdsExportRequest,
  getOpenRequestsStatuses,
} from "../../utils/api";
import { updateRequestStatusMsg } from "./actions";

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

export async function monitorForStatusUpdates(ctx = this) {
  let interval;

  const fn = async () => {
    const {
      actions: { updateRequestStatusMsg },
      dispatch,
    } = ctx;

    const { etlContextId } = createEtlContextPropsProxy(ctx);

    if (!etlContextId) {
      return;
    }

    const openRequestsStatuses = await getOpenRequestsStatuses(ctx);

    // console.log(JSON.stringify(openRequestsStatuses, null, 4));

    const idx = openRequestsStatuses.findIndex(
      (e) => e.etl_context_id === etlContextId
    );

    if (idx === -1) {
      dispatch(updateRequestStatusMsg("This request has finished processing"));
      clearInterval(interval);
      return;
    }

    if (idx) {
      const plural = idx > 1 ? ["are", "s"] : ["is", ""];
      const [
        {
          payload: { status },
        },
      ] = openRequestsStatuses;

      dispatch(
        updateRequestStatusMsg(
          `There ${plural[0]} ${idx} request${plural[1]} ahead of this one in the queue. The currently processing request's status is: ${status}`
        )
      );
    } else {
      const {
        payload: { status },
      } = openRequestsStatuses[idx];
      dispatch(updateRequestStatusMsg(`Request status: ${status}`));
    }
  };

  fn();
  interval = setInterval(fn, 1000);
}

export async function requestNpmrdsTravelTimesData(ctx = this) {
  const {
    actions: {
      updateEtlContextId,
      updateNpmrdsDownloadName,
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

    const { etlContextId, npmrdsDownloadName } = await queueNpmrdsExportRequest(
      ctx
    );

    dispatch(setRequestStatusToReceived());
    dispatch(updateEtlContextId(etlContextId));
    dispatch(updateNpmrdsDownloadName(npmrdsDownloadName));

    monitorForStatusUpdates(ctx);
  } catch (err) {
    console.error(err);
    dispatch(setRequestStatusToError());
    dispatch(updateRequestErrMsg(err.message));
  }
}
