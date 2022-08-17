import React from "react"

import TrackVisibility from 'react-on-screen';

import { useParams } from "react-router-dom"

import get from "lodash.get"
import { groups as d3groups } from "d3-array"
import { scaleQuantile, scaleThreshold } from "d3-scale"

import {
  useFalcor,
  useTheme,
  getColorRange,
  ScalableLoading
} from "modules/avl-components/src"

import { GridGraph } from "modules/avl-graph/src"

import GridComp from "./components/GridComponent"

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

const GridColors = getColorRange(9, "RdYlGn")

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
        ["tmc", TMCs, "meta", year, ["length", "avg_speedlimit"]]
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


    const widths = TMCs.reduce((a, c) => {
      a[c] = get(falcorCache, ["tmc", c, "meta", year, "length"], 1);
      return a;
    }, {})


    let avgSL = Math.round(TMCs.reduce((a,c) =>  {
        return a + (get(widths, c, 1) * get(falcorCache, ["tmc", c, "meta", year, "avg_speedlimit"], 35))
    },0) / Object.values(widths).reduce((a,b) => a+b,0))

    console.log('avgSL', avgSL)

    const scl = scaleThreshold()
        .domain([avgSL-20,avgSL-15, avgSL-10, avgSL-5, avgSL -2 , avgSL, avgSL+5 ])
        .range(GridColors);

    // const scl = scaleQuantile()
    //   .domain(data.map(d => d.speed))
    //   .range(GridColors);

    setScale(() => scl);

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
      <TrackVisibility offset={ days * 12 } className="h-full relative">
        <GridComp { ...props } month={ month }/>
      </TrackVisibility>
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
