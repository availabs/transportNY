import Home from "sites/npmrds/pages/Home"

import Folders from "./pages/Folders"

import Analysis from "./pages/analysis"

const Routes = [
  Home,
  ...Folders,
  ...Analysis
]

const site =  {
	title: "NPMRDS",
	Routes
}

export default site
