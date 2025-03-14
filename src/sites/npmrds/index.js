import Folders from "./pages/Folders"
import Analysis from "./pages/analysis"
import Home from "./pages/Home"
import RouteCreation from "./pages/route_creation"
import Map from "./pages/Map"
import TmcPage from "./pages/TmcPage"
import PM3 from "./pages/pm3Map21"
import NpmrdsDocs from "./pages/npmrdsDocs"
import BatchReports from "./pages/BatchReports"
import BatchReportsNew from "./pages/BatchReportsNew"
import DataManager from "~/pages/DataManager"
import { useFalcor } from "~/modules/avl-components/src"
import { useAuth } from "~/modules/ams/src"

import transportNYDataTypes from '~/pages/TransportNYDataTypes'
import IncidentView from "./pages/IncidentView"

const DAMA_ARGS = {
  baseUrl: '/datasources',
  defaultPgEnv: 'npmrds2',
  dataTypes: transportNYDataTypes,
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
  Home,
  ...RouteCreation,
  ...Folders,
  ...Analysis,
  TmcPage,
  ...Map,
  PM3,
  ...NpmrdsDocs,
  BatchReports,
  BatchReportsNew,
  IncidentView,
  ...DataManager(DAMA_ARGS)
]

console.log('npmrds Routes', Routes)

const site =  {
	title: "NPMRDS",
	Routes
}

export default site
