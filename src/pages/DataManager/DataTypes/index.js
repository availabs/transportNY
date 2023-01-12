import Pages from "./default";
import freight_atlas_shapefile from "./freight_atlas_shapefile";
import npmrdsTravelTime from "./npmrdsTravelTime";
import gis_dataset from "./gis_dataset";
import npmrds_travel_times_export from "./npmrds/travel_times_export";
import npmrds_travel_times_csv from "./npmrds/travel_times_csv";

const DataTypes = {
  freight_atlas_shapefile,
  npmrdsTravelTime,
  gis_dataset,
  npmrds_travel_times_export,
  npmrds_travel_times_csv,
};

export { DataTypes, Pages };
