import React from "react"

import get from "lodash/get"

import { useFalcor } from "~/modules/avl-components/src";

import { AvlMap as AvlMap2, ThemeProvider } from "~/modules/avl-map-2/src"
import { Protocol, PMTiles } from '~/pages/DataManager/utils/pmtiles/index.ts'

import useSourceCategories from "./useSourceCategories"
import NewTheme from "./NewTheme"

import { SourceLayerConstructor } from "./SourceLayer"
import SourcePanel from "./SourcePanel"

import calculateLegend from "./calculateLegend"

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

  const { pgEnv } = props;

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

  const [activeViewIds, setActiveViewIds] = React.useState({});
  const setActiveViewId = React.useCallback((layerId, view_id) => {
    setActiveViewIds(prev => ({ ...prev, [layerId]: view_id }))
  }, []);

  const [activeDataVariables, setActiveDataVariables] = React.useState({});
  const setActiveDataVariable = React.useCallback((layerId, v) => {
    setActiveDataVariables(prev => ({ ...prev, [layerId]: v }));
  }, []);

  const [legends, setLegends] = React.useState({});

  React.useEffect(() => {
    const legends = layers.reduce((a, c) => {
      const ld = get(layerData, c.id, []);
      const avid = get(activeViewIds, c.id, null);
      const adv = get(activeDataVariables, c.id, null);
      a[c.id] =  calculateLegend(c.damaSource, avid, adv, ld);
      return a;
    }, {});
    setLegends(legends);
  }, [layers, layerData, activeDataVariables, activeViewIds]);

  const layerProps = React.useMemo(() => {
    return layers.reduce((a, c) => {
      a[c.id] = {
        pgEnv,

        layerData: get(layerData, c.id, []),
        setLayerData,

        activeViewId: get(activeViewIds, c.id, null),
        setActiveViewId,

        activeDataVariable: get(activeDataVariables, c.id, null),
        setActiveDataVariable,

        legend: get(legends, c.id, null)
      };
      return a;
    }, {});
  }, [pgEnv, layers, layerData, setLayerData,
      activeViewIds, setActiveViewId, legends,
      activeDataVariables, setActiveDataVariable
    ]
  );

  return (
    <div className="w-full h-full flex items-center justify-center">
      <ThemeProvider theme={ NewTheme }>
        <AvlMap2
          layers={ layers }
          layerProps={ layerProps }
          mapOptions={ {
            protocols: [PMTilesProtocol],
            styles: [{
              name: "new-style",
              style: "https://api.maptiler.com/maps/dataviz-light/style.json?key=mU28JQ6HchrQdneiq6k9"
            }]
          } }
          leftSidebar={ {
            Panels: [
              { icon: "fas fa-layer-group",
                Panel: SourcePanel
              }
            ]
          } }/>
      </ThemeProvider>
    </div>
  )
}
export default DamaMap;
