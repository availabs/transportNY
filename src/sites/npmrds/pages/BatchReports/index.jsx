import React from "react"

import get from "lodash/get"
import { range as d3range } from "d3-array"
import download from "downloadjs"
import moment from "moment"

import {API_HOST} from "~/config"

import Sidebar from "./components/Sidebar"

import { useFalcor } from "~/modules/avl-components/src"

import { Input, Button } from "~/modules/avl-map-2/src/uicomponents"

import {
  DEFAULT_COLUMNS,
  DATA_COLUMNS,
  PERCENT_CHANGE_COLUMNS
} from "./utils"
import Route from "./components/Route"

import {
  getDatesAndTimes,
  calculateRelativeDates
} from "~/sites/npmrds/pages/analysis/reports/store/utils/relativedates.utils"

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
            if (st && ed) {
              row.startTime = st;
              row.endTime = et;
            }
          }
          return row;
        })
      ]
    });
  }, [falcorCache]);
  const removeRoute = React.useCallback(i => {
    setSelectedRoutes(routes => [...routes.slice(0, i), ...routes.slice(i + 1)])
  }, []);
  const updateRouteData = React.useCallback((i, k, v) => {
    setSelectedRoutes(prev => {
      const update = [...prev];
      update[i] = { ...update[i], [k]: v };
      return update;
    })
  }, []);

  const [activeDataColumns, _setActiveDataColumns] = React.useState([]);
  const [activePCColumns, setActivePCColumns] = React.useState([]);
  const [activeDateColumns, setActiveDateColumns] = React.useState([]);

  const setActiveDataColumns = React.useCallback(cols => {
    _setActiveDataColumns(cols);
    setActivePCColumns(prev => {
      return prev.filter(col => {
        return cols.reduce((a, c) => {
          return a || col.key.includes(c.key);
        }, false)
      })
    })
  }, [activePCColumns]);

  const pcColumns = React.useMemo(() => {
    return PERCENT_CHANGE_COLUMNS.filter(col => {
      return activeDataColumns.reduce((a, c) => {
        return a || col.key.includes(c.key);
      }, false)
    })
  }, [activeDataColumns]);

  const activeColumns = React.useMemo(() => {
    return [
      ...DEFAULT_COLUMNS,
      ...activeDataColumns,
      ...activeDateColumns.reduce((a, c, i) => {
        a.push(c);
        if (i % 2 === 1) {
          a.push(...activeDataColumns);
          a.push(...activePCColumns);
        }
        return a;
      }, [])
    ]
  }, [activeDataColumns, activePCColumns, activeDateColumns]);

  const routes = React.useMemo(() => {
    return selectedRoutes.map(route => {
      const { startDate, endDate } = route;
      return {
        ...route,
        // ...activeDataColumns.reduce((a, c) => {
        //   a[c.key] = c.header;
        //   return a;
        // }, {}),
        ...activeDateColumns
          .filter(adc => adc.relativeDate)
          .reduce((a, c, i) => {
            const [sd, ed] = calculateRelativeDates(c.relativeDate, startDate, endDate, "YYYY-MM-DD");
            a[c.key] = (i % 2 === 0) ? sd : ed;
            // if (i % 2 === 1) {
            //   // return activeDataColumns.reduce((a, c) => {
            //   //   a[c.key] = c.header;
            //   //   return a;
            //   // }, a)
            //   activeDataColumns.forEach(c => {
            //     a[c.key] = c.header;
            //   });
            //   activePCColumns.forEach(c => {
            //     a[c.key] = c.header;
            //   });
            // }
            return a;
          }, {})
      }
    })
  }, [selectedRoutes, activeDateColumns]);

  const [filename, setFilename] = React.useState(`csv_data_${ moment().format("MM_DD_YYYY") }`);

  const okToSend = React.useMemo(() => {
    if (!activeDataColumns.length) return false;
    if (!routes.length) return false;
    if (!filename.replace(".csv", "").length) return false;

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
  }, [routes, activeColumns, activeDataColumns, filename]);

  const sendToServer = React.useCallback(e => {
    if (!okToSend) return;
    startLoading("Sending data to server and generating .csv file...")
    fetch(`${API_HOST}/batchreports`, {
      method: "POST",
      body: JSON.stringify({
        routes,
        dataColumns: activeDataColumns,
        pcColumns: activePCColumns,
        dateColumns: activeDateColumns
      })
    }).then(res => res.json())
      .then(json => {
        return download(new Blob([json.csv]), `${ filename }.csv`, "text/csv");
      }).then(() => { stopLoading(); })
  }, [routes, okToSend, filename,
      activeDataColumns, activePCColumns, activeDateColumns,
      startLoading, stopLoading
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

      <div className="h-full w-fit">
        <Sidebar
          addRoutes={ addRoutes }
          activeDataColumns={ activeDataColumns }
          setActiveDataColumns={ setActiveDataColumns }
          activePCColumns={ activePCColumns }
          setActivePCColumns={ setActivePCColumns }
          activeDateColumns={ activeDateColumns }
          setActiveDateColumns={ setActiveDateColumns }
          dataColumns={ DATA_COLUMNS }
          pcColumns={ pcColumns }
        >
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center">
              <div className="mr-2">Filename:</div>
              <Input value={ filename }
                onChange={ setFilename }/>
              <div className="ml-2">.csv</div>
            </div>
            <Button className="buttonBlock"
              onClick={ sendToServer }
              disabled={ !okToSend }
            >
              Generate .csv file
            </Button>
          </div>
        </Sidebar>
      </div>

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
