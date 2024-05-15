import React from "react"

import get from "lodash/get"
import { range as d3range } from "d3-array"
import { v4 as uuidv4 } from "uuid"
import moment from "moment"

import { useFalcor } from "~/modules/avl-components/src"

import Sidebar from "./components/Sidebar"
import RouteTableRow from "./components/RouteTableRow"
import { TimeSourceOptions } from "./components/TimeSelector"

import {
  getDatesAndTimes,
  calculateRelativeDates,
  RelativeDateOptions
} from "~/sites/npmrds/pages/analysis/reports/store/utils/relativedates.utils"

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

  const [selectedRoutes, setSelectedRoutes] = React.useState([]);
  const [timeSource, setTimeSource] = React.useState(TimeSourceOptions[0]);
  const [startTime, setStartTime] = React.useState("06:00:00");
  const [endTime, setEndTime] = React.useState("21:00:00");
  const addRoutes = React.useCallback(rids => {
    if (!Array.isArray(rids)) {
      rids = [rids];
    }
    setSelectedRoutes(prev => {
      return [
        ...prev,
        ...rids.map(rid => {
          const data = get(falcorCache, ["routes2", "id", rid]);
          const route = {
            rid,
            uuid: uuidv4(),
            name: data.name,
            tmcs: [...(data.tmc_array?.value || [])],
            dates: get(data, ["metadata", "value", "dates"], [])
          };
          const [[sd, ed], [st, et]] = getDatesAndTimes(route.dates, "YYYY-MM-DD");
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
      ]
    });
  }, [falcorCache, startTime, endTime, timeSource]);
  const removeRoute = React.useCallback(i => {
    setSelectedRoutes(routes => [...routes.slice(0, i), ...routes.slice(i + 1)]);
  }, []);
  const updateRouteData = React.useCallback((i, k, v) => {
    setSelectedRoutes(prev => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [k]: v };
      return updated;
    })
  }, []);

  const [columns, setColumns] = React.useState([]);
  const addColumn = React.useCallback(column => {
    setColumns(prev => [...prev, column]);
  }, []);
  const editColumn = React.useCallback(edit => {
    setColumns(columns => {
      return columns.map(column => {
        if (column.uuid === edit.uuid) {
          return edit;
        }
        return column;
      })
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
      if ((timeSource === "From Route") && route.startTime && route.endTime) {
        return [route.startTime, route.endTime];
      }
      else {
        return [startTime, endTime];
      }
    }

    return selectedRoutes.map(sr => {
      const [startTime, endTime] = getTimes(sr);
      const route = { ...sr };
      columns.forEach(col => {
        const [startDate, endDate] = getDates(route, col, columns[0].name);
        route[col.name] = {
          startDate,
          endDate,
          startTime,
          endTime
        };
        col.dataColumns.forEach(dc => {
          route[col.name][dc.key] = "No Data"
        })
      })
      return route;
    })
  }, [selectedRoutes, columns, timeSource, startTime, endTime]);

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
        editColumn={ editColumn }/>

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
                          ${ i % 2 === 0 ? "bg-gray-300" : "" }
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
