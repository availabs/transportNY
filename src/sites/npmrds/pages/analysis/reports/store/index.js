import { falcorGraph } from "store/falcorGraph"
// import { update } from "utils/redux-falcor/components/duck"
// import { updateFalcor as update } from "store/falcorGraph"

import deepequal from "deep-equal"
import get from "lodash.get"
import moment from "moment"

import { range } from "d3-array";

// import { UPDATE as updateFalcor } from "utils/redux-falcor"

// import DateObject from "components/tmc_graphs/utils/DateObject"
import DateObject from "sites/npmrds/pages/analysis/components/tmc_graphs/utils/DateObject"

import {
  _addStationComp,
  _removeStationComp,
  _updateStationSettings,
  _updateStation,
  loadStationCompsFromReport,
  loadStationCompsFromTemplate,
  _reorderStationComps
} from "./utils/station.utils"

// import { getColorRange } from "constants/color-ranges"
import { getColorRange } from "modules/avl-components/src"
const COLORS = getColorRange(9, "Set1");//COLOR_RANGES[12][1].colors.slice();
// const COLORS = ['#FF6900', '#FCB900', '#7BDCB5', '#00D084', '#8ED1FC', '#0693E3', '#ABB8C3', '#EB144C', '#F78DA7', '#9900EF']

const DEFAULT_COLOR_RANGE = getColorRange(5, "RdYlGn");//COLOR_RANGES[5].reduce((a, c) => c.name === "RdYlGn" ? c.colors : a)

let AVAILABLE_COLORS = [...COLORS];

const getRouteColor = () => {
  if (!AVAILABLE_COLORS.length) {
    AVAILABLE_COLORS = [...COLORS];
  }
  return AVAILABLE_COLORS.pop();
}

let STATION_COLORS = [...COLORS].reverse();
const getStationColor = () => {
  if (!STATION_COLORS.length) {
    STATION_COLORS = [...COLORS].reverse();
  }
  return STATION_COLORS.pop();
}

const DATE_EXTENT = [
  "2015-01-01",
  "2019-05-31"
]
const YEARS_WITH_DATA = [
  2015,
  2016,
  2017,
  2018
]

const UPDATE_STATE = "UPDATE_STATE";
const RESET_STATE = "RESET_STATE";

export const LOCAL_STORAGE_REPORT_KEY = "UNSAVED_NPMRDS_REPORT"

let ROUTE_COMP_ID = -1;
const getUniqueRouteCompId = () =>
  `comp-${ ++ROUTE_COMP_ID }`

let GRAPH_COMP_ID = -1
const getUniqueGraphCompId = () =>
  `graph-comp-${ ++GRAPH_COMP_ID }`

const getAllYears = dateExtent =>
  range(
    +dateExtent[0].slice(0, 4),
    +dateExtent[1].slice(0, 4) + 1
  )

export const getDataDateExtent = () =>
	dispatch =>
		falcorGraph.get(["npmrdsDataDateExtent"])
			.then(res => {
				const dateExtent = get(res, 'json.npmrdsDataDateExtent', DATE_EXTENT)
								.map(d => d.slice(0, 10)),

					minYear = +dateExtent[0].slice(0, 4,),
					minMonth = +dateExtent[0].slice(5, 7),
					minDate = +dateExtent[0].slice(8),

					maxYear = +dateExtent[1].slice(0, 4),
					maxMonth = +dateExtent[1].slice(5, 7),
					maxDate = +dateExtent[1].slice(8),

					yearsWithData = range(
						(minMonth == 1) && (minDate == 1) ? minYear : minYear + 1,
						(maxMonth == 12) && (maxDate == 31) ? maxYear + 1 : maxYear
					);

				dispatch({
					type: UPDATE_STATE,
					state: {
						dateExtent,
						yearsWithData,
            allYearsWithData: getAllYears(dateExtent)
					}
				})
			})

const getRouteData = (routeIds, report) =>
	falcorGraph.get(["routes2", "id", routeIds, ["tmc_array", "name"]])
    // .then(() => falcorGraph.get(
    //   ["routes", "byId", routeIds,
    //     report.allYearsWithData,
    //     "tmcArray"
    //   ])
    // )

const getStationData = stationIds =>
  falcorGraph.get(
    ["hds", "continuous", "stations", "byId",
      stationIds, ["stationId", "muni", "data_type"]
    ]
  )

const getTemplateData = templateId =>
  falcorGraph.get(
    ["templates2", "id", templateId,
      ['name',
      	'description',
      	'route_comps',
      	'graph_comps',
        'stations',
        'station_comps',
        'color_range',
        'created_by',
        'folder',
        'default_type'
      ]
    ]
  )
const getTemplateIdByType = defaultType =>
	falcorGraph.get(
		['templates2', 'type', defaultType, 'id']
	).then(res => {
    return get(res, ["json", "templates2", "type", defaultType, "id"])
  })

const getReportData = reportId =>
	falcorGraph.get(
		['reports2', 'id', reportId,
			['id',
				'name',
				'description',
				'route_comps',
				'graph_comps',
        'station_comps',
        'color_range',
        'created_by',
        'folder'
			]
		]
	)

const redirect = url =>
	dispatch =>
		Promise.resolve(
			dispatch({
				type: UPDATE_STATE,
				state: { redirect: url }
			})
		)

export const loadRoutesAndTemplate = (routeIds, templateId, stationIds = []) =>
	(dispatch, getState) =>
    Promise.resolve()
      .then(() => stationIds.length && getStationData(stationIds))
		  .then(() => routeIds.length && getRouteData(routeIds, getState().report))
			.then(() => getTemplateData(templateId))
			.then(() =>
				dispatch({
					type: UPDATE_STATE,
					state: _loadTemplate(templateId, routeIds, getState().report, stationIds)
				})
			)
