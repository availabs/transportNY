
import Auth from "pages/Auth"
import NoMatch from "pages/404"
import DataManager from "pages/DataManager"
import Documentation from "pages/Documentation"

const Routes = [
  Auth,
  ...DataManager,
  ...Documentation,
  NoMatch
]

export default Routes
