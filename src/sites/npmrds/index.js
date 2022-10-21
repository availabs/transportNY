import Home from "sites/npmrds/pages/Home"

import Folders from "./pages/Folders"

const Routes = [
  Home,
  ...Folders
]

const site =  {
	title: "NPMRDS",
	Routes
}

export default site
