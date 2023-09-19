import React from "react"

import get from "lodash/get"

import { Legend } from "~/modules/avl-map-2/src"

import useSourceLegend from "./useSourceLegend"

const SourceLegend = props => {

  const {
    layer,
    layerProps,
    layersLoading
  } = props;

  const layerData = React.useMemo(() => {
    return get(layerProps, [layer.id, "layerData"], []);
  }, [layer, layerProps]);

  const activeDataVariable = React.useMemo(() => {
    return get(layerProps, [layer.id, "activeDataVariable"], null)
  }, [layer, layerProps]);

  const legend = React.useMemo(() => {
    return get(layerProps, [layer.id, "legend"], null);
  }, [layer, layerProps]);

  const layerLoading = React.useMemo(() => {
    return Boolean(get(layersLoading, [layer.id, "loading"], 0));
  }, [layer, layersLoading]);

  return (
    <div className="p-1">
      <div className="font-bold">
        { activeDataVariable || "no data variable selected" }
      </div>
      <div className="relative w-full">
        { !layerData.length && layerLoading ? "loading data..." :
          !layerData.length && !activeDataVariable ? "select a data variable..." :
          !layerData.length ? "no data received" :
          layerData.length && !legend ? "processing data..." :
          <Legend { ...legend } showHover={ false }/>
        }
      </div>
    </div>
  )
}
export default SourceLegend;
