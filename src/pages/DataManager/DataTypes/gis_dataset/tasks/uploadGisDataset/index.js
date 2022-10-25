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

export default function UploadGisDataset() {
  const pCtx = useContext(EtlContextReact);

  const [state, dispatch] = useReducer(
    reducer,
    // Fixme: maxSeenEventId belongs on damaEtlAdmin
    { maxSeenEventId: pCtx.getState().maxSeenEventId || -1 },
    init
  );

  const { current: ctx } = useRef(
    new EtlContext({
      name: "UploadGisDataset",
      actions,
      selectors,
      dispatch,
      pCtx,
    })
  );

  ctx.setState(state);

  useEffect(() => {
    pCtx.dispatch({
      type: "uploadGisDataset:STATE_UPDATE",
      payload: state,
    });
  }, [pCtx, state]);

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
