
import Auth from "~/pages/Auth"
import NoMatch from "~/pages/404"
import DataManager from "~/pages/DataManager"
import Documentation from "~/pages/Documentation"

import { useFalcor } from "~/modules/avl-components/src"
import { useAuth } from "@availabs/ams"

const DAMA_ARGS = {
  baseUrl: '/datasources',
  defaultPgEnv: 'npmrds',
  useFalcor,
  useAuth
}

const Routes = [
  Auth,
  ...DataManager(DAMA_ARGS),
  ...Documentation,
  NoMatch
]

export default Routes
