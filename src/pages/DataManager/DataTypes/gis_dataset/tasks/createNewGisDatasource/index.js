/*
 *  TODO:
 *        [ ] fetch err handling
 *        [ ] Replace gisUploadId with etlContextId
 */

import React, { useEffect, useReducer, useRef } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import _ from "lodash";

import EtlContext, {
  useEtlContextDependencies,
  EtlContextReact,
} from "../../utils/EtlContext";
import { selectPgEnv, selectUserId } from "pages/DataManager/store";

import { getNewEtlContextId, getDamaApiRoutePrefix } from "../../utils/api";

import PublishStatus from "../../constants/PublishStatus";

import UploadGisDataset from "../uploadGisDataset";
import { selectors as uploadGisDatasetSelectors } from "../uploadGisDataset/store";

import SelectGisDatasetLayer from "../selectGisDatasetLayer";
import { selectors as selectGisDatasetLayerSelectors } from "../selectGisDatasetLayer/store";

import UpdateGisDatasetLayerDatabaseSchema from "../updateGisDatasetLayerDatabaseSchema";
import { selectors as updateGisDatasetLayerDatabaseSchemaSelectors } from "../updateGisDatasetLayerDatabaseSchema/store";

import { PublishButton, PublishErrorMessage } from "./components/PublishButton";

import reducer, { initialState, actions, selectors, operations } from "./store";

const workflow = [
  UploadGisDataset,
  SelectGisDatasetLayer,
  UpdateGisDatasetLayerDatabaseSchema,
];

const {
  updateDataSourceName,
  updateDataSourceDisplayName,
  updateEtlContextId,
} = actions;

const {
  selectUploadGisDatasetState,
  selectGisDatasetLayerState,
  selectGisDatasetLayerDatabaseSchemaState,
} = selectors;

const boundUploadGisDatasetSelectors = _.mapValues(
  uploadGisDatasetSelectors,
  (sel) => (state) => sel(selectUploadGisDatasetState(state))
);
const boundSelectGisDatasetLayerSelectors = _.mapValues(
  selectGisDatasetLayerSelectors,
  (sel) => (state) => sel(selectGisDatasetLayerState(state))
);
const boundGisDatasetLayerDatabaseSchemaSelectors = _.mapValues(
  updateGisDatasetLayerDatabaseSchemaSelectors,
  (sel) => (state) => sel(selectGisDatasetLayerDatabaseSchemaState(state))
);

function RequestSourceName() {
  return (
    <div
      style={{
        display: "inline-block",
        width: "100%",
        marginTop: "30px",
        textAlign: "center",
        fontSize: "20px",
        fontWeight: "bold",
      }}
    >
      <span>Please provide a source name above.</span>
    </div>
  );
}

const Create = ({ source }) => {
  const { name: sourceName, display_name: sourceDisplayName } = source;

  const pgEnv = useSelector(selectPgEnv);
  const userId = useSelector(selectUserId);

  const [state, dispatch] = useReducer(reducer, initialState);

  const rtPfx = pgEnv ? getDamaApiRoutePrefix(pgEnv) : null;

  const { current: ctx } = useRef(
    new EtlContext({
      name: "CreateGisDataset",
      actions,
      selectors: {
        ...boundUploadGisDatasetSelectors,
        ...boundSelectGisDatasetLayerSelectors,
        ...boundGisDatasetLayerDatabaseSchemaSelectors,
        ...selectors,
      },
      operations,
      dispatch,
      meta: { userId, pgEnv, rtPfx },
    })
  );

  ctx.setState(state);

  useEffect(() => {
    dispatch(updateDataSourceName(sourceName));
  }, [sourceName]);

  useEffect(() => {
    dispatch(updateDataSourceDisplayName(sourceDisplayName));
  }, [sourceDisplayName]);

  // Probably want to wait until the user takes an action that requires the etlContextId
  // Could do that by wrapping fetch in ctx.api
  useEffect(() => {
    (async () => {
      ctx.meta.etlContextId = await getNewEtlContextId(pgEnv);

      // This might not be necessary after everything uses ctx.
      ctx.dispatch(updateEtlContextId(ctx.meta.etlContextId));
    })();
  }, [pgEnv, ctx]);

  const etlCtxDeps = useEtlContextDependencies(ctx, [
    "etlContextId",
    "dataSourceId",
    "publishStatus",
  ]);

  const { etlContextId, dataSourceId, publishStatus } = etlCtxDeps;

  ctx.assignMeta({ etlContextId, rtPfx });

  const history = useHistory();

  if (publishStatus === PublishStatus.PUBLISHED) {
    history.push(`/datasources/source/${dataSourceId}`);
  }

  if (!sourceName) {
    return <RequestSourceName />;
  }

  const workflowElems = workflow.map((Elem, i) => {
    return <Elem key={`create_gis_dataset_workflow_step_${i}`} />;
  });

  // https://beta.reactjs.org/learn/managing-state#preserving-and-resetting-state
  return (
    <div key={etlContextId || "fresh-upload"} className="w-full">
      <div
        style={{
          display: "inline-block",
          width: "100%",
          marginTop: "20px",
          textAlign: "center",
          paddingTop: "20px",
          paddingBottom: "20px",
          fontSize: "25px",
          borderTop: "8px solid",
        }}
      >
        <span>GIS Data Source</span>
      </div>

      <EtlContextReact.Provider value={ctx}>
        {workflowElems}
        <PublishButton />
        <PublishErrorMessage />
      </EtlContextReact.Provider>

      <div
        style={{
          display: "inline-block",
          width: "100%",
          marginTop: "40px",
          textAlign: "center",
          paddingTop: "50px",
          paddingBottom: "150px",
          fontSize: "30px",
          borderTop: "8px solid",
        }}
      />
    </div>
  );
};

export default Create;
