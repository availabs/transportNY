import React from "react";

export const RerouterPlugin = {
  id: "rerouter",
  type: "plugin",
  mapRegister: (map, state, setState) => {
  },
  dataUpdate: (map, state, setState) => {
  },
  internalPanel: ({ state, setState }) => {
    return [];
  },
  externalPanel: ({ state, setState }) => {
    return [];
  },
  cleanup: (map, state, setState) => {
  },
  comp: ({ map }) => {
    return null;
  },
}