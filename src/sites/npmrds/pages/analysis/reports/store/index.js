import { falcorGraph } from "~/store/falcorGraph"
// import { update } from "utils/redux-falcor/components/duck"
// import { updateFalcor as update } from "store/falcorGraph"

import isEqual from "lodash/isEqual"
import get from "lodash/get"
import moment from "moment"

import { range } from "d3-array";

// import { UPDATE as updateFalcor } from "utils/redux-falcor"

// import DateObject from "components/tmc_graphs/utils/DateObject"
import DateObject from "~/sites/npmrds/pages/analysis/components/tmc_graphs/utils/DateObject"

import {
  _addStationComp,
  _removeStationComp,
  _updateStationSettings,
  _updateStation,
  loadStationCompsFromReport,
  loadStationCompsFromTemplate
  //_reorderStationComps
} from "./utils/station.utils"

// import { getColorRange } from "constants/color-ranges"
import { getColorRange } from "~/modules/avl-components/src"
const COLORS = getColorRange(8, "Dark2");//COLOR_RANGES[12][1].colors.slice();
// const COLORS = ['#FF6900', '#FCB900', '#7BDCB5', '#00D084', '#8ED1FC', '#0693E3', '#ABB8C3', '#EB144C', '#F78DA7', '#9900EF']

import {
  calculateRelativeDates,
  getDatesAndTimes
} from "./utils/relativedates.utils.js"

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
  2018,
  2019
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

const getRouteData = (routeIds, report) => {
	return falcorGraph.get(["routes2", "id", routeIds, ["name", "metadata"]])
    .then(() =>
      falcorGraph.get(
        ["routes2", "id", routeIds, report.allYearsWithData, "tmc_array"]
      )
    )
}

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
		['templates2', 'defaultType', defaultType, 'id']
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

const loadingRoutesForReport = {};

export const loadRoutesForReport = routeIds =>
  (dispatch, getState) => {
    if (loadingRoutesForReport[routeIds]) return Promise.resolve();
    loadingRoutesForReport[routeIds] = true;
    return Promise.resolve()
      // .then(() => getDataDateExtent())
      .then(() => routeIds.length && getRouteData(routeIds, getState().report))
			.then(() => {
        dispatch({
          type: UPDATE_STATE,
          state: _addRouteComp(getState().report, routeIds)
        })
        loadingRoutesForReport[routeIds] = false;
			})
  }

export const loadRoutesAndTemplate = (routeIds, templateId, stationIds = []) =>
	(dispatch, getState) =>
    Promise.resolve()
      .then(() => stationIds.length && getStationData(stationIds))
		  .then(() => routeIds.length && getRouteData(routeIds, getState().report))
			.then(() => getTemplateData(templateId))
      .then(() => {
        return dispatch({
					type: UPDATE_STATE,
					state: _loadTemplate(templateId, routeIds, getState().report, stationIds)
				})
      })
