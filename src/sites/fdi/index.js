// import FreightMap from "./pages/FreightMap"
// import FreightAtlas from "./pages/Atlas"
// import CollectionAtlas from "./pages/CollectionAtlas"
import FreightCMS from "./FreightCMS.jsx"


// import Auth from "~/pages/Auth/Auth1.0.14"

import DataManager from "~/pages/DataManager"
import { useFalcor } from "~/modules/avl-components/src"
import { useAuth } from "~/modules/dms/src"

import transportNYDataTypes from '~/pages/TransportNYDataTypes'


const DAMA_ARGS = {
  baseUrl: '/datasources',
  defaultPgEnv: 'freight_data',
  dataTypes: transportNYDataTypes,
  useFalcor,
  useAuth,
  authLevel:1,
  navSettings: {
    topNav: {
      position: 'fixed',
      size: 'compact',
    },
    sideNav: {
      size: 'none',
      color: 'white'
    },
  }
}


const Routes = [
  ...FreightCMS,
  ...DataManager(DAMA_ARGS),
  // ...FreightMap,
  // ...FreightAtlas,
  // ...CollectionAtlas
]

const SiteConfig = {
  title: "Freight Atlas",
  Routes
}

export default SiteConfig