export const loadRoutesAndTemplateByType = (routeIds, defaultType, stationIds = []) =>
	(dispatch, getState) =>
    Promise.resolve()
      .then(() => stationIds.length && getStationData(stationIds))
		  .then(() => routeIds.length && getRouteData(routeIds, getState().report))
			.then(() => getTemplateIdByType(defaultType))
			.then(templateId => {
        return getTemplateData(templateId)
    			.then(() =>
    				dispatch({
    					type: UPDATE_STATE,
    					state: _loadTemplate(templateId, routeIds, getState().report, stationIds)
    				})
    			)
      })
export const loadTemplate = templateId =>
	(dispatch, getState) =>
		getTemplateData(templateId)
			.then(() => {
				const state = getState().report,
					routeIds = state.route_comps.reduce((a, c) => a.includes(c.routeId) ? a : [...a, c.routeId], []),
  				stationIds = state.station_comps.reduce((a, c) => a.includes(c.stationId) ? a : [...a, c.stationId], []);
				return dispatch({
					type: UPDATE_STATE,
					state: _loadTemplate(templateId, routeIds, state, stationIds)
				})
			})
export const saveTemplate = (template, templateId = null) =>
	(dispatch, getState) => {
		const state = getState().report,
			yearsWithData = state.yearsWithData,
			mostRecent = Math.max(...yearsWithData);

    const {
      name,
      description,
      folder,
      defaultType,
      saveYearsAsRecent,
      colorRange
    } = template;

    const setRecentYear = (year, mostRecent) => {
    	const diff = mostRecent - year;
    	return `{recent-${ diff }}`;
    }
    const setRecentDate = (date, mostRecent) => {
    	const asString = date.toString(),
    		year = +asString.slice(0, 4),
    		rest = asString.slice(4),
    		diff = mostRecent - year;
    	return `{recent-${ diff }}${ rest }`;
    }
    const setRecentText = (name, mostRecent, yearsWithData) => {
    	yearsWithData.forEach(year => {
    		const regex = new RegExp(`${ year }`, 'g');
    		if (regex.test(name)) {
    			const diff = mostRecent - year,
    				replacement = `{recent-${ diff }}`;
    			name = name.replace(regex, replacement);
    		}
    	})
    	return name;
    }

    const routeIds = template.route_comps
      .reduce((a, c) => a.includes(c.routeId) ? a : [...a, c.routeId], []),
      idMap = {};
    routeIds.forEach((id, i) => {
      idMap[id] = `$${ i }`;
    })
    const route_comps = template.route_comps.map(rc => ({
      routeId: idMap[rc.routeId],
      compId: rc.compId,
      color: rc.color,
      settings: {
      	...rc.settings,
      	year: rc.settings.year === "advanced" ? "advanced" : saveYearsAsRecent ? setRecentYear(rc.settings.year, mostRecent) : rc.settings.year,
      	startDate: saveYearsAsRecent ? setRecentDate(rc.settings.startDate, mostRecent) : rc.settings.startDate,
      	endDate: saveYearsAsRecent ? setRecentDate(rc.settings.endDate, mostRecent) : rc.settings.endDate,
      	compTitle: saveYearsAsRecent ? setRecentText(rc.settings.compTitle, mostRecent, yearsWithData) : rc.settings.compTitle,
        overrides: {}
      }
    }))
    const graph_comps = template.graph_comps.map(gc => ({
      type: gc.type,
      layout: {
        x: gc.layout.x,
        y: gc.layout.y,
        w: gc.layout.w,
        h: gc.layout.h
      },
      state: {
        ...gc.state
      }
    }))
    const stationIds = template.station_comps
      .reduce((a, c) => a.includes(c.stationId) ? a : [...a, c.stationId], []),
      stationIdMap = {};
    stationIds.forEach((id, i) => stationIdMap[id] = `$${ i }`);
    const station_comps = template.station_comps.map(sc => ({
      stationId: stationIdMap[sc.stationId],
      compId: sc.compId,
      color: sc.color,
      settings: {
      	...sc.settings,
      	startDate: saveYearsAsRecent ? setRecentDate(sc.settings.startDate, mostRecent) : sc.settings.startDate,
      	endDate: saveYearsAsRecent ? setRecentDate(sc.settings.endDate, mostRecent) : sc.settings.endDate,
      	compTitle: saveYearsAsRecent ? setRecentText(sc.settings.compTitle, mostRecent, yearsWithData) : sc.settings.compTitle
      }
    }))


    const data = {
    	templateId,
      name: saveYearsAsRecent ? setRecentText(name, mostRecent, yearsWithData) : name,
      description: saveYearsAsRecent ? setRecentText(description, mostRecent, yearsWithData) : description,
      folder,
      routes: routeIds.length,
      route_comps,
      graph_comps,
      station_comps,
      stations: stationIds.length,
      defaultType,
      colorRange
    }

// console.log("SAVING TEMPLATE:",data)

		return falcorGraph.call(
			["templates2", "save"],
			[data], [], []
		)
		// .then(() => dispatch(update(falcorGraph.getCache())));
	}

export const addRouteComp = (routeId, needsSnapShot = false) =>
	(dispatch, getState) =>
		getRouteData(routeId, getState().report)
			.then(() =>
				dispatch({
					type: UPDATE_STATE,
					state: _addRouteComp(getState().report, routeId)
				})
			)
			.then(() => needsSnapShot && dispatch(takeSnapShot()))
export const removeRouteComp = (compId, needsSnapShot = false) =>
	(dispatch, getState) =>
		Promise.resolve(
			dispatch({
				type: UPDATE_STATE,
				state: {
					..._removeRouteComp(getState().report, compId)
				}
			})
		)
		.then(() => needsSnapShot && dispatch(takeSnapShot()))
