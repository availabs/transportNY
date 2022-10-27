import React, {
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import EtlContext, {
  useEtlContextDependencies,
  EtlContextReact,
} from "../../utils/EtlContext";

import { checkApiResponse } from "../../utils/api";

import reducer, { init, selectors, actions } from "./store";

import { GisDatasetLayerDatabaseDbSchemaForm } from "./components";

const { updateTableDescriptor, updateDatabaseColumnNames } = actions;

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
    "dataSourceId",
    "databaseColumnNames",
    "gisUploadId",
    "layerName",
  ]);

  const { dataSourceId, databaseColumnNames, gisUploadId, layerName } =
    etlCtxDeps;

  const [isCreatingNew] = useState(!dataSourceId);

  const gisDatasetUploadedAndAnalyzed = gisUploadId && layerName;

  const mustAwaitDbColNames = !(
    isCreatingNew || Array.isArray(databaseColumnNames)
  );

  const ready = !mustAwaitDbColNames && gisDatasetUploadedAndAnalyzed;

  useEffect(() => {
    (async () => {
      if (mustAwaitDbColNames) {
        const url = new URL(
          `${rtPfx}/metadata/datasource-latest-view-table-columns`
        );
        url.searchParams.append("dataSourceId", dataSourceId);

        const res = await fetch(url);

        await checkApiResponse(res);

        let dbColNames = await res.json();

        dbColNames = dbColNames.filter(
          (col) => col !== "wkb_geometry" && col !== "ogc_fid"
        );

        dispatch(updateDatabaseColumnNames(dbColNames));
      }
    })();
  }, [rtPfx, mustAwaitDbColNames, dataSourceId]);

  useEffect(() => {
    (async () => {
      dispatch(updateTableDescriptor(null));

      if (!ready) {
        return;
      }

      const tblDscRes = await fetch(
        `${rtPfx}/staged-geospatial-dataset/${gisUploadId}/${layerName}/tableDescriptor`
      );

      await checkApiResponse(tblDscRes);

      const tblDsc = await tblDscRes.json();

      if (!isCreatingNew) {
        const dbCols = new Set(databaseColumnNames);

        for (const row of tblDsc.columnTypes) {
          if (!dbCols.has(row.col)) {
            row.col = "";
          }
        }
      }

      return dispatch(updateTableDescriptor(tblDsc));
    })();
  }, [
    rtPfx,
    ready,
    isCreatingNew,
    databaseColumnNames,
    gisUploadId,
    layerName,
  ]);

  if (!ready) {
    return "";
  }

  return (
    <EtlContextReact.Provider value={ctx}>
      <GisDatasetLayerDatabaseDbSchemaForm />
    </EtlContextReact.Provider>
  );
}
