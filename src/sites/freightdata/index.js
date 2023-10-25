import DataManager from "~/pages/DataManager"

import MapPageConfig from "./MapPage"
import SymbologyMapConfig from "./SymbologyMapPage"
import FreightAtlas from './Atlas'

import { useFalcor } from "~/modules/avl-components/src"
import { useAuth } from "@availabs/ams"

const DAMA_ARGS = {
  baseUrl: '',
  defaultPgEnv: 'freight_data',
  useFalcor,
  useAuth
}

const Routes = [
  ...DataManager(DAMA_ARGS),
  FreightAtlas,
  MapPageConfig,
  SymbologyMapConfig
]

const site = {
	title: "TransportNY",
	Routes
}

export default site
