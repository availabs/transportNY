import MapPage from "~/pages/DataManager/DataTypes/gis_dataset/pages/Map";
import Table from "./table";

const NpmrdsMetaConfig = {
  table: {
    name: "Table",
    path: "/table",
    component: Table,
  },
  map: {
    name: "Map",
    path: "/map",
    component: MapPage,
  }
};

export default NpmrdsMetaConfig;
