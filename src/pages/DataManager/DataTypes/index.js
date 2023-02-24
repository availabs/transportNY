import Pages from "./default";
import freight_atlas_shapefile from "./freight_atlas_shapefile";
import npmrdsTravelTime from "./npmrdsTravelTime";
import gis_dataset from "./gis_dataset";
import npmrds from "./npmrds";
import npmrds_travel_times_export_ritis from "./npmrds/npmrds_travel_times_export_ritis";
import npmrds_travel_times_csv from "./npmrds/npmrds_travel_times_csv";
import npmrds_tmc_identification_csv from "./npmrds/npmrds_tmc_identification_csv";
import npmrds_travel_times_export_sqlite from "./npmrds/npmrds_travel_times_export_sqlite";
import npmrds_travel_times_imp from "./npmrds/npmrds_travel_times_imp";

const DataTypes = {
  freight_atlas_shapefile,
  npmrdsTravelTime,
  gis_dataset,
  npmrds,
  npmrds_travel_times_export_ritis,
  npmrds_travel_times_csv,
  npmrds_tmc_identification_csv,
  npmrds_travel_times_export_sqlite,
  npmrds_travel_times_imp,
};

export { DataTypes, Pages };
