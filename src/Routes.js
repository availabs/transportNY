
import Auth from "~/pages/Auth"

// import Auth from "~/pages/Auth/Auth1.0.14"

import NoMatch from "~/pages/404"
import DataManager from "~/pages/DataManager"
import Documentation from "~/pages/Documentation"

import GraphTest from "./GraphTest"

import { useFalcor } from "~/modules/avl-components/src"
// import { useAuth } from "@availabs/ams"
import { useAuth } from "~/modules/ams/src"

import transportNYDataTypes from '~/pages/TransportNYDataTypes'

const DAMA_ARGS = {
  baseUrl: '/datasources',
  defaultPgEnv: 'freight_data',
  dataTypes: transportNYDataTypes,
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
  ...Auth,
  ...DataManager(DAMA_ARGS),
  ...Documentation,
  GraphTest,
  NoMatch
]

export default Routes