export const updateRouteCompSettings = (compId, settings) =>
	(dispatch, getState) => {
		const state = getState().report,
			routeComponentSettings = new Map(state.routeComponentSettings),
			current = routeComponentSettings.get(compId);
		routeComponentSettings.set(compId, { ...current, ...settings });
		return Promise.resolve(
			dispatch({
				type: UPDATE_STATE,
				state: {
					routeComponentSettings
				}
			})
		)
	}
export const updateRouteComp = (compId, update, reloadData=true) =>
	(dispatch, getState) =>
		new Promise((resolve, reject) => {
			const state = getState().report;
	    let settings = {};

	    const route_comps = state.route_comps.map(rc => {
	      if (rc.compId === compId) {
	        settings = { ...rc.settings, ...update };
	        const name = get(getState(), `graph.routes.byId.${ rc.routeId }.name`, 'unknown');
	        return {
	          ...rc,
	          settings,
	          name: getRouteCompName(name, settings)
	        }
	      }
	      return rc;
	    })

	    const routeDataMap = state.routes.reduce((a, c) => ({ ...a, [c.compId]: c.data }), {});
	    if (reloadData) {
	    	delete routeDataMap[compId];
	    }
		  const routes = route_comps.reduce((a, c) =>
		  	[...a, ...getRoutesForRouteComp(c, routeDataMap, true)]
		  , [])

	    resolve(
	    	dispatch({
	    		type: UPDATE_STATE,
	    		state: {
	    			route_comps,
	    			routes
	    		}
	    	})
	    )
		})
    .then(() => dispatch(takeSnapShot()))
export const updateAllRouteComps = () =>
	(dispatch, getState) =>
		new Promise((resolve, reject) => {
		  const state = getState().report;

		  const route_comps = state.route_comps.map(rc => ({
		    ...rc,
		    settings: { ...state.routeComponentSettings.get(rc.compId) }
		  }))

	    // const routeDataMap = state.routes.reduce((a, c) => ({ ...a, [c.compId]: c.data }), {});
		  const routes = route_comps.reduce((a, c) =>
		  	[...a, ...getRoutesForRouteComp(c, null, true)]
		  , [])

		  resolve(
		  	dispatch({
			  	type: UPDATE_STATE,
			  	state: {
			  		route_comps,
			  		routes
			  	}
			  })
			)
		})
export const updateAllStationComps = () =>
  (dispatch, getState) =>
    new Promise((resolve, reject) => {
      const state = getState().report;

      resolve(
        dispatch({
          type: UPDATE_STATE,
          state: {
            station_comps: state.station_comps.map(sc =>
              ({ ...sc, settings: JSON.parse(JSON.stringify(sc.workingSettings)) })
            )
          }
        })
      )
    })
export const updateAllComponents = () =>
  (dispatch, getState) =>
    dispatch(updateAllRouteComps())
      .then(() => dispatch(updateAllStationComps()))
  		.then(() => dispatch(takeSnapShot()))
export const updateRouteCompColor = (compId, color) =>
	(dispatch, getState) =>
		new Promise((resolve, reject) => {
			const state = getState().report;

			const route_comps = state.route_comps.map(rc => {
				if (rc.compId === compId) {
					if (!AVAILABLE_COLORS.includes(rc.color) && COLORS.includes(rc.color)) {
						AVAILABLE_COLORS.push(rc.color);
					}
					return {
						...rc,
						color
					}
				}
				return rc;
			})

			const routes = state.routes.map(r => {
				if (r.compId === compId) {
					return {
						...r,
						color
					}
				}
				return r;
			})

			resolve(
				dispatch({
					type: UPDATE_STATE,
					state: {
						route_comps,
						routes
					}
				})
			)
		})
		.then(() => dispatch(takeSnapShot()))
export const reorderRouteComps = (srcIndex, dstIndex) =>
	(dispatch, getState) =>
		new Promise((resolve, reject) => {
		  const state = getState().report,

		  	routeDataMap = {};

		  state.routes.forEach(r => {
		    routeDataMap[r.compId] = r.data;
		  })

		  const route_comps = [...state.route_comps],
		  	src = route_comps.splice(srcIndex, 1);
		  route_comps.splice(dstIndex, 0, src[0]);

		  const routes = route_comps.reduce((a, c) =>
		  	[...a, ...getRoutesForRouteComp(c, routeDataMap, true)]
		  , [])

			resolve(
				dispatch({
					type: UPDATE_STATE,
					state: {
						route_comps,
						routes
					}
				})
			)
		})

export const addStationComp = (stationId, needsSnapShot = false) =>
	(dispatch, getState) =>
		getStationData(stationId)
			.then(res =>
				dispatch({
					type: UPDATE_STATE,
					state: _addStationComp(getState(), stationId, res)
				})
			)
			.then(() => needsSnapShot && dispatch(takeSnapShot()))
export const removeStationComp = (compId, needsSnapShot = false) =>
  (dispatch, getState) =>
		Promise.resolve(
			dispatch({
				type: UPDATE_STATE,
				state: {
					..._removeStationComp(getState().report, compId)
				}
			})
		)
		.then(() => needsSnapShot && dispatch(takeSnapShot()))
export const updateStationSettings = (compId, update) =>
  (dispatch, getState) =>
    Promise.resolve(
      dispatch({
        type: UPDATE_STATE,
        state: {
          ..._updateStationSettings(getState().report, compId, update)
        }
      })
    )
