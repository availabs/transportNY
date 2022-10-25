import { useContext } from "react";

import { debounce } from "lodash";

import PublishStatus from "../../../constants/PublishStatus";

import {
  useEtlContextDependencies,
  EtlContextReact,
} from "../../../utils/EtlContext";

export const GisDatasetLayerDatabaseDbSchemaForm = () => {
  const ctx = useContext(EtlContextReact);
  const {
    dispatch,
    actions: { updateGisDatasetLayerDatabaseColumnName },
  } = ctx;

  const { layerName, tableDescriptor, publishStatus } =
    useEtlContextDependencies(ctx, [
      "layerName",
      "tableDescriptor",
      "publishStatus",
    ]);

  if (!layerName) {
    return "";
  }

  if (!tableDescriptor) {
    return (
      <span
        style={{
          display: "inline-block",
          width: "100%",
          textAlign: "center",
          padding: "30px",
        }}
      >
        Please wait... the server is analyzing the {layerName} layer. This may
        take a few moments.
      </span>
    );
  }

  const tableDescriptorColumnTypes = tableDescriptor.columnTypes;

  const fieldsMappingSection = (
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
          {tableDescriptorColumnTypes.map((row, rowIdx) => (
            <tr key={row.key} className="border-b">
              <td className="py-4 text-left">{row.key}</td>
              <td className="text-right  p-2">
                <input
                  className="w-full p-2 flex-1 shadow bg-grey-50 focus:bg-blue-100 border-gray-300"
                  disabled={publishStatus !== PublishStatus.AWAITING}
                  id={row.key}
                  defaultValue={row.col}
                  onChange={debounce(
                    (e) =>
                      dispatch(
                        updateGisDatasetLayerDatabaseColumnName(
                          rowIdx,
                          e.target.value
                        )
                      ),
                    500
                  )}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
