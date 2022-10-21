import React from "react"

import get from "lodash.get"
import { range as d3range } from "d3-array"

import {
  useFalcor,
  useTheme,
  ScalableLoading
} from "modules/avl-components/src"

import { GridGraph } from "modules/avl-graph/src"

import { useComponentDidMount } from "sites/tsmo/pages/Dashboards/components/utils"

import Stoplights from "./Stoplights"

const InitialState = {
  loading: 0,
  incidentsLoaded: false,
  numEvents: 0,
  points: [],
  stoplights: []
}
const Reducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "loading-start":
      return {
        ...state,
        loading: state.loading + 1
      }
    case "loading-stop":
      return {
        ...state,
        loading: state.loading - 1
      }
    case "update-state":
      return { ...state, ...payload };
    default:
      return state;
  }
}

const monthIndexFormat = index => {
  let [date, hour] = index.split(":");
  const ampm = +hour < 12 ? "am" : "pm";
  hour = +hour % 12 === 0 ? 12 : +hour % 12;
  return `${ date } ${ hour }${ ampm }`;
}
const leftAxisMonthFormat = index => {
  return index.slice(0, 10);
}

const epochFormat = index => {
  let minutes = +index * 5;
  let hour = Math.floor(minutes / 60);
  const ampm = +hour < 12 ? "am" : "pm";
  hour = +hour % 12 === 0 ? 12 : +hour % 12;
  minutes = minutes % 60;
  return `${ hour }:${ `0${ minutes }`.slice(-2) }${ ampm }`;
}

const GridComponent = ({ date, data, ttToSpeed, TMCs, tmcWidths, scale, onClick, isVisible = true }) => {

  const [year, /*month*/, day] = React.useMemo(() => {
    return date.split("-").map(Number);
  }, [date]);
  const dateType = !day ? "month" : "day";
  // const resolution = dateType === "month" ? "hour" : "epoch";

  const height = React.useMemo(() => {
    if (dateType === "month") {
      const [y, m] = date.split("-");
      return new Date(y, m, 0).getDate() * 24;
    }
    return 288 * 2;
  }, [date, dateType]);

  const tickValues = React.useMemo(() => {
    if (dateType === "month") {
      return data.filter(d => +d.index.split(":")[1] === 12).map(d => d.index);
    }
    return d3range(0, 288).filter((d, i) => !((i - 3) % 6)).map(d => `00${ d }`.slice(-3) );
  }, [data, dateType]);

  const MOUNTED = useComponentDidMount();

  const [state, dispatch] = React.useReducer(Reducer, InitialState);

  const { loading, numEvents, points, incidentsLoaded } = state;

  const startLoading = React.useCallback(() => {
    if (!MOUNTED) return;
    dispatch({ type: "loading-start" });
  }, [MOUNTED]);
  const stopLoading = React.useCallback(() => {
    if (!MOUNTED) return;
    dispatch({ type: "loading-stop" });
  }, [MOUNTED]);

  const { falcor, falcorCache } = useFalcor();

  // const bottomAxisFormat = React.useCallback(tmc => {
  //   return get(falcorCache, ["tmc", tmc, "meta", year, "firstname"], tmc);
  // }, [year, falcorCache]);

  React.useEffect(() => {
    if (!isVisible) return;

    startLoading();
    falcor.get(["tmc", TMCs, "stoplights", year])
      .then(res => {
        TMCs.reduce((a, c) => {
          const sls = get(res, ["json", "tmc", c, "stoplights", year], []);
          a.push(...sls.map(sl => sl.osm_node_id));
          return a;
        }, [])
      })
      .then(() => stopLoading());
  }, [falcor, TMCs, year, startLoading, stopLoading, isVisible]);

  React.useEffect(() => {
    if (!isVisible) return;

    const totalLength = TMCs.reduce((a, c) => {
      return a + get(tmcWidths, c, 1);
    }, 0);

    let prev = null;

    const stoplights = TMCs.map(tmc => {
      const lights = get(falcorCache, ["tmc", tmc, "stoplights", year, "value"], []);
      const length = get(tmcWidths, tmc, 1);
      const fn = get(falcorCache, ["tmc", tmc, "meta", year, "firstname"]);
      const firstname = fn === prev ? "" : fn;
      prev = fn;
      return { tmc, lights, length: length / totalLength, firstname };
    })
    dispatch({
      type: "update-state",
      stoplights
    })
  }, [falcorCache, TMCs, year, isVisible, tmcWidths])

  React.useEffect(() => {
    if (!isVisible) return;

    startLoading();
    falcor.get(["transcom2", "events", "tmc", TMCs, date, ["Incident", "Construction"]])
      .then(res => {
        const numEvents = TMCs.reduce((a, c) => {
          return ["Incident", "Construction"].reduce((aa, cc) => {
            const n = get(res, ["json", "transcom2", "events", "tmc", c, date, cc, "length"], 0);
            return aa + n;
          }, a);
        }, 0);
        dispatch({
          type: "update-state",
          incidentsLoaded: true,
          numEvents
        });
      })
      .then(() => stopLoading());
  }, [falcor, TMCs, date, startLoading, stopLoading, isVisible]);

  React.useEffect(() => {
    if (!isVisible) return;

    const events = TMCs.reduce((a, c) => {
      return ["Incident", "Construction"].reduce((aa, cc) => {
        const e = get(falcorCache, ["transcom2", "events", "tmc", c, date, cc, "value"], []);
        aa.push(...e);
        return aa;
      }, a);
    }, []);

    const points = events.map(({ start_date_time, type, tmc, ...rest }) => {
      const date = new Date(start_date_time);
      const epoch = date.getHours() * 12 + Math.floor(date.getMinutes() / 5);
      return {
        index: dateType === "month" ?
          `${ start_date_time.slice(0, 10) }:${ `0${ epoch }`.slice(-2) }` :
          `00${ epoch }`.slice(-3),
        key: tmc,
        fill: type === "Incident" ? "#00f" : "#fff",
        stroke: type === "Incident" ? "#00f" : "#fff",
        r: "6",
        data: { start_date_time, type, tmc, ...rest }
      }
    });

    dispatch({
      type: "update-state",
      points
    });
  }, [falcorCache, TMCs, date, dateType, isVisible]);

  const indexFormat = React.useMemo(() => {
    if (dateType === "month") {
      return monthIndexFormat;
    }
    return epochFormat;
  }, [dateType]);

  const leftAxisFormat = React.useMemo(() => {
    if (dateType === "month") {
      return leftAxisMonthFormat;
    }
    return epochFormat;
  }, [dateType]);

  const renderGraph = data.length && isVisible && incidentsLoaded && (numEvents === points.length);

  return (
    <div>
      <div className="relative" style={ { height: `${ height }px`} }>
        <div
          className={ `
            inset-0 ${ loading ? "absolute" : "hidden" } rounded-lg
            flex justify-center items-center z-50 bg-black opacity-50
          ` }
          style={ {
            marginRight: "60px",
            marginBottom: "60px",
            marginLeft: "120px"
          } }
        >
          <ScalableLoading />
        </div>
        <div className="border-2 rounded-lg absolute inset-0"
          style={ {
            marginRight: "60px",
            marginBottom: "60px",
            marginLeft: "120px"
          } }
        />
        { !renderGraph ? null :
          <div className="w-full h-full relative">
            <div className="bg-gray-300 rounded-lg absolute inset-0 flex items-center justify-center"
              style={ {
                marginRight: "60px",
                marginBottom: "60px",
                marginLeft: "120px"
              } }
            >
              <div className="font-bold text-3xl">RENDERING GRAPH...</div>
            </div>
            <GridGraph
              hoverPoints
              bgColor="#000"
              nullColor="#E5E7EB"
              onClick={ onClick }
              showAnimations={ false }
              colors={ scale }
              data={ data }
              keys={ TMCs }
              keyWidths={ tmcWidths }
              points={ points }
              margin={ { top: 0, right: 60, bottom: 0, left: 120 } }
              axisLeft={ {
                format: leftAxisFormat,
                tickValues
              } }
              hoverComp={ {
                HoverComp: GridHoverComp,
                valueFormat: ",.2f",
                indexFormat
              } }
            />
          </div>
        }
      </div>
      <div className="w-full"
        style={ {
          paddingRight: "60px",
          paddingLeft: "120px",
          paddingBottom: "60px"
        } }
      >
        <Stoplights stoplights={ state.stoplights }/>
      </div>
    </div>
  )
}