export const updateStation = (compId, color, needsSnapShot = false) =>
  (dispatch, getState) =>
    Promise.resolve(
      dispatch({
        type: UPDATE_STATE,
        state: {
          ..._updateStation(getState().report, compId, color)
        }
      })
    )
		.then(() => needsSnapShot && dispatch(takeSnapShot()))
export const reorderStationComps = (srcIndex, dstIndex) =>
  (dispatch, getState) =>
    new Promise((resolve, reject) => {
      const state = getState().report;

      const station_comps = [...state.station_comps],
        src = station_comps.splice(srcIndex, 1);
      station_comps.splice(dstIndex, 0, src[0]);

      resolve(
        dispatch({
          type: UPDATE_STATE,
          state: { station_comps }
        })
      )
    })

const switchToAdvanced = (SETTINGS, yearsWithData) => {
	const simpleSettings = getSimpleSettings(SETTINGS, yearsWithData);

	return (SETTINGS.startDate !== simpleSettings.startDate) ||
		(SETTINGS.endDate !== simpleSettings.endDate)
}
const copySettings = (key, compId, SETTINGS, yearsWithData) => {
  const copyFrom = SETTINGS.get(compId),
    copyValue = copyFrom[key];
  for (const [id, settings] of SETTINGS) {
    if (id === compId) continue;

    settings[key] = copyValue;

    if ((key === "startTime") || (key === "endTime")) {
      settings.amPeak = false;
      settings.offPeak = false;
      settings.pmPeak = false;
    }
    else if (switchToAdvanced(settings, yearsWithData)) {
      settings.year = 'advanced';
      settings.month = 'advanced';
    }
  }
}

export const getRoutePeaks = (graph, path) => {
  if (graph && path) {
    return get(graph, path, {});
  }
  return {
		amPeakStart: 7 * 12,
		amPeakEnd: 10 * 12,
		pmPeakStart: (4 + 12) * 12,
		pmPeakEnd: (7 + 12) * 12
  }
}
const MIN = (v1, v2) => {
  if (isNaN(v1)) return v2;
  return Math.min(v1, v2);
}
const MAX = (v1, v2) => {
  if (isNaN(v1)) return v2;
  return Math.max(v1, v2);
}

const getPeakBounds = (peaks, routeId, state) => {
	const {
		amPeakStart,
		amPeakEnd,
		pmPeakStart,
		pmPeakEnd
	} = getRoutePeaks();//(state, ["graph", "routes", "byId", routeId]);

  const peakBounds = {
    amPeak: [amPeakStart, amPeakEnd],
    offPeak: [amPeakEnd, pmPeakStart],
    pmPeak: [pmPeakStart, pmPeakEnd]
  }
  return Object.keys(peaks).reduce((a, c) => {
    if (peaks[c]) {
      const bounds = peakBounds[c];
      return [
        MIN(a[0], bounds[0]),
        MAX(a[1], bounds[1])
      ]
    }
    return a;
  }, [])
}
const copyPeaks = (compId, SETTINGS, state) => {
  const copyFrom = SETTINGS.get(compId),
    { amPeak,
      offPeak,
      pmPeak
    } = copyFrom;

  for (const [id, settings] of SETTINGS) {
    if (id === compId) continue;

    settings.amPeak = amPeak;
    settings.offPeak = offPeak;
    settings.pmPeak = pmPeak;

    const bounds = getPeakBounds({ amPeak, offPeak, pmPeak }, settings.routeId, state);
    if (bounds.length) {
      settings.startTime = DateObject.epochToTimeString(bounds[0]);
      settings.endTime = DateObject.epochToTimeString(bounds[1]);
    }
    else {
      settings.startTime = "00:00";
      settings.endTime = "00:00";
    }
  }
}
const getSimpleSettings = (SETTINGS, yearsWithData, settings = {}) => {
  const dateSettings = {
    year: SETTINGS.year,
    month: SETTINGS.month,
    ...settings
  }
  let {
    year,
    month
  } = dateSettings;
  if (year === "advanced") {
		year = Math.min(
			+SETTINGS.endDate.toString().slice(0, 4),
			yearsWithData[yearsWithData.length - 1]
		)
  }
  if (month === "advanced") {
    month = "all";
  }
  let startDate = +`${ year }0101`,
    endDate = +`${ year }1231`;
  if (month !== 'all') {
    startDate = +`${ year }${ (`0${ month }`).slice(-2) }01`;
    const date = moment(startDate, 'YYYYMMDD')
      .add(1, 'month')
      .subtract(1, 'day')
      .date();
    endDate = +`${ year }${ (`0${ month }`).slice(-2) }${ (`0${ date }`).slice(-2) }`;
  }
  return {
    year,
    month,
    startDate,
    endDate
  };
}
const copySimpleSettings = (setting, compId, SETTINGS, yearsWithData) => {
  const copyFrom = SETTINGS.get(compId);

  for (const [id, settings] of SETTINGS) {
    if (id === compId) continue;

    const simple = getSimpleSettings(settings, yearsWithData, { [setting]: copyFrom[setting] });

    SETTINGS.set(id, { ...settings, ...simple });
  }
}
export const copyRouteCompSettings = (compId, keys = []) =>
  (dispatch, getState) => {
    const state = getState(),
      report = state.report,
      routeComponentSettings = new Map(report.routeComponentSettings);

    for (const key of keys) {
      switch (key) {
        case "peaks":
          copyPeaks(compId, routeComponentSettings, state);
          break;
        case "year":
        case "month":
          copySimpleSettings(key, compId, routeComponentSettings, report.yearsWithData);
          break;
        default:
          copySettings(key, compId, routeComponentSettings, report.yearsWithData)
          break;
      }
    }

    return Promise.resolve(
			dispatch({
				type: UPDATE_STATE,
				state: { routeComponentSettings }
			})
		)
  }

