import React from "react"
import get from "lodash.get"
import { AvlMap } from "modules/avl-map/src"
import config from "config.json"
// import { RisLayerFactory } from "./layers/RISLayer"
import { MacroLayerFactory } from "./layers/MacroView/index"
import { baseMaps } from './map-styles/basemaps'

const Map = () => {
  const layers = React.useRef([MacroLayerFactory()]);
  return (
    <div className='h-full'>
      <AvlMap
        accessToken={ config.MAPBOX_TOKEN }
        mapOptions={ {
          zoom: 6.6,
          styles: baseMaps
        } }
        layers={ layers.current }
        sidebar={ {
          title: "NPMRDS",
          tabs: ["layers", "styles"],
          open: true
        } }/>
    </div>
  )
}


const AdminMapPage = {
  icon: 'fa fa-map',
  path: '/map',
  exact: true,
  mainNav: true,
  menuSettings: {
    display: 'none',
    image: 'none',
    scheme: 'color-scheme-dark',
    position: 'menu-position-side',
    layout: 'menu-layout-mini',
    style: 'color-style-default'
  },
  name: 'Map',
  authLevel: 0,
  component: Map
}

export default AdminMapPage;
