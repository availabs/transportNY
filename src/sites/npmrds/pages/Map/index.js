import React from "react"
import get from "lodash.get"
import { AvlMap } from "modules/avl-map/src"
import config from "config.json"
import { ThemeContext } from "modules/avl-components/src"
// import { RisLayerFactory } from "./layers/RISLayer"
import { MacroLayerFactory } from "./layers/MacroView/index"
import { baseMaps } from './map-styles/basemaps'

const theme = {
  menuBg: 'bg-npmrds-600',
  bg: 'bg-npmrds-600',
  sidebarBg: 'bg-npmrds-800',
  accent1: 'bg-npmrds-600',
  accent2: 'bg-cool-gray-800',
  accent3: 'bg-cool-gray-700',
  accent4: 'bg-cool-gray-500',
  menuText: 'text-npmrds-100',
  rounded: '',

  inputBg: 'bg-npmrds-800 hover:bg-cool-gray-700',
  inputBgFocus: 'bg-cool-gray-700',
  itemText: 'text-npmrds-100 hover:text-white text-sm',
  menuBgActive: 'bg-transparent',

  input: 'bg-npmrds-600 w-full text-npmrds-100 text-sm p-2'
}


const Map = () => {
  const layers = React.useMemo(() => {
    return [MacroLayerFactory()];
  }, []);
  return (
    <div className='h-screen  h-full flex-1 flex flex-col text-white'>
       <ThemeContext.Provider value={ theme }>
        <AvlMap
          accessToken={ config.MAPBOX_TOKEN }
          mapOptions={ {
            zoom: 6.6,
            styles: baseMaps
          } }
          layers={ layers }
          sidebar={ {
            title: "NPMRDS",
            tabs: ["layers", "styles"],
            open: true
          } }/>
        </ThemeContext.Provider>
    </div>
  )
}


const AdminMapPage = {
  icon: 'fa-map',
  class: "fa",
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