export const updateRouteData = routeData =>
  (dispatch, getState) => {
    const { routes } = getState().report;
    dispatch({
      type: UPDATE_STATE,
      state: {
        routes: routes.map(r => {
          return {
            ...r,
            data: { ...r.data, ...get(routeData, r.compId, {}) }
          };
        })
      }
    })
  }
export const updateStationData = stationData =>
  (dispatch, getState) => {
    const { station_comps } = getState().report;
    dispatch({
      type: UPDATE_STATE,
      state: {
        station_comps: station_comps.map(s => {
          return {
            ...s,
            data: { ...s.data, ...get(stationData, s.compId, {}) }
          };
        })
      }
    })
  }

const intersects = (rect1, rect2) => {
	return rect1.x < (rect2.x + rect2.w) &&
		(rect1.x + rect1.w) > rect2.x &&
		rect1.y < (rect2.y + rect2.h) &&
		(rect1.y + rect1.h) > rect2.y;
}
const tryFit = (rects, base, layout) => {
	layout.x += base.w;
	if ((layout.x + layout.w) > 12) {
		layout.x = 0;
		layout.y += base.h;
	}
	const doesIntersect = rects.reduce((a, c) => a || intersects(c, layout), false);
	return doesIntersect ? tryFit(rects, base, layout) : layout;
}
export const addGraphComp = (type, _layout = null) =>
	(dispatch, getState) =>
		new Promise((resolve, reject) => {
    	const state = getState().report,

		    y = state.graphs
		      .reduce((a, { layout: { y, h } }) => {
		      	return Math.max(a, y + h)
		      }, 0);

		  let layout = {
		  	x: 0,
		  	y,
		  	w: 12,
		  	h: 8
		  }

		  if (_layout) {
		  	const rects = state.graphs.map(({ layout: { x, y, w, h }, id }) => ({ x, y, w, h, i: id }));
		  	layout = tryFit(rects, _layout, _layout);
		  }

	    const newGraphComp = {
	      type,
	      id: getUniqueGraphCompId(),
	      layout,
	      state: { title: "" }
	    };

	    resolve(
	    	dispatch({
		    	type: UPDATE_STATE,
		    	state: {
	    			graphs: [
	    				...state.graphs,
		    			newGraphComp
		    		]
		    	}
		    })
		  )
		})
		.then(() => dispatch(takeSnapShot()))
export const removeGraphComp = (index, needsSnapShot) =>
	(dispatch, getState) =>
		new Promise((resolve, reject) => {
			const state = getState().report;

			resolve(
				dispatch({
					type: UPDATE_STATE,
					state: {
						graphs: state.graphs.filter((g, i) => i !== index)
					}
				})
			)
		})
		.then(() => needsSnapShot && dispatch(takeSnapShot()))
export const updateGraphComp = (index, update) =>
	(dispatch, getState) =>
		new Promise((resolve, reject) => {
			const state = getState().report;
	    if ("state" in update) {
	      update = { state: { ...get(state, `graphs[${ index }].state`, {}), ...update.state } }
	      for (const key in update.state) {
	        if (update.state[key] === null) {
	          delete update.state[key];
	        }
	      }
	    }
	    resolve(
	    	dispatch({
	    		type: UPDATE_STATE,
	    		state: {
			      graphs: [
			        ...state.graphs.slice(0, index),
			        { ...state.graphs[index], ...update },
			        ...state.graphs.slice(index + 1)
			      ]
	    		}
	    	})
	    )
		})
		.then(() => dispatch(takeSnapShot()))

export const onLayoutChange = newLayouts =>
	(dispatch, getState) => {
		const state = getState().report;

    const needsUpdate = newLayouts.reduce((a, newLayout) => {
      if (a) return a;
      const oldLayout = state.graphs.reduce((a, c) => c.id === newLayout.i ? c.layout : a, {});
      return newLayout.x !== oldLayout.x ||
        newLayout.y !== oldLayout.y ||
        newLayout.w !== oldLayout.w ||
        newLayout.h !== oldLayout.h
    }, false);

    if (needsUpdate) {
    	return Promise.resolve(
    		dispatch({
	    		type: UPDATE_STATE,
	    		state: {
	    			graphs: state.graphs.map(g => ({
		          ...g, layout: { ...newLayouts.find(l => l.i === g.id) }
		        }))
	        }
	    	})
	    )
	    .then(() => dispatch(takeSnapShot()))
    }
    return Promise.resolve();
	}

export const loadReport = report =>
	(dispatch, getState) => {
		if (typeof report === "object") {
			const routeIds = (get(report, "route_comps") || []).map(rc => rc.routeId),
        stationIds = (get(report, "station_comps") || []).map(sc => sc.stationId);
			return getStationData(stationIds)
        .then(() => getRouteData(routeIds, getState().report))
				.then(() => dispatch(_loadReport(report)))
		}
		if (!isNaN(+report)) {
			// console.log('get reportData', report)
			return getReportData(report)
				.then(res => {
					const data = get(res, `json.reports2.id.${ report }`, null);
					console.log('got reportData', res,data)

					if (data) {
						return dispatch(loadReport(data));
					}
					else {
						return dispatch(redirect("/folders/reports"));
					}
				})
		}
		if (isNaN(+report)) {
			return dispatch(redirect("/folders/reports"));
		}
	}
export const updateReport = update =>
	dispatch =>
		Promise.resolve(
			dispatch({
				type: UPDATE_STATE,
				state: { ...update }
			})
		)
