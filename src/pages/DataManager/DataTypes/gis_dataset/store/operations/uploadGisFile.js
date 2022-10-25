import { checkApiResponse } from "../../utils/api";

export default async function uploadGisFile(file) {
  let stopPolling = false;

  try {
    // The following results in: Maximum call stack size exceeded
    // resetState();

    dispatch(updateUploadedFile(file));

    // First, we need to get a new etl-context-id
    //
    //   NOTE:  If we omit this step, in order to get progress updates
    //          the dama-admin server would need to immediately return the etlContextId
    //          for an upload, and the client would need to determine the status of the
    //          upload by querying the upload events.
    //
    const newEtlCtxRes = await fetch(`${rtPfx}/new-etl-context-id`);

    await checkApiResponse(newEtlCtxRes);

    const _etlCtxId = await newEtlCtxRes.text();

    dispatch(updateEtlContextId(_etlCtxId));

    const formData = new FormData();
    // https://moleculer.services/docs/0.14/moleculer-web.html#File-upload-aliases
    // text form-data fields must be sent before files fields.
    formData.append("etlContextId", _etlCtxId);
    formData.append("user_id", userId);
    formData.append("fileSizeBytes", file.size);
    formData.append("progressUpdateIntervalMs", progressUpdateIntervalMs);
    formData.append("file", file);

    let _maxSeenEventId = -1;

    async function queryEtlContextEvents(
      etlCtxId = etlContextId,
      sinceEventId = maxSeenEventId
    ) {
      if (!etlCtxId) {
        console.error("etlContextId is required to poll for events.");
        return;
      }

      const url = new URL(`${rtPfx}/events/query`);

      url.searchParams.append("etl_context_id", etlCtxId);
      url.searchParams.append("event_id", sinceEventId);

      const res = await fetch(url);

      await checkApiResponse(res);

      const events = await res.json();

      return events;
    }

    async function pollEvents() {
      const events = await queryEtlContextEvents(_etlCtxId, _maxSeenEventId);

      if (Array.isArray(events) && events.length) {
        const latestEvent = events[events.length - 1];
        // console.log(latestEvent);
        dispatch(updateMaxSeenEventId(latestEvent.event_id));
        dispatch(updateFileUploadStatus(latestEvent));
      }

      if (!stopPolling) {
        setTimeout(pollEvents, progressUpdateIntervalMs);
      }
    }

    setTimeout(pollEvents, progressUpdateIntervalMs);

    // Upload the Geospatial Dataset
    const res = await fetch(
      `${rtPfx}/staged-geospatial-dataset/uploadGeospatialDataset`,
      {
        method: "POST",
        body: formData,
      }
    );

    await checkApiResponse(res);

    // Upload response is the ETL ID
    const [{ id }] = await res.json();

    const layerNamesRes = await fetch(
      `${rtPfx}/staged-geospatial-dataset/${id}/layerNames`
    );

    await checkApiResponse(layerNamesRes);

    const layerNames = await layerNamesRes.json();

    stopPolling = true;

    dispatch(updateGisUploadId(id));
    dispatch(updateLayerNames(layerNames));

    if (layerNames.length === 1) {
      selectLayer(layerNames[0], id);
    }
  } catch (err) {
    stopPolling = true;
    dispatch(updateUploadErrMsg(err.message));
  }
}
