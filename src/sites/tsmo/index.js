import Incidents from "sites/tsmo/pages/Dashboards/Incidents"
import Workzones from "sites/tsmo/pages/Dashboards/Workzones"
import Congestion from "sites/tsmo/pages/Dashboards/Congestion"

import IncidentView from "./pages/IncidentView"

import Home from './pages/Home'

const Routes = [
  Home,
  ...Incidents,
  Workzones,
  Congestion,
  IncidentView
]

export default {
	title: "TSMO",
	Routes
}
