import CreatePage from "./create";
import OverViewPage from "./overview";

const NpmrdsRawConfig = {
  sourceCreate: {
    name: "Create",
    component: CreatePage,
  },
  add_version: {
    name: "Add Version",
    path: "/add_version",
    component: CreatePage,
  },
  view: {
    name: "View",
    path: "/view",
    component: OverViewPage,
  }
};

export default NpmrdsRawConfig;