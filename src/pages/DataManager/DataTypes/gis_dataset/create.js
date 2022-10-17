/*
 *  TODO:
 *        [ ] fetch err handling
 *        [ ] Replace gisUploadId with etlContextId
 */

import React from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

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
  ERROR: "ERROR",
};

async function checkApiResponse(res) {
  if (!res.ok) {
    let errMsg = res.statusText;
    try {
      const { message } = await res.json();
      errMsg = message;
    } catch (err) {
      console.error(err);
    }

    throw new Error(errMsg);
  }
}

const Create = ({ source }) => {
  const pgEnv = useSelector(selectPgEnv);
  const userId = useSelector(selectUserId);

  const history = useHistory();

  const [gisUploadId, setGisUploadId] = React.useState(null);
  const [etlContextId, setEtlContextId] = React.useState(null);

  const [fileUploadStatus, setFileUploadStatus] = React.useState(null);
  const [maxSeenEventId, setMaxSeenEventId] = React.useState(null);

  const [uploadedFile, setUploadedFile] = React.useState(null);
  const [uploadErrMsq, setUploadErrMsg] = React.useState(null);

  const [layerNames, setLayerNames] = React.useState([]);
  const [layerName, setLayerName] = React.useState(null);

  const [newDataSourceMeta, setNewDataSourceMeta] = React.useState(null);

  const [tableDescriptor, setTableDescriptor] = React.useState(null);
  const [layerAnalysis, setLayerAnalysis] = React.useState(null);
  const [lyrAnlysErrMsg, setLyrAnlysErrMsg] = React.useState(null);

  const [publishStatus, setPublishStatus] = React.useState(
    PublishStatus.AWAITING
  );

  const [publishErrMsg, setPublishErrMsg] = React.useState(null);

  const { name: sourceName, display_name: sourceDisplayName } = source;

  if (publishStatus === PublishStatus.PUBLISHED) {
    if (!newDataSourceMeta) {
      throw new Error("BROKEN INVARIANT. PUBLISHED but no newDataSourceMeta");
    }

    const { id } = newDataSourceMeta;

    history.push(`/datasources/source/${id}`);
  }

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
    setUploadErrMsg(null);
    setLayerNames(null);
    setLayerName(null);
    setLyrAnlysErrMsg(null);
    setTableDescriptor(null);
    setLayerAnalysis(null);

    setPublishStatus(PublishStatus.AWAITING);
    setPublishErrMsg(null);
  };

  const uploadGisFile = async (file) => {
    let stopPolling = false;

    try {
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

      await checkApiResponse(newEtlCtxRes);

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

        const res = await fetch(url);

        await checkApiResponse(res);

        const events = await res.json();

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

      await checkApiResponse(res);

      // Upload response is the ETL ID
      const [{ id }] = await res.json();

      const layerNamesRes = await fetch(
        `${rtPfx}/staged-geospatial-dataset/${id}/layerNames`
      );

      await checkApiResponse(layerNamesRes);

      const layerNames = await layerNamesRes.json();

      stopPolling = true;

      setGisUploadId(id);
      setLayerNames(layerNames);

      if (layerNames.length === 1) {
        selectLayer(layerNames[0], id);
      }
    } catch (err) {
      stopPolling = true;
      setUploadErrMsg(err.message);
    }
  };

  const selectLayer = async (_layerName, _id) => {
    if (!_id) {
      _id = gisUploadId;
    }

    setLayerName(_layerName);

    if (_layerName) {
      try {
        const tblDscRes = await fetch(
          `${rtPfx}/staged-geospatial-dataset/${_id}/${_layerName}/tableDescriptor`
        );

        await checkApiResponse(tblDscRes);
        const tblDsc = await tblDscRes.json();

        const lyrAnlysRes = await fetch(
          `${rtPfx}/staged-geospatial-dataset/${_id}/${_layerName}/layerAnalysis`
        );

        await checkApiResponse(lyrAnlysRes);
        const lyrAnlys = await lyrAnlysRes.json();

        setTableDescriptor(tblDsc);
        setLayerAnalysis(lyrAnlys);
      } catch (err) {
        setLyrAnlysErrMsg(err.message);
      }
    }
  };

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

    setNewDataSourceMeta(newSrcMeta);
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

    const res = await fetch(url);

    await checkApiResponse(res);
  }

  async function simplePublish() {
    try {
      setPublishStatus(PublishStatus.IN_PROGRESS);

      await createNewDataSource();

      await stageLayerData();

      await approveQA();

      await submitViewMeta();

      await publishGisDatasetLayer();

      setPublishStatus(PublishStatus.PUBLISHED);
    } catch (err) {
      setPublishStatus(PublishStatus.ERROR);
      console.log("==>", err.message);
      setPublishErrMsg(err.message);
    }
  }

  const getLayersSelector = () => {
    if (uploadErrMsq) {
      return (
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
                GIS Dataset Upload Error
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
                {uploadErrMsq}
              </td>
              <td style={{ border: "1px solid", backgroundColor: "white" }}>
                {etlContextId}
              </td>
            </tr>
          </tbody>
        </table>
      );
    }

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

  const getLayerAnalysisSection = () => {
    if (!layerName) {
      return "";
    }

    if (lyrAnlysErrMsg) {
      return (
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
                Layer Analysis Error
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
                {lyrAnlysErrMsg}
              </td>
              <td style={{ border: "1px solid", backgroundColor: "white" }}>
                {etlContextId}
              </td>
            </tr>
          </tbody>
        </table>
      );
    }

    if (!layerAnalysis) {
      return <div>Analyzing Layer... please wait.</div>;
    }

    const { layerGeometriesAnalysis } = layerAnalysis;

    const { featuresCount, countsByPostGisType, commonPostGisGeometryType } =
      layerGeometriesAnalysis;

    const plSfx = featuresCount > 1 ? "s" : "";

    const geomTypes = Object.keys(countsByPostGisType).sort(
      (a, b) => countsByPostGisType[b] - countsByPostGisType[a]
    );

    let geomTypeSection;
    if (geomTypes.length === 1) {
      const [geomType] = geomTypes;

      geomTypeSection = (
        <div
          className="text-blue-500"
          style={{ textAlign: "center", fontWeight: "bold" }}
        >
          The layer contains {featuresCount} {geomType} feature{plSfx}.
        </div>
      );
    } else {
      geomTypeSection = (
        <div style={{ width: "100%" }}>
          <div style={{ width: "50%", margin: "10px auto" }}>
            The layer contained features of multiple geometry types:
            <table
              style={{
                marginTop: "20px",
                backgroundColor: "white",
                margin: "30px auto",
                border: "1px solid",
              }}
            >
              <thead style={{ backgroundColor: "black", color: "white" }}>
                <tr>
                  <th
                    className="text-center"
                    style={{ padding: "10px", borderRight: "1px solid white" }}
                  >
                    Geometry Type
                  </th>
                  <th className="text-center" style={{ padding: "10px" }}>
                    Feature Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {geomTypes.map((type) => (
                  <tr className="border-b">
                    <td
                      className="py-4 text-center"
                      style={{ padding: "10px", border: "1px solid" }}
                    >
                      {type}
                    </td>
                    <td
                      className="text-center  p-2"
                      style={{ padding: "10px", border: "1px solid" }}
                    >
                      {countsByPostGisType[type]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            For consistency, all features will be converted to{" "}
            {commonPostGisGeometryType}s.
          </div>
        </div>
      );
    }

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
          Layer Analysis
        </span>
        {geomTypeSection}
      </div>
    );
  };

  const getTableDescriptorSection = () => {
    if (!layerName || uploadErrMsq || lyrAnlysErrMsg) {
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

    const fieldsMappingSection = tableDescriptor ? (
      <div>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-center" style={{ paddingRight: "40px" }}>
                GIS Dataset Field Name
              </th>
              <th className="text-center">Database Column Name</th>
            </tr>
          </thead>
          <tbody>
            {get(tableDescriptor, "columnTypes", []).map((row) => (
              <tr key={row.key} className="border-b">
                <td className="py-4 text-left">{row.key}</td>
                <td className="text-right  p-2">
                  <input
                    className="w-full p-2 flex-1 shadow bg-grey-50 focus:bg-blue-100 border-gray-300"
                    disabled={publishStatus !== PublishStatus.AWAITING}
                    id={row.key}
                    defaultValue={row.col}
                    onChange={(e) => (row.col = e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
      {getLayerAnalysisSection()}
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
