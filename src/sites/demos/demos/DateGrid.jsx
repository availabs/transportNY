import React from "react"

import { useNavigate, useParams, Link } from "react-router-dom"

import get from "lodash.get"
import { groups as d3groups, range as d3range } from "d3-array"
import { scaleQuantile, scaleThreshold } from "d3-scale"

import { useComponentDidMount } from "~/sites/tsmo/pages/Dashboards/components/utils"

import {
  useFalcor,
  getColorRange,
  ScalableLoading,
  Select
} from "~/modules/avl-components/src"

import GridComp from "./components/GridComponent"

const DirectionMap = {
  N: "North",
  S: "South",
  E: "East",
  W: "West"
}
const Year = new Date().getFullYear();
const Years = d3range(Year, 2015, -1);
const MonthMap = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December"
}
const Months = d3range(1, 13)
  .map(m => ({ value: m, name: MonthMap[m] }));

const GridColors = getColorRange(9, "RdYlGn");

const DataTypes = [
  { name: "Speed", value: "tt" },
  { name: "Total Delay", value: "td" },
  { name: "Non-recurrent Delay", value: "nrd" },
  { name: "Recurrent Delay", value: "rd" }
]

const MonthGrid = () => {

  const MOUNTED = useComponentDidMount();

  const [date, setDate] = React.useState("2021-04");
  const [year, month, day] = React.useMemo(() => {
    return date.split("-").map(Number);
  }, [date]);
  const dateType = !day ? "month" : "day";
  const resolution = dateType === "month" ? "hour" : "epoch"

  const [geo, setGeo] = React.useState("COUNTY|36001");
  const geoid = React.useMemo(() => {
    const [/*level*/, id] = geo.split("|");
    return id || "unknown";
  }, [geo]);

  const [selectedGeo, setSelectedGeo] = React.useState(geo);

  const [tmclinear, setTmcLinear] = React.useState(430);
  const [direction, setDirection] = React.useState("E");
  const tmclinearKey = `${ tmclinear }_${ direction }`;

  const navigate = useNavigate();

  const setUrlFromTmclinearKey = React.useCallback(tmclinearKey => {
    const [/*level*/, geoid] = selectedGeo.split("|");
    navigate(`/dategrid/${ geoid }_${ tmclinearKey }/${ date }`);
  }, [navigate, date, selectedGeo]);

  const setUrlFromMonth = React.useCallback(month => {
    const [/*level*/, geoid] = selectedGeo.split("|");
    const date = `${ year }-${ `0${ month }`.slice(-2) }`;
    navigate(`/dategrid/${ geoid }_${ tmclinearKey }/${ date }`);
  }, [navigate, year, tmclinearKey, selectedGeo]);
  
  const setUrlFromYear = React.useCallback(year => {
    const [/*level*/, geoid] = selectedGeo.split("|");
    const date = `${ year }-${ `0${ month }`.slice(-2) }`;
    navigate(`/dategrid/${ geoid }_${ tmclinearKey }/${ date }`);
  }, [navigate, month, tmclinearKey, selectedGeo]);

  const setUrlFromDate = React.useCallback(date => {
    const [/*level*/, geoid] = selectedGeo.split("|");
    navigate(`/dategrid/${ geoid }_${ tmclinearKey }/${ date }`);
  }, [navigate, tmclinearKey, selectedGeo])

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
    if (params.date) {
      setDate(params.date);
    }
    if (params.tmclinear) {
      const [geoid, tmclinear, direction] = params.tmclinear.split("_");
      setGeo(`COUNTY|${ geoid }`);
      setSelectedGeo(`COUNTY|${ geoid }`);
      setTmcLinear(tmclinear);
      setDirection(direction.toUpperCase());
    }
  }, [params]);

  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    falcor.get(["geo", "36", "geoLevels"])
  }, [falcor]);

  const counties = React.useMemo(() => {
    return get(falcorCache, ["geo", "36", "geoLevels", "value"], [])
      .filter(({ geolevel }) => geolevel === "COUNTY")
      .map(geo => ({ ...geo, geo: `${ geo.geolevel }|${ geo.geoid }` }))
      .sort((a, b) => a.geo.localeCompare(b.geo))
  }, [falcorCache]);

  React.useEffect(() => {
    if (!counties.length) return;
    falcor.get(["geo", counties.map(c => c.geoid), "name"])
  }, [falcor, counties]);

  /*const name = React.useMemo(() => {
    return get(falcorCache, ["geo", geoid, "name"], "Uknown Geography");
  }, [falcorCache, geoid]);*/

  React.useEffect(() => {
    if (!counties.length) return;
    falcor.get(["geo", counties.map(c => c.geo), year, "tmclinear"])
  }, [falcor, counties, year]);

  const tmclinearsByCounties = React.useMemo(() => {
    return counties.reduce((a, c) => {
      const linears = get(falcorCache, ["geo", c.geo, year, "tmclinear", "value"], []);
      a[c.geo] = linears.map(l =>
        ({ ...l,
          key: `${ l.tmclinear }_${ l.direction }`,
          name: `${ l.roadname } ${ DirectionMap[l.direction] } (${ l.tmclinear })`
        })
      ).sort((a, b) => a.name.localeCompare(b.name))
      return a;
    }, {});
  }, [falcorCache, counties, year]);

  React.useEffect(() => {
    falcor.get(
        ["tmc", "tmclinear", year, geo, tmclinear, direction],
        ["tmclinear", "meta", year, geo, tmclinear, direction, 'roadname']
      )
  }, [falcor, year, geo, tmclinear, direction, loadingStart, loadingStop]);

  /*const roadname = React.useMemo(() => {
    return get(falcorCache, ["tmclinear", "meta", year, geo, tmclinear, direction, "roadname"], "");
  }, [falcorCache, year, geo, tmclinear, direction]);*/

  React.useEffect(() => {
    const tmcs = get(falcorCache, ["tmc", "tmclinear", year, geo, tmclinear, direction, "value"], []);
    if (tmcs.length) {
      setTMCs(tmcs.sort((a, b) => +a.road_order - +b.road_order).map(t => t.tmc));
    }
  }, [falcorCache, year, geo, tmclinear, direction]);

  React.useEffect(() => {
    if (TMCs.length) {
      falcor.get(["tmc", TMCs, dataType, dateType, date, "by", resolution])
    }
  }, [falcor, date, dateType, dataType, resolution, TMCs]);

  React.useEffect(() => {
    if (TMCs.length) {
      falcor.get(
        ["tmc", TMCs, "meta", year, ["length", "avg_speedlimit", "firstname"]]
      )
    }
  }, [falcor, year, dataType, TMCs]);

  React.useEffect(() => {
    const widths = TMCs.reduce((a, c) => {
      a[c] = get(falcorCache, ["tmc", c, "meta", year, "length"], 1);
      return a;
    }, {});

    setTmcWidths(widths);

    const data = TMCs.reduce((a, c) => {
      const d = get(falcorCache, ["tmc", c, dataType, dateType, date, "by", resolution, "value"], []);
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

    let scl = scaleThreshold()
      .domain([1, 5, 10, 25, 50, 75, 100])
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
    }

    setScale(() =>  scl);

    let grouped = [];
    if (dateType === "month") {
      grouped = d3groups(data, d => `${ d.date }:${ `0${ d.resolution }`.slice(-2) }`);
    }
    else {
      const epochs = new Set(d3range(0, 288).map(e => `00${ e }`.slice(-3)));
      grouped = d3groups(data, d => `00${ d.resolution }`.slice(-3) );
      grouped.forEach(([index]) => {
        epochs.delete(index);
      })
      for (const epoch of epochs) {
        grouped.push([epoch, []]);
      }
    }

    const gd = grouped.map(([index, data]) => {
      return data.reduce((a, c) => {
        if (c.value) {
          a[c.tmc] = c.value;
        }
        return a;
      }, { index });
    }).sort((a, b) => a.index.localeCompare(b.index));

    setGridData(gd);

  }, [falcorCache, date, dateType, year, dataType, resolution, TMCs]);


  const [prev, next] = React.useMemo(() => {
    if (dateType === "month") {
      const [y, m] = date.split("-").map(Number);

      const py = m === 1 ? y - 1 : y;
      const pm = m === 1 ? 12 : m - 1;

      const ny = m === 12 ? y + 1 : y;
      const nm = m === 12 ? 1 : m + 1;

      return [
        `/dategrid/${ geoid }_${ tmclinear }_${ direction }/${ py }-${ `0${ pm }`.slice(-2) }`,
        `/dategrid/${ geoid }_${ tmclinear }_${ direction }/${ ny }-${ `0${ nm }`.slice(-2) }`
      ]
    }
    const [y, m, d] = date.split("-").map(Number);
    const pDate = new Date(y, m - 1, d - 1);
    const pd = `${ pDate.getFullYear() }-${ `0${ pDate.getMonth() + 1 }`.slice(-2) }-${ `0${ pDate.getDate() }`.slice(-2) }`;

    const nDate = new Date(y, m - 1, d + 1);
    const nd = `${ nDate.getFullYear() }-${ `0${ nDate.getMonth() + 1 }`.slice(-2) }-${ `0${ nDate.getDate() }`.slice(-2) }`;

    return [
      `/dategrid/${ geoid }_${ tmclinear }_${ direction }/${ pd }`,
      `/dategrid/${ geoid }_${ tmclinear }_${ direction }/${ nd }`
    ]
  }, [geoid, tmclinear, direction, date, dateType]);

  const onClick = React.useMemo(() => {
    if (dateType === "day") return null;
    return (e, { key, index, value }) => {
      e.stopPropagation();
      setUrlFromDate(index.slice(0, 10));
    };
  }, [ dateType, setUrlFromDate]);

  return (
    <div style={ { width: "calc(100vw - 3.5rem)"}}>
      <div className={ `
          inset-0 ${ loading ? "fixed" : "hidden" }
          flex justify-center items-center z-50 bg-black opacity-50
        ` }
      >
        <ScalableLoading />
      </div>
      <div className="px-12 py-4 grid grid-cols-3 gap-1">
        <div className="text-xl font-bold col-span-2">
        </div>
        <div className="text-xl font-bold">
          <Select options={ DataTypes }
            value={ dataType }
            accessor={ d => d.name }
            valueAccessor={ d => d.value }
            onChange={ setDataType }/>
        </div>
      </div>
      <div className="px-12 grid grid-cols-12 gap-1">
        <div className="text-xl font-bold col-span-8 grid grid-cols-10 gap-1">
          <div className="col-span-3">
            <Select options={ counties }
              onChange={ setSelectedGeo }
              value={ selectedGeo }
              valueAccessor={ d => d.geo }
              accessor={ d => get(falcorCache, ["geo", d.geoid, "name"], geoid) }/>
          </div>
          <div className="col-span-3">
            <Select options={ tmclinearsByCounties[selectedGeo] }
              onChange={ setUrlFromTmclinearKey }
              value={ tmclinearKey }
              accessor={ d => d.name }
              valueAccessor={ d => d.key }/>
          </div>
          <div className="col-span-2">
            <Select options={ Months }
              onChange={ setUrlFromMonth }
              value={ month }
              valueAccessor={ m => m.value }
              accessor={ m => m.name }/>
          </div>
          <div className="col-span-2">
            <Select options={ Years }
              onChange={ setUrlFromYear }
              value={ year }/>
          </div>
        </div>
        <div className="col-span-4 flex items-center">
          <Scale scale={ scale }/>
        </div>
      </div>
      <div className="flex mx-8 font-bold text-lg my-2">
        <div className="flex-1">
          <Link to={ prev }><span className="fa fa-caret-left"/> Previous { dateType }</Link>
        </div>
        <div className="flex-0">
          <Link to={ next }>Next { dateType } <span className="fa fa-caret-right"/></Link>
        </div>
      </div>
      <GridComp date={ date }
        TMCs={ TMCs }
        tmcWidths={ tmcWidths }
        data={ gridData }
        scale={ scale }
        onClick={ onClick }
      />
    </div>
  )
}

const Scale = ({ scale }) => {
  const domain = scale.domain();
  const range = scale.range();
  return (
    <div className="w-full">
      <div className="flex flex-row">
        { range.map(color => (
            <div key={ color } className="h-4 flex-1"
              style={ { background: color } }/>
          ))
        }
      </div>
      <div className="flex flex-row">
        { range.map((color, i) => (
            <div key={ color } className="flex-1 text-center text-sm">
              { i < domain.length ? `< ${ domain[i] }` : `${ domain[i - 1] }+` }
            </div>
          ))
        }
      </div>
    </div>
  )
}

const config = [
  { name:'Month Grid',
    path: "/dategrid/:tmclinear/:date",
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
