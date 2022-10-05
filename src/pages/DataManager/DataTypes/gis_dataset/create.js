/*
 *  TODO:
 *        [ ] Poll for ETL events.
 *              Currently, "damaPublished" even if publish fails.
 *
 *        [ ] Spinner when uploading a GIS Dataset (after Choose File)
 *
 */

import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import get from "lodash.get";
import Switch from "react-switch";

import { selectPgEnv } from "pages/DataManager/store";

import { DAMA_HOST } from "config";

const Create = () => {
  const pgEnv = useSelector(selectPgEnv);

  const [gisUploadId, setGisUploadId] = React.useState(null);

  const [layerNames, setLayerNames] = React.useState([]);
  const [layerName, setLayerName] = React.useState(null);

  const [tableDescriptor, setTableDescriptor] = React.useState(null);
  const [etlContextId, setEtlContextId] = React.useState(null);
  const [qaApproved, setQaApproved] = React.useState(false);

  const [useExistingSource, setUseExistingSource] = React.useState(false);
  const [damaSrcTblCols, setDamaSrcTblCols] = React.useState(null);
  const [damaSrcMeta, setDamaSrcMeta] = React.useState(null);
  const [damaSrcName, setDamaSrcName] = React.useState(null);

  const [damaDataSrcs, setDamaDataSrcs] = React.useState(null);

  const [damaViewTblCols, setDamaViewTblCols] = React.useState(null);
  const [damaViewMeta, setDamaViewMeta] = React.useState(null);

  const [damaPublished, setDamaPublished] = React.useState(false);

  const rtPfx = `${DAMA_HOST}/dama-admin/${pgEnv}`;

  const resetState = () => {
    // NOTE: we do not reset gisUploadId unless a new file uploaded.

    setLayerName(null);
    setTableDescriptor(null);
    setEtlContextId(null);
    setQaApproved(false);

    setUseExistingSource(false);

    setDamaSrcMeta(null);
    setDamaSrcName(null);

    setDamaDataSrcs(null);

    setDamaViewMeta(null);

    setDamaPublished(false);
  };

  useEffect(() => {
    const fn = async () => {
      console.log("USE EFFECT");

      const [src, vw] = await Promise.all([
        (async () => {
          const res = await fetch(
            `${rtPfx}/table-columns?tableSchema=data_manager&tableName=sources`
          );
          const schema = await res.json();
          console.log("src", schema);
          return schema;
        })(),

        (async () => {
          const res = await fetch(
            `${rtPfx}/table-columns?tableSchema=data_manager&tableName=views`
          );
          const schema = await res.json();
          console.log("vw", schema);
          return schema;
        })(),
      ]);

      setDamaSrcTblCols(src);
      setDamaViewTblCols(vw);
    };

    fn();
  }, [rtPfx]);

  if (!(damaSrcTblCols && damaViewTblCols)) {
    return <span>Initializing</span>;
  }

  const uploadGisFile = async (file) => {
    resetState();

    const formData = new FormData();
    formData.append("file", file);

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
  };

  const selectLayer = async (_layerName, _id) => {
    if (!_id) {
      _id = gisUploadId;
    }

    resetState();
    setLayerName(_layerName);

    if (_layerName) {
      const res = await fetch(
        `${rtPfx}/staged-geospatial-dataset/${_id}/${_layerName}/tableDescriptor`
      );

      // The tableDescriptor controls DB table creation and loading.
      const tblDsc = await res.json();

      setTableDescriptor(tblDsc);

      setDamaSrcMeta(
        damaSrcTblCols.reduce((acc, col) => {
          acc[col] = "";
          return acc;
        }, {})
      );

      setDamaViewMeta(
        damaViewTblCols.reduce((acc, col) => {
          acc[col] = "";
          return acc;
        }, {})
      );
    }
  };

  const getDamaDataSources = async () => {
    //  we repeat this call because
    //    since we are possibly inserting into the data_manager.sources table
    //    it seems safe to assume the available sources will change over time.
    setDamaDataSrcs(null);

    const res = await fetch(`${rtPfx}/dama-data-sources`);

    // The tableDescriptor controls DB table creation and loading.
    const srcs = await res.json();

    console.log({ damaDataSrcs: srcs });

    setDamaDataSrcs(srcs);
  };

  const stageLayerData = async () => {
    /*
     */
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

    const event = {
      type: "dama/data_source_integrator:LOAD_REQUEST",
      payload: { id: gisUploadId, layerName },
      meta: { DAMAA: true },
    };

    const res = await fetch(`${rtPfx}/events/dispatch`, {
      method: "POST",
      body: JSON.stringify(event),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const {
      meta: { etl_context_id },
    } = await res.json();

    setEtlContextId(etl_context_id);
  };

  const approveQA = async () => {
    const event = {
      type: "dama/data_source_integrator:QA_APPROVED",
      meta: {
        DAMAA: true,
        etl_context_id: etlContextId,
        timestamp: new Date().toISOString(),
      },
    };

    await fetch(`${rtPfx}/events/dispatch`, {
      method: "POST",
      body: JSON.stringify(event),
      headers: {
        "Content-Type": "application/json",
      },
    });

    setQaApproved(true);
  };

  const createNewDataSource = async () => {
    const res = await fetch(`${rtPfx}/create/dataSource`, {
      method: "POST",
      body: JSON.stringify(damaSrcMeta),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { name } = await res.json();

    console.log("==> created damaSrc", name);

    await getDamaDataSources();

    setDamaSrcName(name);
    setDamaViewMeta({ ...damaViewMeta, data_source_name: name });
    setUseExistingSource(true);
  };

  async function submitViewMeta() {
    const event = {
      type: "dama/data_source_integrator:VIEW_METADATA_SUBMITTED",
      payload: damaViewMeta,
      meta: {
        DAMAA: true,
        etl_context_id: etlContextId,
        timestamp: new Date().toISOString(),
      },
    };

    await fetch(`${rtPfx}/events/dispatch`, {
      method: "POST",
      body: JSON.stringify(event),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async function publishData() {
    await submitViewMeta();

    const event = {
      type: "dama/data_source_integrator:PUBLISH",
      meta: {
        DAMAA: true,
        etl_context_id: etlContextId,
        timestamp: new Date().toISOString(),
      },
    };

    await fetch(`${rtPfx}/events/dispatch`, {
      method: "POST",
      body: JSON.stringify(event),
      headers: {
        "Content-Type": "application/json",
      },
    });

    setDamaPublished(true);
  }

  const layersSelector =
    layerNames.length > 0 ? (
      <div className="w-full ">
        <div className="p-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium text-gray-500 py-5">
            Select Layer
          </dt>
          <div className="sm:col-span-2 pr-8 pt-3">
            <select
              className="w-full bg-white p-2 flex-1 shadow bg-grey-50 focus:bg-blue-100  border-gray-300"
              value={layerName || ""}
              onChange={(e) => selectLayer(e.target.value || null)}
            >
              {["", ...layerNames].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    ) : (
      ""
    );

  const tableDescriptorSection = tableDescriptor ? (
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
        Database Table Descriptor
      </span>

      <div>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">GIS Dataset Field Name</th>
              <th className="text-right">Database Column Name</th>
              <td className="text-right">Database Column Type</td>
            </tr>
          </thead>
          <tbody>
            {get(tableDescriptor, "columnTypes", []).map((row) => (
              <tr key={row.key} className="border-b">
                <td className="py-4">{row.key}</td>
                <td className="text-right  p-2">
                  <input
                    className="w-full p-2 flex-1 shadow bg-grey-50 focus:bg-blue-100 border-gray-300"
                    disabled={!!etlContextId}
                    id={row.key}
                    defaultValue={row.col}
                    onChange={(e) => (row.col = e.target.value)}
                  />
                </td>
                <td className="text-right  p-2">{row.db_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <span
        style={{
          display: "inline-block",
          marginTop: "20px",
          textAlign: "center",
          padding: "10px",
          fontSize: "25px",
          border: "2px solid",
          borderRadius: "25px",
          backgroundColor: etlContextId ? "#e5e7eb" : "#3b82f680",
        }}
        onClick={stageLayerData}
      >
        {etlContextId ? "Data Staged in Database" : "Stage Data in Database"}
      </span>
    </div>
  ) : (
    ""
  );

  const qaSection = etlContextId ? (
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
        Quality Assurance
      </span>
      <span
        style={{
          display: "inline-block",
          marginTop: "20px",
          textAlign: "center",
          padding: "10px",
          fontSize: "25px",
          border: "2px solid",
          borderRadius: "25px",
          backgroundColor: qaApproved ? "#e5e7eb" : "#3b82f680",
        }}
        onClick={approveQA}
      >
        {qaApproved ? "QA Approved" : "Approve QA"}
      </span>
    </div>
  ) : (
    ""
  );

  function getSrcMetaForm() {
    if (!damaDataSrcs) {
      setTimeout(getDamaDataSources);
      return "";
    }

    if (!etlContextId || !qaApproved) {
      return "";
    }

    const srcMetaOmittedMetaCols = [
      "id",
      "metadata",
      "statistics",
      "categories",
      "category",
      "data_table",
    ];

    const getShortName = (name) => name.split("/").slice(-2).join("/");

    const short2long =
      damaDataSrcs &&
      damaDataSrcs.reduce((acc, { name: longName }) => {
        acc[getShortName(longName)] = longName;
        return acc;
      }, {});

    // const long2short = Object.entries(short2long).reduce(
    //   (acc, [short, long]) => {
    //     acc[long] = short;
    //     return acc;
    //   },
    //   {}
    // );

    const existingSrcSelector =
      useExistingSource && damaDataSrcs ? (
        <div className="w-full ">
          <div className="p-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 py-5">
              Select Data Source Name
            </dt>
            <div className="sm:col-span-2 pr-8 pt-3">
              <select
                className="w-full bg-white p-2 flex-1 shadow bg-grey-50 focus:bg-blue-100  border-gray-300"
                value={damaSrcName}
                disabled={damaPublished}
                onChange={(e) => {
                  const data_source_name = e.target.value;

                  setDamaSrcName(data_source_name);
                  setDamaViewMeta({ ...damaViewMeta, data_source_name });
                }}
              >
                {[null, ...Object.keys(short2long).sort()].map((shortName) => (
                  <option
                    key={shortName || "null"}
                    value={shortName ? short2long[shortName] : ""}
                  >
                    {shortName || ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        ""
      );

    const newSrcFormFields =
      !useExistingSource && damaSrcTblCols ? (
        <div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-center">Property</th>
                <th className="text-center">Value</th>
              </tr>
            </thead>
            <tbody>
              {damaSrcTblCols
                .filter((col) => !srcMetaOmittedMetaCols.includes(col))
                .map((col) => (
                  <tr key={col} className="border-b">
                    <td className="py-4">{col}</td>
                    <td
                      className="text-right  p-2"
                      style={
                        col === "name" &&
                        get(damaSrcMeta, "name", "").length < 3
                          ? { border: "1px solid red" }
                          : {}
                      }
                    >
                      <input
                        required={col === "name"}
                        className="w-full p-2 flex-1 shadow bg-grey-50 focus:bg-blue-100"
                        id={col}
                        value={get(damaSrcMeta, col, "")}
                        onChange={(e) => {
                          setDamaSrcMeta({
                            ...damaSrcMeta,
                            [col]: e.target.value,
                          });
                        }}
                      />
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
                !damaSrcName && get(damaSrcMeta, "name", "").length >= 3
                  ? "#3b82f680"
                  : "#e5e7eb",
            }}
            onClick={
              !damaSrcName && get(damaSrcMeta, "name", "").length >= 3
                ? createNewDataSource
                : () => {}
            }
          >
            Create New Data Source
          </span>
        </div>
      ) : (
        ""
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
          DataManager Source Metadata
        </span>

        <label
          style={{
            display: "inline-block",
            marginTop: "5px",
            marginBottom: "20px",
            textAlign: "center",
            paddingTop: "5px",
            paddingBottom: "25px",
          }}
        >
          <span style={{ paddingRight: "15px" }}>Use Existing Data Source</span>
          <Switch
            onChange={() => {
              if (!useExistingSource) {
                // Switching to useExistingSource. Refresh the damaDataSrcs
                getDamaDataSources();
              } else {
                //
                setDamaSrcName(null);
                setDamaViewMeta({ ...damaViewMeta, data_source_name: null });
              }
              setUseExistingSource(!useExistingSource);
            }}
            checked={useExistingSource}
            disabled={damaPublished}
          />
        </label>
        {existingSrcSelector}
        {newSrcFormFields}
      </div>
    );
  }

  function getViewMetaForm() {
    if (!(etlContextId && qaApproved && damaSrcName)) {
      return "";
    }

    const omittedViewMetaCols = [
      "id",
      "source_id",
      "last_updated",
      "metadata",
      "etl_context_id",
      "root_etl_context_id",
      "statistics",
    ];

    const requiredFields = ["data_source_name", "table_schema", "table_name"];
    const cols = [
      ...requiredFields,
      ...damaViewTblCols.filter(
        (c) => !omittedViewMetaCols.includes(c) && !requiredFields.includes(c)
      ),
    ];
    const allRequiredFieldsPopulated = requiredFields.every((col) =>
      get(damaViewMeta, col)
    );

    return damaViewMeta && damaViewTblCols ? (
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
            borderTop: "2px solid",
          }}
        >
          DataManager View Metadata
        </span>

        <table className="w-full">
          <thead>
            <tr>
              <th className="text-center">Property</th>
              <th className="text-center">Value</th>
            </tr>
          </thead>
          <tbody>
            {cols.map((col) => (
              <tr key={col} className="border-b">
                <td className="py-4">{col}</td>
                <td
                  className="text-right  p-2"
                  style={
                    requiredFields.includes(col) && !get(damaViewMeta, col)
                      ? { border: "1px solid red" }
                      : {}
                  }
                >
                  <input
                    className="w-full p-2 flex-1 shadow bg-grey-50 focus:bg-blue-100"
                    id={col}
                    value={get(damaViewMeta, col, "")}
                    disabled={damaPublished || col === "data_source_name"}
                    onChange={(e) => {
                      if (col !== "data_source_name") {
                        setDamaViewMeta({
                          ...damaViewMeta,
                          [col]: e.target.value,
                        });
                      }
                    }}
                  />
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
              requiredFields.every((col) => get(damaViewMeta, col)) &&
              !damaPublished
                ? "#3b82f680"
                : "#e5e7eb",
          }}
          onClick={() => {
            if (allRequiredFieldsPopulated && !damaPublished) {
              publishData();
            }
          }}
        >
          {damaPublished ? "Published" : "Publish"}
        </span>
      </div>
    ) : (
      ""
    );
  }

  return (
    <div className="w-full">
      <div
        style={{
          display: "inline-block",
          width: "100%",
          marginTop: "40px",
          textAlign: "center",
          paddingTop: "50px",
          paddingBottom: "100px",
          fontSize: "30px",
          borderTop: "8px solid",
        }}
      >
        <span>Postgres Environment:</span>
        <span style={{ color: "red", paddingLeft: "20px", fontWeight: "bold" }}>
          {pgEnv}
        </span>
      </div>

      <div> Add New Source</div>
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
      {layersSelector}
      {tableDescriptor ? (
        <div>
          {tableDescriptorSection}
          {qaSection}
          {getSrcMetaForm()}
          {getViewMetaForm()}
        </div>
      ) : (
        ""
      )}

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
