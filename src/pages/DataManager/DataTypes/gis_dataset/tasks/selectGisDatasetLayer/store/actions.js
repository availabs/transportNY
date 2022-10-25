import createSimpleIdentityAction from "../../../utils/createSimpleIdentityAction";

export const updateLayerNames = createSimpleIdentityAction("layerNames/UPDATE");

export const updateLayerName = createSimpleIdentityAction("layerName/UPDATE");

export const updateLayerAnalysis = createSimpleIdentityAction(
  "layerAnalysis/UPDATE"
);

export const updateLyrAnlysErrMsg = createSimpleIdentityAction(
  "lyrAnlysErrMsg/UPDATE"
);
