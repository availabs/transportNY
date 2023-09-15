import React from "react"

import get from "lodash/get"

import { Legend } from "~/modules/avl-map-2/src"

import useSourceLegend from "./useSourceLegend"

const SourceLegend = props => {

  const {
    layer,
    layerProps
  } = props;

  const layerData = React.useMemo(() => {
    return get(layerProps, [layer.id, "layerData"], []);
  }, [layer, layerProps]);

  const legend = useSourceLegend(props.layer?.damaSource, layerData);

  return (
    <div className="p-1">
      <div className="relative w-full">
        { !legend || !legend.range ? null :
          <Legend { ...legend } showHover={ false }/>
        }
      </div>
    </div>
  )
}
export default SourceLegend;
