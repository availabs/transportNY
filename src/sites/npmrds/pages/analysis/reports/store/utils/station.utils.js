import get from "lodash.get"

// import DateObject from "components/tmc_graphs/utils/DateObject"
import DateObject from "sites/npmrds/pages/analysis/components/tmc_graphs/utils/DateObject"

import {
  getRoutePeaks
} from "./general.utils"

// import { getColorRange } from "constants/color-ranges"
import { getColorRange } from "modules/avl-components/src"
const COLORS = getColorRange(9, "Set1");

let STATION_COLORS = [...COLORS].reverse();
const getStationColor = () => {
  if (!STATION_COLORS.length) {
    STATION_COLORS = [...COLORS].reverse();
  }
  return STATION_COLORS.pop();
}

let STATION_ID = -1;
const makeNewStationCompId = () => `station-comp-${ ++STATION_ID }`;

export const _addStationComp = (state, stationId, res) => {

  const { amPeakStart, pmPeakEnd } = getRoutePeaks();

  const yearsWithData = [2015];

  const settings = {
    startDate: `${ yearsWithData[yearsWithData.length - 1] }-01-01`,
    endDate: `${ yearsWithData[yearsWithData.length - 1] }-12-31`,

    startTime: DateObject.epochToTimeString(amPeakStart),
    endTime: DateObject.epochToTimeString(pmPeakEnd),

    resolution: 'hour',

    weekdays: ["2", "3", "4", "5", "6"],

    amPeak: true,
    offPeak: true,
    pmPeak: true,

    compTitle: ""
  }

  const stationData = get(res, ["json", "hds", "continuous", "stations", "byId", stationId]);

  const newStationComp = {
    compId: makeNewStationCompId(),
    stationId,
    color: getStationColor(),
    name: `${ stationData.stationId } (${ stationData.muni }) (${ stationData.data_type.split(",").map(s => s[0]).join(", ") })`,
    data: {},
    workingSettings: JSON.parse(JSON.stringify(settings)),
    settings
  };

  return {
    station_comps: [...state.report.station_comps, newStationComp]
  };
}

export const _removeStationComp = (reportState, compId) => {

  const { color } = reportState.station_comps.find(sc => sc.compId === compId);
  if (!STATION_COLORS.includes(color) && COLORS.includes(color)) {
    STATION_COLORS.push(color);
  }

  const station_comps = reportState.station_comps.filter(rc => rc.compId !== compId);

    // graphs = state.graphs.map(g => {
    //   const { state } = g;
    //   if (get(state, 'activeRouteComponents.length', 0)) {
    //     state.activeRouteComponents = state.activeRouteComponents.filter(arc => !arc.includes(compId));
    //     if (state.activeRouteComponents.length === 0) {
    //       delete state.activeRouteComponents;
    //     }
    //   }
    //   return {
    //     ...g,
    //     state
    //   }
    // });

  return { station_comps }
}

export const _updateStationSettings = (reportState, compId, update) => {
  const station_comps = reportState.station_comps.map(comp => {
    if (comp.compId === compId) {
      return {
        ...comp,
        workingSettings: { ...comp.workingSettings, ...update }
      }
    }
    return comp;
  })
  return { station_comps };
}

export const _updateStation = (reportState, compId, color) => {
  const station_comps = reportState.station_comps.map(comp => {
    if (comp.compId === compId) {
      return {
        ...comp,
        color,
        settings: JSON.parse(JSON.stringify(comp.workingSettings)),
        data: {}
      }
    }
    return comp;
  })
  return { station_comps };
}

export const loadStationCompsFromReport = (report, falcorCache) => {

  STATION_COLORS = [...COLORS].reverse();
  STATION_ID = -1;
  const regex = /^station-comp-(\d+)$/,
    colors = [];
  (get(report, "station_comps") || []).forEach(comp => {
    const [, id] = regex.exec(comp.compId);
    STATION_ID = Math.max(STATION_ID, +id);
    colors.push(comp.color);
  })
  STATION_COLORS = STATION_COLORS.filter(c => !colors.includes(c));

  return (get(report, "station_comps") || [])
    .map(comp => {
      const stationData = get(falcorCache, ["hds", "continuous", "stations", "byId", comp.stationId]);
      return {
        compId: comp.compId,
        stationId: comp.stationId,
        color: comp.color,
        name: `${ stationData.stationId } (${ stationData.muni }) (${ stationData.data_type.split(",").map(s => s[0]).join(", ") })`,
        data: {},
        workingSettings: JSON.parse(JSON.stringify(comp.settings)),
        settings: JSON.parse(JSON.stringify(comp.settings))
      }
    })
}

export const loadStationCompsFromTemplate = (station_comps, falcorCache, stationIds) => {

  STATION_COLORS = [...COLORS].reverse();
  STATION_ID = -1;
  const regex = /^station-comp-(\d+)$/,
    colors = [];
  station_comps.forEach(comp => {
    const [, id] = regex.exec(comp.compId);
    STATION_ID = Math.max(STATION_ID, +id);
    colors.push(comp.color);
  })
  STATION_COLORS = STATION_COLORS.filter(c => !colors.includes(c));

  const variables = station_comps.reduce((a, { stationId }) =>
      !a.includes(stationId) ? [...a, stationId] : a
    , []),
    idMap = {};
  variables.forEach((v, i) => {
    idMap[v] = stationIds[i];
  });

  return station_comps.map(sc => {
    const comp = {
      ...sc,
      stationId: idMap[sc.stationId],
      data: {},
      settings: JSON.parse(JSON.stringify(sc.settings))
    };
    const stationData = get(falcorCache, ["hds", "continuous", "stations", "byId", comp.stationId]);
    comp.name = `${ stationData.stationId } (${ stationData.muni }) ` +
      `(${ stationData.data_type.split(",").map(s => s[0]).join(", ") })`;
    return comp;
  })
}
