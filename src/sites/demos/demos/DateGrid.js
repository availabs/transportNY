import React from "react"

import { useHistory, useParams, Link } from "react-router-dom"

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

  const [geo, setGeo] = React.useState("COUNTY|36001");
  const geoid = React.useMemo(() => {
    const [level, id] = geo.split("|");
    return id || "unknown";
  }, [geo]);

  const [selectedGeo, setSelectedGeo] = React.useState(geo);

  const [tmclinear, setTmcLinear] = React.useState(430);
  const [direction, setDirection] = React.useState("E");
  const tmclinearKey = `${ tmclinear }_${ direction }`;

  const history = useHistory();

  const setNewUrl = React.useCallback(tmclineaerKey => {
    const [level, geoid] = selectedGeo.split("|");
    history.push(`/dategrid/${ geoid }_${ tmclineaerKey }/${ date }`)
  }, [history, date, selectedGeo]);

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
      setTmcLinear(tmclinear);
      setDirection(direction.toUpperCase());
    }
  }, [params]);

  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    loadingStart();
    falcor.get(["geo", "36", "geoLevels"])
      .then(() => loadingStop());
  }, [falcor]);

  const counties = React.useMemo(() => {
    return get(falcorCache, ["geo", "36", "geoLevels", "value"], [])
      .filter(({ geolevel }) => geolevel === "COUNTY")
      .map(geo => ({ ...geo, geo: `${ geo.geolevel }|${ geo.geoid }` }))
      .sort((a, b) => a.geo.localeCompare(b.geo))
  }, [falcorCache]);

  React.useEffect(() => {
    if (!counties.length) return;
    loadingStart();
    falcor.get(["geo", counties.map(c => c.geoid), "name"])
      .then(() => loadingStop());
  }, [falcor, counties]);

  const name = React.useMemo(() => {
    return get(falcorCache, ["geo", geoid, "name"], "Uknown Geography");
  }, [falcorCache, geoid]);

  React.useEffect(() => {
    if (!counties.length) return;
    loadingStart();
    falcor.get(["geo", counties.map(c => c.geo), year, "tmclinear"])
      .then(() => loadingStop());
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
    loadingStart();
    falcor.get(
        ["tmc", "tmclinear", year, geo, tmclinear, direction],
        ["tmclinear", "meta", year, geo, tmclinear, direction, 'roadname']
      )
      .then(() => loadingStop());
  }, [falcor, year, geo, tmclinear, direction, loadingStart, loadingStop]);

  const roadname = React.useMemo(() => {
    return get(falcorCache, ["tmclinear", "meta", year, geo, tmclinear, direction, "roadname"], "");
  }, [falcorCache, year, geo, tmclinear, direction]);

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
        ["tmc", TMCs, dataType, dateType, date, "by", "hour"]
      )
      .then(() => loadingStop());
    }
  }, [falcor, date, dateType, dataType, TMCs]);

  React.useEffect(() => {
    if (TMCs.length) {
      loadingStart();
      falcor.get(
        ["tmc", TMCs, "meta", year, ["length", "avg_speedlimit", "firstname"]]
      )
      .then(() => loadingStop());
    }
  }, [falcor, year, dataType, TMCs]);

  React.useEffect(() => {
    const widths = TMCs.reduce((a, c) => {
      a[c] = get(falcorCache, ["tmc", c, "meta", year, "length"], 1);
      return a;
    }, {});

    setTmcWidths(widths);

    const data = TMCs.reduce((a, c) => {
      const d = get(falcorCache, ["tmc", c, dataType, dateType, date, "by", "hour", "value"], []);
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

  }, [falcorCache, date, dateType, year, dataType, TMCs]);

  const [prev, next] = React.useMemo(() => {
    const [y, m] = date.split("-").map(Number);

    const py = m === 1 ? y - 1 : y;
    const pm = m === 1 ? 12 : m - 1;

    const ny = m === 12 ? y + 1 : y;
    const nm = m === 12 ? 1 : m + 1;

    return [
      `/dategrid/${ geoid }_${ tmclinear }_${ direction }/${ py }-${ `0${ pm }`.slice(-2) }`,
      `/dategrid/${ geoid }_${ tmclinear }_${ direction }/${ ny }-${ `0${ nm }`.slice(-2) }`
    ]
  }, [geoid, tmclinear, direction, date])

  return (
    <div>
      <div className={ `
          inset-0 ${ loading ? "fixed" : "hidden" }
          flex justify-center items-center z-50 bg-black opacity-50
        ` }
      >
        <ScalableLoading />
      </div>
      <div className="px-12 py-4 grid grid-cols-2 gap-4">
        <div className="text-xl">
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
      <div className="px-12 grid grid-cols-12">
        <div className="text-xl font-bold col-span-5 grid grid-cols-2 gap-1">
          <div>
            <Select options={ counties }
              onChange={ setSelectedGeo }
              value={ selectedGeo }
              valueAccessor={ d => d.geo }
              accessor={ d => get(falcorCache, ["geo", d.geoid, "name"], geoid) }/>
          </div>
          <div>
            <Select options={ tmclinearsByCounties[selectedGeo] }
              onChange={ setNewUrl }
              value={ tmclinearKey }
              accessor={ d => d.name }
              valueAccessor={ d => d.key }/>
          </div>
        </div>
        <div className="text-xl font-bold col-span-2 flex items-center justify-center">
          { MonthMap[month] } { year }
        </div>
        <div className="col-span-5">
          <Scale scale={ scale }/>
        </div>
      </div>
      <div className="flex mx-8 font-bold text-lg">
        <div className="flex-1">
          <Link to={ prev }><span className="fa fa-caret-left"/> Previous Month</Link>
        </div>
        <div className="flex-0">
          <Link to={ next }>Next Month <span className="fa fa-caret-right"/></Link>
        </div>
      </div>
      <GridComp date={ date } year={ year }
        TMCs={ TMCs }
        tmcWidths={ tmcWidths }
        data={ gridData }
        scale={ scale }
      />
    </div>
  )
}

const Scale = ({ scale }) => {
  const domain = scale.domain();
  const range = scale.range();
  return (
    <div>
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
              { i < domain.length ? `below ${ domain[i] }` : `${ domain[i - 1] }+` }
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
