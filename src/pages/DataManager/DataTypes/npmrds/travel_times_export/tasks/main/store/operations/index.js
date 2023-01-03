// FIXME: These functions should probably get all their props from the ctx.
//        However, if an operation is used in an useEffect hook,
//          then the hook's dependencies array must contain the operation's deps.
//        Not sure how to resolve this at the moment.

import { createEtlContextPropsProxy } from "pages/DataManager/utils/EtlContext";

import {
  getNpmrdsDataDateExtent,
  queueNpmrdsExportRequest,
  getOpenRequestsStatuses,
  getEtlProcessFinalEvent as getEtlProcessFinalEventFromDamaController,
} from "./api";

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
      actions: { updateRequestStatusMsg, updateNpmrdsDownloadName },
      dispatch,
    } = ctx;

    const { etlContextId, npmrdsDownloadName } =
      createEtlContextPropsProxy(ctx);

    if (!etlContextId) {
      return;
    }

    const openRequestsStatuses = await getOpenRequestsStatuses(ctx);

    // console.log(openRequestsStatuses);

    const idx = openRequestsStatuses.findIndex(
      (e) => e.etl_context_id === etlContextId
    );

    if (idx === -1) {
      dispatch(updateRequestStatusMsg("This request has finished processing"));
      /*
       *  We'll need to navigate to a summary view once processing is done.
       *  We will need the DamaViewId.
       *  We will be able to get that using the etlContextId.
       *    The event_store FINAL event will have both the etlContextId and the damaViewId
       */
      clearInterval(interval);
      getEtlProcessFinalEvent(ctx);
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
        payload: { status, npmrdsDownloadName: _npmrdsDownloadName },
      } = openRequestsStatuses[idx];

      // Could leave this to the store to check, but why waste cycles
      if (!npmrdsDownloadName && _npmrdsDownloadName) {
        dispatch(updateNpmrdsDownloadName(_npmrdsDownloadName));
      }

      dispatch(updateRequestStatusMsg(`Request status: ${status}`));
    }
  };

  fn();
  interval = setInterval(fn, 1000);
}

export async function requestNpmrdsTravelTimesExport(ctx = this) {
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

    const { etlContextId } = await queueNpmrdsExportRequest(ctx);

    dispatch(setRequestStatusToReceived());
    dispatch(updateEtlContextId(etlContextId));

    monitorForStatusUpdates(ctx);
  } catch (err) {
    console.error(err);
    dispatch(setRequestStatusToError());
    dispatch(updateRequestErrMsg(err.message));
  }
}

export async function getEtlProcessFinalEvent(ctx = this) {
  const {
    actions: { updateEtlProcessFinalEvent },
    dispatch,
  } = ctx;

  try {
    const finalEvent = await getEtlProcessFinalEventFromDamaController(ctx);

    console.log(finalEvent);

    dispatch(updateEtlProcessFinalEvent(finalEvent));
  } catch (err) {
    console.error(err);
  }
}
