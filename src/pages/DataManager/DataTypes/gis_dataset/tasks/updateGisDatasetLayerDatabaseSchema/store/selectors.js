import createSimpleSelector from "../../../utils/createSimpleSelector";

export const selectDatabaseColumnNames = createSimpleSelector(
  "databaseColumnNames"
);

export const selectTableDescriptor = createSimpleSelector("tableDescriptor");
