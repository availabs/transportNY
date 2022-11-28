import createSimpleSelector from "../../../utils/createSimpleSelector";

export const selectMaxSeenId = createSimpleSelector("maxSeenEventId");
export const selectGisUploadId = createSimpleSelector("gisUploadId");
export const selectFileUploadStatus = createSimpleSelector("fileUploadStatus");
export const selectUploadedFile = createSimpleSelector("uploadedFile");
export const selectUploadErrMsg = createSimpleSelector("uploadErrMsg");
