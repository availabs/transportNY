import React from "react"

import TrackVisibility from 'react-on-screen';

import { useParams } from "react-router-dom"

import get from "lodash.get"
import { groups as d3groups, extent as d3extent } from "d3-array"
import { scaleQuantile, scaleQuantize, scaleThreshold } from "d3-scale"

import { useComponentDidMount } from "sites/tsmo/pages/Dashboards/components/utils"

import {
  useFalcor,
  useTheme,
  getColorRange,
  ScalableLoading,
  Select
} from "modules/avl-components/src"

import { GridGraph } from "modules/avl-graph/src"

import GridComp from "./components/GridComponent"

const isLeapYear = year => {
  return (year % 400 === 0) || ((year % 100 !== 0) && (year % 4 === 0));
}
const daysInYear = year => {
  return isLeapYear(year) ? 366 : 365;
}
const DirectionMap = {
  N: "North",
  S: "South",
  E: "East",
  W: "West"
}

const GridColors = getColorRange(9, "RdYlGn");

const DataTypes = [
  { name: "Travel Time", value: "tt" },
  { name: "Total Delay", value: "td" },
  { name: "Non-recurrent Delay", value: "nrd" },
  { name: "Recurrent Delay", value: "rd" }
]

const MonthGrid = () => {

  const MOUNTED = useComponentDidMount();

  const [month, setMonth] = React.useState("2021-04");
  const year = React.useMemo(() => {
    const [y, m] = month.split("-");
    return y;
  }, [month]);
  const days = React.useMemo(() => {
    const [y, m] = month.split("-");
    return new Date(y, m, 0).getDate();
  }, [month]);
  const [geo, setGeo] = React.useState("COUNTY|36001");
  const geoid = React.useMemo(() => {
    const [level, id] = geo.split("|");
    return id || "unknown";
  }, [geo]);
  const [tmclinear, setTmcLinear] = React.useState(212);
  const [direction, setDirection] = React.useState("N");

  const [TMCs, setTMCs] = React.useState([]);

  const [gridData, setGridData] = React.useState([]);
  const [tmcWidths, setTmcWidths] = React.useState({});
  const [dataType, setDataType] = React.useState("tt");
  const [scale, setScale] = React.useState(() => scaleQuantile());

  const [loading, setLoading] = React.useState(0);
  const loadingStart = React.useCallback(() => {
    if (!MOUNTED) return;
    setLoading(prev => prev + 1);
  }, [MOUNTED]);
  const loadingStop = React.useCallback(() => {
    if (!MOUNTED) return;
    setLoading(prev => prev - 1);
  }, [MOUNTED]);

  const params = useParams();

  React.useEffect(() => {
    if (params.month) {
      setMonth(params.month);
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
        ["tmc", TMCs, dataType, "month", month, "by", "hour"],
        ["tmc", TMCs, "meta", year, ["length", "avg_speedlimit", "firstname"]]
      )
      .then(() => loadingStop());
    }
  }, [falcor, month, year, dataType, TMCs]);

  React.useEffect(() => {
    const widths = TMCs.reduce((a, c) => {
      a[c] = get(falcorCache, ["tmc", c, "meta", year, "length"], 1);
      return a;
    }, {});

    setTmcWidths(widths);

    const data = TMCs.reduce((a, c) => {
      const d = get(falcorCache, ["tmc", c, dataType, "month", month, "by", "hour", "value"], []);
      const mapped = d.map(d => {
        if (dataType === "tt") {
          const value = get(widths, d.tmc, 1) / (d.value / 3600);
          return { ...d, value };
        }
        return d;
      });
      a.push(...mapped);
      return a;
    }, []);

    let scl = scaleQuantile()
      .domain(data.map(d => d.value).filter(Boolean))
      .range([...GridColors].reverse());

    if (dataType === "tt") {
      let avgSL = Math.round(
        TMCs.reduce((a, c) =>  {
          return a + (get(widths, c, 1) * get(falcorCache, ["tmc", c, "meta", year, "avg_speedlimit"], 35))
        }, 0) / Object.values(widths).reduce((a, b) => a + b, 0)
      );
      scl = scaleThreshold()
        .domain([avgSL - 25, avgSL - 20, avgSL - 15, avgSL - 10, avgSL - 5, avgSL - 2.5, avgSL, avgSL + 5])
        .range(GridColors);

      console.log('sl', avgSL, [avgSL - 25, avgSL - 20, avgSL - 15, avgSL - 10, avgSL - 5, avgSL - 2.5, avgSL, avgSL + 5])  
    }

    setScale(() =>  scl);

    const grouped = d3groups(data, d => `${ d.date }:${ `0${ d.resolution }`.slice(-2) }`);

    const gd = grouped.map(([index, data]) => {
      return data.reduce((a, c) => {
        if (c.value) {
          a[c.tmc] = c.value;
        }
        return a;
      }, { index });
    }).sort((a, b) => a.index.localeCompare(b.index));

    setGridData(gd);

  }, [falcorCache, month, year, dataType, TMCs]);

  console.log('testing', gridData)

  return (
    <div>
      <div className={ `
        inset-0 ${ loading ? "fixed" : "hidden" }
        flex justify-center items-center z-50 bg-black opacity-50
      ` }>
        <ScalableLoading />
      </div>
      <div className="px-12 py-4 grid grid-cols-2 gap-4">
        <div className="text-xl">
          <span className="font-bold">Geography:</span> { name }<br />
          <span className="font-bold">Month:</span> { month }<br />
          <span className="font-bold">TMC Linear:</span> { tmclinear }<br />
          <span className="font-bold">Direction:</span> { DirectionMap[direction] }
        </div>
        <div>
          <span className="text-xl font-bold">Data Type</span><br />
          <Select options={ DataTypes }
            value={ dataType }
            accessor={ d => d.name }
            valueAccessor={ d => d.value }
            onChange={ setDataType }/>
        </div>
      </div>
      <div className="relative" style={ { height: `${ days * 24 }px`}}>
        <GridComp month={ month }
          TMCs={ TMCs }
          tmcWidths={ tmcWidths }
          data={ gridData }
          month={ month }
          scale={ scale }/>
      </div>
    </div>
  )
}

const config = [
  { name:'Month Grid',
    path: "/monthgrid/:tmclinear/:month",
    showInBlocks: false,
    exact: true,
    auth: false,
    mainNav: false,
    sideNav: {
      color: 'dark',
      size: 'micro'
    },
    component: MonthGrid
  },
  { name:'Month Grid',
    path: "/monthgrid",
    exact: true,
    auth: false,
    mainNav: false,
    sideNav: {
      color: 'dark',
      size: 'micro'
    },
    component: MonthGrid
  }
]

export default config
