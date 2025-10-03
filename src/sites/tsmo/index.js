import Incidents from "~/sites/tsmo/pages/Dashboards/Incidents"
import Workzones from "~/sites/tsmo/pages/Dashboards/Workzones"
import Congestion from "~/sites/tsmo/pages/Dashboards/Congestion"

import IncidentSearch from './pages/IncidentSearch'
import IncidentView from "./pages/IncidentView"
import CorridorView from "./pages/CorridorView"

//import TSMODocs from "./pages/docsTSMO"

import Home from './pages/Home'

const Routes = [
  Home,
  IncidentSearch,
  Incidents,
  Workzones,
  Congestion,
  IncidentView,
  ...CorridorView,
  //...TSMODocs
]


const TSMOconfig = {
	title: "TSMO",
	Routes
}

export default TSMOconfig
