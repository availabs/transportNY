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
      name: 'test map 0',
      url: '/'
    },
    {
      name: 'test map 1',
      url: '/?layers=140|144|74'
    },
    {
      name: 'test map 2',
      url: '/?layers=136'
    }

]

const SecondPanel = () => {
  return <div>
    {pages.map(p => (
      <div key={`${p.name}_panel_link`} className='w-full flex items-center p-4 border border-blue-300 hover:bg-blue-100'>
        <Link to={p.url}>{p.name}</Link>
      </div>
    ))}  
  </div>
}

const AtlasMap = props => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlActiveLayers = searchParams.get("layers")?.split('|').map(id => parseInt(id)).filter(item => !isNaN(item)) || [];

	const sources = useSourcesWithViewSymbologies({categories:['Freight Atlas']});
  
	const layers = React.useMemo(() => {
    console.log("recomputing/creating layers")
		return sources.map(SymbologyLayerConstructor).map((l) => {
      const newLayer = { ...l };

      if (urlActiveLayers.includes(l.symbology_id)) {
        newLayer.startActive = true;
        newLayer.startState = { activeSymbology: l.layers[0].symbology[0] }; //TODO may need to change this to array depending on how multi layered symbologies is implemented
      }
      return newLayer;
    });
	}, [sources]); //RYAN TODO maybe need to add urlActiveLayers to depenedencies

	// React.useEffect(() => {
	// 	if(urlActiveLayers.includes(symbology.symbology_id)){
	// 		console.log("should be active on map", symbology.symbology_id);
	// 		MapActions.updateLayerState(layerId, {
	// 			activeSymbology: symbologies[0]
	// 		});
	// 		MapActions.activateLayer(layerId);
	// 		// MapActions.toggleLayerVisibility(layerId);
	// 	}
	// 	else{
	// 		console.log("should not be active on map", symbology.symbology_id)
	// 		MapActions.updateLayerState(layerId, {
	// 			activeSymbology: null
	// 		});
	// 		MapActions.deactivateLayer(layerId);
	// 		MapActions.toggleLayerVisibility(layerId);
	// 	}
	// },[urlActiveLayers.includes(symbology.symbology_id)])
  

  // console.log(layers);
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