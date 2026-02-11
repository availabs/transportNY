import React from "react"
import get from "lodash/get"
import { AvlMap } from "~/modules/avl-map/src"
import { useParams } from "react-router"
import config from "~/config.json"
// import { RisLayerFactory } from "./layers/RISLayer"
import { MacroLayerFactory } from "./layers/MacroView/index"
import { baseMaps } from './map-styles/basemaps'

const Map = () => {
  const layers = React.useRef([MacroLayerFactory()]);
  const layerId = layers.current[0].id;

  const params = useParams();
  const layerProps = React.useMemo(() => {
    return { [layerId]: { params: { ...params } } };
  }, [params, layerId]);

  return (
    <div className='h-full'>
      <AvlMap
        accessToken={ config.MAPBOX_TOKEN }
        mapOptions={ {
          zoom: 6.6,
          styles: baseMaps
        } }
        layers={ layers.current }
        layerProps={ layerProps }
        sidebar={ { open: true } }/>
    </div>
  )
}


const MapConfig = [
  { icon: 'fa-duotone fa-map',
    path: '/map',
    exact: true,
    mainNav: true,
    sideNav: {
      color: 'dark',
      size: 'compact'
    },
    name: 'Macro',
    auth: true,
    component: Map
  },
  { icon: 'fa-duotone fa-map',
    path: '/map/:geoid/:year/:measure',
    exact: true,
    mainNav: false,
    sideNav: {
      color: 'dark',
      size: 'compact'
    },
    name: 'Macro',
    auth: true,
    component: Map
  }
]

export default MapConfig;
