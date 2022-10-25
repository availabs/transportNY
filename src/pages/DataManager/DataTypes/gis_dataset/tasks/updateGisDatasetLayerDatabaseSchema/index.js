import React, { useEffect, useReducer, useRef } from "react";

import EtlContext, { useEtlContextDependencies } from "../../utils/EtlContext";
import { checkApiResponse } from "../../utils/api";

import reducer, { init, selectors, actions } from "./store";

import { GisDatasetLayerDatabaseDbSchemaForm } from "./components";

const { updateTableDescriptor } = actions;

export const taskName = "updateGisDatasetLayerDatabaseSchema";

export default function UpdateGisDatasetLayerDatabaseDbSchema({ ctx: pCtx }) {
  const [state, dispatch] = useReducer(reducer, null, init);

  const { current: ctx } = useRef(
    new EtlContext({
      name: taskName,
      actions,
      selectors,
      dispatch,
      pCtx,
    })
  );

  ctx.setState(state);

  const {
    meta: { rtPfx },
  } = pCtx;

  useEffect(() => {
    pCtx.dispatch({
      type: `${taskName}:STATE_UPDATE`,
      payload: state,
    });
  }, [pCtx, state]);

  const etlCtxDeps = useEtlContextDependencies(ctx, [
    "gisUploadId",
    "layerName",
    "tableDescriptor",
  ]);

  const { gisUploadId, layerName } = etlCtxDeps;

  useEffect(() => {
    (async () => {
      if (gisUploadId && layerName) {
        const tblDscRes = await fetch(
          `${rtPfx}/staged-geospatial-dataset/${gisUploadId}/${layerName}/tableDescriptor`
        );

        await checkApiResponse(tblDscRes);
        const tblDsc = await tblDscRes.json();

        dispatch(updateTableDescriptor(tblDsc));
      }
    })();
  }, [rtPfx, gisUploadId, layerName]);

  if (!layerName) {
    return "";
  }

  return (
    <div>
      <GisDatasetLayerDatabaseDbSchemaForm ctx={ctx} />
    </div>
  );
}
