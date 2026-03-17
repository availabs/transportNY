import CreatePage from "./create";
import MapPage from "~/pages/DataManager/DataTypes/gis_dataset/pages/Map";
// import AnalysisPage from "./analysis";
import TablePage from '~/pages/DataManager/DataTypes/gis_dataset/pages/Table';

const Pm3AggregateConfig = {
  sourceCreate: {
    name: "Create",
    component: CreatePage,
  },
  table: {
    name:"Table",
    component: TablePage,
    path:"/table"
  },
  map: {
    name: "Map",
    path: "/map",
    component: MapPage,
  }
};

export default Pm3AggregateConfig;