import React from "react"
import {get, set} from "lodash-es";
// import { filters, updateSubMeasures, getMeasure } from "./updateFilters"
import { InternalPanel } from "./internalPanel"
// import { ExternalPanel } from "./externalPanel"
// import { DataUpdate } from "./dataUpdate"
// import { Comp } from "./comp";

const MAP_CLICK = () => console.log("map was clicked");
export const RoutecreationPlugin = {
    id: "routecreation",
    type: "plugin",
    mapRegister: (map, state, setState) => {
      map.on("click", MAP_CLICK);
      let pluginDataPath = '';

      //state.symbologies indicates that the map context is DMS
      if(state.symbologies) {
        const symbName = Object.keys(state.symbologies)[0];
        const pathBase = `symbologies['${symbName}']`
        pluginDataPath = `${pathBase}.symbology.pluginData.routecreation`
      } else {
        pluginDataPath = `symbology.pluginData.routecreation`;
      }

      //const newFilters = updateSubMeasures(filters);

      ///const pathBase = MapContext ? `symbologies['${symbName}']` : ``
      setState(draft => {
        //set(draft, `${pathBase}.${layerPaintPath}`, npmrdsPaint); //Mapbox paint
      })
    },
    //dataUpdate: DataUpdate,
    internalPanel: InternalPanel,
    externalPanel: () => {},
    comp: () => {},
    cleanup: (map, state, setState) => {
      map.off("click", MAP_CLICK);
    },
  }