export const saveReport = (report, reportId = null) =>
	(dispatch, getState) => {
		const state = getState().report;

    const args = {
      reportId,
      ...report,
      route_comps: state.route_comps.map(rc =>
        ({
          compId: rc.compId,
          routeId: rc.routeId,
          settings: { ...rc.settings },
          color: rc.color
        })
      ),
      station_comps: state.station_comps.map(sc =>
        ({
          compId: sc.compId,
          stationId: sc.stationId,
          settings: { ...sc.settings },
          color: sc.color
        })
      ),
      graph_comps: state.graphs.map(g =>
        ({
          type: g.type,
          layout: {
            x: g.layout.x,
            y: g.layout.y,
            w: g.layout.w,
            h: g.layout.h
          },
          state: { ...g.state }
        })
      )
    }
    return falcorGraph.call(
      ["reports2", "save"],
      [args], [], []
    )
    .then(res => {
      const newReportId = get(res, 'json.reports.recentlySaved', reportId);
      if ((newReportId !== null) && (newReportId != reportId)) {
      	return dispatch(redirect(`/report/edit/${ newReportId }`));
      }
    })
    .then(() => dispatch(removeSnapShot(reportId)));
	}

export const resetState = () =>
	dispatch =>
		Promise.resolve(
			dispatch({
				type: RESET_STATE
			})
		)

export const selectColorRange = colorRange =>
  (dispatch, getState) =>
    !deepequal(getState().report.colorRange, colorRange) &&
      Promise.resolve(
        dispatch({
          type: UPDATE_STATE,
          state: {
            colorRange
          }
        })
      ).then(() => dispatch(takeSnapShot()))

//****************************************************************************************
//****************************************************************************************
//****************************************************************************************

const INITIAL_STATE = {
  reportId: null,
  folder: null,
  name: "New Report",
  description: "",
  colorRange: DEFAULT_COLOR_RANGE,

  graphs: [],

  station_comps: [],

  routeComponentSettings: new Map(),
  route_comps: [],
  routes: [],

  redirect: false,
  dateExtent: DATE_EXTENT,
  yearsWithData: YEARS_WITH_DATA,
  allYearsWithData: YEARS_WITH_DATA,

  templateId: null,
  defaultType: 'none',
  saveYearsAsRecent: false
}

export default (state=INITIAL_STATE, action) => {
	switch (action.type) {
		case UPDATE_STATE:
// console.log(action)
			return {
				...state,
				...action.state
			}
		case RESET_STATE:
			return { ...INITIAL_STATE };
		default:
			return state;
	}
}

//****************************************************************************************
//****************************************************************************************
//****************************************************************************************

export const takeSnapShot = () =>
	(dispatch, getState) => {
		const state = getState().report;

	  // if (!state.route_comps.length && !state.graphs.length) {
	  //   return this.removeSnapShot();
	  // }
	  if (window.localStorage) {
	    const id = state.reportId ? `report-${ state.reportId }` : LOCAL_STORAGE_REPORT_KEY;
	    window.localStorage.setItem(id, JSON.stringify({
        id: state.reportId,
	      name: state.name,
        folder: state.folder,
	      description: state.description,
        color_range: state.colorRange,
	      route_comps: state.route_comps.map(rc =>
	        ({
	          compId: rc.compId,
	          routeId: rc.routeId,
	          settings: { ...rc.settings },
          	color: rc.color
	        })
	      ),
        station_comps: state.station_comps.map(sc =>
          ({
            compId: sc.compId,
            stationId: sc.stationId,
            settings: { ...sc.settings },
            color: sc.color
          })
        ),
	      graph_comps: state.graphs.map(g =>
	        ({
	          type: g.type,
	          layout: {
	            x: g.layout.x,
	            y: g.layout.y,
	            w: g.layout.w,
	            h: g.layout.h
	          },
	          state: { ...g.state }
	        })
	      )
	    }))
	  }
	}
export const removeSnapShot = reportId =>
	(dispatch, getState) => {
	  if (window.localStorage) {
	    const id = reportId ? `report-${ reportId }` : LOCAL_STORAGE_REPORT_KEY;
	    window.localStorage.removeItem(id);
	  }
	}

const _loadReport = report =>
	(dispatch, getState) => {
		const state = getState().report;

		AVAILABLE_COLORS = [...COLORS];
		ROUTE_COMP_ID = 0;
	  report.route_comps.forEach(rc => {
	  	ROUTE_COMP_ID = Math.max(ROUTE_COMP_ID, +rc.compId.slice(5));
	  	if (AVAILABLE_COLORS.includes(rc.color)) {
	  		AVAILABLE_COLORS = AVAILABLE_COLORS.filter(c => c !== rc.color);
	  	}
	  });

	  const routeComponentSettings = new Map();
	  report.route_comps.forEach(({ compId, settings, routeId }) => {
	    routeComponentSettings.set(compId, { ...settings, routeId });
	  })

	  const routes = report.route_comps.reduce((a, c) =>
	  	[...a, ...getRoutesForRouteComp(c, null, Boolean(c.color))]
	  , [])

    const station_comps = loadStationCompsFromReport(report, falcorGraph.getCache());

	  return Promise.resolve(
			dispatch({
				type: UPDATE_STATE,
				state: {
			  	reportId: report.id || state.reportId,
          folder: report.folder,
			  	// type: report.type || state.type,
			  	// owner: report.owner || state.owner,
			  	name: report.name,
			  	description: report.description,
			  	route_comps: report.route_comps,
			  	graphs: report.graph_comps.map(g => ({ ...g, id: getUniqueGraphCompId() })),
          colorRange: report.color_range || DEFAULT_COLOR_RANGE,
			  	routes,
			  	routeComponentSettings,
          station_comps
			  }
			})
		)
	}

