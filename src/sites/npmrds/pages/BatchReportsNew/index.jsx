import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"
import { range as d3range } from "d3-array"
import { format as d3format } from "d3-format"
import { csvFormatRows as d3csvFormatRows } from "d3-dsv";
import download from "downloadjs"
import { v4 as uuidv4 } from "uuid"
import moment from "moment"

import { useFalcor } from "~/modules/avl-components/src"

import { API_HOST } from "~/config"

import Sidebar from "./components/Sidebar"
import RouteTableRow from "./components/RouteTableRow"
import { TimeSourceOptions } from "./components/TimeSelector"

import {
  getDatesAndTimes,
  calculateRelativeDates,
  RelativeDateOptions
} from "~/sites/npmrds/pages/analysis/reports/store/utils/relativedates.utils"

import { Button, Input } from "~/modules/avl-map-2/src/uicomponents"

const LoadingScreen = ({ loading, message }) => {
  return (
    <div className={ `
        inset-0 flex items-center justify-center
        bg-opacity-75 bg-black z-50 text-6xl font-bold text-white
        ${ loading ? "fixed" : "hidden" }
      ` }
    >
      { message }
    </div>
  )
}

const BATCH_REPORT_STORAGE_KEY = "batch-report-data";

const InitialState = {
  selectedRoutes: [],
  columns: [],
  timeSource: TimeSourceOptions[0],
  startTime: "06:00:00",
  endTime: "21:00:00",
  routeData: []
}
const Reducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "load-state":
      return payload.state;
    case "update-state":
    case "set-route-data":
      return { ...state, ...payload };
    case "add-routes":
      return {
        ...state,
        selectedRoutes: [
          ...state.selectedRoutes,
          ...payload.routes
        ]
      }
    case "remove-route": {
      const srs = state.selectedRoutes;
      const { index: i } = payload;
      return {
        ...state,
        selectedRoutes: [...srs.slice(0, i), ...srs.slice(i + 1)]
      }
    }
    case "update-route-data": {
      const { index, key, value } = payload;
      const uuid = state.selectedRoutes[index].uuid;
      return {
        ...state,
        selectedRoutes: state.selectedRoutes.map((route, i) => {
          if (index === i) {
            return { ...route, [key]: value };
          }
          return route;
        }),
        routeData: state.routeData.filter(rd => rd.uuid !== uuid)
      }
    }
    case "add-column":
      return {
        ...state,
        columns: [...state.columns, payload.column]
      }
    case "edit-column": {
      const { edit } = payload;
      return {
        ...state,
        columns: state.columns.map(column => {
          if (column.uuid === edit.uuid) {
            return edit;
          }
          return column;
        }),
        routeData: []
      }
    }
    case "delete-column": {
      const { uuid } = payload;
      return {
        ...state,
        columns: state.columns.filter(c => c.uuid !== uuid),
        routeData: []
      }
    }
    default:
      return state;
  }
}

