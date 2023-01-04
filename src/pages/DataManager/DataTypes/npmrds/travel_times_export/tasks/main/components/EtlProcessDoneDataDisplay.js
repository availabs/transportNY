import { useContext } from "react";

import {
  useEtlContext,
  EtlContextReact,
} from "pages/DataManager/utils/EtlContext";

export default function RequestStatusMessage() {
  const ctx = useContext(EtlContextReact);

  const { etlProcessFinalEvent } = useEtlContext(ctx);

  if (!etlProcessFinalEvent) {
    return "";
  }

  const {
    payload: { toposortedDamaViewInfo },
  } = etlProcessFinalEvent;

  const tableRows = toposortedDamaViewInfo.map(
    ({ name, source_id, view_id, source_dependencies, view_dependencies }) => (
      <tr key={name} style={{ border: "1px solid" }}>
        <td
          style={{
            border: "1px solid",
            padding: "10px",
            backgroundColor: "white",
            color: "darkblue",
          }}
        >
          {name}
        </td>
        <td
          style={{
            border: "1px solid",
            backgroundColor: "white",
            paddingLeft: "10px",
            paddingRight: "10px",
          }}
        >
          {source_id}
        </td>
        <td style={{ border: "1px solid", backgroundColor: "white" }}>
          {view_id}
        </td>
        <td style={{ border: "1px solid", backgroundColor: "white" }}>
          {(source_dependencies || []).join(", ")}
        </td>
        <td style={{ border: "1px solid", backgroundColor: "white" }}>
          {(view_dependencies || []).join(", ")}
        </td>
      </tr>
    )
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
            Data Source Name
          </th>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            Source ID
          </th>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            View ID
          </th>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            Source Dependencies
          </th>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            View Dependencies
          </th>
        </tr>
      </thead>
      <tbody style={{ border: "1px solid" }}>{tableRows}</tbody>
    </table>
  );
}
