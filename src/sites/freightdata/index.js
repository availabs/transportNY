import DataManager from "~/pages/DataManager"

// import MapPageConfig from "./MapPage"
// import SymbologyMapConfig from "./SymbologyMapPage"
// import FreightAtlas from './Atlas'

import { useFalcor } from "~/modules/avl-components/src"
// import { useAuth } from "@availabs/ams"
import { useAuth } from "~/modules/ams/src"

import FreightDocs from './FreightDocs'

const DAMA_ARGS = {
  baseUrl: '',
  defaultPgEnv: 'freight_data',
  useFalcor,
  useAuth,
  navSettings: {
    topNav: {
      position: 'fixed',
      size: 'compact',
    },
  }
}

const Routes = [
  ...DataManager(DAMA_ARGS),
  ...FreightDocs
]

const site = {
	title: "TransportNY",
	Routes
}

export default site
