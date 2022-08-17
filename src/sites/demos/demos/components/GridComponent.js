import React from "react"

import get from "lodash.get"

import {
  useFalcor,
  useTheme,
  ScalableLoading
} from "modules/avl-components/src"

import { GridGraph } from "modules/avl-graph/src"

import { useComponentDidMount } from "sites/tsmo/pages/Dashboards/components/utils"

const indexFormat = index => {
  let [date, hour] = index.split(":");
  const ampm = +hour < 12 ? "am" : "pm";
  hour = +hour % 12 === 0 ? 12 : +hour % 12;
  return `${ date } ${ hour }${ ampm }`;
}
const leftAxisFormat = index => {
  return index.slice(0, 10);
}

const InitialState = {
  loading: 0,
  incidentsLoaded: false,
  numEvents: 0,
  points: [],
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

const GridComponent = ({ month, data, ttToSpeed, TMCs, tmcWidths, scale, isVisible }) => {

  const tickValues = React.useMemo(() => {
    return data.filter(d => d.index.split(":")[1] == 12).map(d => d.index)
  }, [data]);

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

  React.useEffect(() => {
    if (!isVisible) return;
    startLoading();
    falcor.get(["transcom2", "events", "tmc", TMCs, month, ["Incident", "Construction"]])
      .then(res => {
        const numEvents = TMCs.reduce((a, c) => {
          return ["Incident", "Construction"].reduce((aa, cc) => {
            const n = get(res, ["json", "transcom2", "events", "tmc", c, month, cc, "length"], 0);
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
  }, [falcor, TMCs, month, startLoading, stopLoading, isVisible]);

  React.useEffect(() => {
    if (!isVisible) return;

    const events = TMCs.reduce((a, c) => {
      return ["Incident", "Construction"].reduce((aa, cc) => {
        const e = get(falcorCache, ["transcom2", "events", "tmc", c, month, cc, "value"], []);
        aa.push(...e);
        return aa;
      }, a);
    }, []);

    const points = events.map(({ start_date_time, type, tmc }) => {
      const date = new Date(start_date_time);
      const epoch = date.getHours() * 12 + Math.floor(date.getMinutes() / 5);
      return {
        index: `${ start_date_time.slice(0, 10) }:${ `0${ epoch }`.slice(-2) }`,
        key: tmc,
        fill: type === "Incident" ? "#00f" : "#fff",
        stroke: type === "Incident" ? "#00f" : "#fff",
        r: "6"
      }
    })

    dispatch({
      type: "update-state",
      points
    });
  }, [falcorCache, TMCs, month, isVisible]);

  const renderGraph = data.length && isVisible && incidentsLoaded && (numEvents === points.length);

  return (
    <>
      <div className={ `
        inset-0 ${ loading ? "absolute" : "hidden" }
        flex justify-center items-center z-50 bg-black opacity-50
      ` }>
        <ScalableLoading />
      </div>
      { !renderGraph ? null :
        <div className="w-full h-full relative">
          <div className="bg-gray-300 absolute inset-0 flex items-center justify-center"
            style={ {
              marginRight: "60px",
              marginBottom: "60px",
              marginLeft: "120px"
            } }>
            <div className="font-bold text-3xl">RENDERING GRAPH...</div>
          </div>
          <GridGraph
            showAnimations={ false }
            colors={ scale }
            data={ data }
            keys={ TMCs }
            keyWidths={ tmcWidths }
            points={ points }
            margin={ { top: 0, right: 60, bottom: 60, left: 120 } }
            axisBottom={ { tickDensity: 1 } }
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
    </>
  )
}

export default GridComponent;

const GridHoverComp = ({ data, indexFormat, keyFormat, valueFormat }) => {

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
      <div className="font-bold text-lg leading-6 border-b-2 pl-2">
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
