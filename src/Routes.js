import Incidents from "pages/Dashboards/Incidents"
import Workzones from "pages/Dashboards/Workzones"
import Congestion from "pages/Dashboards/Congestion"
import Auth from "pages/Auth"
import NoMatch from "pages/404"

const Routes = [
  ...Incidents,
  Workzones,
  Congestion,
  Auth,
  NoMatch
]

export default Routes
