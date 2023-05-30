import DataManager from "~/pages/DataManager"

const Routes = [
  ...DataManager('', 'freight_data', true)
]

const site = {
	title: "TransportNY",
	Routes
}

export default site