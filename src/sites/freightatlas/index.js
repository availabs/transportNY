import FreightMap from "~/sites/freightatlas/pages/FreightMap"
import FreightAtlas from "~/sites/freightatlas/pages/Atlas"


const Routes = [
  ...FreightMap,
  ...FreightAtlas
]

const SiteConfig = {
	title: "Freight Atlas",
	Routes
}

export default SiteConfig