const _addRouteComp = (state, routeIds) => {
  routeIds = Array.isArray(routeIds) ? routeIds : [routeIds];

	const { yearsWithData } = state,
    routeComponentSettings = new Map(state.routeComponentSettings),
    newRouteComps = [],
    newRoutes = [];

  for (const routeId of routeIds) {
    const data = get(falcorGraph.getCache(), `routes2.id.${ routeId }`, {}),
      {
    		amPeakStart,
    		// amPeakEnd,
    		// pmPeakStart,
    		pmPeakEnd
    	} = getRoutePeaks(),
      compId = getUniqueRouteCompId(),
      newRouteComp = {
        compId,
        routeId,
        name: data.name,
        settings: {
          startDate: +`${ yearsWithData[yearsWithData.length - 1] }0101`,
          endDate: +`${ yearsWithData[yearsWithData.length - 1] }1231`,
          year: yearsWithData[yearsWithData.length - 1],
          month: 'all',
          startTime: DateObject.epochToTimeString(amPeakStart),
          endTime: DateObject.epochToTimeString(pmPeakEnd),
          resolution: '5-minutes',
          weekdays: {
            sunday: false,
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: false
          },
          overrides: {},
          amPeak: true,
          offPeak: true,
          pmPeak: true,
          dataColumn: "travel_time_all",
          compTitle: "",
          routeId
        }
      };
    routeComponentSettings.set(newRouteComp.compId, { ...newRouteComp.settings });
    newRouteComps.push(newRouteComp);
    newRoutes.push(...getRoutesForRouteComp(newRouteComp));
  }

	return {
    route_comps: [
      ...state.route_comps,
      ...newRouteComps
    ],
    routes: [
      ...state.routes,
      ...newRoutes
    ],
    routeComponentSettings
	};
}
const _removeRouteComp = (state, compId) => {
	const routeComponentSettings = new Map(state.routeComponentSettings);
  routeComponentSettings.delete(compId);

  const { color } = state.route_comps.find(rc => rc.compId === compId);
  if (!AVAILABLE_COLORS.includes(color) && COLORS.includes(color)) {
    AVAILABLE_COLORS.push(color);
  }

  const routeDataMap = {};
  state.routes.forEach(r => {
    routeDataMap[r.compId] = r.data;
  })

  const route_comps = state.route_comps.filter(rc => rc.compId !== compId),
    routes = route_comps.reduce((a, c) =>
    	[...a, ...getRoutesForRouteComp(c, routeDataMap, true)]
    , []),

    graphs = state.graphs.map(g => {
      const { state } = g;
      const newState = { ...state };
      if (get(state, 'activeRouteComponents.length', 0)) {
        newState.activeRouteComponents = state.activeRouteComponents.filter(arc => !arc.includes(compId));
        if (newState.activeRouteComponents.length === 0) {
          delete newState.activeRouteComponents;
        }
      }
      return {
        ...g,
        state: newState
      }
    });

  return {
  	route_comps,
  	routes,
  	graphs
  }
}

const _loadTemplate = (templateId, routeIds, state, stationIds = []) => {
	const yearsWithData = state.yearsWithData,
		mostRecent = Math.max(...yearsWithData);

	const falcorCache = falcorGraph.getCache(),
    template = get(falcorCache, `templates2.id.${ templateId }`, {});

	let name = template.name,
	  description = template.description,
	  folder = template.folder,
	  route_comps = get(template, ["route_comps", "value"], []),
	  graph_comps = get(template, ["graph_comps", "value"], []),
    station_comps = get(template, ["station_comps", "value"], []),
    colorRange = get(template, ["color_range", "value"], DEFAULT_COLOR_RANGE),
    defaultType = template.defaultType;

	AVAILABLE_COLORS = [...COLORS];
	ROUTE_COMP_ID = 0;
  route_comps.forEach(rc => {
  	ROUTE_COMP_ID = Math.max(ROUTE_COMP_ID, +rc.compId.slice(5));
  	if (AVAILABLE_COLORS.includes(rc.color)) {
  		AVAILABLE_COLORS = AVAILABLE_COLORS.filter(c => c !== rc.color);
  	}
  });

  // LOAD ROUTE COMPS
  let variables = route_comps.reduce((a, { routeId }) => {
    if (!a.includes(routeId)) {
      a.push(routeId);
    }
    return a;
  }, [])

  let idMap = {};
  variables.forEach((v, i) => {
    idMap[v] = routeIds[i];
  })

  route_comps = route_comps.map(rc =>
    ({ ...rc,
      routeId: idMap[rc.routeId]
    })
  )

  let saveYearsAsRecent = false;

  const routeComponentSettings = new Map();
  route_comps.forEach(route_comp => {
  	const {
  		compId,
  		settings
  	} = route_comp;
    settings.routeId = route_comp.routeId;
  	if (RECENT_REGEX.test(settings.year)) {
  		saveYearsAsRecent = true;
  		settings.year = +replace(settings.year, mostRecent);
  	}
  	if (RECENT_REGEX.test(settings.startDate)) {
  		saveYearsAsRecent = true;
  		settings.startDate = +replace(settings.startDate, mostRecent);
  	}
  	if (RECENT_REGEX.test(settings.endDate)) {
  		saveYearsAsRecent = true;
  		settings.endDate = +replace(settings.endDate, mostRecent);
  	}
  	if (RECENT_REGEX.test(settings.compTitle)) {
  		saveYearsAsRecent = true;
  		settings.compTitle = replace(settings.compTitle, mostRecent);
  	}
    routeComponentSettings.set(compId, { ...settings });
  })

  const routes = route_comps.reduce((a, c) =>
  	[...a, ...getRoutesForRouteComp(c, null, Boolean(c.color))]
  , [])

  // LOAD STATION COMPS
  station_comps = loadStationCompsFromTemplate(station_comps, falcorCache, stationIds);

  station_comps.forEach(comp => {
    if (RECENT_REGEX.test(comp.settings.year)) {
      saveYearsAsRecent = true;
      comp.settings.year = +replace(comp.settings.year, mostRecent);
    }
    if (RECENT_REGEX.test(comp.settings.startDate)) {
      saveYearsAsRecent = true;
      comp.settings.startDate = +replace(comp.settings.startDate, mostRecent);
    }
    if (RECENT_REGEX.test(comp.settings.endDate)) {
      saveYearsAsRecent = true;
      comp.settings.endDate = +replace(comp.settings.endDate, mostRecent);
    }
    if (RECENT_REGEX.test(comp.settings.compTitle)) {
      saveYearsAsRecent = true;
      comp.settings.compTitle = replace(comp.settings.compTitle, mostRecent);
    }
    comp.workingSettings = JSON.parse(JSON.stringify(comp.settings));
  })

  const graphs = graph_comps.map(gc => ({
    id: getUniqueGraphCompId(),
    type: gc.type,
    layout: { ...gc.layout },
    state: { ...gc.state }
  }))

  if (RECENT_REGEX.test(name)) {
  	saveYearsAsRecent = true;
  	name = replace(name, mostRecent);
  }
  if (RECENT_REGEX.test(description)) {
  	saveYearsAsRecent = true;
  	description = replace(description, mostRecent);
  }

  return {
    name,
    description,
    folder,
    route_comps,
    routes,
    graphs,
    station_comps,
    routeComponentSettings,
    templateId,
    saveYearsAsRecent,
    colorRange,
    defaultType
	};
}

