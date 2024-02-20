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

const AtlasMap = props => {
	const sources = useSourcesWithViewSymbologies({categories:['Freight Atlas']});
  //console.log('atlas map', sources)
  
	const layers = React.useMemo(() => {
		return sources.map(SymbologyLayerConstructor);
	}, [sources]);

  console.log('layers', layers)

	return (
    <div className="w-full h-full flex items-center justify-center">
      <ThemeProvider theme={ NewTheme }>
        <AvlMap2
          layers={ layers }
          mapOptions={ {
            center: [-76, 43.3],
            zoom: 6,
            protocols: [PMTilesProtocol],
            styles: [{
              name: "new-style",
              style: "https://api.maptiler.com/maps/dataviz-light/style.json?key=mU28JQ6HchrQdneiq6k9"
            }]
          } }
          leftSidebar={ {
            Panels: [
              { icon: "fad fa-layer-group",
                Panel: SourcePanel
              }
            ]
          } }
          rightSidebar={ false }
        />
      </ThemeProvider>
    </div>
	)
}


const AtlasPage = props => {
  return (
    <div className="w-full h-full relative">
      <AtlasMap pgEnv="freight_data"/>
    </div>
  )
}

const config = [{
  name: 'Freight Atlas',
  icon: 'fa-duotone fa-map',
  path: "/colmap",
  exact: true,
  auth: false,
  mainNav: true,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: AtlasPage
}]

export default config;