import CreatePage from "./create";
import AnalysisPage from "./analysis";
import TablePage from '~/pages/DataManager/DataTypes/gis_dataset/pages/Table';

const Map21Config = {
  sourceCreate: {
    name: "Create",
    component: CreatePage,
  },
  table: {
    name:"Table",
    component: TablePage,
    path:"/table"
  },
  analysis: {
    name:"Analysis",
    component: AnalysisPage,
    path:"/analysis"
  }
};

export default Map21Config;