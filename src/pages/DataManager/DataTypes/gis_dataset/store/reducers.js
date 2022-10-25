// https://github.com/alexnm/re-ducks#reducers

import PublishStatus from "../constants/PublishStatus";

import * as uploadGisDatasetSelectors from "../tasks/uploadGisDataset/store/selectors";

export const initialState = {
  etlContextId: null,
  maxSeenEventId: null,

  // SubSlices
  uploadGisDatasetState: null,
  gisDatasetLayerState: null,
  gisDatasetLayerDatabaseSchemaState: null,

  publishStatus: PublishStatus.AWAITING,
  publishErrMsg: null,
};

export default function reducer(state, action) {
  // console.log("==> createGisDatasource reducer:", { state, action });

  const { type, payload } = action;

  switch (type) {
    case "RESET_STATE":
      return initialState;

    case "etlContextId/UPDATE":
      return { ...state, etlContextId: payload };

    case "maxSeenEventId/UPDATE":
      return { ...state, maxSeenEventId: payload };

    case "uploadGisDataset:STATE_UPDATE": {
      const newState = { ...state, uploadGisDatasetState: payload };

      const uploadMaxSeenEventId =
        uploadGisDatasetSelectors.selectMaxSeenId(payload);

      newState.maxSeenEventId = Math.max(
        state.maxSeenEventId,
        uploadMaxSeenEventId
      );

      return newState;
    }

    case "selectGisDatasetLayer:STATE_UPDATE": {
      if (state.gisDatasetLayerState === payload) {
        return state;
      }

      return { ...state, gisDatasetLayerState: payload };
    }

    case "updateGisDatasetLayerDatabaseSchema:STATE_UPDATE": {
      if (state.gisDatasetLayerDatabaseSchemaState === payload) {
        return state;
      }

      return { ...state, gisDatasetLayerDatabaseSchemaState: payload };
    }

    case "publishStatus/UPDATE":
      return { ...state, publishStatus: payload };
    case "publishErrMsg/UPDATE":
      return { ...state, publishErrMsg: payload };

    default:
      return state;
  }
}
