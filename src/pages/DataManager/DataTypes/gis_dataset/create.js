/*
 *  TODO:
 *        [ ] fetch err handling
 *        [ ] Replace gisUploadId with etlContextId
 */

import React from "react";
import { useSelector } from "react-redux";

import get from "lodash.get";
import prettyBytes from "pretty-bytes";

import { selectPgEnv, selectUserId } from "pages/DataManager/store";

import { DAMA_HOST } from "config";

const progressUpdateIntervalMs = 3000;

// https://www.geeksforgeeks.org/how-to-create-a-custom-progress-bar-component-in-react-js/
const ProgressBar = ({ progress }) => {
  const Parentdiv = {
    display: "inline-block",
    height: "100%",
    width: "100%",
    backgroundColor: "whitesmoke",
    borderRadius: 40,
    margin: 50,
  };

  const Childdiv = {
    display: "inline-block",
    height: "84%",
    width: `${progress}`,
    backgroundColor: "#3b82f680",
    borderRadius: 40,
    textAlign: "right",
  };

  const progresstext = {
    padding: 10,
    color: "black",
    fontWeight: 900,
  };

  return (
    <div style={Parentdiv}>
      <span
        style={{
          fontWeight: "bold",
          paddingLeft: "10px",
          paddingRight: "10px",
        }}
      >
        {" "}
        Sent:
      </span>

      <div style={Childdiv}>
        <span style={progresstext}>{`${progress}`}</span>
      </div>
    </div>
  );
};

const PublishStatus = {
  AWAITING: "AWAITING",
  IN_PROGRESS: "IN_PROGRESS",
  PUBLISHED: "PUBLISHED",
};

