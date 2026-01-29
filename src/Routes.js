


import NoMatch from "~/pages/404"
import DataManager from "~/pages/DataManager"
//import Documentation from "~/pages/Documentation"

//import GraphTest from "./GraphTest"

import { useFalcor } from "~/modules/avl-components/src"
// import { useAuth } from "@availabs/ams"
import { useAuth } from "~/modules/dms/packages/dms/src"

import transportNYDataTypes, { mapPlugins } from '~/pages/TransportNYDataTypes'

// const authMenuConfig = {

//   topNav: {
//     position: 'fixed',
//     size: 'compact'
//   },
// }

const DAMA_ARGS = {
  baseUrl: '/datasources',
  defaultPgEnv: 'npmrds2',
  dataTypes: transportNYDataTypes,
  mapPlugins: mapPlugins,
  useFalcor,
  useAuth,
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
  ...DataManager(DAMA_ARGS),
  // ...Documentation,
  // GraphTest,
  NoMatch
]

export default Routes
