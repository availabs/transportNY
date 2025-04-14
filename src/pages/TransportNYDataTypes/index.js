
// ---------------------------
// ---- Basic Types
// ---------------------------
import freight_atlas_shapefile from "./freight_atlas_shapefile";
import npmrds_raw from "./npmrds_raw";
import npmrds from "./npmrds";
import npmrds_meta from "./npmrds_meta";
import freight_bottlenecks from "./freight_bottlenecks";
import excessive_delay from "./excessive_delay";
import transcom_congestion from "./transcom_congestion";
import production_transfer from "./production_transfer";

import osm_upload from "./osm"

const transportNYDataTypes = {
  // freight_atlas_shapefile
  npmrds_raw,
  npmrds,
  npmrds_meta,
  freight_bottlenecks,
  excessive_delay,
  transcom_congestion,
  production_transfer,

  osm_upload
}


export default transportNYDataTypes
