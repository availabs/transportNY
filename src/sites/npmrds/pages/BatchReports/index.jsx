import React from "react"

import get from "lodash/get"
import { range as d3range } from "d3-array"
import download from "downloadjs"
import moment from "moment"

import { csvFormatRows as d3csvFormatRows } from "d3-dsv";

import { API_HOST } from "~/config"

import Sidebar from "./components/Sidebar"

import { useFalcor } from "~/modules/avl-components/src"

import { Input, Button } from "~/modules/avl-map-2/src/uicomponents"

import {
  DEFAULT_COLUMNS,
  DATA_COLUMNS,
  PERCENT_CHANGE_COLUMNS
} from "./utils"
import Route from "./components/Route"
import ColumnNamer from "./components/ColumnNamer"

import {
  getDatesAndTimes,
  calculateRelativeDates,
  RelativeDateOptions
} from "~/sites/npmrds/pages/analysis/reports/store/utils/relativedates.utils"

import "./utils/animations.css"

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
    startLoading("Loading routes and folders...");
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

  const [dataFromServer, setDataFromServer] = React.useState([]);

  const [selectedRoutes, setSelectedRoutes] = React.useState([]);
  const addRoutes = React.useCallback(rids => {
    if (!Array.isArray(rids)) {
      rids = [rids];
    }
    setSelectedRoutes(prev => {
      return [
        ...prev,
        ...rids.map(rid => {
          const route = get(falcorCache, ["routes2", "id", rid]);
          const row = {
            id: rid,
            tmcs: route.tmc_array.value || [],
            name: route.name,
            startTime: "",
            endTime: "",
            startDate: "",
            endDate: ""
          };
          const dates = get(route, ["metadata", "value", "dates"], []);
          if (dates.length) {
            const [[sd, ed], [st, et]] = getDatesAndTimes(dates, "YYYY-MM-DD");
            if (sd && ed) {
              row.startDate = sd;
              row.endDate = ed;
            }
            if (st && et) {
              row.startTime = st;
              row.endTime = et;
            }
          }
          return row;
        })
      ]
    });
    setDataFromServer([]);
  }, [falcorCache]);
  const removeRoute = React.useCallback(i => {
    setSelectedRoutes(routes => [...routes.slice(0, i), ...routes.slice(i + 1)]);
    setDataFromServer([]);
  }, []);
  const updateRouteData = React.useCallback((i, k, v) => {
    setSelectedRoutes(prev => {
      const update = [...prev];
      update[i] = { ...update[i], [k]: v };
      return update;
    })
    setDataFromServer([]);
  }, []);

  const [defaultColumns, setDefaultColumns] = React.useState(DEFAULT_COLUMNS.map(col => ({ ...col })));
  const [activeDataColumns, _setActiveDataColumns] = React.useState([]);
  const [activePCColumns, _setActivePCColumns] = React.useState([]);
  const [activeDateColumns, _setActiveDateColumns] = React.useState([]);

  const setActiveDataColumns = React.useCallback(cols => {
    _setActiveDataColumns(cols.map(col => ({ ...col })));
    _setActivePCColumns(prev => {
      return prev.filter(col => {
        return cols.reduce((a, c) => {
          return a || col.key.includes(c.key);
        }, false)
      })
    });
    setDataFromServer([]);
  }, [activePCColumns]);
  const setActivePCColumns = React.useCallback(cols => {
    _setActivePCColumns(cols.map(col => ({ ...col })));
    setDataFromServer([]);
  }, []);
  const setActiveDateColumns = React.useCallback(func => {
    _setActiveDateColumns(func);
    setDataFromServer([]);
  }, []);

  const pcColumnOptions = React.useMemo(() => {
    return PERCENT_CHANGE_COLUMNS.filter(col => {
      return activeDataColumns.reduce((a, c) => {
        return a || col.key.includes(c.key);
      }, false)
    })
  }, [activeDataColumns]);

  const [activeColumns, setActiveColumns] = React.useState([]);

  React.useEffect(() => {
    const pcColumnsMap = activePCColumns.reduce((a, c) => {
      const [base] = c.key.split("-");
      a[base] = c;
      return a;
    }, {});
    setActiveColumns([
      ...defaultColumns,
      ...activeDataColumns.map(col => ({ ...col, key: `${ col.key }-0` })),
      ...activeDateColumns.reduce((a, c, i) => {
        a.push(c);
        if (i % 2 === 1) {
          activeDataColumns.forEach(col => {
            const header = c.header.replace("End Date", col.header);
            a.push({ ...col, header, key: `${ col.key }-${ (i + 1) / 2 }`});
            if (col.key in pcColumnsMap) {
              const pcCol = pcColumnsMap[col.key];
              const header = c.header.replace("End Date", pcCol.header);
              a.push({ ...pcCol, header, key: `${ pcCol.key }-${ (i + 1) / 2 }`});
            }
          })
        }
        return a;
      }, [])
    ])
  }, [defaultColumns, activeDataColumns, activePCColumns, activeDateColumns]);

  const updateColumnHeaders = React.useCallback(updates => {
    setActiveColumns(prev => {
      return prev.map(column => {
        if (column.key in updates) {
          return { ...column, header: updates[column.key] };
        }
        return column;
      })
    })
  }, []);

  const routes = React.useMemo(() => {
    const dataMap = dataFromServer
      .reduce((a, c) => {
        a[c[0]] = c.slice(1);
        return a;
      }, {});

    return selectedRoutes.map((route, i) => {
      const { startDate, endDate } = route;
      return activeColumns.reduce((a, c, ii) => {
        if (get(dataMap, [i, ii], null)) {
          a[c.key] = dataMap[i][ii];
        }
        else if (c.relativeDate && (c.type === "date:start")) {
          const [sd] = calculateRelativeDates(c.relativeDate, startDate, endDate, "YYYY-MM-DD");
          a[c.key] = sd;
        }
        else if (c.relativeDate && (c.type === "date:end")) {
          const [, ed] = calculateRelativeDates(c.relativeDate, startDate, endDate, "YYYY-MM-DD");
          a[c.key] = ed;
        }
        else if (c.key in route) {
          a[c.key] = route[c.key];
        }
        else {
          a[c.key] = c.header;
        }
        return a;
      }, { ...route })
    })
  }, [selectedRoutes, activeColumns, dataFromServer]);

  const okToSend = React.useMemo(() => {
    if (!activeDataColumns.length) return false;
    if (!routes.length) return false;

    const timeRegex = /\d\d:\d\d(:\d\d)?/;
    const dateRetgex = /\d{4}-\d\d-\d\d/;

    return routes.reduce((a, c) => {
      return activeColumns.reduce((aa, cc) => {
        if (cc.key === "name") {
          return aa && Boolean(c[cc.key].length);
        }
        if (cc.key === "tmcs") {
          return aa && Boolean(c[cc.key].length);
        }
        else if (cc.type.slice(0, 4) === "time") {
          return aa && timeRegex.test(c[cc.key]);
        }
        else if (cc.type.slice(0, 4) === "date") {
          return aa && dateRetgex.test(c[cc.key]);
        }
        return aa;
      }, a);
    }, true);
  }, [routes, activeColumns, activeDataColumns]);

  const sendToServer = React.useCallback(e => {
    if (!okToSend) return;
    startLoading("Sending selections to server and generating data...")
    fetch(`${API_HOST}/batchreports`, {
      method: "POST",
      body: JSON.stringify({
        routes: routes.map((r, i) => ({ ...r, index: i })),
        dataColumns: activeDataColumns,
        pcColumns: activePCColumns,
        dateColumns: activeDateColumns
      })
    }).then(res => res.json())
      .then(json => {
        setDataFromServer(json.data);
      }).then(() => { stopLoading(); })
  }, [routes, okToSend, startLoading, stopLoading,
      activeDataColumns, activePCColumns, activeDateColumns
  ]);

  const [ref, setRef] = React.useState(null);
  const [height, setHeight] = React.useState(null);
  const [width, setWidth] = React.useState(null);
  React.useEffect(() => {
    if (!ref) return;
    const { top, left } = ref.getBoundingClientRect();
    setHeight(`${  window.innerHeight - top - 1 }px`);
    setWidth(`${  window.innerWidth - left - 1 }px`);
  }, [ref]);

  return (
    <div className="h-full max-h-full flex">

      <div className={ `
          inset-0 flex items-center justify-center
          bg-opacity-75 bg-black z-50 text-6xl font-bold text-white
          ${ loading ? "fixed" : "hidden" }
        ` }
      >
        { loadingMessage }
      </div>

      <Collapsable>
        <div className="flex h-full flex-col">
          <Sidebar
            addRoutes={ addRoutes }
            activeDataColumns={ activeDataColumns }
            setActiveDataColumns={ setActiveDataColumns }
            activePCColumns={ activePCColumns }
            setActivePCColumns={ setActivePCColumns }
            activeDateColumns={ activeDateColumns }
            setActiveDateColumns={ setActiveDateColumns }
            dataColumnOptions={ DATA_COLUMNS }
            pcColumnOptions={ pcColumnOptions }/>

          <div className="flex-1 flex flex-col justify-end">

            <div className="grid grid-cols-1 gap-4 p-4">
              <div className="border-2 border-current"/>

              <ColumnNamer columns={ activeColumns }
                updateHeaders={ updateColumnHeaders }/>

              <div className="border-2 border-current"/>

              <Button className="buttonBlock"
                onClick={ sendToServer }
                disabled={ !okToSend }
              >
                Generate Data
              </Button>

              <FileSaver data={ dataFromServer }
                columns={ activeColumns }/>

            </div>

          </div>
        </div>
      </Collapsable>

      <div ref={ setRef }
        className="flex-1 p-4 overflow-auto scrollbar"
        style={ { height, width } }
      >
        <table className="w-full">
          <thead>
            <tr>
              <th />
              { activeColumns.map((col, i) => (
                  <th key={ i }>{ col.header }</th>
                ))
              }
            </tr>
          </thead>
          <tbody>
            { routes.map((r, i) => (
                <Route key={ `${ r.id }-${ i }` }
                  route={ r }
                  index={ i }
                  columns={ activeColumns }
                  update={ updateRouteData }
                  remove={ removeRoute }/>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

const brConfig = {
  path: "/batchreports",
  component: BatchReports,
  auth: true
}
export default brConfig

const FileSaver = ({ data, columns }) => {
  const [filename, setFilename] = React.useState(`csv_data_${ moment().format("MM_DD_YYYY") }`);
  const saveData = React.useCallback(e => {
  e.stopPropagation();
    data = data.map(row => {
      const sliced = row.slice(1);
      sliced[1] = sliced[1].join(", ");
      return sliced;
    });
    data.unshift(columns.map(col => col.header));
    const csv = d3csvFormatRows(data);
    download(new Blob([csv]), `${ filename }.csv`, "text/csv");
  }, [data, columns, filename]);
  return (
    <div>
      <div className="flex items-center mb-2">
        <div className="mr-2">Filename:</div>
        <Input value={ filename }
          onChange={ setFilename }/>
        <div className="ml-2">.csv</div>
      </div>
      <Button className="buttonBlock"
        onClick={ saveData }
        disabled={ !data.length }
      >
        Save Data as CSV
      </Button>
    </div>
  )
}

const Collapsable = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const toggle = React.useCallback(e => {
    e.stopPropagation();
    setIsOpen(isOpen => !isOpen);
  }, []);

  return (
    <div className={ `
        h-full relative bg-white
        ${ isOpen ? `w-[400px] overflow-visible` : "w-8 overflow-hidden" }
      ` }
    >
      <div className={ `
          absolute top-0 right-0 z-20
          bg-gray-300 hover:bg-gray-400
          w-8 h-8 flex items-center justify-center
          rounded cursor-pointer
        ` }
        onClick={ toggle }
      >
        <span className={ `
            fa ${ isOpen ? "fa-chevron-left" : "fa-chevron-right" }
          ` }/>
      </div>
      { isOpen ? null :
        <div className="absolute inset-0 z-10 bg-white"/>
      }
      <div className="w-fit h-full">
        { children }
      </div>
    </div>
  )
}