const Create = ({ source }) => {
  const pgEnv = useSelector(selectPgEnv);
  const userId = useSelector(selectUserId);

  const [gisUploadId, setGisUploadId] = React.useState(null);
  const [etlContextId, setEtlContextId] = React.useState(null);

  const [fileUploadStatus, setFileUploadStatus] = React.useState(null);
  const [maxSeenEventId, setMaxSeenEventId] = React.useState(null);

  const [uploadedFile, setUploadedFile] = React.useState(null);

  const [layerNames, setLayerNames] = React.useState([]);
  const [layerName, setLayerName] = React.useState(null);

  const [tableDescriptor, setTableDescriptor] = React.useState(null);

  const [publishStatus, setPublishStatus] = React.useState(
    PublishStatus.AWAITING
  );

  const { name: sourceName, displayName: sourceDisplayName } = source;

  if (!sourceName) {
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

  const rtPfx = `${DAMA_HOST}/dama-admin/${pgEnv}`;

  const resetState = () => {
    // NOTE: we do not reset gisUploadId unless a new file uploaded.
    setFileUploadStatus(null);
    setLayerNames(null);
    setLayerName(null);
    setTableDescriptor(null);

    setPublishStatus(PublishStatus.AWAITING);
  };

  const uploadGisFile = async (file) => {
    /*
        1. Get an etl_context_id
        2. Progress polling
    */
    resetState();
    setUploadedFile(file);

    // First, we need to get a new etl-context-id
    //
    //   NOTE:  If we omit this step, in order to get progress updates
    //          the dama-admin server would need to immediately return the etlContextId
    //          for an upload, and the client would need to determine the status of the
    //          upload by querying the upload events.
    //
    const newEtlCtxRes = await fetch(`${rtPfx}/new-etl-context-id`);

    const _etlCtxId = await newEtlCtxRes.text();

    setEtlContextId(_etlCtxId);

    const formData = new FormData();
    // https://moleculer.services/docs/0.14/moleculer-web.html#File-upload-aliases
    // text form-data fields must be sent before files fields.
    formData.append("etlContextId", _etlCtxId);
    formData.append("user_id", userId);
    formData.append("fileSizeBytes", file.size);
    formData.append("progressUpdateIntervalMs", progressUpdateIntervalMs);
    formData.append("file", file);

    let _maxSeenEventId = -1;

    let stopPolling = false;

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

      const response = await fetch(url);

      const events = await response.json();

      return events;
    }

    async function pollEvents() {
      const events = await queryEtlContextEvents(_etlCtxId, _maxSeenEventId);

      if (Array.isArray(events) && events.length) {
        const latestEvent = events[events.length - 1];
        // console.log(latestEvent);
        setMaxSeenEventId(latestEvent.event_id);
        setFileUploadStatus(latestEvent);
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

    // Upload response is the ETL ID
    const [{ id }] = await res.json();

    const layerNamesRes = await fetch(
      `${rtPfx}/staged-geospatial-dataset/${id}/layerNames`
    );

    const layerNames = await layerNamesRes.json();

    setGisUploadId(id);
    setLayerNames(layerNames);

    if (layerNames.length === 1) {
      selectLayer(layerNames[0], id);
    }

    stopPolling = true;
  };

  const selectLayer = async (_layerName, _id) => {
    if (!_id) {
      _id = gisUploadId;
    }

    setLayerName(_layerName);

    if (_layerName) {
      const res = await fetch(
        `${rtPfx}/staged-geospatial-dataset/${_id}/${_layerName}/tableDescriptor`
      );

      // The tableDescriptor controls DB table creation and loading.
      const tblDsc = await res.json();

      setTableDescriptor(tblDsc);
    }
  };

  const stageLayerData = async () => {
    await fetch(
      `${rtPfx}/staged-geospatial-dataset/${gisUploadId}/updateTableDescriptor`,
      {
        method: "POST",
        body: JSON.stringify(tableDescriptor),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const url = new URL(
      `${rtPfx}/staged-geospatial-dataset/stageLayerData/${layerName}`
    );
    url.searchParams.append("etl_context_id", etlContextId);

    await fetch(url);
  };

  const approveQA = async () => {
    const url = new URL(`${rtPfx}/staged-geospatial-dataset/approveQA`);
    url.searchParams.append("etl_context_id", etlContextId);
    url.searchParams.append("user_id", userId);

    await fetch(url);
  };

  const createNewDataSource = async () => {
    await fetch(`${rtPfx}/metadata/createNewDataSource`, {
      method: "POST",
      body: JSON.stringify({
        name: sourceName,
        display_name: sourceDisplayName,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  async function submitViewMeta() {
    const url = new URL(`${rtPfx}/staged-geospatial-dataset/submitViewMeta`);
    url.searchParams.append("etl_context_id", etlContextId);
    url.searchParams.append("user_id", userId);

    const viewMetadata = {
      data_source_name: sourceName,
      table_schema: "gis_datasets",
      table_name: `${sourceName}_v1`,
      version: 1,
    };

    await fetch(url, {
      method: "POST",
      body: JSON.stringify(viewMetadata),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async function publishGisDatasetLayer() {
    const url = new URL(
      `${rtPfx}/staged-geospatial-dataset/publishGisDatasetLayer`
    );
    url.searchParams.append("etl_context_id", etlContextId);
    url.searchParams.append("user_id", userId);

    await fetch(url);
  }

  async function simplePublish() {
    setPublishStatus(PublishStatus.IN_PROGRESS);

    await createNewDataSource();

    await stageLayerData();

    await approveQA();

    await submitViewMeta();

    await publishGisDatasetLayer();

    setPublishStatus(PublishStatus.PUBLISHED);
  }

  const getLayersSelector = () => {
    if (!uploadedFile) {
      return (
        <div className="w-full border border-dashed border-gray-300 bg-gray-100">
          <div className="p-4">
            <button>
              <input
                type="file"
                onChange={(e) => {
                  uploadGisFile(e.target.files[0]);
                }}
              />
            </button>
          </div>
        </div>
      );
    }

    // TODO: Table with file metadata
    //       LayerName or LayerSelector as a table row

    let layerRow;

    if (!Array.isArray(layerNames)) {
      if (!fileUploadStatus) {
        layerRow = (
          <tr>
            <td className="py-4 text-left">File Upload Status</td>
            <td className="py-4 text-center">Sending GIS File to server</td>
          </tr>
        );
      } else {
        const { type, payload } = fileUploadStatus;

        if (/GIS_FILE_UPLOAD_PROGRESS$/.test(type)) {
          layerRow = (
            <tr>
              <td className="py-4 text-left">File Upload Status</td>
              <td className="py-4 text-left">
                <ProgressBar progress={payload.progress} />
              </td>
            </tr>
          );
        } else if (/GIS_FILE_RECEIVED$/.test(type)) {
          layerRow = (
            <tr>
              <td className="py-4 text-left">File Upload Status</td>
              <td className="py-4 text-center">File Received</td>
            </tr>
          );
        } else if (/START_GIS_FILE_UPLOAD_ANALYSIS$/.test(type)) {
          layerRow = (
            <tr>
              <td className="py-4 text-left">File Upload Status</td>
              <td className="py-4 text-center">
                Server Analyzing the GIS File
              </td>
            </tr>
          );
        } else if (/FINISH_GIS_FILE_UPLOAD$/.test(type)) {
          layerRow = (
            <tr>
              <td className="py-4 text-left">File Upload Status</td>
              <td className="py-4 text-center">GIS File Analysis Complete</td>
            </tr>
          );
        } else {
          layerRow = (
            <tr>
              <td className="py-4 text-left">File Upload Status</td>
              <td className="py-4 text-center">Processing</td>
            </tr>
          );
        }
      }
    } else if (layerNames.length === 1) {
      if (!layerName) {
        selectLayer(layerNames[0]);
      }

      layerRow = (
        <tr>
          <td className="py-4 text-left">Layer Name</td>
          <td className="py-4 text-center">{layerName}</td>
        </tr>
      );
    } else {
      layerRow = (
        <tr>
          <td className="py-4 text-left">Select Layer</td>
          <td className="py-4 text-center">
            <select
              className="text-center w-1/2 bg-white p-2 shadow bg-grey-50 focus:bg-blue-100 border-gray-300"
              value={layerName || ""}
              onChange={(e) => selectLayer(e.target.value || null)}
            >
              {["", ...layerNames].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </td>
        </tr>
      );
    }

    return (
      <div>
        <div
          style={{
            display: "inline-block",
            width: "100%",
            marginTop: "10px",
            textAlign: "center",
            paddingBottom: "20px",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          <span>File Metadata</span>
        </div>

        <table className="w-full">
          <tbody>
            <tr key="uploaded-file-meta--name" className="border-b">
              <td className="py-4 text-left">Name</td>
              <td className="text-center  p-2">{uploadedFile.name}</td>
            </tr>

            <tr key="uploaded-file-meta--last-mod-ts" className="border-b">
              <td className="py-4 text-left">Last Modified</td>
              <td className="text-center  p-2">
                {uploadedFile.lastModifiedDate.toLocaleString()}
              </td>
            </tr>

            <tr key="uploaded-file-meta--size" className="border-b">
              <td className="py-4 text-left">Size</td>
              <td className="text-center  p-2">
                {prettyBytes(uploadedFile.size)}
              </td>
            </tr>

            {layerRow}
          </tbody>
        </table>
      </div>
    );
  };

  const getTableDescriptorSection = () => {
    if (!layerName) {
      return "";
    }

    let publishButtonText = "Publish";
    if (publishStatus === PublishStatus.IN_PROGRESS) {
      publishButtonText = "Publishing...";
    }
    if (publishStatus === PublishStatus.PUBLISHED) {
      publishButtonText = "Published";
    }

    const fieldsMappingSection = tableDescriptor ? (
      <div>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-center" style={{ paddingRight: "40px" }}>
                GIS Dataset Field Name
              </th>
              <th className="text-center">Database Column Name</th>
              <th className="text-center">Omit</th>
            </tr>
          </thead>
          <tbody>
            {get(tableDescriptor, "columnTypes", []).map((row) => (
              <tr key={row.key} className="border-b">
                <td className="py-4 text-left">{row.key}</td>
                <td className="text-right  p-2">
                  <input
                    className="w-full p-2 flex-1 shadow bg-grey-50 focus:bg-blue-100 border-gray-300"
                    disabled={false} // FIXME
                    id={row.key}
                    defaultValue={row.col}
                    onChange={(e) => (row.col = e.target.value)}
                  />
                </td>
                <td className="py-4 text-center">
                  <input type="checkbox" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <span
          style={{
            display: "inline-block",
            marginTop: "20px",
            textAlign: "center",
            padding: "10px",
            fontSize: "25px",
            border: "2px solid",
            borderRadius: "25px",
            backgroundColor:
              publishStatus === PublishStatus.AWAITING
                ? "#3b82f680"
                : "#e5e7eb",
          }}
          onClick={() => {
            if (publishStatus === PublishStatus.AWAITING) {
              simplePublish();
            }
          }}
        >
          {publishButtonText}
        </span>
      </div>
    ) : (
      <span
        style={{
          display: "inline-block",
          width: "100%",
          textAlign: "center",
          padding: "30px",
        }}
      >
        Please wait... the server is analyzing the {layerName} layer. This may
        take a while.
      </span>
    );

    return (
      <div>
        <span
          style={{
            display: "inline-block",
            width: "100%",
            marginTop: "20px",
            textAlign: "center",
            paddingTop: "25px",
            paddingBottom: "50px",
            fontSize: "25px",
            borderTop: "4px solid",
          }}
        >
          Field Names Mappings
        </span>

        {fieldsMappingSection}
      </div>
    );
  };

  return (
    <div className="w-full">
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

      {getLayersSelector()}
      {getTableDescriptorSection()}

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
