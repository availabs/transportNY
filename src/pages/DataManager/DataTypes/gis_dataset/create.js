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
} from "./utils/EtlContext";
import { selectPgEnv, selectUserId } from "pages/DataManager/store";

import {
  checkApiResponse,
  getNewEtlContextId,
  getDamaApiRoutePrefix,
} from "./utils/api";

import PublishStatus from "./constants/PublishStatus";
import reducer, { initialState, actions, selectors } from "./store";

import UploadGisDataset from "./tasks/uploadGisDataset";
import { selectors as uploadGisDatasetSelectors } from "./tasks/uploadGisDataset/store";

import SelectGisDatasetLayer from "./tasks/selectGisDatasetLayer";
import { selectors as selectGisDatasetLayerSelectors } from "./tasks/selectGisDatasetLayer/store";

import UpdateGisDatasetLayerDatabaseSchema from "./tasks/updateGisDatasetLayerDatabaseSchema";
import { selectors as updateGisDatasetLayerDatabaseSchemaSelectors } from "./tasks/updateGisDatasetLayerDatabaseSchema/store";

const workflow = [
  UploadGisDataset,
  SelectGisDatasetLayer,
  UpdateGisDatasetLayerDatabaseSchema,
];

const {
  updateEtlContextId,
  setPublishStatusToInProgress,
  setPublishStatusToPublished,
  setPublishStatusToError,
  updatePublishErrMsg,
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
  const pgEnv = useSelector(selectPgEnv);
  const userId = useSelector(selectUserId);

  const [state, dispatch] = useReducer(reducer, initialState);

  const rtPfx = pgEnv ? getDamaApiRoutePrefix(pgEnv) : null;

  const { current: ctx } = useRef(
    new EtlContext({
      name: "TopLevelCreateGisDataset",
      actions,
      selectors: {
        ...boundUploadGisDatasetSelectors,
        ...boundSelectGisDatasetLayerSelectors,
        ...boundGisDatasetLayerDatabaseSchemaSelectors,
        ...selectors,
      },
      dispatch,
      meta: { userId, pgEnv, rtPfx },
    })
  );

  ctx.setState(state);

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
    "gisUploadId",
    "etlContextId",
    "uploadErrMsg",
    "layerName",
    "tableDescriptor",
    "lyrAnlysErrMsg",
    "publishStatus",
    "publishErrMsg",
  ]);

  const {
    gisUploadId,
    etlContextId,
    uploadErrMsg,
    layerName,
    tableDescriptor,
    lyrAnlysErrMsg,
    publishStatus,
    publishErrMsg,
  } = etlCtxDeps;

  ctx.assignMeta({ etlContextId, rtPfx });

  const history = useHistory();

  // const [newDataSourceMeta, setNewDataSourceMeta] = React.useState(null);

  const { name: sourceName, display_name: sourceDisplayName } = source;

  if (!sourceName) {
    return <RequestSourceName />;
  }

  const stageLayerData = async () => {
    const updTblDscRes = await fetch(
      `${rtPfx}/staged-geospatial-dataset/${gisUploadId}/updateTableDescriptor`,
      {
        method: "POST",
        body: JSON.stringify(tableDescriptor),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    await checkApiResponse(updTblDscRes);

    const url = new URL(
      `${rtPfx}/staged-geospatial-dataset/stageLayerData/${layerName}`
    );
    url.searchParams.append("etl_context_id", etlContextId);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);
  };

  const approveQA = async () => {
    const url = new URL(`${rtPfx}/staged-geospatial-dataset/approveQA`);
    url.searchParams.append("etl_context_id", etlContextId);
    url.searchParams.append("user_id", userId);

    await fetch(url);
  };

  const createNewDataSource = async () => {
    const res = await fetch(`${rtPfx}/metadata/createNewDataSource`, {
      method: "POST",
      body: JSON.stringify({
        name: sourceName,
        display_name: sourceDisplayName,
        type: "gis_dataset",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    await checkApiResponse(res);

    const newSrcMeta = await res.json();

    return newSrcMeta;
  };

  async function submitViewMeta() {
    const url = new URL(`${rtPfx}/staged-geospatial-dataset/submitViewMeta`);
    url.searchParams.append("etl_context_id", etlContextId);
    url.searchParams.append("user_id", userId);

    const viewMetadata = {
      data_source_name: sourceName,
      version: 1,
    };

    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(viewMetadata),
      headers: {
        "Content-Type": "application/json",
      },
    });

    await checkApiResponse(res);

    const submitViewMetaResponse = await res.json();

    console.log({ submitViewMetaResponse });
  }

  async function publishGisDatasetLayer() {
    const url = new URL(
      `${rtPfx}/staged-geospatial-dataset/publishGisDatasetLayer`
    );
    url.searchParams.append("etl_context_id", etlContextId);
    url.searchParams.append("user_id", userId);

    const res = await fetch(url);

    await checkApiResponse(res);
  }

  async function simplePublish() {
    try {
      ctx.dispatch(setPublishStatusToInProgress());

      const newSrcMeta = await createNewDataSource();

      // setNewDataSourceMeta(newSrcMeta);

      await stageLayerData();

      await approveQA();

      await submitViewMeta();

      await publishGisDatasetLayer();

      ctx.dispatch(setPublishStatusToPublished());

      const { id } = newSrcMeta;

      history.push(`/datasources/source/${id}`);
    } catch (err) {
      ctx.dispatch(setPublishStatusToError());
      ctx.dispatch(updatePublishErrMsg(err.message));
      console.error("==>", err);
    }
  }

  const getPublishButton = () => {
    if (!layerName || uploadErrMsg || lyrAnlysErrMsg || !tableDescriptor) {
      return "";
    }

    let publishButtonText = "Publish";
    let publishButtonBgColor = "#3b82f680";

    if (publishStatus === PublishStatus.IN_PROGRESS) {
      publishButtonText = "Publishing...";
      publishButtonBgColor = "#e5e7eb";
    }
    if (publishStatus === PublishStatus.PUBLISHED) {
      publishButtonText = "Published";
      publishButtonBgColor = "#e5e7eb";
    }

    if (publishStatus === PublishStatus.ERROR) {
      publishButtonText = "Publish Error";
      publishButtonBgColor = "red";
    }

    return (
      <div>
        {publishStatus !== PublishStatus.ERROR ? (
          <span
            style={{
              display: "inline-block",
              marginTop: "20px",
              textAlign: "center",
              padding: "10px",
              fontSize: "25px",
              border: "2px solid",
              borderRadius: "25px",
              backgroundColor: publishButtonBgColor,
            }}
            onClick={() => {
              if (publishStatus === PublishStatus.AWAITING) {
                simplePublish();
              }
            }}
          >
            {publishButtonText}
          </span>
        ) : (
          <table
            className="w-2/3"
            style={{
              margin: "40px auto",
              textAlign: "center",
              border: "1px solid",
              borderColor: "back",
            }}
          >
            <thead
              style={{
                color: "black",
                backgroundColor: "red",
                fontWeight: "bolder",
                textAlign: "center",
                marginTop: "40px",
                fontSize: "20px",
                border: "1px solid",
                borderColor: "black",
              }}
            >
              <tr>
                <th style={{ border: "1px solid", borderColor: "black" }}>
                  {" "}
                  Publish Error
                </th>
                <th style={{ border: "1px solid", borderColor: "black" }}>
                  {" "}
                  ETL Context ID
                </th>
              </tr>
            </thead>
            <tbody style={{ border: "1px solid" }}>
              <tr style={{ border: "1px solid" }}>
                <td
                  style={{
                    border: "1px solid",
                    padding: "10px",
                    backgroundColor: "white",
                    color: "darkred",
                  }}
                >
                  {publishErrMsg}
                </td>
                <td style={{ border: "1px solid", backgroundColor: "white" }}>
                  {etlContextId}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    );
  };

  const workflowElems = workflow.map((Elem, i) => {
    return <Elem key={`create_gis_dataset_workflow_step_${i}`} />;
  });

  // https://beta.reactjs.org/learn/managing-state#preserving-and-resetting-state
  return (
    <EtlContextReact.Provider value={ctx}>
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

        {workflowElems}
        {getPublishButton()}

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
    </EtlContextReact.Provider>
  );
};

export default Create;
