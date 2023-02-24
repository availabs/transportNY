import React from "react";

import DamaViewsTable from "pages/DataManager/components/DamaViewsTable";

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
    path: "/dama-views-table",
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
