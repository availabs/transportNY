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
    "databaseColumnNames",
    "gisUploadId",
    "layerName",
    "tableDescriptor",
  ]);

  const { databaseColumnNames, gisUploadId, layerName } = etlCtxDeps;

  useEffect(() => {
    (async () => {
      // if creating new datasouce, databaseColumnNames = undefined
      // if updating existing datasource, databaseColumnNames = string[] | null
      const isCreatingNew = databaseColumnNames === undefined;

      const awaitingDbCols = !(
        isCreatingNew || Array.isArray(databaseColumnNames)
      );

      if (!awaitingDbCols && gisUploadId && layerName) {
        const tblDscRes = await fetch(
          `${rtPfx}/staged-geospatial-dataset/${gisUploadId}/${layerName}/tableDescriptor`
        );

        await checkApiResponse(tblDscRes);

        const tblDsc = await tblDscRes.json();

        if (databaseColumnNames) {
          const dbCols = new Set(databaseColumnNames);

          for (const row of tblDsc.columnTypes) {
            if (!dbCols.has(row.col)) {
              row.col = null;
            }
          }
        }

        dispatch(updateTableDescriptor(tblDsc));
      }
    })();
  }, [rtPfx, databaseColumnNames, gisUploadId, layerName]);

  if (!layerName) {
    return "";
  }

  return (
    <EtlContextReact.Provider value={ctx}>
      <GisDatasetLayerDatabaseDbSchemaForm />
    </EtlContextReact.Provider>
  );
}