export const loadRoutesAndTemplateWithDates = (routeIds, templateId, datesMap, stationIds = []) =>
	(dispatch, getState) =>
    Promise.resolve()
      .then(() => stationIds.length && getStationData(stationIds))
		  .then(() => routeIds.length && getRouteData(routeIds, getState().report))
			.then(() => getTemplateData(templateId))
			.then(() =>
				dispatch({
					type: UPDATE_STATE,
					state: _loadTemplateWithDates(templateId, routeIds, datesMap, getState().report, stationIds)
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
    			.then(() => {
            return dispatch({
              type: UPDATE_STATE,
              state: _loadTemplate(templateId, routeIds, getState().report, stationIds)
            })
    			})
      })
export const loadTemplateWithSyntheticRoute = (tmcArray, templateId, dates) =>
  (dispatch, getState) =>
    Promise.resolve()
      .then(() => getTemplateData(templateId))
			.then(() =>
				dispatch({
					type: UPDATE_STATE,
					state: _loadTemplateWithSyntheticRoute(templateId, tmcArray, dates, getState().report)
				})
			)
export const loadTemplate = (templateId) =>
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

    const usingRelativeDates = state.usingRelativeDates;

    const {
      name,
      description,
      defaultType,
      saveYearsAsRecent,
      ...rest
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
      .reduce((a, c) => {
        if (c.type === "group") {
          return c.route_comps.reduce((aa, cc) => {
            aa.add(cc.routeId);
            return aa;
          }, a)
        }
        a.add(c.routeId);
        return a;
      }, new Set());

    const idMap = [...routeIds].reduce((a, c, i) => {
      a[c] = `$${ i }`;
      return a;
    }, {});

    const route_comps = template.route_comps.map(rc =>
        rc.type === "group" ? ({
          ...rc,
          color: get(rc, "color", "#666666"),
          type: "group",
          route_comps: get(rc, "route_comps", [])
            .map(rc => ({
              ...rc,
              routeId: idMap[rc.routeId],
              type: "route",
              settings: {
              	...rc.settings,
              	year: saveYearsAsRecent ? setRecentYear(rc.settings.year, mostRecent) : rc.settings.year,
              	startDate: saveYearsAsRecent ? setRecentDate(rc.settings.startDate, mostRecent) : rc.settings.startDate,
              	endDate: saveYearsAsRecent ? setRecentDate(rc.settings.endDate, mostRecent) : rc.settings.endDate,
              	compTitle: saveYearsAsRecent ? setRecentText(rc.settings.compTitle, mostRecent, yearsWithData) : rc.settings.compTitle
              }
            }))
        }) : ({
          ...rc,
          routeId: idMap[rc.routeId],
          type: "route",
          settings: {
          	...rc.settings,
            year: saveYearsAsRecent ? setRecentYear(rc.settings.year, mostRecent) : rc.settings.year,
            startDate: saveYearsAsRecent ? setRecentDate(rc.settings.startDate, mostRecent) : rc.settings.startDate,
            endDate: saveYearsAsRecent ? setRecentDate(rc.settings.endDate, mostRecent) : rc.settings.endDate,
            compTitle: saveYearsAsRecent ? setRecentText(rc.settings.compTitle, mostRecent, yearsWithData) : rc.settings.compTitle
          }
        })
    )
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


    const toSave = {
    	templateId,
      name: saveYearsAsRecent ? setRecentText(name, mostRecent, yearsWithData) : name,
      description: saveYearsAsRecent ? setRecentText(description, mostRecent, yearsWithData) : description,
      route_comps,
      station_comps,
      graph_comps,
      routes: routeIds.size,
      stations: stationIds.length,
      default_type: defaultType,
      ...rest
    }

// console.log("TO SAVE:", toSave);
// return Promise.resolve();

		return falcorGraph.call(
			["templates2", "save"],
			[toSave], [], []
		)
    .then(res => {
      dispatch({
        type: UPDATE_STATE,
        state: {
          name: toSave.name,
          folder: toSave.folder
        }
      })
    })
    .then(() => dispatch(removeSnapShot(`template-${ templateId }`)));
	}

export const addRouteComp = (routeId, settings = null, groupId = null, needsSnapShot = false) =>
	(dispatch, getState) => {
    if (isNaN(routeId)) {
      return Promise.resolve()
        .then(() =>
  				dispatch({
  					type: UPDATE_STATE,
  					state: _addRouteComp(getState().report, routeId, settings, groupId)
  				})
        )
  			.then(() => needsSnapShot && dispatch(takeSnapShot()))
    }
  	return getRouteData(routeId, getState().report)
			.then(() =>
				dispatch({
					type: UPDATE_STATE,
					state: _addRouteComp(getState().report, routeId, settings, groupId)
				})
			)
			.then(() => needsSnapShot && dispatch(takeSnapShot()))
  }
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
		.then(() => needsSnapShot && dispatch(takeSnapShot()));

const checkRelativeDates = (nextState, updateSettings = false, setTimes = false) => {

  const [route_comps, route_groups] = nextState.route_comps.reduce((a, c) => {
    if ((c.type === "group") && c.usingRelativeDates) {
      return [a[0], [...a[1], c]];
    }
    else if (c.type === "group") {
      return [[...a[0], ...c.route_comps], a[1]];
    }
    return [[...a[0], c], a[1]];
  }, [[], []]);

  const routeComponentSettings = nextState.routeComponentSettings;

  let usingRelativeDates = false;
  let relativeDateBase = {
    compId: null,
    startDate: null,
    endDate: null
  }

  let startTime = null;
  let endTime = null;

  route_comps.forEach(rc => {
    const settings = routeComponentSettings.get(rc.compId);
    if (settings.isRelativeDateBase) {
      usingRelativeDates = true;
      relativeDateBase.compId = rc.compId;
      relativeDateBase.startDate = settings.startDate;
      relativeDateBase.endDate = settings.endDate;

      if (setTimes) {
        startTime = settings.startTime;
        endTime = settings.endTime;
      }
    }
  })
  route_comps.forEach(rc => {
    const settings = routeComponentSettings.get(rc.compId);
    if (!settings.isRelativeDateBase) {
      const dates = calculateRelativeDates(
        settings.relativeDate,
        relativeDateBase.startDate,
        relativeDateBase.endDate
      )
      if (dates.filter(Boolean).length) {
        routeComponentSettings.set(
          rc.compId,
          { ...settings,
            startDate: +dates[0],
            endDate: +dates[1],
            startTime: setTimes ? startTime : settings.startTime,
            endTime: setTimes ? endTime : settings.endTime,
            useRelativeDateControls: true
          }
        )
        if (updateSettings) {
          rc.settings = { ...routeComponentSettings.get(rc.compId) };
        }
      }
    }
  })

  route_groups.forEach(rg => {
    // if (rg.usingRelativeDates) {
    rg.relativeDateBase = {
      compId: null,
      startDate: null,
      endDate: null
    }

    let startTime = null;
    let endTime = null;

    rg.route_comps.forEach(rc => {
      const settings = routeComponentSettings.get(rc.compId);
      if (settings.isRelativeDateBase) {
        rg.relativeDateBase.compId = rc.compId;
        rg.relativeDateBase.startDate = settings.startDate;
        rg.relativeDateBase.endDate = settings.endDate;

        if (setTimes) {
          startTime = settings.startTime;
          endTime = settings.endTime;
        }
      }
    })
    rg.route_comps.forEach(rc => {
      const settings = routeComponentSettings.get(rc.compId);
      if (!settings.isRelativeDateBase) {
        const dates = calculateRelativeDates(
          settings.relativeDate,
          rg.relativeDateBase.startDate,
          rg.relativeDateBase.endDate
        )
        if (dates.filter(Boolean).length) {
          routeComponentSettings.set(
            rc.compId,
            { ...settings,
              startDate: +dates[0],
              endDate: +dates[1],
              startTime: setTimes ? startTime : settings.startTime,
              endTime: setTimes ? endTime : settings.endTime,
              useRelativeDateControls: true
            }
          )
          if (updateSettings) {
            rc.settings = { ...routeComponentSettings.get(rc.compId) };
          }
        }
      }
    })
    // } // END if (rg.usingRelativeDates)
    // else {
    //   rg.route_comps.forEach(rc => {
    //     const settings = routeComponentSettings.get(rc.compId);
    //     if (settings.isRelativeDateBase) {
    //       usingRelativeDates = true;
    //       relativeDateBase.compId = rc.compId;
    //       relativeDateBase.startDate = settings.startDate;
    //       relativeDateBase.endDate = settings.endDate;
    //     }
    //   })
    //   rg.route_comps.forEach(rc => {
    //     const settings = routeComponentSettings.get(rc.compId);
    //     if (!settings.isRelativeDateBase) {
    //       const dates = calculateRelativeDates(
    //         settings.relativeDate,
    //         relativeDateBase.startDate,
    //         relativeDateBase.endtDate
    //       )
    //       if (dates.length) {
    //         routeComponentSettings.set(
    //           rc.compId,
    //           { ...settings,
    //             startDate: +dates[0],
    //             endDate: +dates[1]
    //           }
    //         )
    //         if (updateSettings) {
    //           rc.settings = { ...routeComponentSettings.get(rc.compId) };
    //         }
    //       }
    //     }
    //   })
    // } // END else
  })

  return {
    ...nextState,
    routeComponentSettings,
    usingRelativeDates,
    relativeDateBase
  };
}
export const updateRouteCompSettings = (compId, settings) =>
  (dispatch, getState) => {
  const state = getState().report,
    routeComponentSettings = new Map(state.routeComponentSettings),
    current = routeComponentSettings.get(compId);
  routeComponentSettings.set(compId, { ...current, ...settings });
  return Promise.resolve(
    dispatch({
      type: UPDATE_STATE,
      state: checkRelativeDates({ ...state, routeComponentSettings })
    })
  )
}

export const updateRouteComp = (compId, update, reloadData=true) =>
	(dispatch, getState) =>
		new Promise((resolve, reject) => {
			const state = getState().report;

	    const route_comps = state.route_comps.map(rc => {
        const type = get(rc, "type", "route");
        if ((type === "route") && (rc.compId === compId)) {
          const cache = falcorGraph.getCache();
          const settings = { ...rc.settings, ...update };
	        const name = get(cache, `routes2.id.${ rc.routeId }.name`, 'unknown');
	        return {
	          ...rc,
	          settings,
	          name: getRouteCompName(name, settings)
	        }
        }
        else if ((type === "synthetic") && (rc.compId === compId)) {
          const settings = { ...rc.settings, ...update };
	        return {
	          ...rc,
	          settings,
	          name: getRouteCompName("Synthetic Route", settings)
	        }
        }
        else if (type === "group") {
          const hasComp = get(rc, "route_comps", [])
            .reduce((a, c) => {
              return a || (c.compId === compId);
            }, false);
          if (hasComp) {
            return {
              ...rc,
              route_comps: get(rc, "route_comps", [])
                .map(rc => {
                  if (rc.compId === compId) {
                    const cache = falcorGraph.getCache();
                    const settings = { ...rc.settings, ...update };
          	        const name = get(cache, `routes2.id.${ rc.routeId }.name`, 'unknown');
                    return {
          	          ...rc,
          	          settings,
          	          name: getRouteCompName(name, settings)
          	        }
                  }
                  return rc;
                })
            }
          }
        }
	      return rc;
	    })

	    const routeDataMap = state.routes.reduce((a, c) => ({ ...a, [c.compId]: c.data }), {});
	    if (reloadData) {
	    	delete routeDataMap[compId];
	    }
		  const routes = route_comps.reduce((a, c) => {
		  	return [...a, ...getRoutesForRouteComp(c, routeDataMap, true)];
		  }, []);

      const nextState = {
        route_comps,
        routes
      }

	    resolve(
	    	dispatch({
	    		type: UPDATE_STATE,
	    		state: nextState
	    	})
	    )
		})
    .then(() => dispatch(takeSnapShot()))
// END updateRouteComp

export const updateAllRouteComps = () =>
	(dispatch, getState) =>
		new Promise((resolve, reject) => {
		  const state = getState().report;

		  const route_comps = state.route_comps.map(rc => {
        if (get(rc, "type", "route") === "group") {
          return {
            ...rc,
            route_comps: rc.route_comps.map(rc2 => {
              const next = state.routeComponentSettings.get(rc2.compId);
              return {
                ...rc2,
                settings: { ...next }
              }
            })
          }
        }
        else {
          const next = state.routeComponentSettings.get(rc.compId);
          return {
    		    ...rc,
    		    settings: { ...next }
          }
        }
		  })
		  const routes = route_comps.reduce((a, c) => {
		  	return [...a, ...getRoutesForRouteComp(c, null, true)];
		  }, [])

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
  		.then(() => dispatch(takeSnapShot()));

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
        else if (rc.type === "group") {
          rc.route_comps = rc.route_comps.map(rc => {
    				if (rc.compId === compId) {
    					if (!AVAILABLE_COLORS.includes(rc.color) && COLORS.includes(rc.color)) {
    						AVAILABLE_COLORS.push(rc.color);
    					}
    					return {
    						...rc,
    						color
    					}
    				}
          })
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
		.then(() => dispatch(takeSnapShot()));

export const reorderRouteComps = (srcIndex, dstIndex, groupId) =>
	(dispatch, getState) =>
		new Promise((resolve, reject) => {
		  const state = getState().report;

      const route_comps = [...state.route_comps];

      if (groupId) {
        const route_group = route_comps.reduce((a, c) => {
          return c.compId === groupId ? c : a;
        }, null);
        if (route_group) {
          route_group.route_comps = [...get(route_group, "route_comps", [])];
    		  const [src] = route_group.route_comps.splice(srcIndex, 1);
          if (src) {
            route_group.route_comps.splice(dstIndex, 0, src);
          }
        }
      }
      else {
  		  const [src] = route_comps.splice(srcIndex, 1);
        if (src) {
          route_comps.splice(dstIndex, 0, src);
        }
      }

      const routeDataMap = state.routes.reduce((a, c) => {
        a[c.compId] = c.data;
        return a;
      }, {});

		  const routes = route_comps.reduce((a, c) => {
		  	return [...a, ...getRoutesForRouteComp(c, routeDataMap, true)];
		  }, []);

			resolve(
				dispatch({
					type: UPDATE_STATE,
					state: {
            ...state,
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
				state: checkRelativeDates({ ...report, routeComponentSettings })
			})
		)
  }

export const updateRouteData = routeData =>
  (dispatch, getState) => {
    const { routes } = getState().report;
    const updatedRoutes = [];
    routes.forEach(r => {
      if (r.compId in routeData) {
        updatedRoutes.push({
          ...r,
          data: { ...r.data, ...get(routeData, r.compId, {}) }
        })
      }
      else {
        updatedRoutes.push(r);
      }
    })
    dispatch({
      type: UPDATE_STATE,
      state: { routes: updatedRoutes }
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
export const addGraphComp = (type, _layout = null, graphState = null) =>
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
	      state: graphState ?
          JSON.parse(JSON.stringify(graphState)) :
          { title: "{type}, {data}" }
	    };

      newGraphComp.state.title = newGraphComp.state.title || "{type}, {data}"

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
		.then(() => needsSnapShot && dispatch(takeSnapShot()));

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
			const routeIds = (get(report, "route_comps") || [])
              .reduce((a, rc) => {
                if (get(rc, "type", "route") === "route") {
                  a.push(rc.routeId)
                }
                else if (get(rc, "type", "route") === "group") {
                  a.push(...rc.route_comps.map(rc => rc.routeId));
                }
                return a;
              }, []),
        stationIds = (get(report, "station_comps") || []).map(sc => sc.stationId);

			return getStationData(stationIds)
        .then(() => getRouteData([...new Set(routeIds)], getState().report))
				.then(() => dispatch(_loadReport(report)))
		}
		if (!isNaN(+report)) {
			return getReportData(report)
				.then(res => {
					const data = get(res, `json.reports2.id.${ report }`, null);

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

    const toSave = {
      reportId,
      ...report,
      route_comps: state.route_comps.map(rc =>
        get(rc, "type", "route") === "group" ?
          ({ ...rc,
            compId: rc.compId,
            color: get(rc, "color", "#666666"),
            type: "group",
            route_comps: get(rc, "route_comps", [])
              .map(rc => ({
                ...rc,
                settings: { ...rc.settings },
                type: "route"
              }))
          }) :
          ({ ...rc,
            settings: { ...rc.settings },
            type: get(rc, "type", "route")
          })

      ),
      station_comps: state.station_comps.map(sc =>
        ({ ...sc, settings: { ...sc.settings } })
      ),
      graph_comps: state.graphs.map(g =>
        ({ ...g,
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
      [toSave], [], []
    )
    .then(res => {
      const newReportId = get(res, 'json.reports2.recentlySaved', reportId);
      if ((newReportId !== null) && (newReportId != reportId)) {
      	return dispatch(redirect(`/report/edit/${ newReportId }`));
      }
    })
    .then(() => dispatch(removeSnapShot(`report-${ reportId }`)));
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
    !isEqual(getState().report.colorRange, colorRange) &&
      Promise.resolve(
        dispatch({
          type: UPDATE_STATE,
          state: {
            colorRange
          }
        })
      ).then(() => dispatch(takeSnapShot()))

let groupId = -1;
const getGroupId = () => ++groupId;

export const createNewRouteGroup = (srcId = null, dstId = null) =>
  (dispatch, getState) => {
    const report = getState().report;

    const route_comps = report.route_comps
      .filter(rc => rc.compId !== srcId);

    const dstIndex = route_comps.reduce((a, c, i) => {
      return c.compId === dstId ? i : a;
    }, route_comps.length);

    const srcComp = report.route_comps.reduce((a, c) => {
      return c.compId === srcId ? c : a;
    }, null);
    const dstComp = report.route_comps.reduce((a, c) => {
      return c.compId === dstId ? c : a;
    }, null);

    const workingSettings = {
      color: "#666666",
      usingRelativeDates: false,
      relativeDateBase: null
    }

    const group = {
      type: "group",
      name: `Route Group ${ getGroupId() }`,
      compId: getUniqueRouteCompId(),
      route_comps: [srcComp, dstComp].filter(Boolean)
        .map(rc => ({ ...rc, inRouteGroup: true })),
      ...workingSettings,
      workingSettings
    }

    route_comps.splice(dstIndex, 1, group);

    return Promise.resolve(
      dispatch({
        type: UPDATE_STATE,
        state: checkRelativeDates({ ...report, route_comps }, true)
      })
    ).then(() => dispatch(takeSnapShot()))
  }

export const addRouteToGroup = (groupId, compId) =>
  (dispatch, getState) => {
    const report = getState().report;

    const route_comp = report.route_comps.reduce((a, c) => {
      return c.compId === compId ? c : a;
    }, null);

    const route_comps = report.route_comps.filter(rc => rc.compId !== compId);

    const route_group = route_comps.reduce((a, c) => {
      return c.compId === groupId ? c : a;
    }, null);

    route_group.route_comps = [
      ...route_group.route_comps,
      { ...route_comp, inRouteGroup: true }
    ];

    return Promise.resolve(
      dispatch({
        type: UPDATE_STATE,
        state: checkRelativeDates({ ...report,  route_comps }, true)
      })
    ).then(() => dispatch(takeSnapShot()))
  }

export const combineRouteComps = (srcId, dstId) =>
  (dispatch, getState) => {
    const report = getState().report;
    const { route_comps } = report;

    const srcComp = route_comps.reduce((a, c) => {
      return c.compId === srcId ? c : a;
    }, null);
    const srcType = get(srcComp, "type", "route");

    const dstComp = route_comps.reduce((a, c) => {
      return c.compId === dstId ? c : a;
    }, null);
    const dstType = get(dstComp, "type", "route");

    if ((srcType !== "group") && (dstType !== "group")) {
      return dispatch(createNewRouteGroup(srcId, dstId));
    }

    if (srcType === "group") {
      return dispatch(addRouteToGroup(srcId, dstId));
    }
    if (dstType === "group") {
      return dispatch(addRouteToGroup(dstId, srcId));
    }

    return Promise.resolve();
  }

export const removeRouteFromGroup = (groupId, compId) =>
  (dispatch, getState) => {
    const report = getState().report;

    const [group, index] = report.route_comps.reduce((a, c, i) => {
      return c.compId === groupId ? [c, i] : a;
    }, [null, -1]);

    if (group) {

      const comp = group.route_comps.reduce((a, c) => {
        return c.compId === compId ? c : a;
      }, null);

      group.route_comps = group.route_comps.filter(rc => rc.compId !== compId);

      const route_comps = [...report.route_comps];
      route_comps.splice(index, 0, { ...comp, inRouteGroup: false });

      const routeDataMap = report.routes.reduce((a, c) => {
        a[c.compId] = c.data;
        return a;
      }, {});

      const routes = route_comps.reduce((a, c) => {
        return [...a, ...getRoutesForRouteComp(c, routeDataMap, Boolean(c.color))]
      }, []);

      return Promise.resolve(
        dispatch({
          type: UPDATE_STATE,
          state: checkRelativeDates({
            ...report,
            route_comps,
            routes
          }, true)
        })
      ).then(() => dispatch(takeSnapShot()))
    }

    return Promise.resolve();
  }

export const updateRouteGroupWorkingSettings = (groupId, key, value) =>
  (dispatch, getState) => {
    const report = getState().report;
    const route_comps = report.route_comps.map(rc => {
      if (rc.compId === groupId) {
        if (typeof key === "string") {
          return {
            ...rc,
            workingSettings: {
              ...rc.workingSettings,
              [key]: value
            }
          }
        }
        else if (typeof key === "object") {
          return {
            ...rc,
            workingSettings: {
              ...rc.workingSettings,
              ...key
            }
          }
        }
      }
      return rc;
    })
    return Promise.resolve(
      dispatch({
        type: UPDATE_STATE,
        state: { route_comps }
      })
    )
  }

export const updateRouteGroup = (groupId, key, value) =>
  (dispatch, getState) => {
    const report = getState().report;
    const route_comps = report.route_comps.map(rc => {
      if (rc.compId === groupId) {
        if (key && value) {
          return {
            ...rc,
            [key]: value
          }
        }
        else {
          return {
            ...rc,
            ...rc.workingSettings
          }
        }
      }
      return rc;
    })
    return Promise.resolve(
      dispatch({
        type: UPDATE_STATE,
        state: { route_comps }
      })
    ).then(() => dispatch(takeSnapShot()))
  }

//****************************************************************************************
//****************************************************************************************
//****************************************************************************************
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
  saveYearsAsRecent: false,

  usingRelativeDates: false,
  relativeDateBase: {
    compId: null,
    startDate: null,
    endDate: null
  }
}

export default (state=INITIAL_STATE, action) => {
	switch (action.type) {
		case UPDATE_STATE:
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
//****************************************************************************************
//****************************************************************************************
//****************************************************************************************

export const takeSnapShot = () =>
	(dispatch, getState) => {
		const state = getState().report;
	  if (window.localStorage) {
	    const snapShotId = state.reportId ? `report-${ state.reportId }` :
        state.templateId ? `template-${ state.templateId }` :
        LOCAL_STORAGE_REPORT_KEY;

	    window.localStorage.setItem(snapShotId, JSON.stringify({
        reportId: state.reportId,
        templateId: state.templateId,
	      name: state.name,
        folder: state.folder,
	      description: state.description,
        color_range: state.colorRange,
	      route_comps: state.route_comps.map(rc =>
	        get(rc, "type", "route") === "route" ? ({
            ...rc,
	          settings: { ...rc.settings },
            type: "route"
	        }) : get(rc, "type", "route") === "synthetic" ? ({
            ...rc,
	          settings: { ...rc.settings },
            type: "synthetic"
	        }) : ({
            ...rc,
            type: "group",
            route_comps: rc.route_comps.map(rc => ({
              ...rc,
  	          settings: { ...rc.settings },
              type: "route"
  	        }))
          })
	      ),
        station_comps: state.station_comps.map(sc =>
          ({ ...sc, settings: { ...sc.settings } })
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
export const removeSnapShot = snapShotId =>
	(dispatch, getState) => {
	  if (window.localStorage) {
	    // const id = state.reportId ? `report-${ state.reportId }` :
      //   state.templateId ? `template-${ state.templateId }` :
      //   LOCAL_STORAGE_REPORT_KEY;
	    window.localStorage.removeItem(snapShotId);
	  }
	}

const _loadReport = report =>
	(dispatch, getState) => {
		const state = getState().report;

		AVAILABLE_COLORS = [...COLORS];
		ROUTE_COMP_ID = -1;

    let usingRelativeDates = false;
    let relativeDateBase = {
      compId: null,
      startDate: null,
      endDate: null
    }

	  report.route_comps.forEach(rc => {
      if (rc.type === "group") {
        rc.route_comps.forEach(rc => {
          ROUTE_COMP_ID = Math.max(ROUTE_COMP_ID, +rc.compId.slice(5));
    	  	if (AVAILABLE_COLORS.includes(rc.color)) {
    	  		AVAILABLE_COLORS = AVAILABLE_COLORS.filter(c => c !== rc.color);
    	  	}
          if (rc.settings.isRelativeDateBase) {
            usingRelativeDates = true;
            relativeDateBase = {
              compId: rc.compId,
              startDate: rc.settings.startDate,
              endDate: rc.settings.endDate
            }
          }
        })
      }
      else {
  	  	ROUTE_COMP_ID = Math.max(ROUTE_COMP_ID, +rc.compId.slice(5));
  	  	if (AVAILABLE_COLORS.includes(rc.color)) {
  	  		AVAILABLE_COLORS = AVAILABLE_COLORS.filter(c => c !== rc.color);
  	  	}
        if (rc.settings.isRelativeDateBase) {
          usingRelativeDates = true;
          relativeDateBase = {
            compId: rc.compId,
            startDate: rc.settings.startDate,
            endDate: rc.settings.endDate
          }
        }
      }
	  });

	  const routeComponentSettings = new Map();
	  report.route_comps.forEach(({ compId, type, ...rest }) => {
      if (type === "group") {
        const { route_comps } = rest;
        route_comps.forEach(({ compId, settings, routeId }) => {
          routeComponentSettings.set(compId, { ...settings, routeId });
        });
      }
      else {
        const { settings, routeId } = rest;
        routeComponentSettings.set(compId, { ...settings, routeId });
      }
	  })

	  const routes = report.route_comps.reduce((a, c) =>
	  	[...a, ...getRoutesForRouteComp(c, null, Boolean(c.color))]
	  , [])

    const station_comps = loadStationCompsFromReport(report, falcorGraph.getCache());

	  return Promise.resolve(
			dispatch({
				type: UPDATE_STATE,
				state: {
			  	reportId: report.id || report.reportId || state.reportId,
          templateId: report.templateId || state.templateId,
          folder: report.folder,
			  	// type: report.type || state.type,
			  	// owner: report.owner || state.owner,
			  	name: report.name,
			  	description: report.description,
			  	route_comps: report.route_comps,
			  	graphs: report.graph_comps.map(g => {
            const gc = {
              ...g,
              id: getUniqueGraphCompId()
            };
            gc.state.title = gc.state.title || "{type}, {data}"
            return gc;
          }),
          colorRange: report.color_range?.length ? [...report.color_range] : [...DEFAULT_COLOR_RANGE],
			  	routes,
			  	routeComponentSettings,
          station_comps,

          usingRelativeDates,
          relativeDateBase
			  }
			})
		)
	}

const _addRouteComp = (state, routeIds, copiedSettings, groupId = null) => {

console.log("ADD ROUTE COMP:", routeIds)

  routeIds = Array.isArray(routeIds) ? routeIds : [routeIds];

	const { yearsWithData } = state,
    lastYear = yearsWithData[yearsWithData.length - 1];

  const baseDates = [`${ lastYear }-01-01`, `${ lastYear }-12-31`];

  const routeComponentSettings = new Map(state.routeComponentSettings),
    newRouteComps = [],
    newRoutes = [];

  for (const routeId of routeIds) {
    const data = get(falcorGraph.getCache(), `routes2.id.${ routeId }`, {});
    const dates = get(data, ["metadata", "value", "dates"], baseDates)
                    .map(d => +d.replaceAll("-", ""));
    const {
  		amPeakStart,
  		pmPeakEnd
  	} = getRoutePeaks();

    const compId = getUniqueRouteCompId();

    const newRouteComp = {
      compId,
      routeId,
      name: `${ routeId }`.includes("synthetic") ? "Synthetic Route" : data.name,
      type: `${ routeId }`.includes("synthetic") ? "synthetic" : "route",
      inRouteGroup: Boolean(groupId),
      settings: copiedSettings ?
        { ...copiedSettings, isRelativeDateBase: false } :
        { startDate: dates[0],
          endDate: dates[1],
          relativeDate: null,
          isRelativeDateBase: false,
          useRelativeDateControls: false,
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

  if (groupId) {
    return {
      route_comps: state.route_comps.map(rc => {
        if (rc.compId === groupId) {
          return {
            ...rc,
            route_comps: [
              ...rc.route_comps,
              ...newRouteComps
            ]
          }
        }
        return rc;
      }),
      routes: [
        ...state.routes,
        ...newRoutes
      ],
      routeComponentSettings
    }
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

  const color = state.route_comps.reduce((a, c) => {
    return c.compId === compId ? c.color : a;
  }, null);
  if (!AVAILABLE_COLORS.includes(color) && COLORS.includes(color)) {
    AVAILABLE_COLORS.push(color);
  }

  const routeDataMap = {};
  state.routes.forEach(r => {
    routeDataMap[r.compId] = r.data;
  });

  const route_comps = state.route_comps.reduce((a, c) => {
    if ((c.type === "group") && (c.compId === compId)) {
      a.push(...c.route_comps);
      return a;
    }
    else if (c.compId === compId) {
      return a;
    }
    a.push(c);
    return a;
  }, []);

  const routes = route_comps.reduce((a, c) => {
  	return [...a, ...getRoutesForRouteComp(c, routeDataMap, true)]
  }, []);

  const graphs = state.graphs.map(g => {
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

const _loadTemplateWithDates = (templateId, routeIds, datesMap, state, stationIds = []) => {

console.log("_loadTemplateWithDates::datesMap", datesMap);

  const falcorCache = falcorGraph.getCache();
  const template = get(falcorCache, `templates2.id.${ templateId }`, {});

  let name = template.name,
    description = template.description,
    folder = template.folder,
    route_comps = get(template, ["route_comps", "value"], []),
    graph_comps = get(template, ["graph_comps", "value"], []),
    station_comps = get(template, ["station_comps", "value"], []),
    colorRangeFromTemplate = get(template, ["color_range", "value"], []),
    defaultType = template.default_type;

  let colorRange = colorRangeFromTemplate.length ? [...colorRangeFromTemplate] : [...DEFAULT_COLOR_RANGE];

  const hasRelativeDates = route_comps.reduce((a, c) => {
    if (c.type === "group") {
      return c.route_comps.reduce((aa, cc) => {
        return aa || Boolean(cc.settings.isRelativeDateBase);
      }, a)
    }
    return a || Boolean(c.settings.isRelativeDateBase);
  }, false);

  if (!hasRelativeDates) {
    return _loadTemplate(templateId, routeIds, state, stationIds = []);
  }

  AVAILABLE_COLORS = [...COLORS];
  ROUTE_COMP_ID = -1;

  route_comps.forEach(rc => {
    if (rc.type === "group") {
      rc.route_comps.forEach(rc => {
        ROUTE_COMP_ID = Math.max(ROUTE_COMP_ID, +rc.compId.slice(5));
        if (AVAILABLE_COLORS.includes(rc.color)) {
          AVAILABLE_COLORS = AVAILABLE_COLORS.filter(c => c !== rc.color);
        }
      })
    }
    ROUTE_COMP_ID = Math.max(ROUTE_COMP_ID, +rc.compId.slice(5));
    if (AVAILABLE_COLORS.includes(rc.color)) {
      AVAILABLE_COLORS = AVAILABLE_COLORS.filter(c => c !== rc.color);
    }
  });

  let variables = route_comps.reduce((a, rc) => {
    if (rc.type === "group") {
      return get(rc, "route_comps", []).reduce((aa, rc) => {
        if (!aa.includes(rc.routeId)) {
          aa.push(rc.routeId);
        }
        return aa;
      }, a);
    }
    else {
      if (!a.includes(rc.routeId)) {
        a.push(rc.routeId);
      }
    }
    return a;
  }, []);

  let idMap = variables.reduce((a, c, i) => {
    a[c] = routeIds[i];
    return a;
  }, {});

  datesMap = routeIds.reduce((a, c) => {
    if (a[c]) {
      return a;
    }
    const metadates = get(falcorCache, ["routes2", "id", c, "metadata", "value", "dates"], []);
    if (metadates.length) {
      a[c] = metadates;
    }
    return a;
  }, datesMap);

// console.log("DATES MAP:", datesMap)

  const routeComponentSettings = new Map();

  let usingRelativeDates = false;
  const relativeDateBase = {
    compId: null,
    startDate: null,
    endDate: null
  };

  route_comps = route_comps.map(rc => {
    if (rc.type === "group") {
      const rg = rc;
      return {
        ...rc,
        route_comps: rc.route_comps.map(rc => {
          const routeId = idMap[rc.routeId];
          const [[startDate, endDate], [startTime, endTime]] = getDatesAndTimes(datesMap[routeId]);
          const settings = {
            ...rc.settings,
            routeId
          }
          if (settings.isRelativeDateBase) {
            if (!rg.usingRelativeDates) {
              usingRelativeDates = true;
              relativeDateBase.compId = rc.compId;
              relativeDateBase.startDate = startDate;
              relativeDateBase.endDate = endDate;
            }
            settings.startDate = startDate;
            settings.endDate = endDate;
          }
          else if (!settings.isRelativeDateBase) {
            const dates = calculateRelativeDates(rc.settings.relativeDate, startDate, endDate);
            if (dates.length) {
              settings.startDate = +dates[0];
              settings.endDate = +dates[1];
            }
          }
          if (startTime && endTime) {
            settings.startTime = startTime;
            settings.endTime = endTime;
          }
          routeComponentSettings.set(rc.compId, { ...settings });
          return {
            ...rc,
            settings,
            routeId
          };
        })
      }
    }
    else {
      const routeId = idMap[rc.routeId];
      // const [startDate, endDate] = datesMap[routeId];
      const [[startDate, endDate], [startTime, endTime]] = getDatesAndTimes(datesMap[routeId]);
      const settings = {
        ...rc.settings,
        routeId
      }
      if (settings.isRelativeDateBase) {
        settings.startDate = startDate;
        settings.endDate = endDate;

        usingRelativeDates = true;
        relativeDateBase.compId = rc.compId;
        relativeDateBase.startDate = startDate;
        relativeDateBase.endDate = endDate;
      }
      else if (!settings.isRelativeDateBase) {
        const dates = calculateRelativeDates(rc.settings.relativeDate, startDate, endDate);
        if (dates.length) {
          settings.startDate = +dates[0];
          settings.endDate = +dates[1];
        }
      }
      if (startTime && endTime) {
        settings.startTime = startTime;
        settings.endTime = endTime;
      }
      routeComponentSettings.set(rc.compId, { ...settings });
      return {
        ...rc,
        settings,
        routeId
      };
    }
  })

  const routes = route_comps.reduce((a, c) => {
  	return [...a, ...getRoutesForRouteComp(c, null, Boolean(c.color))];
  }, []);

  const graphs = graph_comps.map(gc => ({
    id: getUniqueGraphCompId(),
    type: gc.type,
    layout: { ...gc.layout },
    state: {
      ...gc.state,
      title: gc.state.title || "{type}, {data}"
    }
  }))

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
    saveYearsAsRecent: false,

    usingRelativeDates,
    relativeDateBase,

    colorRange,
    defaultType
	};
}

const _loadTemplateWithSyntheticRoute = (templateId, tmcArray, dates, reportState) => {

// console.log("_loadTemplateWithSyntheticRoute", tmcArray, dates)

  const falcorCache = falcorGraph.getCache();
  const template = get(falcorCache, `templates2.id.${ templateId }`, {});

  let name = template.name,
    description = template.description,
    folder = template.folder,
    route_comps = get(template, ["route_comps", "value"], []),
    graph_comps = get(template, ["graph_comps", "value"], []),
    station_comps = get(template, ["station_comps", "value"], []),
    colorRangeFromTemplate = get(template, ["color_range", "value"], []),
    defaultType = template.default_type;

  let colorRange = colorRangeFromTemplate.length ? [...colorRangeFromTemplate] : [...DEFAULT_COLOR_RANGE];

	AVAILABLE_COLORS = [...COLORS];
	ROUTE_COMP_ID = -1;
  route_comps.forEach(rc => {
    if (rc.type === "group") {
      rc.route_comps.forEach(rc => {
        ROUTE_COMP_ID = Math.max(ROUTE_COMP_ID, +rc.compId.slice(5));
        if (AVAILABLE_COLORS.includes(rc.color)) {
          AVAILABLE_COLORS = AVAILABLE_COLORS.filter(c => c !== rc.color);
        }
      })
    }
  	ROUTE_COMP_ID = Math.max(ROUTE_COMP_ID, +rc.compId.slice(5));
  	if (AVAILABLE_COLORS.includes(rc.color)) {
  		AVAILABLE_COLORS = AVAILABLE_COLORS.filter(c => c !== rc.color);
  	}
  });

  const routeId = `synthetic:${ tmcArray.join("_") }`;

  route_comps = route_comps.map(rc => {
    if (rc.type === "group") {
      return {
        ...rc,
        route_comps: rc.route_comps.map(rc => ({
          ...rc,
          type: "synthetic",
          routeId
        }))
      }
    }
    else {
      return {
        ...rc,
        type: "synthetic",
        routeId
      }
    }
  })

  const routeComponentSettings = new Map();

  route_comps.forEach(route_comp => {
    if (route_comp.type === "group") {
      const route_group = route_comp;
      route_group.route_comps.forEach(route_comp => {
      	const {
      		compId,
      		settings
      	} = route_comp;
        settings.routeId = routeId;

        const { isRelativeDateBase } = settings;

        if (isRelativeDateBase) {
          const [[startDate, endDate], [startTime, endTime]] = getDatesAndTimes(dates);

          settings.year = "advanced";
          settings.startDate = +startDate;
          settings.endDate = +endDate;

          if (startTime && endTime) {
            settings.startTime = startTime;
            settings.endTime = endTime;
          }
        }
        routeComponentSettings.set(compId, { ...settings });
      })
    }
    else {
    	const {
    		compId,
    		settings
    	} = route_comp;
      settings.routeId = routeId;

      const { isRelativeDateBase } = settings;

      if (isRelativeDateBase) {
        const [[startDate, endDate], [startTime, endTime]] = getDatesAndTimes(dates);

// console.log("??????????????", startDate, startTime, endDate, endTime)

        settings.year = "advanced";
        settings.startDate = +startDate;
        settings.endDate = +endDate;

        if (startTime && endTime) {
          settings.startTime = startTime;
          settings.endTime = endTime;
        }
      }
      routeComponentSettings.set(compId, { ...settings });
    }
  });

  const graphs = graph_comps.map(gc => ({
    id: getUniqueGraphCompId(),
    type: gc.type,
    layout: { ...gc.layout },
    state: {
      ...gc.state,
      title: gc.state.title || "{type}, {data}"
    }
  }))

  let stateUpdate = {
    name,
    description,
    folder,
    route_comps,
    graphs,
    station_comps,
    routeComponentSettings,
    templateId,
    saveYearsAsRecent: false,
    colorRange,
    defaultType
	};

  const usingRelativeDates = route_comps.reduce((a, c) => {
    if (c.type === "group") {
      return c.route_comps.reduce((aa, cc) => {
        return aa || Boolean(cc.settings.isRelativeDateBase);
      }, a)
    }
    return a || Boolean(c.settings.isRelativeDateBase);
  }, false);

  if (usingRelativeDates) {
    stateUpdate = checkRelativeDates(stateUpdate, true, true);
  }

  stateUpdate.routes = stateUpdate.route_comps.reduce((a, c) => {
    return [...a, ...getRoutesForRouteComp(c, null, Boolean(c.color))];
  }, []);

  return stateUpdate;
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
    colorRangeFromTemplate = get(template, ["color_range", "value"], DEFAULT_COLOR_RANGE),
    defaultType = template.default_type;

  let colorRange = colorRangeFromTemplate.length ? [...colorRangeFromTemplate] : [...DEFAULT_COLOR_RANGE];

	AVAILABLE_COLORS = [...COLORS];
	ROUTE_COMP_ID = -1;
  route_comps.forEach(rc => {
    if (rc.type === "group") {
      rc.route_comps.forEach(rc => {
        ROUTE_COMP_ID = Math.max(ROUTE_COMP_ID, +rc.compId.slice(5));
        if (AVAILABLE_COLORS.includes(rc.color)) {
          AVAILABLE_COLORS = AVAILABLE_COLORS.filter(c => c !== rc.color);
        }
      })
    }
  	ROUTE_COMP_ID = Math.max(ROUTE_COMP_ID, +rc.compId.slice(5));
  	if (AVAILABLE_COLORS.includes(rc.color)) {
  		AVAILABLE_COLORS = AVAILABLE_COLORS.filter(c => c !== rc.color);
  	}
  });

  // LOAD ROUTE COMPS
  let variables = route_comps.reduce((a, rc) => {
    if (rc.type === "group") {
      return get(rc, "route_comps", []).reduce((aa, rc) => {
        if (!aa.includes(rc.routeId)) {
          aa.push(rc.routeId);
        }
        return aa;
      }, a);
    }
    else {
      if (!a.includes(rc.routeId)) {
        a.push(rc.routeId);
      }
    }
    return a;
  }, []);

  const datesMap = routeIds.reduce((a, c) => {
    const dates = get(falcorCache, `routes2.id.${ c }.metadata.value.dates`, []);
    if (Array.isArray(dates) && dates.length === 2) {
      a[c] = dates.map(d => d.replace(/[-]/g, ""));
    }
    return a;
  }, {});

  const idMap = variables.reduce((a, c, i) => {
    a[c] = routeIds[i];
    return a;
  }, {});

  route_comps = route_comps.map(rc => {
    if (rc.type === "group") {
      return {
        ...rc,
        route_comps: rc.route_comps.map(rc => ({
          ...rc,
          routeId: idMap[rc.routeId]
        }))
      }
    }
    else {
      return {
        ...rc,
        routeId: idMap[rc.routeId]
      }
    }
  })

  let saveYearsAsRecent = false;

  const routeComponentSettings = new Map();

  route_comps.forEach(route_comp => {
    if (route_comp.type === "group") {
      const route_group = route_comp;
      route_group.route_comps.forEach(route_comp => {
      	const {
      		compId,
      		settings
      	} = route_comp;
        settings.routeId = route_comp.routeId;

        const { isRelativeDateBase } = settings;
        const hasDates = route_comp.routeId in datesMap;

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

        if (isRelativeDateBase && hasDates) {
          const dates = datesMap[route_comp.routeId];
          const [[startDate, endDate], [startTime, endTime]] = getDatesAndTimes(dates);

          settings.year = "advanced";
          settings.startDate = +startDate;
          settings.endDate = +endDate;

          if (startTime && endTime) {
            settings.startTime = startTime;
            settings.endTime = endTime;
          }
        }
        routeComponentSettings.set(compId, { ...settings });
      })
    }
    else {
    	const {
    		compId,
    		settings
    	} = route_comp;
      settings.routeId = route_comp.routeId;

      const { isRelativeDateBase } = settings;
      const hasDates = route_comp.routeId in datesMap;

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

      if (isRelativeDateBase && hasDates) {
        const dates = datesMap[route_comp.routeId];

        const [[startDate, endDate], [startTime, endTime]] = getDatesAndTimes(dates);

        settings.year = "advanced";
        settings.startDate = +startDate;
        settings.endDate = +endDate;

        if (startTime && endTime) {
          settings.startTime = startTime;
          settings.endTime = endTime;
        }
      }
      routeComponentSettings.set(compId, { ...settings });
    }
  });

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
    state: {
      ...gc.state,
      title: gc.state.title || "{type}, {data}"
    }
  }))

  if (RECENT_REGEX.test(name)) {
  	saveYearsAsRecent = true;
  	name = replace(name, mostRecent);
  }
  if (RECENT_REGEX.test(description)) {
  	saveYearsAsRecent = true;
  	description = replace(description, mostRecent);
  }

  let stateUpdate = {
    name,
    description,
    folder,
    route_comps,
    graphs,
    station_comps,
    routeComponentSettings,
    templateId,
    saveYearsAsRecent,
    colorRange,
    defaultType
	};

  const usingRelativeDates = route_comps.reduce((a, c) => {
    if (c.type === "group") {
      return c.route_comps.reduce((aa, cc) => {
        return aa || Boolean(cc.settings.isRelativeDateBase);
      }, a)
    }
    return a || Boolean(c.settings.isRelativeDateBase);
  }, false);

  if (usingRelativeDates) {
    stateUpdate = checkRelativeDates(stateUpdate, true, true);
  }

  stateUpdate.routes = stateUpdate.route_comps.reduce((a, c) => {
    return [...a, ...getRoutesForRouteComp(c, null, Boolean(c.color))];
  }, []);

  return stateUpdate;
}

const getRoutesForRouteComp = (routeComp, routeDataMap = null, preserveColors = false) => {

  const type = get(routeComp, "type", "route");

  if (type === "group") {
    return get(routeComp, "route_comps", [])
      .reduce((a, c) => {
        const routes = getRoutesForRouteComp(c, routeDataMap, preserveColors);
        a.push(...routes);
        return a;
      }, [])
  }

  if (type === "synthetic") {
    const tmcArray = routeComp.routeId.slice(10).split("_");
    const color = preserveColors ? routeComp.color : getRouteColor();
    routeComp.name = getRouteCompName("Synthetic Route", routeComp.settings);
    routeComp.color = color;
    routeComp.isValid = true;
    return [{
      tmcArray,
      name: routeComp.name,
      settings: { ...routeComp.settings },
      data: get(routeDataMap, `[${ routeComp.compId }]`, {}),
      compId: routeComp.compId,
      color
    }]
  }

  const cache = falcorGraph.getCache(),

    data = get(cache, `routes2.id.${ routeComp.routeId }`, null),

    fromData = get(data, ["tmc_array", "value"], []),

    { endDate } = routeComp.settings,
    year = +endDate.toString().slice(0, 4),
    routes = [];

  let tmcArray = get(cache, ["routes2", "id", routeComp.routeId, year, "tmc_array", "value"], fromData);

  if (!Array.isArray(tmcArray)) {
    tmcArray = [];
  }

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
    routeComp.name = `Route ${ routeComp.routeId } Does Not Exist.`;
    routeComp.isValid = false;
    routeComp.color = getRouteColor();
  }
  return routes;
}

export const RECENT_REGEX = /{recent-(\d+)}/g;
export const replace = (string, mostRecent, test) =>(
	string.replace(RECENT_REGEX, (match, capture) => `${ mostRecent - +capture }`)
)

const NAME_REGEX = /{name}/g;
const YEAR_REGEX = /{year}/g;
const MONTH_REGEX = /{month}/g;
const DATE_REGEX = /{date}/g;
const DATA_REGEX = /{data}/g;

const getRouteCompName = (name, settings) => {
  if (!settings.compTitle) return name;

// console.log("GET ROUTE COMP NAME:", name, JSON.stringify(settings, null, 3))

  return settings.compTitle.replace(NAME_REGEX, name)
    .replace(YEAR_REGEX, getYearString(settings))
    .replace(MONTH_REGEX, getMonthString(settings))
    .replace(DATE_REGEX, getDateString(settings));
}

const getGraphCompTitle = (graphState, route_comps) => {
  const { title } = graphState;
}

const getYearString = settings => {
	if ((settings.year !== 'advanced') && !settings.useRelativeDateControls) return settings.year.toString();

	const start = settings.startDate.toString().slice(0, 4),
		end = settings.endDate.toString().slice(0, 4);

	if (start === end) return start;

	return `${ end }-${ start }`;
}
const MONTHS = {
	"01": "January",
	"02": "February",
	"03": "March",
	"04": "April",
	"05": "May",
	"06": "June",
	"07": "July",
	"08": "August",
	"09": "September",
	"10": "October",
	"11": "November",
	"12": "December"
}
const getMonthString = settings => {

	if (settings.month === 'all') return `Jan-Dec, ${ settings.year }`;
	if ((settings.month !== 'advanced') && !useRelativeDateControls) {
    return `${ MONTHS[settings.month].slice(0, 3) }, ${ settings.year }`;
  }

  const startDate = settings.startDate.toString();
  const endDate = settings.endDate.toString();

	const m1 = startDate.slice(4, 6);
	const m2 = endDate.slice(4, 6);

  const y1 = startDate.slice(0, 4);
  const y2 = endDate.slice(0, 4);

  if (y1 === y2) {
  	if (m1 === m2) {
      return `${ MONTHS[m1].slice(0, 3) }, ${ y1 }`;
    }
  	return `${ MONTHS[m1].slice(0, 3) }-${ MONTHS[m2].slice(0, 3) }, ${ y1 }`;
  }
  return getYearString(settings);
}
const getDateString = settings => {
	const start = settings.startDate.toString(),
		end = settings.endDate.toString();
	if (start === end) {
		const month = start.slice(4, 6),
			day = start.slice(6),
			year = start.slice(0, 4);
		return `${ MONTHS[month].slice(0, 3) } ${ +day }, ${ year }`;
	}

  return getMonthString(settings);
}
