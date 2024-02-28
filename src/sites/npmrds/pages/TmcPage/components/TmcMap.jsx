import React from "react"

import get from "lodash/get"

import { AvlMap } from "~/modules/avl-map/src"
import config from "~/config.json"

import { useFalcor } from "~/modules/avl-components/src"

import TmcLayer from "./TmcLayer"

const TmcMap = ({ tmc, year }) => {

  const layers = React.useRef([new TmcLayer()]);
  const layerId = layers.current[0].id;

  const { falcorCache } = useFalcor();

  const layerProps = React.useMemo(() => {
    const bbox = get(falcorCache, ["tmc", tmc, "meta", year, "bounding_box", "value"], []);
    const geom = get(falcorCache, ["tmc", tmc, "year", year, "geometries", "value"], null);
    return { [layerId]: { bbox, geom } };
  }, [falcorCache, layerId, tmc, year]);

  return (
    <div className='h-64'>
      <AvlMap layers={ layers.current }
        accessToken={ config.MAPBOX_TOKEN }
        navigationControl={ false }
        layerProps={ layerProps }
        sidebar={ false }/>
    </div>
  )
}

export default TmcMap;
