import PublishStatus from "../../../constants/PublishStatus";

import createSimpleIdentityAction from "../../../utils/createSimpleIdentityAction";

export const resetState = createSimpleIdentityAction("RESET_STATE");

export const updateDataSourceName = createSimpleIdentityAction(
  "dataSourceName/UPDATE"
);

export const updateDataSourceDisplayName = createSimpleIdentityAction(
  "dataSourceDisplayName/UPDATE"
);

export const updateDataSourceId = createSimpleIdentityAction(
  "dataSourceId/UPDATE"
);

export const updateEtlContextId = createSimpleIdentityAction(
  "etlContextId/UPDATE"
);

export const updateMaxSeenEventId = createSimpleIdentityAction(
  "maxSeenEventId/UPDATE"
);

export const setPublishStatusToInProgress = createSimpleIdentityAction(
  "publishStatus/UPDATE"
).bind(null, PublishStatus.IN_PROGRESS);

export const setPublishStatusToPublished = createSimpleIdentityAction(
  "publishStatus/UPDATE"
).bind(null, PublishStatus.PUBLISHED);

export const setPublishStatusToError = createSimpleIdentityAction(
  "publishStatus/UPDATE"
).bind(null, PublishStatus.ERROR);

export const updatePublishErrMsg = createSimpleIdentityAction(
  "publishErrMsg/UPDATE"
);
