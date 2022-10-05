
import Auth from "pages/Auth"
import NoMatch from "pages/404"
import DataManager from "pages/DataManager"
// import DataManagerAdmin from "pages/DataManager/admin"
import Documentation from "pages/Documentation"

const Routes = [
  Auth,
  ...DataManager,
  //...DataManagerAdmin,
  ...Documentation,
  NoMatch
]

export default Routes
