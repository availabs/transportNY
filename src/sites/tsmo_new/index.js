import Incidents from "./pages/Dashboards/Incidents"
import Workzones from "./pages/Dashboards/Workzones"
import Congestion from "./pages/Dashboards/Congestion"

import IncidentSearch from './pages/IncidentSearch'
import IncidentView from "./pages/IncidentView"
import CorridorView from "./pages/CorridorView"

//import TSMODocs from "./pages/docsTSMO"

import Home from './pages/Home'

const Routes2 = [
  Home,
  IncidentSearch,
  Incidents,
  Workzones,
  Congestion,
  IncidentView,
  ...CorridorView,
  //...TSMODocs
]


const TSMONewConfig = {
	title: "TSMO",
	Routes: Routes2
}

export default TSMONewConfig
