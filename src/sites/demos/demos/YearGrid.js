import React from "react"

import TrackVisibility from 'react-on-screen';

import { useParams } from "react-router-dom"

import get from "lodash.get"
import { groups as d3groups } from "d3-array"
import { scaleQuantile } from "d3-scale"

import {
  useFalcor,
  useTheme,
  getColorRange,
  ScalableLoading
} from "modules/avl-components/src"

import { GridGraph } from "modules/avl-graph/src"

const isLeapYear = year => {
  return (year % 400 === 0) || ((year % 100 !== 0) && (year % 4 === 0));
}
const daysInYearear = year => {
  return isLeapYear(year) ? 366 : 365;
}
const DirectionMap = {
  N: "North",
  S: "South",
  E: "East",
  W: "West"
}

const GridColors = getColorRange(5, "RdYlGn")

const YearGrid = ({}) => {

  const [year, setYear] = React.useState(2021);
  const [geo, setGeo] = React.useState("COUNTY|36001");
  const geoid = React.useMemo(() => {
    const [level, id] = geo.split("|");
    return id || "unknown";
  }, [geo])
  const [tmclinear, setTmcLinear] = React.useState(212);
  const [direction, setDirection] = React.useState("N");

  const [TMCs, setTMCs] = React.useState([]);

  const [gridData, setGridData] = React.useState([]);
  const [tmcWidths, setTmcWidths] = React.useState({});
  const [scale, setScale] = React.useState(() => scaleQuantile());

  const [loading, setLoading] = React.useState(0);
  const loadingStart = React.useCallback(() => {
    setLoading(prev => prev + 1);
  }, []);
  const loadingStop = React.useCallback(() => {
    setLoading(prev => prev - 1);
  }, []);

  const params = useParams();

  React.useEffect(() => {
    if (params.year) {
      setYear(params.year);
    }
    if (params.tmclinear) {
      const [geoid, tmclinear, direction] = params.tmclinear.split("_");
      setGeo(`COUNTY|${ geoid }`);
      setTmcLinear(tmclinear);
      setDirection(direction.toUpperCase());
    }
  }, [params]);

  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    loadingStart();
    falcor.get(["geo", geoid, "name"])
      .then(() => loadingStop());
  }, [falcor, geoid]);

  const name = React.useMemo(() => {
    return get(falcorCache, ["geo", geoid, "name"], "Uknown Geography");
  }, [falcorCache, geoid])

  React.useEffect(() => {
    loadingStart();
    falcor.get(["tmc", "tmclinear", year, geo, tmclinear, direction])
      .then(() => loadingStop());
  }, [falcor, year, geo, tmclinear, direction, loadingStart, loadingStop]);

  React.useEffect(() => {
    const tmcs = get(falcorCache, ["tmc", "tmclinear", year, geo, tmclinear, direction, "value"], []);
    if (tmcs.length) {
      setTMCs(tmcs.sort((a, b) => +a.road_order - +b.road_order).map(t => t.tmc));
    }
  }, [falcorCache, year, geo, tmclinear, direction]);

  React.useEffect(() => {
    if (TMCs.length) {
      loadingStart();
      falcor.get(
        ["tmc", TMCs, "data", year, "by", "hour"],
        ["tmc", TMCs, "meta", year, "length"]
      )
      .then(() => loadingStop());
    }
  }, [falcor, year, TMCs]);

  React.useEffect(() => {
    const data = TMCs.reduce((a, c) => {
      const d = get(falcorCache, ["tmc", c, "data", year, "by", "hour", "value"], []);
      const mapped = d.map(d => {
        const speed = get(tmcWidths, d.tmc, 1) / (d.tt / 3600);
        return { ...d, speed };
      });
      a.push(...mapped);
      return a;
    }, []);

    const scl = scaleQuantile()
      .domain(data.map(d => d.speed))
      .range(GridColors);

    setScale(() => scl);

    const widths = TMCs.reduce((a, c) => {
      a[c] = get(falcorCache, ["tmc", c, "meta", year, "length"], 1);
      return a;
    }, {})

    setTmcWidths(widths);

    const grouped = d3groups(data, d => d.date.slice(0, 7), d => `${ d.date }:${ d.resolution.toString().padStart(2, '0') }`);

    const gd = grouped.map(([month, md]) => {
      const mmd = md.map(([index, data]) => {
        return {
          index,
          ...data.reduce((a, c) => { a[c.tmc] = c.speed; return a; }, {})
        }
      }).sort((a, b) => a.index.localeCompare(b.index))
      return [month, mmd]
    }).sort((a, b) => a[0].localeCompare(b[0]));

    setGridData(gd);

  }, [falcorCache, year, TMCs]);

  return (
    <div>
      <div className={ `
        inset-0 ${ loading ? "fixed" : "hidden" }
        flex justify-center items-center z-50 bg-black opacity-50
      ` }>
        <ScalableLoading />
      </div>
      <div className="px-12 py-4 text-xl">
        <b>Geography:</b> { name }<br />
        <b>Year:</b> { year }<br />
        <b>TMC Linear:</b> { tmclinear }<br />
        <b>Direction:</b> { DirectionMap[direction] }
      </div>
      { gridData.map(([month, gd]) => {
          return (
            <GridTracker key={ month }
              TMCs={ TMCs }
              tmcWidths={ tmcWidths }
              data={ gd }
              month={ month }
              scale={ scale }
            />
          )
        })
      }
    </div>
  )
}

const GridTracker = ({ month, ...props }) => {
  const days = React.useMemo(() => {
    const [y, m] = month.split("-");
    return new Date(y, m, 0).getDate();
  }, [month]);
  return (
    <div style={ { height: `${ days * 24 }px`}}>
      <TrackVisibility once partialVisibility className="h-full relative">
        <GridComp { ...props }/>
      </TrackVisibility>
    </div>
  )
}

const indexFormat = index => {
  let [date, hour] = index.split(":");
  const ampm = +hour < 12 ? "am" : "pm";
  hour = +hour % 12 === 0 ? 12 : +hour % 12;
  return `${ date } ${ hour }${ ampm }`;
}
const leftAxisFormat = index => {
  return index.slice(0, 10);
}

const GridComp = ({ data, ttToSpeed, TMCs, tmcWidths, scale, isVisible }) => {
  const tickValues = React.useMemo(() => {
    return data.filter(d => d.index.split(":")[1] == 12).map(d => d.index)
  }, [data])
  return !isVisible ? null : (
    <GridGraph
      showAnimations={ false }
      colors={ scale }
      data={ data }
      keys={ TMCs }
      keyWidths={ tmcWidths }
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
  )
}

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

const config = [
  { name:'Year Grid',
    path: "/yeargrid/:tmclinear/:year",
    showInBlocks: false,
    exact: true,
    auth: false,
    mainNav: false,
    sideNav: {
      color: 'dark',
      size: 'micro'
    },
    component: YearGrid
  },
  { name:'Year Grid',
    path: "/yeargrid",
    exact: true,
    auth: false,
    mainNav: false,
    sideNav: {
      color: 'dark',
      size: 'micro'
    },
    component: YearGrid
  }
]

export default config
