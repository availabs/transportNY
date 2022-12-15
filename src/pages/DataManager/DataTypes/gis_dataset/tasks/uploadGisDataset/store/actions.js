import createSimpleIdentityAction from "../../../utils/createSimpleIdentityAction";

export const updateGisUploadId =
  createSimpleIdentityAction("gisUploadId/UPDATE");

export const updateFileUploadStatus = createSimpleIdentityAction(
  "fileUploadStatus/UPDATE"
);

export const updateMaxSeenEventId = createSimpleIdentityAction(
  "maxSeenEventId/UPDATE"
);

export const updateUploadedFile = createSimpleIdentityAction(
  "uploadedFile/UPDATE"
);

export const updateUploadErrMsg = createSimpleIdentityAction(
  "uploadErrMsg/UPDATE"
);
