// import FreightMap from "./pages/FreightMap"
// import FreightAtlas from "./pages/Atlas"
// import CollectionAtlas from "./pages/CollectionAtlas"
import FreightAtlasCMS from "./pages/freightAtlasCMS.jsx"
 
const Routes = [
  ...FreightAtlasCMS,
  // ...FreightMap,
  // ...FreightAtlas,
  // ...CollectionAtlas
]

const SiteConfig = {
	title: "Freight Atlas",
	Routes
}

export default SiteConfig