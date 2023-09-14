import DataManager from "~/pages/DataManager"

<<<<<<< HEAD
import MapPageConfig from "./MapPage"

=======
>>>>>>> a50e5aa66e94187c557f563da708d719cf3bc19b
import { useFalcor } from "~/modules/avl-components/src"
import { useAuth } from "@availabs/ams"

const DAMA_ARGS = {
<<<<<<< HEAD
  baseUrl: "",
  defaultPgEnv: "freight_data",
  auth: true,
=======
  baseUrl: '',
  defaultPgEnv: 'freight_data',
>>>>>>> a50e5aa66e94187c557f563da708d719cf3bc19b
  useFalcor,
  useAuth
}

<<<<<<< HEAD
const Routes = [
  ...DataManager(DAMA_ARGS),
  MapPageConfig
=======

const Routes = [
  ...DataManager(DAMA_ARGS)
>>>>>>> a50e5aa66e94187c557f563da708d719cf3bc19b
]

const site = {
	title: "TransportNY",
	Routes
}

export default site