const getRoutesForRouteComp = (routeComp, routeDataMap = null, preserveColors = false) => {
  const cache = falcorGraph.getCache(),

    data = get(cache, `routes2.id.${ routeComp.routeId }`, null),

    fromData = get(data, ["tmc_array", "value"], []),

    { endDate } = routeComp.settings,
    year = +endDate.toString().slice(0, 4),
    // tmcArray = [
    //   ...get(cache, ["routes2", "id", routeComp.routeId, year, "tmcArray", "value"], fromData)
    // ],
    tmcArray = fromData,

  	routes = [];

  if (data && tmcArray.length) {
    const color = preserveColors ? routeComp.color : getRouteColor();
    routeComp.name = getRouteCompName(data.name, routeComp.settings);
    routeComp.color = color;
    routeComp.isValid = true;
    routes.push({
      tmcArray,
      name: routeComp.name,
      settings: { ...routeComp.settings },
      data: get(routeDataMap, `[${ routeComp.compId }]`, {}),
      compId: routeComp.compId,
      color
    })
  }
  else {
    routeComp.name = `Route (${ routeComp.routeId }) Does Not Exist.`;
    routeComp.isValid = false;
    routeComp.color = getRouteColor();
  }
  // else if (data.colltype === "network") {
  //   const meta = data.meta.value,
  //   	ids = Object.keys(meta.routes)
	//       .sort((a, b) => a < b ? -1 : a > b ? 1 : 0),
  //   	colors = preserveColors ? routeComp.colors : ids.map(() => getRouteColor()),
  //   	routes = ids.map((id, i) => ({
  //       tmcArray: [...meta.routes[id]],
  //       name: `${ routeComp.name }-${ id }`,
  //       settings: { ...routeComp.settings },
  //       data: get(routeDataMap, `[${ routeComp.compId }-${ id }]`, {}),
  //       compId: `${ routeComp.compId }-${ id }`,
  //       color: colors[i]
	//     }))
  //   routes.push(...routes);
  //   routeComp.colors = colors;
  //   routeComp.color = "#ccc";
  // }
  return routes;
}

const NAME_REGEX = /{name}/g;
const YEAR_REGEX = /{year}/g;
const MONTH_REGEX = /{month}/g;
const DATE_REGEX = /{date}/g;

const getRouteCompName = (name, settings) => {
	if (!settings.compTitle) return name;

	return settings.compTitle.replace(NAME_REGEX, name)
		.replace(YEAR_REGEX, getYearString(settings))
		.replace(MONTH_REGEX, getMonthString(settings))
		.replace(DATE_REGEX, getDateString(settings));
}

export const RECENT_REGEX = /{recent-(\d+)}/g;
export const replace = (string, mostRecent, test) =>(
	string.replace(RECENT_REGEX, (match, capture) => `${ mostRecent - +capture }`)
)
const getYearString = settings => {
	if (settings.year !== 'advanced') return settings.year.toString();

	const start = settings.startDate.toString().slice(0, 4),
		end = settings.endDate.toString().slice(0, 4);

	if (start === end) return start;

	return `${ end }-${ start }`;
}
const MONTHS = {
	1: "January",
	2: "February",
	3: "March",
	4: "April",
	5: "May",
	6: "June",
	7: "July",
	8: "August",
	9: "September",
	10: "October",
	11: "November",
	12: "December"
}
const getMonthString = settings => {
	if (settings.month === 'all') return 'Jan-Dec';
	if (settings.month !== 'advanced') return MONTHS[settings.month];

	const start = +settings.startDate.toString().slice(4, 6),
		end = +settings.endDate.toString().slice(4, 6);

	if (start === end) return MONTHS[start];

	return `${ MONTHS[start].slice(0, 3) }-${ MONTHS[end].slice(0, 3) }`;
}
const getDateString = settings => {
	const start = settings.startDate.toString(),
		end = settings.endDate.toString();

	if (start === end) {
		const month = +start.slice(4, 6),
			day = start.slice(6),
			year = start.slice(0, 4);
		return `${ MONTHS[month].slice(0, 3) }-${ day }-${ year }`;
	}
	return '';
}