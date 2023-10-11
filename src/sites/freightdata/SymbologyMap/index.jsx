import React from "react"

import get from "lodash/get"

import { AvlMap as AvlMap2, ThemeProvider } from "~/modules/avl-map-2/src"
import { Protocol, PMTiles } from '~/pages/DataManager/utils/pmtiles/index.ts'

import { useFalcor } from "~/modules/avl-components/src";

import NewTheme from "./NewTheme"

import SourcePanel from "./SourcePanel"

import useSourcesWithViewSymbologies from "./useSourcesWithViewSymbologies"
import { SymbologyLayerConstructor } from "./SymbologyLayer"

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

const SymbologyMap = props => {
	const sources = useSourcesWithViewSymbologies({});

	const layers = React.useMemo(() => {
		return sources.map(SymbologyLayerConstructor);
	}, [sources]);

	return (
    <div className="w-full h-full flex items-center justify-center">
      <ThemeProvider theme={ NewTheme }>
        <AvlMap2
          layers={ layers }
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
          } }
          rightSidebar={ false }/>
      </ThemeProvider>
    </div>
	)
}
export default SymbologyMap;