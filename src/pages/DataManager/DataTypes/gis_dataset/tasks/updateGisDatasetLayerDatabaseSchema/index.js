import React, { useContext, useEffect, useReducer, useRef } from "react";

import EtlContext, {
  useEtlContextDependencies,
  EtlContextReact,
} from "../../utils/EtlContext";
import { checkApiResponse } from "../../utils/api";

import reducer, { init, selectors, actions } from "./store";

import { GisDatasetLayerDatabaseDbSchemaForm } from "./components";

const { updateTableDescriptor } = actions;

export const taskName = "updateGisDatasetLayerDatabaseSchema";

export default function UpdateGisDatasetLayerDatabaseDbSchema() {
  const parentCtx = useContext(EtlContextReact);

  const [state, dispatch] = useReducer(reducer, null, init);

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

  const {
    meta: { rtPfx },
  } = parentCtx;

  useEffect(() => {
    parentCtx.dispatch({
      type: `${taskName}:STATE_UPDATE`,
      payload: state,
    });
  }, [parentCtx, state]);

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
    <EtlContextReact.Provider value={ctx}>
      <GisDatasetLayerDatabaseDbSchemaForm />
    </EtlContextReact.Provider>
  );
}
