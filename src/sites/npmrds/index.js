import Home from "sites/npmrds/pages/Home"

import Folders from "./pages/Folders"

import Analysis from "./pages/analysis"

import NewHome from "./pages/NewHome"

import RouteCreation from "./pages/route_creation"

import Map from "./pages/Map"

import TmcPage from "./pages/TmcPage"

const Routes = [
  Home,
  NewHome,
  ...RouteCreation,
  ...Folders,
  ...Analysis,
  TmcPage,
  Map
]

const site =  {
	title: "NPMRDS",
	Routes
}

export default site
