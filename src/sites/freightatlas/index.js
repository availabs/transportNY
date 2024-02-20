import FreightMap from "~/sites/freightatlas/pages/FreightMap"
import FreightAtlas from "~/sites/freightatlas/pages/Atlas"
import CollectionAtlas from "~/sites/freightatlas/pages/CollectionAtlas"


const Routes = [
  ...FreightMap,
  ...FreightAtlas,
  ...CollectionAtlas
]

const SiteConfig = {
	title: "Freight Atlas",
	Routes
}

export default SiteConfig