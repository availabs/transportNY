import Overview from "./Overview";
import Metadata from "./Metadata";
import GisDataset from "../gis_dataset/tasks/main";

const Pages = {
  overview: {
    name: "Overview",
    path: "",
    component: Overview,
  },
  meta: {
    name: "Metadata",
    path: "/meta",
    component: Metadata,
  },
  update: {
    name: "Update",
    path: "/update",
    component: GisDataset,
  },
};

export default Pages;
