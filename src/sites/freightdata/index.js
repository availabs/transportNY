import DataManager from "~/pages/DataManager"

const Routes = [
  ...DataManager('', 'freight_data')
]

const site = {
	title: "TransportNY",
	Routes
}

export default site