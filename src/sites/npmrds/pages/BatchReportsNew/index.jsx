import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"
import { range as d3range } from "d3-array"
import { format as d3format } from "d3-format"
import { csvFormatRows as d3csvFormatRows } from "d3-dsv";
import download from "downloadjs"
import { v4 as uuidv4 } from "uuid"
import moment from "moment"

import { useParams } from "react-router";

import { useFalcor } from "~/modules/avl-components/src"

import { useAuth } from "~/modules/ams/src"

import { API_HOST } from "~/config"

import Sidebar from "./components/Sidebar"
import RouteTableRow from "./components/RouteTableRow"
import { TimeSourceOptions } from "./components/TimeSelector"

import {
  getDatesAndTimes,
  calculateRelativeDates,
  RelativeDateOptions
} from "~/sites/npmrds/pages/analysis/reports/store/utils/relativedates.utils"

import { MultiLevelSelect as MultiLevelSelectNew } from "./components/MultiLevelSelect"

import { Button, Input } from "~/modules/avl-map-2/src/uicomponents"

const LoadingIndicator = ({ loading, message }) => {
  return (
    <div className={ `
        right-0 bottom-0 p-12
        bg-opacity-75 bg-black z-50 text-3xl font-bold text-white
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
      return {
        ...InitialState,
        ...payload.state
      };
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
    case "clear-routes":
      return {
        ...state,
        selectedRoutes: []
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

const strictNaN = v => {
  if (v === null) return true;
  if (v === "") return true;
  return isNaN(v);
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
      ["folders2", "user", "length"],
      ["folders2", "user", "tree"]
    )
  }, [falcor, startLoading]);

  React.useEffect(() => {
    const numRoutes = get(falcorCache, ["routes2", "user", "length"], 0);
    const numFolders = get(falcorCache, ["folders2", "user", "length"], 0);
    // const requests = [];
    if (numRoutes) {
      // requests.push([
      //   "routes2", "user", "index", { from: 0, to: numRoutes - 1 },
      //   ["id", "name", "metadata", "tmc_array"]
      // ])
      falcor.chunk([
        "routes2", "user", "index", d3range(0, numRoutes),
        ["id", "name", "metadata", "tmc_array"]
      ]);
    }
    if (numFolders) {
      falcor.get([
        "folders2", "user", "index", { from: 0, to: numFolders - 1 },
        ["id", "name", "type"]
      ]);
      // requests.push([
      //   "folders2", "user", "index", { from: 0, to: numFolders - 1 },
      //   ["id", "name", "type"]
      // ])
    }
    // if (requests.length) {
    //   falcor.get(...requests);
    // }
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
        .then(() => { stopLoading(); });
    }
  }, [falcor, falcorCache, stopLoading]);

  const [state, dispatch] = React.useReducer(Reducer, InitialState);

  const [filename, setFilename] = React.useState("");
  const [description, setDescription] = React.useState("");
  const setDescriptionCallback = React.useCallback(e => {
    setDescription(e.target.value);
  }, []);

  const loadState = React.useCallback(state => {
    dispatch({
      type: "load-state",
      state
    })
  }, []);

  const params = useParams();
  
  React.useEffect(() => {
    if (params.batchreportId) {

      const brid = params.batchreportId;

      startLoading(`Loading batch report: ${ brid }`);

      falcor.get([
        "batch", "report", "id", brid,
        ["name", "batchreport"]
      ]);

      const filename = get(falcorCache, ["batch", "report", "id", brid, "name"], null);
      if (filename) {
        setFilename(filename);
      }

      const description = get(falcorCache, ["batch", "report", "id", brid, "description"], null);
      if (description) {
        setDescription(description);
      }

      const batchreport = get(falcorCache, ["batch", "report", "id", brid, "batchreport", "value"], null);
      if (batchreport) {
        loadState(batchreport);
        stopLoading();
      }
    }
  }, [falcor, falcorCache, params, startLoading, stopLoading, loadState]);

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
  const clearRoutes = React.useCallback(() => {
    dispatch({
      type: "clear-routes"
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
          return calculateRelativeDates(column.relativeDate, sd, ed, "YYYY-MM-DD", "YYYY-MM-DD")
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
          route[col.name][dc.key] = strictNaN(d) ? "No Data" : format(d);
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

    const TMC_LIMIT = 50;

    startLoading("Sending selections to server and generating data...");

    routes.sort((a, b) => b.tmcs.length - a.tmcs.length);

    const groups = routes.reduce((a, c) => {
        const i = a.length - 1;
        const numTmcs = a[i].reduce((a, c) => a + c.tmcs.length, 0);
        if (!a[i].length || ((numTmcs + c.tmcs.length) < TMC_LIMIT)) {
          a[i].push(c);
        }
        else {
          a.push([c]);
        }
        return a;
      }, [[]])
      .map(routes => ({ id: uuidv4(), routes, tmcs: routes.reduce((a, c) => a + c.tmcs.length, 0) }));

    const result = groups.reduce((a, c) => {
      a[c.id] = [];
      return a;
    }, {});

    groups.reduce((promise, { id, routes }) => {
      return promise.then(() => {
        return fetch(`${ API_HOST }/batchreports/npmrds2/982`, {
          method: "POST",
          body: JSON.stringify({ id, routes, columns })
        }).then(res => res.json())
          .then(({ id, data }) => {
            if (id in result) {
              result[id] = data;
            }
          })
      })
    }, Promise.resolve())
      .then(() => {
        setRouteData([].concat(...Object.values(result)))
      }).then(() => {
        stopLoading();
      });

    // fetch(`${ API_HOST }/batchreports`, {
    //   method: "POST",
    //   body: JSON.stringify({ routes, columns })
    // }).then(res => res.json())
    //   .then(json => {
    //     setRouteData(json.data);
    //   }).then(() => { stopLoading(); })
  }, [routes, columns, okToSend, setRouteData, startLoading, stopLoading]);

  const okToSaveAsCsv = React.useMemo(() => {
    if (!okToSend) return false;
    if (!routeData.length) return false;
    if (!filename) return false;
    return true;
  }, [routeData, okToSend, filename]);

  const saveAsCsv = React.useCallback(e => {
    if (!okToSaveAsCsv) return;
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
    download(new Blob([csv]), `${ filename }.csv`, "text/csv");
    stopLoading();
  }, [routes, columns, routeData, okToSaveAsCsv, startLoading, stopLoading, filename]);

  const okToSaveToFolder = React.useMemo(() => {
    if (!okToSend) return false;
    if (!filename) return false;
    return true;
  }, [okToSend, filename]);

  const saveToFolder = React.useCallback(fid => {
    if (!okToSaveToFolder) return;

    startLoading("Saving Batch Report to folder...");

    const data = {
      batchreport: { ...state, routeData: [] },
      name: filename,
      description,
      batchreportId: null,
      folder: fid
    };
    falcor.call(
      ["batch", "report", "save"], [data]
    ).then(() => stopLoading());
  }, [okToSaveToFolder, startLoading, stopLoading, falcor, state, filename, description]);

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

  const [hovering, setHovering] = React.useState(false);
  const onMouseEnter = React.useCallback(e => {
    setHovering(true);
  }, []);
  const onMouseLeave = React.useCallback(e => {
    setHovering(false);
  }, []);

  const [open, setOpen] = React.useState(false);
  const openFolderSelector = React.useCallback(e => {
    setOpen(true);
  }, []);
  const closeFolderSelector = React.useCallback(e => {
    setOpen(false);
  }, []);

  const stoptheProp = React.useCallback(e => {
    e.stopPropagation();
  }, []);

  return (
    <div className="h-full max-h-full flex">

      <LoadingIndicator loading={ loading }
        message={ loadingMessage }/>

      <Sidebar
        addRoutes={ addRoutes }
        clearRoutes={ clearRoutes }
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
        <div className="p-4 grid grid-cols-2 gap-2">

          <div className="col-span-2">
            <Button className="buttonBlock"
              disabled={ !okToSend }
              onClick={ sendToServer }
            >
              Generate Data
            </Button>
          </div>

          <div className="border-b-2 mt-2 border-current font-bold col-span-2">
            Save Options
          </div>


          <div className="flex col-span-2 items-center">
            <div className="whitespace-nowrap font-bold mr-1">
              Name:
            </div>
            <Input type="text"
              className="input"
              value={ filename }
              onChange={ setFilename }
              placeholder="First, enter a name..."/>
            <div className={ `
                py-1 ml-1 
                ${ hovering ? "text-current" : "text-gray-200" }
              `}
            >
              .csv
            </div>
          </div>

          <div>
            <Button className={ okToSaveAsCsv ? "buttonBlockPrimary" : "buttonBlock" }
              style={ { opacity: okToSaveAsCsv ? "1.0" : "0.5" } }
              disabled={ !okToSaveAsCsv }
              onClick={ saveAsCsv }
              onMouseEnter={ onMouseEnter }
              onMouseLeave={ onMouseLeave }
            >
              Save as CSV
            </Button>
          </div>

          <div className="relative">
            <Button className={ okToSaveToFolder ? "buttonBlockSuccess" : "buttonBlock" }
              style={ { opacity: okToSaveToFolder ? "1.0" : "0.5" } }
              disabled={ !okToSaveToFolder }
              onClick={ openFolderSelector }
            >
              Save to a Folder...
            </Button>
            <div className={ `
                absolute bottom-[-1px] left-[-1px] z-50
                rounded-bl bg-white shadow-lg shadow-black
              ` }
              style={ { display: open ? "block" : "none" } }
              onClick={ closeFolderSelector }
            >
              <span className={ `
                  fa fa-close bg-gray-200 hover:bg-gray-400 rounded-bl
                  px-2 py-1 cursor-pointer absolute right-0 top-0
                ` }/>
              <div className="pl-2 pt-2 grid grid-cols-1"
                onClick={ stoptheProp }
              >
                <div className="font-bold border-b-2 border-current mb-1 mr-2">
                  Add a description...
                </div>
                <div className="mr-2">
                  <textarea
                    value={ description }
                    onChange={ setDescriptionCallback }
                    className={ `
                      w-full px-2 py-1 pointer-events-auto
                    ` }/>
                </div>
              </div>
              <FolderSelector saveToFolder={ saveToFolder }/>
            </div>
          </div>

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

const brConfig = [
  { name:'Batch Report',
    path: "/batchreportsnew",
    component: BatchReports,
    mainNav: true,
    icon: 'fa fa-table-list',
    auth: true
  },
  { name:'Batch Report',
    path: "/batchreportsnew/report/:batchreportId",
    component: BatchReports,
    mainNav: false,
    icon: 'fa fa-table-list',
    auth: true
  }
]
export default brConfig

const FolderItem = ({ folder, saveToFolder, isChild = false }) => {

  const hasChildren = React.useMemo(() => {
    return Boolean(folder.children.length);
  }, [folder.children]);

  const [hovering, setHovering] = React.useState(false);
  const onMouseOver = React.useCallback(e => {
    setHovering(true);
  }, []);
  const onMouseOut = React.useCallback(e => {
    setHovering(false);
  }, []);

  const doSaveToFolder = React.useCallback(e => {
    saveToFolder(folder.id);
  }, [saveToFolder, folder.id]);

  return (
    <div className={ `
        whitespace-nowrap px-1 cursor-pointer
        ${ isChild ? "" : "rounded-l" }
        ${ hasChildren ? "" : "mr-2 rounded-r" } relative
        bg-white hover:bg-gray-200
      ` }
      onMouseOver={ hasChildren ? onMouseOver : null }
      onMouseOut={ hasChildren ? onMouseOut : null }
      onClick={ doSaveToFolder }
    >
      <div className="flex items-center">
        <div className="flex-1 flex items-center">
            <span className={ `${ folder.icon } mr-1 w-6 text-center` }
                  style={ { color: folder.color } }/>
          { folder.name }
        </div>
        { !hasChildren ? null :
          <span className="fa fa-caret-right mr-1"/>
        }
      </div>

      { !hasChildren ? null :
        <div className={ `
            h-fit w-fit absolute z-75 bottom-0 bg-white py-2
          ` }
          style={ {
            display: hovering ? "block" : "none",
            left: "100%",
            bottom: "-0.5rem"
          } }
        >
          { folder.children.map(f =>
              <FolderItem key={ f.id } folder={ f } isChild
                saveToFolder={ saveToFolder }/>
            )
        }
        </div>
      }
    </div>
  )
}

const FOLDER_TYPES_SORT_VALUES = {
  "user": 1,
  "group": 2,
  "AVAIL": 3
}

const FolderSelector = ({ folderTree, ...props }) => {

  const { falcor, falcorCache } = useFalcor();

  const user = useAuth();

  const groupAuthLevels = React.useMemo(() => {
    return (user.meta || []).reduce((a, c) => {
      a[c.group] = c.authLevel;
      return a;
    }, {});
  }, [user]);

  const foldersTree = React.useMemo(() => {
    return get(falcorCache, ["folders2", "user", "tree", "value"], [])
      .filter(f => {
        if (f.type === "user") return true;
        if (f.type === "AVAIL") return groupAuthLevels["AVAIL"] >= f.editable;
        return (groupAuthLevels[f.owner] || 0) >= f.editable;
      })
      .sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return FOLDER_TYPES_SORT_VALUES[a.type] - FOLDER_TYPES_SORT_VALUES[b.type];
      });
  }, [falcorCache, groupAuthLevels]);

  return (
    <div className="py-2 pl-2">
      <div className="font-bold border-b-2 border-current mb-1 mr-2">
        Select a folder to save to...
      </div>
      { foldersTree.map(f =>
          <FolderItem key={ f.id } { ...props } folder={ f }/>
        )
      }
    </div>
  )
}