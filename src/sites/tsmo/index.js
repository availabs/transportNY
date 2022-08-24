import Incidents from "sites/tsmo/pages/Dashboards/Incidents"
import Workzones from "sites/tsmo/pages/Dashboards/Workzones"
import Congestion from "sites/tsmo/pages/Dashboards/Congestion"

import IncidentView from "./pages/IncidentView"
import CorridorView from "./pages/CorridorView"

import Home from './pages/Home'

const Routes = [
  Home,
  ...Incidents,
  Workzones,
  Congestion,
  IncidentView,
  ...CorridorView
]


const TSMOconfig = {
	title: "TSMO",
	Routes
}

export default TSMOconfig