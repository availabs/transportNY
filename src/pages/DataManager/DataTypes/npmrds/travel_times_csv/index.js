import React from "react";

import DamaViewsTable from "./components/DamaViewsTable";

const Table = (/*{ source }*/) => {
  return <div> Table View Foo </div>;
};

const pages = [
  {
    name: "Table",
    path: "/table",
    component: Table,
  },
  {
    name: "Dama Views Table",
    path: "/foo",
    component: DamaViewsTable,
  },
];

const config = pages.reduce((acc, page) => {
  const { path } = page;
  const key = path.replace(/^\//, "");

  acc[key] = page;
  return acc;
}, {});

export default config;
