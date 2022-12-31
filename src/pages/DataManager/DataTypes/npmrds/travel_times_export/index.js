import React from "react";

import main from "./tasks/main";

const Table = (/*{ source }*/) => {
  return <div> Table View </div>;
};

const config = {
  table: {
    name: "Table",
    path: "/table",
    component: Table,
  },
  // This key is used to filter in src/pages/DataManager/Source/create.js
  request: {
    name: "Request",
    path: "/request",
    component: main,
  },
};

export default config;
