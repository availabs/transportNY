import React from "react"

import get from "lodash.get";
import { useSelector } from 'react-redux';


import {
  groups as d3groups,
  rollups as d3rollups,
  rollup as d3rollup,
} from "d3-array"

import { format as d3format } from "d3-format"


import {
  PieGraph,
  BarGraph
} from "modules/avl-graph/src"

import {
  useFalcor,
  useTheme
} from "modules/avl-components/src"

import { F_SYSTEMS } from './components/metaData'

import DashboardLayout from './components/DashboardLayout'

import CongestionSegmentTable from './components/congestionSegmentTable'

import CongestionCorridorTable from './components/congestionCorridorTable'




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



const useComponentDidMount = () => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);
  return mounted;
};

const RecurrentDelay = props => {
  const theme = useTheme()
  const MOUNTED = useComponentDidMount();
  const {region, month: tableDate, fsystem} = useSelector(state => state.dashboard)
  const [year, month] = tableDate.split("-").map(Number),
        py = year - 1,
        pm = (month - 2 + 12) % 12 + 1,
        prevMonth = `${ pm == 12 ? year - 1 : year }-${ `0${ pm }`.slice(-2) }`,
        prevYear = `${ py }-${ `0${ month }`.slice(-2) }`,
        prevYearMonth = `${ pm == 12 ? py - 1 : py }-${ `0${ pm }`.slice(-2) }`;

  const [loading, _setLoading] = React.useState(0);
  const [showDPM, setShowDPM] = React.useState(false)
  const setLoading = React.useCallback(
    (loading) => {
      if (MOUNTED) {
        _setLoading((prev) => Math.max(0, prev + loading));
      }
    },
    [MOUNTED]
  );


  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {

    if (!region || !F_SYSTEMS.length) return;
    setLoading(1);
    //sconsole.log('test', region, F_SYSTEMS)
    falcor
      .get(
        ["delay",
          { from: 2016, to: 2021 }, { from: 1, to: 12 },
          region, F_SYSTEMS,
          ["total", "non_recurrent"]
        ],
        ["excessive", "delay", region, "top", 10]
      )
      .then(res => console.log("RES:", res))
      .then(() => setLoading(-1));
  }, [falcor, setLoading, region, F_SYSTEMS]);

  const [rawDelayData, setRawDelayData] = React.useState([]);
  
  React.useEffect(() => {
    const data = get(
      falcorCache,
      ["excessive", "delay", region, "top", 10, "value"],
      []
    );

    if (data.length) {
      setRawDelayData(data);
    }
  }, [region,falcorCache]);

   const [fullDelayData, setFullDelayData] = React.useState([]);
  
  React.useEffect(() => {
    const data = get(
      falcorCache,
      [ "delay", year],
      {}
    );
    let mn = +month
    let tmcs = F_SYSTEMS.reduce((out,fclass) => {

      get(data,`[${mn}][${region}][${fclass}].total.value`,[])
        .forEach(tmc => {
          if(!out.includes(tmc.tmc)){
            out.push(tmc.tmc)
          }
        })
      return out 
    },[])
    console.log('getting delay', data, tmcs)
    



   
  }, [region,year,falcorCache]);

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


  const [pieData, setPieData] = React.useState({ data: [], keys: [] });
  const [months, setMonths] = React.useState([])
  React.useEffect(() => {
    const data = [], keys = [];
    for (let y = 2016; y <= 2020; ++y) {
      for (let m = 1; m <= 12; ++m) {
        const index = `${ y }-${ `0${ m }`.slice(-2) }`
        const [total, non_recurrent] = F_SYSTEMS.reduce((a, c) => {
          const d = get(falcorCache, ["delay", y, m, region, c], null);
          if (d) {
            a[0] += d.total.value.reduce((a, c) => a + c.value, 0);
            a[1] += d.non_recurrent.value.reduce((a, c) => a + c.value, 0);
          }
          return a;
        }, [0, 0]);
        if (total) {
          data.push({
            index,
            recurrent: total - non_recurrent,
            "non-recurrent": non_recurrent
          })
        }
      }
    }

    if (data.length) {
      setPieData({ data, keys: ["recurrent", "non-recurrent"] });
    }
  }, [falcorCache, region, F_SYSTEMS]);

  // console.log('pie data', pieData, pieData.data.filter(d => +d.index.substring(0,4) === year))
  const currentMonth = get(get(pieData,'data',[]).filter(d => d.index === tableDate),'[0]',{recurrent: 0, "non-recurrent": 0})
  const currentMonthTotal = (currentMonth['recurrent'] + currentMonth['non-recurrent'])



  const totalByYear = React.useMemo(() => get(pieData,'data',[])
    .reduce((total, curr) => {
      let year = curr.index.substring(0,4)
      let month = curr.index.substring(5,7)

      if(!total[year]) {
        total[year] = {
          recurrent: 0,
          non_recurrent: 0,
          total: 0,
          months:0
        }
      }
      total[year].recurrent += curr.recurrent
      total[year].non_recurrent += curr['non-recurrent']
      total[year].total += curr['non-recurrent'] + curr.recurrent
      total[year].months += 1

      if(!total[month]) {
        total[month] = {
          recurrent: 0,
          non_recurrent: 0,
          total: 0,
          avg: 0,
          count:0
        }
      }
      total[month].recurrent += curr.recurrent
      total[month].non_recurrent += curr['non-recurrent']
      total[month].total += curr['non-recurrent'] + curr.recurrent
      total[month].count += 1
      total[month].avg = total[month].total / total[month].count 
      return total
    },{}),[pieData])
  
  return (
      <DashboardLayout
        loading={loading}>
        <div className='bg-white shadow rounded p-4 '>
          Total Congestion
          <div className='text-5xl text-extrabold text-gray-800 w-full text-center pt-2'>
            {
              currentMonthTotal
                .toLocaleString('en-US',{maximumFractionDigits: 0})
            }
          </div>
          <div className='text-sm text-extrabold text-gray-600 w-full text-center '>
          Vehicle Hours of Delay
          </div>
          Total Year Congestion {year}
          <div className='text-5xl text-extrabold text-gray-800 w-full text-center pt-2'>
            {
              get(totalByYear,`[${year}].total`,0)
                .toLocaleString('en-US',{maximumFractionDigits: 0})
            }
          </div>
          <div className='text-sm text-extrabold text-gray-600 w-full text-center '>
          Vehicle Hours of Delay
          </div>
         
          Monthly Avg Congestion {month}
          <div className='text-5xl text-extrabold text-gray-800 w-full text-center pt-2'>
            {
              get(totalByYear,`[${month}].avg`,0)
                .toLocaleString('en-US',{maximumFractionDigits: 0})
            }
          </div>
          <div className='text-sm text-extrabold text-gray-600 w-full text-center '>
          Vehicle Hours of Delay
          </div>
          
        </div>
        <div className='bg-white shadow rounded p-4'>
          Recurrent vs Non-Recurrent 
          <div className='flex'>
            <div className='flex-1 text-center'>
              Recurrent
              <div className='text-lg text-extrabold text-gray-800 w-full  '>
                {
                  currentMonth.recurrent
                    .toLocaleString('en-US',{maximumFractionDigits: 0})
                }
              </div>
              <div className='text-lg text-extrabold text-gray-800 w-full '>
                {
                  ((currentMonth.recurrent / currentMonthTotal) * 100).toFixed(1)
                  
                }%
              </div>
            </div>
            <div className='flex-1 text-center'>
              Non-Recurrent
              <div className='text-lg text-extrabold text-gray-800 w-full  '>
                {
                  get(currentMonth, `['non-recurrent']`,0)
                    .toLocaleString('en-US',{maximumFractionDigits: 0})
                }
              </div>
              <div className='text-lg text-extrabold text-gray-800 w-full'>
                {
                  ((get(currentMonth, `['non-recurrent']`,0) / currentMonthTotal) * 100).toFixed(1)
                  
                }%
              </div>
            </div>
          </div>
          <div className='w-full h-64'>
            <PieGraph 
              keys={pieData.keys}
              data={get(pieData,'data',[]).filter(d => d.index === tableDate)}
              colors={theme.graphColors}
              hoverComp={ {
                valueFormat: ",.2f"
              } }/>
          </div>
          
        </div>
        <div className='bg-white shadow rounded p-4 col-span-2'>
          Bar Graph
          <BarGraph 
            colors={theme.graphColors}
            indexBy="index"
            data={ pieData.data.filter(d => d.index.substring(0,4) == year) }
            keys={ pieData.keys }
            margin={ { top: 5, right: 5, bottom: 35, left: 70 } }
            padding={ 0.2 }
            axisBottom={ {
              tickDensity: 2
            } }
            axisLeft={ { ticks: 5 } }/>
        </div>
        <div className='bg-white shadow rounded p-4 col-span-4'>
          Highest Congestion Segments
          <CongestionSegmentTable 
            rawDelayData={rawDelayData}
          />
        </div> 
        <div className='bg-white shadow rounded p-4 col-span-4'>
          Highest Congestion Segments
          <CongestionCorridorTable 
            rawDelayData={rawDelayData}
          />
        </div> 

        
    </DashboardLayout>
  )
}

const config = {
  name: "Congestion",
 
  icon: "fad fa-flask",
  path: '/congestion',
  exact: true,
  mainNav: true,
  auth: false,
  sideNav: {
    size: 'micro'
  },
  
  component: RecurrentDelay,
};

export default config;
