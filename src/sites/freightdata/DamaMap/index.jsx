import React from "react"

import get from "lodash/get"

import { useFalcor } from "~/modules/avl-components/src";

import { AvlMap as AvlMap2 } from "~/modules/avl-map-2/src"
import { Protocol, PMTiles } from '~/pages/DataManager/utils/pmtiles/index.ts'

import useSourceCategories from "./useSourceCategories"

import { SourceLayerConstructor } from "./SourceLayer"
import SourcePanel from "./SourcePanel"

const PMTilesProtocol = {
  type: "pmtiles",
  protocolInit: maplibre => {
    const protocol = new Protocol();
    maplibre.addProtocol("pmtiles", protocol.tile);
    return protocol;
  },
  sourceInit: (protocol, source, maplibreMap) => {
    const p = new PMTiles(source.url);
    protocol.add(p);
  }
}

const DamaMap = props => {

  const { pgEnv  } = props;

  const sources = useSourceCategories(props);
  const [layers, setLayers] = React.useState([]);
  const [sourceIds, setSourceIds] = React.useState("");

  React.useEffect(() => {
    if (sources.length) {
      const srcIds = sources.map(src => src.source_id).join("|");
      if (srcIds !== sourceIds) {
        setSourceIds(srcIds);
        setLayers(sources.map(SourceLayerConstructor));
      }
    }
  }, [sources, sourceIds]);

  const [layerData, _setLayerData] = React.useState({});
  const setLayerData = React.useCallback((layerId, data) => {
    _setLayerData(prev => ({ ...prev, [layerId]: data }));
  }, []);

  const [activeViewId, _setActiveViewId] = React.useState({});
  const setActiveViewId = React.useCallback((layerId, viewId) => {
    _setActiveViewId(prev => ({ ...prev, [layerId]: viewId }))
  }, []);

  const layerProps = React.useMemo(() => {
    return layers.reduce((a, c) => {
      a[c.id] = {
        pgEnv,
        layerData: get(layerData, c.id, []),
        setLayerData,
        activeViewId: get(activeViewId, c.id, null),
        setActiveViewId
      };
      return a;
    }, {});
  }, [pgEnv, layers, layerData, setLayerData, activeViewId, setActiveViewId]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <AvlMap2
        layers={ layers }
        layerProps={ layerProps }
        mapOptions={ {
          protocols: [PMTilesProtocol]
        } }
        leftSidebar={ {
          Panels: [
            { icon: "fas fa-layer-group",
              Panel: SourcePanel
            }
          ]
        } }
        rightSidebar={ false }/>
    </div>
  )
}
export default DamaMap;