const BatchReports = props => {
  const { falcor, falcorCache } = useFalcor();

  const [loading, setLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("");

  const startLoading = React.useCallback(msg => {
    setLoading(true);
    if (msg) setLoadingMessage(msg);
  }, []);
  const stopLoading = React.useCallback(() => {
    setLoading(false);
  }, []);

  React.useEffect(() => {
    startLoading("Loading routes and populating folders...");
    falcor.get(
      ["routes2", "user", "length"],
      ["folders2", "user", "length"]
    )
  }, [falcor, startLoading]);

  React.useEffect(() => {
    const numRoutes = get(falcorCache, ["routes2", "user", "length"], 0);
    const numFolders = get(falcorCache, ["folders2", "user", "length"], 0);
    const requests = [];
    if (numRoutes) {
      requests.push([
        "routes2", "user", "index", { from: 0, to: numRoutes - 1 },
        ["id", "name", "metadata", "tmc_array"]
      ])
    }
    if (numFolders) {
      requests.push([
        "folders2", "user", "index", { from: 0, to: numFolders - 1 },
        ["id", "name", "type"]
      ])
    }
    if (requests.length) {
      falcor.get(...requests);
    }
  }, [falcor, falcorCache]);

  React.useEffect(() => {
    const numFolders = get(falcorCache, ["folders2", "user", "length"], 0);
    const fids = d3range(numFolders)
      .reduce((a, c) => {
        const [,, fid] = get(falcorCache, ["folders2", "user", "index", c, "value"], []);
        if (fid) {
          a.push(fid);
        }
        return a;
      }, []);
      if (fids.length) {
        falcor.get(["folders2", "stuff", fids])
          .then(() => stopLoading());
      }
  }, [falcor, falcorCache, startLoading, stopLoading]);

  const [state, dispatch] = React.useReducer(Reducer, InitialState);

  const loadState = React.useCallback(state => {
    dispatch({
      type: "load-state",
      state
    })
  }, []);

  const {
    selectedRoutes,
    timeSource,
    startTime,
    endTime,
    columns,
    routeData
  } = state;

  const setTimeSource = React.useCallback(ts => {
    dispatch({
      type: "update-state",
      timeSource: ts
    });
  }, []);
  const setStartTime = React.useCallback(st => {
    dispatch({
      type: "update-state",
      startTime: st
    });
  }, []);
  const setEndTime = React.useCallback(et => {
    dispatch({
      type: "update-state",
      endTime: et
    });
  }, []);

  const addRoutes = React.useCallback(rids => {
    if (!Array.isArray(rids)) {
      rids = [rids];
    }
    const routes = rids.map(rid => {
      const data = get(falcorCache, ["routes2", "id", rid]);
      const route = {
        rid,
        uuid: uuidv4(),
        name: data.name,
        tmcs: [...(data.tmc_array?.value || [])]
      };
      const dates = get(data, ["metadata", "value", "dates"], []);
      const [[sd, ed], [st, et]] = getDatesAndTimes(dates, "YYYY-MM-DD");
      if (sd && ed) {
        route.startDate = sd;
        route.endDate = ed;
      }
      if (st && et) {
        route.startTime = st;
        route.endTime = et;
      }
      return route;
    })
    dispatch({
      type: "add-routes",
      routes
    })
  }, [falcorCache]);
  const removeRoute = React.useCallback(index => {
    dispatch({
      type: "remove-route",
      index
    })
  }, []);
  const updateRouteData = React.useCallback((i, k, v) => {
    dispatch({
      type: "update-route-data",
      index: i,
      key: k,
      value: v
    })
  }, []);

  const addColumn = React.useCallback(column => {
    dispatch({
      type: "add-column",
      column
    })
  }, []);
  const editColumn = React.useCallback(edit => {
    dispatch({
      type: "edit-column",
      edit
    })
  }, []);
  const deleteColumn = React.useCallback(uuid => {
    dispatch({
      type: "delete-column",
      uuid
    })
  }, []);

  const setRouteData = React.useCallback(routeData => {
    dispatch({
      type: "set-route-data",
      routeData
    })
  }, []);

  const routes = React.useMemo(() => {

    const getDates = (route, column, base) => {
      switch (column.dateSelection) {
        case "from-route": {
          return [
            route.startDate || column.startDate,
            route.endDate || column.endDate
          ]
        }
        case "user-defined":
          return [column.startDate, column.endDate];
        case "relative":
          const sd = route[base].startDate;
          const ed = route[base].endDate;
          return calculateRelativeDates(column.relativeDate, sd, ed, "YYYY-MM-DD")
      }
    }

    const getTimes = route => {
      if (timeSource === "From Route") {
        return [
          route.startTime || startTime,
          route.endTime || endTime
        ];
      }
      else {
        return [startTime, endTime];
      }
    }

    const format = d3format(",.2f");

    return selectedRoutes.map(sr => {
      const [startTime, endTime] = getTimes(sr);
      const data = routeData.find(rd => rd.uuid === sr.uuid);
      const route = { ...sr, startTime, endTime };
      columns.forEach(col => {
        const [startDate, endDate] = getDates(route, col, columns[0].name);
        route[col.name] = {
          startDate,
          endDate
        };
        col.dataColumns.forEach(dc => {
          const d = get(data, [col.name, dc.key], null);
          route[col.name][dc.key] = d ? format(d) : "No Data";
          if (d && dc.key.includes("-pc")) {
            route[col.name][dc.key] = `${ route[col.name][dc.key] }%`
          }
        })
      })
      return route;
    })
  }, [selectedRoutes, columns, timeSource, startTime, endTime, routeData]);

  const okToSend = React.useMemo(() => {
    if (!routes.length) return false;
    if (!columns.length) return false;

    const timeRegex = /\d\d:\d\d(:\d\d)?/;
    const dateRegex = /\d{4}-\d\d-\d\d/;

    return routes.reduce((a, c) => {
      if (!c.name.length) return false;
      if (!c.tmcs.length) return false;
      const { startTime, endTime } = c;
      return columns.reduce((aa, cc) => {
        const { startDate, endDate } = c[cc.name];
        return aa && Boolean(startTime && endTime && startDate && endDate);
      }, a);
    }, true);
  }, [routes, columns]);

  const sendToServer = React.useCallback(e => {
    if (!okToSend) return;
    startLoading("Sending selections to server and generating data...");
    fetch(`${ API_HOST }/batchreports`, {
      method: "POST",
      body: JSON.stringify({ routes, columns })
    }).then(res => res.json())
      .then(json => {
        setRouteData(json.data);
      }).then(() => { stopLoading(); })
  }, [routes, columns, okToSend, setRouteData]);

  const okToSave = React.useMemo(() => {
    if (!okToSend) return false;
    if (!routeData.length) return false;

    return routes.reduce((a, c) => {
      const data = routeData.find(rd => rd.uuid === c.uuid);
      return columns.reduce((aa, cc) => {
        return cc.dataColumns.reduce((aaa, ccc) => {
          const d = get(data, [cc.name, ccc.key], null);
          return aaa && Boolean(d);
        }, aa);
      }, a);
    }, true);
  }, [routes, columns, routeData, okToSend]);

  const [filename, setFilename] = React.useState(`csv_data_${ moment().format("MM_DD_YYYY") }`)

  const saveAsCsv = React.useCallback(e => {
    if (!okToSave) return;
    startLoading("Saving selections as CSV file...");

    const headers = ["route name", "tmcs", "start time", "end time"];
    columns.forEach(column => {
      headers.push(`${ column.name } start date`, `${ column.name } end date`);
      column.dataColumns.forEach(dc => {
        headers.push(`${ column.name } ${ dc.header }`);
      })
    })
    const csvData = [headers];

    routes.forEach(route => {
      const { name, tmcs, startTime, endTime } = route;
      const csvRow = [name, tmcs.join(", "), startTime, endTime];
      const data = routeData.find(rd => rd.uuid === route.uuid);
      columns.forEach(column => {
        const { startDate, endDate } = route[column.name];
        csvRow.push(startDate, endDate);
        column.dataColumns.forEach(dataColumn => {
          const d = get(data, [column.name, dataColumn.key], null);
          csvRow.push(d);
        })
      })
      csvData.push(csvRow);
    })
    const csv = d3csvFormatRows(csvData);
    download(new Blob([csv]), `${ filename }.csv`, "text/csv")
    stopLoading();
  }, [routes, columns, routeData, okToSave, startLoading, stopLoading, filename]);

  React.useEffect(() => {
    if (window.localStorage) {
      const data = window.localStorage.getItem(BATCH_REPORT_STORAGE_KEY);
      if (data) {
        loadState(JSON.parse(data));
      }
    }
  }, [loadState]);

  React.useEffect(() => {
    if (window.localStorage) {
      if (!isEqual(state, InitialState)) {
        window.localStorage.setItem(
          BATCH_REPORT_STORAGE_KEY,
          JSON.stringify(state)
        )
      }
      else {
        window.localStorage.removeItem(BATCH_REPORT_STORAGE_KEY);
      }
    }
  }, [state]);

  return (
    <div className="h-full max-h-full flex">

      <LoadingScreen loading={ loading }
        message={ loadingMessage }/>

      <Sidebar
        addRoutes={ addRoutes }
        timeSource={ timeSource }
        setTimeSource={ setTimeSource }
        startTime={ startTime }
        setStartTime={ setStartTime }
        endTime={ endTime }
        setEndTime={ setEndTime }
        columns={ columns }
        addColumn={ addColumn }
        editColumn={ editColumn }
        deleteColumn={ deleteColumn }
      >
        <div className="p-4 grid grid-cols-1 gap-2">
          <Button className="buttonBlock"
            disabled={ !okToSend }
            onClick={ sendToServer }
          >
            Generate Data
          </Button>
          <div className="grid grid-cols-3">
            <div className="py-1 text-right mr-1 font-bold">File Name</div>
            <div className="col-span-2 flex">
              <div className="flex-1">
                <Input type="text"
                  className="input text-right"
                  value={ filename }
                  onChange={ setFilename }/>
              </div>
              <div className="py-1 ml-1">.csv</div>
            </div>
          </div>
          <Button className="buttonBlock"
            disabled={ !okToSave }
            onClick={ saveAsCsv }
          >
            Save as CSV
          </Button>
        </div>
      </Sidebar>

      <div className="flex-1 relative">
        <div className="absolute inset-0 p-4 overflow-auto scrollbar-xl">

          { !routes.length ? null :
            <table>
              <thead>
                <tr>
                  <th />
                  <th />
                  { columns.map((col, i) => (
                      <th key={ col.name }
                        className={ `
                          text-xl ${ i % 2 === 0 ? "bg-gray-300" : "" }
                        ` }
                      >
                        { col.name }
                      </th>
                    ))
                  }
                </tr>
                <tr>
                  <th />
                  <th>Route Information</th>

                  { columns.map((col, i) => {
                      return (
                        <th key={ col.name }
                          className={ `
                            ${ i % 2 === 0 ? "bg-gray-300" : "" }
                          ` }
                        >
                          <div className={ `grid grid-cols-${ col.dataColumns.length } gap-2` }>
                            { col.dataColumns.map((dc, i) => {
                                return (
                                  <div key={ dc.key }>
                                    { dc.header }
                                  </div>
                                )
                              })
                            }
                          </div>
                        </th>
                      )
                    })
                  }
                </tr>
              </thead>
              <tbody>
                { routes.map((r, i) => (
                    <RouteTableRow key={ r.uuid }
                      index={ i }
                      route={ r }
                      remove={ removeRoute }
                      update={ updateRouteData }
                      columns={ columns }/>
                  ))
                }
              </tbody>
            </table>
          }

        </div>
      </div>

    </div>
  )
}

const brConfig = {
  path: "/batchreportsnew",
  component: BatchReports,
  auth: true
}
export default brConfig
