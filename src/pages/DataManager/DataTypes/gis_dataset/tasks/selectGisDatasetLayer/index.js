import React, { useEffect, useReducer, useRef } from "react";

import EtlContext, { useEtlContextDependencies } from "../../utils/EtlContext";

import reducer, { init, operations, selectors, actions } from "./store";

import { LayerSelector, LayerAnalysisSection } from "./components";

const { getLayerNames, getLayerAnalysis } = operations;

export default function SelectGisDatasetLayer({ ctx: pCtx }) {
  const [state, dispatch] = useReducer(reducer, null, init);

  const { current: ctx } = useRef(
    new EtlContext({
      name: "SelectGisDatasetLayer",
      actions,
      selectors,
      dispatch,
      pCtx,
    })
  );

  ctx.setState(state);

  useEffect(() => {
    pCtx.dispatch({
      type: "selectGisDatasetLayer:STATE_UPDATE",
      payload: state,
    });
  }, [pCtx, state]);

  const etlCtxDeps = useEtlContextDependencies(ctx, [
    "gisUploadId",
    "uploadedFile",
    "layerNames",
    "layerName",
  ]);

  const { gisUploadId, uploadedFile, layerNames, layerName } = etlCtxDeps;

  useEffect(() => {
    if (gisUploadId && uploadedFile) {
      getLayerNames(ctx, gisUploadId);
    }
  }, [ctx, gisUploadId, uploadedFile]);

  useEffect(() => {
    if (gisUploadId && layerName) {
      getLayerAnalysis(ctx, gisUploadId, layerName);
    }
  }, [ctx, gisUploadId, layerName]);

  if (!layerNames) {
    return "";
  }

  return (
    <div>
      <LayerSelector ctx={ctx} />
      <LayerAnalysisSection ctx={ctx} />
    </div>
  );
}
