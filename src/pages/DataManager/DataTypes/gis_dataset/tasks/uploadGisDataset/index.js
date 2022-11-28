import React, { useContext, useEffect, useReducer, useRef } from "react";

import EtlContext, {
  useEtlContextDependencies,
  EtlContextReact,
} from "../../utils/EtlContext";
import reducer, { init, actions, selectors, operations } from "./store";

import {
  GisDatasetUploadErrorMessage,
  GisDatasetUploadButton,
  GisDatasetFileMeta,
} from "./components";

const { uploadGisDataset } = operations;

export const taskName = "uploadGisDataset";

export default function UploadGisDataset() {
  const parentCtx = useContext(EtlContextReact);

  const [state, dispatch] = useReducer(
    reducer,
    // Fixme: maxSeenEventId belongs on damaEtlAdmin
    { maxSeenEventId: parentCtx.getState().maxSeenEventId || -1 },
    init
  );

  const { current: ctx } = useRef(
    new EtlContext({
      name: taskName,
      actions,
      selectors,
      dispatch,
      parentCtx,
    })
  );

  ctx.setState(state);

  useEffect(() => {
    parentCtx.dispatch({
      type: `${taskName}:STATE_UPDATE`,
      payload: state,
    });
  }, [parentCtx, state]);

  const etlCtxDeps = useEtlContextDependencies(ctx, [
    "etlContextId",
    "fileUploadStatus",
    "uploadedFile",
    "uploadErrMsg",
  ]);

  // console.log("==> uploadGisDataset", { etlCtxDeps });

  const { etlContextId, fileUploadStatus, uploadedFile, uploadErrMsg } =
    etlCtxDeps;

  if (!etlContextId) {
    return "";
  }

  if (uploadErrMsg) {
    <GisDatasetUploadErrorMessage
      etlContextId={etlContextId}
      uploadErrMsg={uploadErrMsg}
    />;
  }

  if (!uploadedFile) {
    return (
      <GisDatasetUploadButton
        uploadGisDataset={uploadGisDataset.bind(null, ctx)}
      />
    );
  }

  return (
    <GisDatasetFileMeta
      uploadedFile={uploadedFile}
      fileUploadStatus={fileUploadStatus}
    />
  );
}
