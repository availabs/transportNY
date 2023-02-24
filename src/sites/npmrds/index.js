import Home from "sites/npmrds/pages/Home"

import Folders from "./pages/Folders"

import Analysis from "./pages/analysis"

import NewHome from "./pages/NewHome"

const Routes = [
  Home,
  NewHome,
  ...Folders,
  ...Analysis
]

const site =  {
	title: "NPMRDS",
	Routes
}

export default site
