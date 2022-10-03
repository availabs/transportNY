import Home from "sites/npmrds/pages/Home"

import MyStuff from "./pages/MyStuff"

const Routes = [
  Home,
  ...MyStuff
]

const site =  {
	title: "NPMRDS",
	Routes
}

export default site
