import createSimpleSelector from "../../../utils/createSimpleSelector";

export const selectDataSourceName = createSimpleSelector("dataSourceName");

export const selectDataSourceDisplayName = createSimpleSelector(
  "dataSourceDisplayName"
);

export const selectDataSourceId = createSimpleSelector("dataSourceId");

export const selectEtlContextId = createSimpleSelector("etlContextId");

export const selectMaxSeenId = createSimpleSelector("maxSeenEventId");

export const selectUploadGisDatasetState = createSimpleSelector(
  "uploadGisDatasetState"
);

export const selectGisDatasetLayerState = createSimpleSelector(
  "gisDatasetLayerState"
);

export const selectGisDatasetLayerDatabaseSchemaState = createSimpleSelector(
  "gisDatasetLayerDatabaseSchemaState"
);

export const selectPublishStatus = createSimpleSelector("publishStatus");

export const selectPublishErrMsg = createSimpleSelector("publishErrMsg");
