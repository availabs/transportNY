import { useContext } from "react";

import { debounce } from "lodash";
import Dropdown from "react-dropdown";
import "react-dropdown/style.css";

import PublishStatus from "../../../constants/PublishStatus";

import {
  useEtlContextDependencies,
  EtlContextReact,
} from "../../../utils/EtlContext";

const FreeFormColumnNameInput = ({ publishStatus, field, col, onChange }) => {
  console.log("field:", field, "; col:", col);
  return (
    <input
      className="w-full p-2 flex-1 shadow bg-grey-50 focus:bg-blue-100 border-gray-300"
      disabled={publishStatus !== PublishStatus.AWAITING}
      id={field}
      defaultValue={col}
      onChange={onChange}
    />
  );
};

const ConstrainedColumnNameInput = ({
  publishStatus,
  key,
  col,
  availableDbColNames,
  onChange,
}) => {
  if (!availableDbColNames) {
    return "";
  }

  const matches = availableDbColNames.includes(col);

  const options = [null, ...availableDbColNames];

  return (
    <Dropdown
      key={`col-names-dropdown-for-${key}`}
      options={options}
      onChange={onChange}
      value={matches ? col : null}
      placeholder="Select the db column name"
      disabled={publishStatus !== PublishStatus.AWAITING}
    />
  );
};

export const GisDatasetLayerDatabaseDbSchemaForm = () => {
  const ctx = useContext(EtlContextReact);
  const {
    dispatch,
    actions: { updateGisDatasetLayerDatabaseColumnName },
  } = ctx;

  const etlCtxDeps = useEtlContextDependencies(ctx, [
    "layerName",
    "tableDescriptor",
    "publishStatus",
    "databaseColumnNames",
  ]);

  const { layerName, tableDescriptor, publishStatus, databaseColumnNames } =
    etlCtxDeps;

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

  const InputElem = databaseColumnNames
    ? ConstrainedColumnNameInput
    : FreeFormColumnNameInput;

  const tableDescriptorColumnTypes = tableDescriptor.columnTypes;

  const mappedColNamesSet = new Set(
    tableDescriptorColumnTypes.map(({ col }) => col)
  );

  const availableDbColNames =
    databaseColumnNames &&
    databaseColumnNames.filter((c) => !mappedColNamesSet.has(c));

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
          {tableDescriptorColumnTypes.map(({ key, col }, rowIdx) => (
            <tr key={key} className="border-b">
              <td className="py-4 text-left">{key}</td>
              <td className="text-right  p-2">
                <InputElem
                  {...{
                    availableDbColNames,
                    publishStatus,
                    field: key,
                    col,
                    onChange: debounce((e) => {
                      console.log("fieldsMappingSection onChange:", e);

                      dispatch(
                        updateGisDatasetLayerDatabaseColumnName(
                          rowIdx,
                          e.target.value
                        )
                      );
                    }, 500),
                  }}
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