export default GridComponent;

const GridHoverComp = ({ target, ...rest }) => {
  return target === "graph" ?
    <GraphHoverComp { ...rest }/> :
    <PointHoverComp { ...rest }/>
}

const GraphHoverComp = ({ data, indexFormat, keyFormat, valueFormat }) => {

  const indexes = get(data, "indexes", []);
  const index = get(data, "index", null);

  const [l, h] = React.useMemo(() => {
    const i = indexes.indexOf(index);
    const range = 5;
    const l = i + range < indexes.length ? Math.max(0, i - range) : indexes.length - range * 2 - 1;
    const h = i >= range ? i + range : range * 2;
    return [l, h];
  }, [indexes, index]);

  const theme = useTheme();

  return (
    <div className={ `
      grid grid-cols-1 gap-1 px-2 pt-1 pb-2 rounded
      ${ theme.accent1 }
    ` }>
      <div className="font-bold text-lg leading-6 border-b-2 border-current pl-2">
        { keyFormat(get(data, "key", null)) }
      </div>
      { indexes.slice(l, h + 1).map(i => (
          <div key={ i } className={ `
            flex items-center px-2 rounded transition
          `}>
            <div className="mr-2 rounded-sm color-square w-5 h-5"
              style={ {
                backgroundColor: get(data, ["indexData", i, "color"], null),
                opacity: index === i ? 1 : 0.2
              } }/>
            <div className="mr-4">
              { indexFormat(i) }:
            </div>
            <div className="text-right flex-1">
              { valueFormat(get(data, ["indexData", i, "value"], 0)) }
            </div>
          </div>
        ))
      }
    </div>
  )
}
const PointHoverComp = ({ data }) => {

  const theme = useTheme();

  return (
    <div className={ `
      grid grid-cols-1 gap-1 px-2 pt-1 pb-2 rounded
      ${ theme.accent1 }
    ` }>
      <div className="font-bold text-lg leading-6 border-b-2 border-current pl-2">
        { data.type } ({ data.event_id })
      </div>
      <div className="px-2 grid grid-cols-5">
        <div className="col-span-2 font-bold">Start Time:</div>
        <div className="col-span-3">{ data.start_date_time }</div>

        <div className="col-span-2 font-bold">End Time:</div>
        <div className="col-span-3">{ data.stop_date_time }</div>
      </div>
      <div className="px-2 max-w-md whitespace-pre-wrap">
        { data.description }
      </div>
    </div>
  )
}
