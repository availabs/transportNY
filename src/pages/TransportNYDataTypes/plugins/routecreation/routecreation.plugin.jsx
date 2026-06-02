import React from "react"
import {get, set} from "lodash-es";
// import { filters, updateSubMeasures, getMeasure } from "./updateFilters"
import { InternalPanel } from "./internalPanel"
// import { ExternalPanel } from "./externalPanel"
import { DataUpdate } from "./dataUpdate"
import { Comp } from "./comp";
import {
  SHAPEFILE_LAYER_KEY,
  BLANK_OPTION
} from "./constants";
import { npmrdsPaint } from "./paint";
export const RoutecreationPlugin = {
    id: "routecreation",
    type: "plugin",
    mapRegister: (map, state, setState) => {
      let pluginDataPath = '';
      let symbologyLayerPath = "";
      let symbPath = "";
      //state.symbologies indicates that the map context is DMS
      if (state.symbologies) {
        const symbName = Object.keys(state.symbologies)[0];
        const pathBase = `symbologies['${symbName}']`;
        pluginDataPath = `${pathBase}.symbology.pluginData.routecreation`;
        symbologyLayerPath = `${pathBase}.symbology.layers`;
        symbPath = `${pathBase}.symbology`;
      } else {
        pluginDataPath = `symbology.pluginData.routecreation`;
        symbologyLayerPath = `symbology.layers`;
        symbPath = `symbology`;
      }

      const shapefileLayerId = get(
        state,
        `${pluginDataPath}['active-layers'][${SHAPEFILE_LAYER_KEY}]`
      )



      //const newFilters = updateSubMeasures(filters);

      ///const pathBase = MapContext ? `symbologies['${symbName}']` : ``
      if(shapefileLayerId) {
        setState((draft) => {
          set(
            draft,
            `${symbologyLayerPath}['${shapefileLayerId}']['layers'][1]['paint']`,
            { ...npmrdsPaint }
          ); //Mapbox paint
        });
      }
    },
    dataUpdate: DataUpdate,
    internalPanel: InternalPanel,
    externalPanel: () => {},
    comp: Comp,
    cleanup: (map, state, setState) => {
      //map.off("click", MAP_CLICK);
    },
  }
