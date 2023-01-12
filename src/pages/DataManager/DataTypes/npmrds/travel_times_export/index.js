import React from "react";

import main from "./tasks/main";

const Table = (/*{ source }*/) => {
  return <div> Table View </div>;
};

const pages = [
  {
    name: "Table",
    path: "/table",
    component: Table,
  },
  {
    name: "Request",
    path: "/request",
    component: main,
  },
];

const config = pages.reduce((acc, page) => {
  const { path } = page;
  const key = path.replace(/^\//, "");

  acc[key] = page;
  return acc;
}, {});

export default config;
