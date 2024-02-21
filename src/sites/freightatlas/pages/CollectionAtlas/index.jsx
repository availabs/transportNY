import React from "react"
import { useSearchParams, Link } from "react-router-dom";
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

const pages = [
    {
      name: 'test map 1',
      url: '/?layers=118|144'
    },
    {
      name: 'test map 2',
      url: '/?layers=111|133'
    }

]

const SecondPanel = () => {
  
  return <div>
    {pages.map(p => (
      <div className='w-full flex items-center p-4 border border-blue-300 hover:bg-blue-100'>
        <Link to={p.url}>{p.name}</Link>
      </div>
    ))}  
  </div>
}

const AtlasMap = props => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlActiveLayers = searchParams.get("layers")?.split('|').map(id => parseInt(id)) || [];

	const sources = useSourcesWithViewSymbologies({categories:['Freight Atlas']});
  
	const layers = React.useMemo(() => {
		return sources.map(SymbologyLayerConstructor).map((l) => {
      const newLayer = { ...l };
      if (urlActiveLayers.includes(l.symbology_id)) {
        newLayer.startActive = true;
        newLayer.startState = { activeSymbology: l.layers[0].symbology[0] }; //TODO may need to change this to array depending on how multi layered symbologies is implemented
      }
      return newLayer;
    });
	}, [sources]); //RYAN TODO maybe need to add urlActiveLayers to depenedencies


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
              },
              {
                icon: "fad fa-map",
                Panel: SecondPanel
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
  path: "/",
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