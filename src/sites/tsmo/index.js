import Incidents from "sites/tsmo/pages/Dashboards/Incidents"
import Workzones from "sites/tsmo/pages/Dashboards/Workzones"
import Congestion from "sites/tsmo/pages/Dashboards/Congestion"

const Routes = [
  ...Incidents,
  Workzones,
  Congestion,
]

export default {
	title: "TSMO",
	Routes
}