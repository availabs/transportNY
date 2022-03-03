import React from "react"

import get from "lodash.get";
import { useSelector } from 'react-redux';


import {
  groups as d3groups,
  rollups as d3rollups,
  rollup as d3rollup,
  min as d3min
} from "d3-array"

import { format as d3format } from "d3-format"

import {
  useFalcor,
  useTheme,
  Table,
} from "modules/avl-components/src"

const fFormat = d3format(",.2f")
const floatFormat = f => (f === null) || isNaN(f) ? "no data" : fFormat(f);

const getDailyAvgDelay = (delay, date) => {
  if (!delay) return null;
  const [year, month] = date.split("-"),
    numDays = +(new Date(year, month, 0).getDate());
  return delay / numDays;
}

const numDaysInYear = year => {
  return ((+year % 4 === 0) && (+year % 100 !== 0)) || (+year % 400 === 0) ? 366 : 365;
}

const getColumns = (prevMonth, prevYear, prevYearMonth) => {
  const [pm1, pm2] = prevMonth.split("-"),
    [py1, py2] = prevYear.split("-"),
    [pym1, pym2] = prevYearMonth.split("-");
  return [
    { accessor: "tmc",
      Header: "TMC",
      disableSortBy: true
    },
    { accessor: "roadname",
      Header: "Road Name"
    },
    { accessor: "rank",
      Header: "Rank"
    },
    { accessor: "delay",
      Header: "Total",
      Cell: ({ value }) => floatFormat(value)
    },
    { accessor: "avgDailyDelay",
      Header: () => <div>Avg. Daily</div>,
      Cell: ({ value }) => floatFormat(value)
    },
    { accessor: "prevMdelay",
      Header: ({ ...props }) => <div>Total ({ pm1 }&#8209;{ pm2 })</div>,
      Cell: ({ value }) => floatFormat(value)
    },
    { accessor: "prevMavg",
      Header: () => <div>Avg. Daily ({ pm1 }&#8209;{ pm2 })</div>,
      Cell: ({ value }) => floatFormat(value)
    },
    { accessor: "prevYdelay",
      Header: () => <div>Total ({ py1 }&#8209;{ py2 })</div>,
      Cell: ({ value }) => floatFormat(value)
    },
    { accessor: "prevYavg",
      Header: () => <div>Avg. Daily ({ py1 }&#8209;{ py2 })</div>,
      Cell: ({ value }) => floatFormat(value)
    },
    { accessor: "prevYMdelay",
      Header: () => <div>Total ({ pym1 }&#8209;{ pym2 })</div>,
      Cell: ({ value }) => floatFormat(value)
    },
    { accessor: "prevYMavg",
      Header: () => <div>Avg. Daily ({ pym1 }&#8209;{ pym2 })</div>,
      Cell: ({ value }) => floatFormat(value)
    },
    /*{ accessor: "total",
      Header: () => <div>Total (All&nbsp;Time)</div>,
      Cell: ({ value }) => floatFormat(value)
    },
    { accessor: "totalAvgDaily",
      Header: () => <div>Avg. Daily (All&nbsp;Time)</div>,
      Cell: ({ value }) => floatFormat(value)
    }*/
  ]
}



const CongestionSegmentTable = ({rawDelayData}) => {
  const theme = useTheme()
  const {region, month: tableDate, fsystem} = useSelector(state => state.dashboard)
  const [year, month] = tableDate.split("-").map(Number),
        py = year - 1,
        pm = (month - 2 + 12) % 12 + 1,
        prevMonth = `${ pm == 12 ? year - 1 : year }-${ `0${ pm }`.slice(-2) }`,
        prevYear = `${ py }-${ `0${ month }`.slice(-2) }`,
        prevYearMonth = `${ pm == 12 ? py - 1 : py }-${ `0${ pm }`.slice(-2) }`;

  const { falcor, falcorCache } = useFalcor();

  const [showDPM, setShowDPM] = React.useState(false)

  const Years = React.useMemo(() => {
    return d3groups(rawDelayData, d => d.year)
      .map(([year]) => year)
      .sort((a, b) => a - b);
  }, [rawDelayData]);

  const Months = React.useMemo(() => {
    return d3groups(rawDelayData, d => `${ d.year }-${ `0${ d.month }`.slice(-2) }`)
      .map(([month]) => month)
      .sort((a, b) => b.localeCompare(a));
  }, [rawDelayData]);

  const tmcs = React.useMemo(() => {
    return d3groups(rawDelayData, d => d.tmc)
      .map(([tmc]) => tmc);
  }, [rawDelayData]);

  React.useEffect(() => {
    if (tmcs.length) {
      falcor.get([
        "tmc", tmcs, "meta", Years, ["length", "roadname", "tmclinear","road_order"]
      ]);
    }
  }, [falcor, tmcs, Years]);


  const getTmcData = React.useCallback((tmc, year, d = null) => {
    return get(falcorCache, ["tmc", tmc, "meta", year], d);
  }, [falcorCache]);

  const getTmcAtt = React.useCallback((tmc, year, att = null, d = null) => {
    const path = ["tmc", tmc, "meta", year, att].filter(Boolean);
    return get(falcorCache, path, d);
  }, [falcorCache]);

  const delayData = React.useMemo(() => {
    if (!showDPM) return rawDelayData.map(c => ({
      ...c,
      delay: c.total,
      total: c.summed_total
    }));
    return rawDelayData.reduce((a, c) => {
      const { tmc, year } = c;
      const tmcData = getTmcData(tmc, year);
      if (tmcData) {
        a.push({
          ...c,
          delay: c.total / get(tmcData, "length", 1),
          total: c.summed_total / get(tmcData, "length", 1)
        })
      }
      return a;
    }, [])
  }, [falcorCache, rawDelayData, getTmcData, showDPM])

  const ddByMonth = React.useMemo(() => {
    return d3rollups(
      delayData,
      g => g.sort((a, b) => b.delay - a.delay),
      d => `${ d.year }-${ `0${ d.month }`.slice(-2) }`
    ).sort((a, b) => b[0].localeCompare(a[0]));
  }, [delayData]);

  const ddByTmc = React.useMemo(() => {
    return d3rollup(
      delayData,
      g => ({
        total: g[0].total,
        dailyAvg: g[0].total / Years.reduce((a, c) => a + numDaysInYear(c), 0)
      }),
      d => d.tmc
    );
  }, [delayData, Years]);

  const [tmcData, setTmcData] = React.useState({});
  React.useEffect(() => {
    const data = tmcs.reduce((a, c) => {
      a[c] = Years.reduce((aa, cc) => {
        const d = get(falcorCache, ["tmc", c, "meta", cc], null);
        if (d) {
          aa[cc] = d;
        }
        return aa;
      }, {});
      return a;
    }, {});
    setTmcData(data);
  }, [falcorCache, tmcs, Years]);


  const corridors = React.useMemo(() => {
    let corridors = Object.keys(tmcData).reduce((corridors,tmcId) => {
      let tmc = tmcData[tmcId]
      let tmcLinear = get(tmc, `[${year}].tmclinear`, false)

      // console.log('tmcs', tmcLinear, tmc, tmc[year], year)

      if(tmcLinear) {
        if(!corridors[tmcLinear]) {
          corridors[tmcLinear] = {
            roadnames: [],
            length: 0,
            tmcs: []
          }
        }
        corridors[tmcLinear].length += tmc[year].length
        if(!corridors[tmcLinear].roadnames.includes(tmc[year].roadname)){
          corridors[tmcLinear].roadnames.push(tmc[year].roadname)
        }
        corridors[tmcLinear].tmcs[tmc[year].road_order] = tmcId
      }        

      return corridors
    },{})
    return corridors
  },[tmcData,year]) 

  const tableData = React.useMemo(() => {
    const index = Months.indexOf(tableDate);
    if (index === -1) {
      return [];
    }
    const [date, data] = ddByMonth[index],
      prevMindex = Months.indexOf(prevMonth),
      prevYindex = Months.indexOf(prevYear),
      prevYMindex = Months.indexOf(prevYearMonth);

    console.log('table data', date, data)
    let prevMdata, prevYdata, prevYMdata;
    if (prevMindex !== -1) {
      [, prevMdata] = ddByMonth[prevMindex];
    }
    if (prevYindex !== -1) {
      [, prevYdata] = ddByMonth[prevYindex];
    }
    if (prevYMindex !== -1) {
      [, prevYMdata] = ddByMonth[prevYMindex];
    }

    return data.reduce((a, c, i) => {
      const { tmc, year, delay } = c;
      const d = getTmcData(tmc, year);
      const prev1 = get(prevMdata, i, {}),
        prev2 = get(prevYdata, i, {}),
        prev3 = get(prevYMdata, i, {});
      if (d) {
        a.push({
          tmc,
          delay,
          roadname: d.roadname,
          rank: i + 1,
          avgDailyDelay: getDailyAvgDelay(delay, date),
          prevM: prevMonth,
          prevMdelay: prev1.delay,
          prevMavg: getDailyAvgDelay(prev1.delay, prevMonth),
          prevY: prevYear,
          prevYdelay: prev2.delay,
          prevYavg: getDailyAvgDelay(prev2.delay, prevYear),
          prevYM: prevYearMonth,
          prevYMdelay: prev3.delay,
          prevYMavg: getDailyAvgDelay(prev3.delay, prevYearMonth),
          total: get(ddByTmc.get(tmc), "total", null),
          totalAvgDaily: get(ddByTmc.get(tmc), "dailyAvg", null)
        })
      }
      return a;
    }, [])
  }, [
    tableDate, prevMonth, prevYear, prevYearMonth,
    tmcs, Months, delayData, getTmcData, ddByTmc
  ]);

  const Columns = React.useMemo(() => {
    return getColumns(prevMonth, prevYear, prevYearMonth);
  }, [prevMonth, prevYear, prevYearMonth]);
  
  
  return (
    <>
      <div>
        <pre>
          {JSON.stringify(rawDelayData,null,3)}
        </pre>
      </div>
      <div>
        <pre>
          {JSON.stringify(tmcData,null,3)}
        </pre>
      </div>
    </>
    // <Table 
    //   data={ tableData }
    //   columns={ Columns }
    //   disableFilters={ true }
    //   sortBy="delay"
    //   sortOrder="DESC"
    // />
  )
}


export default CongestionSegmentTable