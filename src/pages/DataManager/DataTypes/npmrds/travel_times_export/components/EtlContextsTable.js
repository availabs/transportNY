import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { getEtlContextsForDamaSourceId } from "pages/DataManager/utils/FalcorApi";

import { selectPgEnv } from "pages/DataManager/store";

function EtlEventsContextTable(etlContextsEvents) {
  const tableRows = etlContextsEvents.map(
    (
      {
        INITIAL: {
          payload: { state, start_date, end_date, is_expanded },
          meta: { etl_context_id },
        },
        LATEST: { type = "INITIAL" } = {},
      },
      i
    ) => {
      const latestEventType = type.replace(/.*:/g, "");

      return (
        <tr key={`event=${i}`} style={{ border: "1px solid" }}>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            {etl_context_id}
          </td>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            {state}
          </td>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            {start_date}
          </td>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            {end_date}
          </td>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            {is_expanded ? "true" : "false"}
          </td>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            {latestEventType}
          </td>
        </tr>
      );
    }
  );

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
          backgroundColor: "#d5e7ff",
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
            ETL Context ID
          </th>
          <th style={{ border: "1px solid", borderColor: "black" }}> State</th>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            Start Date
          </th>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            End Date
          </th>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            Expanded Map
          </th>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            Latest Event Type
          </th>
        </tr>
      </thead>
      <tbody style={{ border: "1px solid" }}>{tableRows}</tbody>
    </table>
  );
}

export default function EtlContextsStatusTable() {
  const [etlContextStatus, setEtlContextStatus] = React.useState("RUNNING");
  const [etlContexts, setEtlContexts] = React.useState(null);

  const pgEnv = useSelector(selectPgEnv);

  const { sourceId } = useParams();

  const otherStatus = etlContextStatus === "RUNNING" ? "STOPPED" : "RUNNING";

  React.useEffect(() => {
    (async () => {
      if (etlContextStatus !== null) {
      }
      setEtlContexts(
        await getEtlContextsForDamaSourceId(pgEnv, sourceId, etlContextStatus)
      );
    })();
  }, [pgEnv, sourceId, etlContextStatus]);

  if (!etlContexts) {
    return "";
  }

  const table = EtlEventsContextTable(etlContexts);

  const buttonColor = etlContextStatus === "RUNNING" ? "red" : "blue";
  const buttonClassName = `bg-${buttonColor}-500 hover:bg-${buttonColor}-700 text-white font-bold py-2 px-4 border border-${buttonColor}-700 rounded`;

  const titleColor = etlContextStatus === "RUNNING" ? "blue" : "red";

  const toggle = (
    <div>
      <button
        className={buttonClassName}
        onClick={() => setEtlContextStatus(otherStatus)}
      >
        Show {otherStatus}
      </button>
      <div style={{ paddingTop: "20px" }}>
        <h2
          style={{
            fontSize: "25px",
            textAlign: "center",
            marginBottom: "15px",
            fontWeight: "bold",
          }}
        >
          NPMRDS Travel Times Exports{" "}
          <span style={{ color: titleColor }}>{etlContextStatus}</span> ETL
          Processes
        </h2>
      </div>
      {table}
    </div>
  );

  return <div>{toggle}</div>;
}
