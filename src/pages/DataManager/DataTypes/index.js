import Pages from "./default";
import freight_atlas_shapefile from "./freight_atlas_shapefile";
import npmrdsTravelTime from "./npmrdsTravelTime";
import gis_dataset from "./gis_dataset";
import npmrds_travel_times_export from "./npmrds/travel_times_export";
import npmrds_travel_times_csv from "./npmrds/travel_times_csv";
import npmrds_tmc_identification_csv from "./npmrds/tmc_identification_csv";
import npmrds_travel_times_export_sqlite from "./npmrds/travel_times_export_sqlite";
import npmrds_data_source_travel_times_export from "./npmrds/data_source_travel_times_export";

const DataTypes = {
  freight_atlas_shapefile,
  npmrdsTravelTime,
  gis_dataset,
  npmrds_travel_times_export,
  npmrds_travel_times_csv,
  npmrds_tmc_identification_csv,
  npmrds_travel_times_export_sqlite,
  npmrds_data_source_travel_times_export,
};

export { DataTypes, Pages };
