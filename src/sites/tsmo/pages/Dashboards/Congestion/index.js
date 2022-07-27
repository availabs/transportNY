import React from "react"

import get from "lodash.get";
import { useSelector } from 'react-redux';

import { format as d3format } from "d3-format"

import {
  PieGraph,
  BarGraph
} from "modules/avl-graph/src"

import {
  useFalcor,
  useTheme
} from "modules/avl-components/src"

import { F_SYSTEM_MAP } from 'sites/tsmo/pages/Dashboards/components/metaData'

import DashboardLayout from 'sites/tsmo/pages/Dashboards/components/DashboardLayout'
// import CongestionSegmentTable from './components/congestionSegmentTable'
import CongestionCorridorTable from './components/congestionCorridorTable'
import CongestionMap from './components/congestionMap'


import { CongestionStatComp/*, displayDuration*/ } from "sites/tsmo/pages/Dashboards/Incidents/components/CompareComp"

import {/*duration2minutes*/  vehicleDelay2cost} from 'sites/tsmo/pages/Dashboards/Incidents/components/utils'

import { calcCost } from "./components/data_processing"

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

const colors =  ['#e5496d', '#fad264', '#F8C22E','#E6AB07','#B08306', '#7A5A04']
// const colors = ['#e96835','#f5dc50','#a63b6e','#e54249','#49969b'],
// const colors = ['#1e4b5a','#e75148','#0f1e37','#8c786e',],
// const colors = ['#fde72f','#95d840','#55a488','#2f708e','#453781','#472354'],
// const colors =  ['#5fc0c8','#5559d3','#ed8534','#7e84fa','#7fe06a']
const colorsForTypes = {
  'recurrent' : colors[0],
  'non-recurrent' : colors[1],
  'accident': colors[2],
  'construction' : colors[3]
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

const calculateCosts = (tmcDelayData, tmcMetaData) => {
	const costs = {
		total: 0,
		accident: 0,
		construction: 0,
		"non-recurrent": 0,
		recurrent: 0
	}
console.log("calculateCosts:", tmcDelayData, tmcMetaData)
	for (const tmc in tmcDelayData) {
		for (const key in costs) {
			costs[key] += calcCost(tmcDelayData[tmc][key], get(tmcMetaData, tmc, {}))
		}
	}
	return costs
}

const RecurrentDelay = props => {
  //const theme = useTheme()
  const MOUNTED = useComponentDidMount();
  const {region, month: tableDate, fsystem} = useSelector(state => state.dashboard)
  const [year, month] = React.useMemo(() => tableDate.split("-").map(Number), [tableDate])

  const [loading, _setLoading] = React.useState(0);
  // const [showDPM, setShowDPM] = React.useState(false)
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
    if (!region) return;

    setLoading(1);

    falcor
      .get(
        ["delay",
          { from: (year-1), to: year }, { from: 1, to: 12 },
          region,  F_SYSTEM_MAP[fsystem],
          ["delay"]
        ],
        // ["excessive", "delay", "top", "fsystems",topFsystemsKey]
      )
      // .then(res => console.log("RES:", res))
      .then(() => setLoading(-1));
  }, [falcor, setLoading, region, year, fsystem]);

  const TMCs = React.useMemo(() => {
    const tmcMap = F_SYSTEM_MAP[fsystem].reduce((a, c) => {
      const data = get(falcorCache, ["delay", year, month, region, c, "delay", "value"], []);
      const tmcs = data.filter(d => d.total).map(d => d.tmc);
      return tmcs.reduce((aa, cc) => { aa[cc] = true; return aa; }, a);
    }, {});
    return Object.keys(tmcMap);
  }, [falcorCache, year, month, region, fsystem]);

  React.useEffect(() => {
    if (TMCs.length) {
      falcor.chunk(["tmc", TMCs, "meta", [year - 1, year], ["aadt", "aadt_combi", "aadt_singl"]])
    }
  }, [falcor, TMCs]);

  const compareData = React.useMemo(() => {
    const py = year - 1,
      pm = (month - 2 + 12) % 12 + 1;
    const dates = {
      curr: [year, month],
      pm: [pm === 12 ? py : year, pm],
      py: [py, month]
    }
    const currDelayData = F_SYSTEM_MAP[fsystem].reduce((a, c) => {
      const d = get(falcorCache, ["delay", ...dates.curr, region, c, "delay", "value"], []);
      return d.reduce((aa, { tmc, ...rest }) => {
        if (!aa[tmc]) {
          aa[tmc] = {
            index: `${ dates.curr[0] }-${ `0${ dates.curr[1] }`.slice(-1) }`,
            total: 0,
            accident: 0,
            construction: 0,
            "non-recurrent": 0,
            recurrent: 0
          }
        }
        aa[tmc].total += rest.total;
        aa[tmc].accident += rest.accident;
        aa[tmc].construction += rest.construction;
        aa[tmc]["non-recurrent"] += (rest.non_recurrent - rest.accident - rest.construction);
        aa[tmc].recurrent += (rest.total - rest.non_recurrent);
        return aa;
      }, a)
    }, {});
    const currTmcMetaData = TMCs.reduce((a, tmc) => {
      a[tmc] = get(falcorCache, ["tmc", tmc, "meta", dates.curr[0]], {});
      return a;
    }, {});
    const currMonth = calculateCosts(currDelayData, currTmcMetaData);

    const pmDelayData = F_SYSTEM_MAP[fsystem].reduce((a, c) => {
      const d = get(falcorCache, ["delay", ...dates.pm, region, c, "delay", "value"], []);
      return d.reduce((aa, { tmc, ...rest }) => {
        if (!aa[tmc]) {
          aa[tmc] = {
            index: `${ dates.pm[0] }-${ `0${ dates.pm[1] }`.slice(-1) }`,
            total: 0,
            accident: 0,
            construction: 0,
            "non-recurrent": 0,
            recurrent: 0
          }
        }
        aa[tmc].total += rest.total;
        aa[tmc].accident += rest.accident;
        aa[tmc].construction += rest.construction;
        aa[tmc]["non-recurrent"] += (rest.non_recurrent - rest.accident - rest.construction);
        aa[tmc].recurrent += (rest.total - rest.non_recurrent);
        return aa;
      }, a)
    }, {});
    const pmTmcMetaData = TMCs.reduce((a, tmc) => {
      a[tmc] = get(falcorCache, ["tmc", tmc, "meta", dates.pm[0]], {})
      return a;
    }, {});
    const prevMonth = calculateCosts(pmDelayData, pmTmcMetaData);

    const pyDelayData = F_SYSTEM_MAP[fsystem].reduce((a, c) => {
      const d = get(falcorCache, ["delay", ...dates.py, region, c, "delay", "value"], []);
      return d.reduce((aa, { tmc, ...rest }) => {
        if (!aa[tmc]) {
          aa[tmc] = {
            index: `${ dates.py[0] }-${ `0${ dates.py[1] }`.slice(-1) }`,
            total: 0,
            accident: 0,
            construction: 0,
            "non-recurrent": 0,
            recurrent: 0
          }
        }
        aa[tmc].total += rest.total;
        aa[tmc].accident += rest.accident;
        aa[tmc].construction += rest.construction;
        aa[tmc]["non-recurrent"] += (rest.non_recurrent - rest.accident - rest.construction);
        aa[tmc].recurrent += (rest.total - rest.non_recurrent);
        return aa;
      }, a)
    }, {});
    const pyTmcMetaData = TMCs.reduce((a, tmc) => {
      a[tmc] = get(falcorCache, ["tmc", tmc, "meta", dates.py[0]], {})
      return a;
    }, {});
    const prevYear = calculateCosts(pyDelayData, pyTmcMetaData);

    return {
      colorsForTypes,
      currMonth,
      prevMonth,
      prevYear
    }

  }, [falcorCache, TMCs, year, month, region, fsystem])

  // React.useEffect(() => {
  //   F_SYSTEM_MAP[fsystem].forEach(fsys => {
  //     const data = get(falcorCache, ["delay", year, month, region, fsys, "delay", "value"], []);
  //
  //     console.log("DATA:", year, month, region, fsys, data.filter(d => d.total));
  //   })
  // }, [falcorCache, year, month, region, fsystem])


   const [fullDelayData, setFullDelayData] = React.useState({});

  React.useEffect(() => {
    const data = get(
      falcorCache,
      [ "delay"],
      {}
    );
// console.log('getting data', falcorCache, data)
    if(Object.keys(data).length) {
      setFullDelayData(data)
    }
  }, [region,year,falcorCache]);



  const [pieData, setPieData] = React.useState({ data: [], keys: [] });
  // const [months, setMonths] = React.useState([])
  React.useEffect(() => {
    const data = [];
    for (let y = year-1; y <= year; ++y) {
      for (let m = 1; m <= 12; ++m) {
        const index = `${ y }-${ `0${ m }`.slice(-2) }`
        const [total, non_recurrent, construction, accident] = get(F_SYSTEM_MAP, [fsystem], [])
          .reduce((a, c) => {
            const d = get(falcorCache, ["delay", y, m, region, c], null);
            if (d) {
              //rawData.push(d.delay.value)
              a[0] += d.delay.value.reduce((a, c) => a + c.total, 0);
              a[1] += d.delay.value.reduce((a, c) => a + c.non_recurrent, 0);
              a[2] += d.delay.value.reduce((a, c) => a + c.construction, 0);
              a[3] += d.delay.value.reduce((a, c) => a + c.accident, 0);
              // a[4] += d.other.value.reduce((a, c) => a + c.value, 0);
            }
            return a;
          }, [0, 0, 0, 0, 0]);
        if (total) {
          data.push({
            index,
            recurrent: total - non_recurrent,
            "non-recurrent": non_recurrent - (construction + accident),
            total, construction, accident
          })
        }
      }
    }

    if (data.length) {
      setPieData({ data, keys: ["recurrent", "non-recurrent", "construction", "accident"] });

    }
  }, [falcorCache, region, fsystem, year, month]);

    // const currentMonth = get(get(pieData,'data',[]).filter(d => d.index === tableDate),'[0]',{recurrent: 0, "non-recurrent": 0})
    // const currentMonthTotal = (currentMonth['recurrent'] + currentMonth['non-recurrent'])

    // const compareDataOld = React.useMemo(() => {
    //   const py = year - 1,
    //     pm = (month - 2 + 12) % 12 + 1,
    //     prevMonth = `${+pm === 12 ? py : year }-${ `0${ pm }`.slice(-2) }`,
    //     prevYear = `${ py }-${ `0${ month }`.slice(-2) }`;
    //   return {
    //     colorsForTypes,
    //     currMonth: pieData.data.reduce((a, c) => {
    //         if (c.index === tableDate) {
    //           return {
    //             ...c,
    //             numDays: getDaysInMonth(year,month)
    //           };
    //         }
    //         return a;
    //       }, 0),
    //     prevMonth: pieData.data.reduce((a, c) => {
    //         if (c.index === prevMonth) {
    //           return {
    //             ...c,
    //             numDays: getDaysInMonth(year,pm)
    //           };
    //         }
    //         return a;
    //       }, 0),
    //     prevYear: pieData.data.reduce((a, c) => {
    //         if (c.index === prevYear) {
    //           return {
    //             ...c,
    //             numDays: getDaysInMonth(py,month)
    //           };
    //         }
    //         return a;
    //       }, 0),
    //   }
    // }, [pieData, tableDate, year, month]);

  const [hoveredTMCs, setHoveredTMCs] = React.useState([]);

  return (
      <DashboardLayout
        loading={loading}>
        <div className='bg-white shadow rounded p-4 col-span-4 md:col-span-2 lg:col-span-1'>

          <div className='w-full font-medium text-blue-400 border-b px-2 pb-3 border-gray-100 text-xs mb-4 '>
            Total Congestion Cost ( vs Prev Month/day )
          </div>

          <CongestionStatComp
            data={compareData}
            display={vehicleDelay2cost}
          />

        </div>
        <div className='flex flex-col bg-white shadow rounded p-4 col-span-4 md:col-span-2 lg:col-span-1'>
          <div className='w-full font-medium text-blue-400 border-b px-2 pb-3 border-gray-100 text-xs mb-4 '>
            Congestion by Type
          </div>
          <div className="flex-1">
            <PieGraph
              keys={pieData.keys}
              data={get(pieData,'data',[]).filter(d => d.index === tableDate)}
              colors={Object.values(colorsForTypes)}
              hoverComp={{
                valueFormat: ".3s",
                HoverComp: PieHoverComp
              }}/>
          </div>
        </div>
        <div className='bg-white shadow rounded p-4 col-span-2 col-span-4 lg:col-span-2'>
          <div className='w-full font-medium text-blue-400 border-b px-2 pb-3 border-gray-100 text-xs mb-4 '>
          Total Congestion (Vehicle Hours) by Month
          </div>
          <BarGraph
            colors={Object.values(colorsForTypes)}
            indexBy="index"
            hoverComp={ {
              valueFormat: ".3s"
            } }
            data={ pieData.data.filter(d => +d.index.substring(0,4) === +year) }
            keys={ pieData.keys }
            margin={ { top: 5, right: 5, bottom: 55, left: 55 } }
            padding={ 0.2 }
            axisBottom={ {
              tickDensity: 2
            } }
            axisLeft={ { ticks: 5 } }/>
        </div>
        {/*<div className='bg-white shadow rounded p-4 col-span-2'>
          <pre>
            {JSON.stringify(compareData, null ,3)}
          </pre>
        </div>*/}
         <div className='pt-4 pb-2 px-2 col-span-4'>
          <span className='text-xl font-medium uppercase text-gray-700'>
             Top 15 Corridors by Delay / Mile
          </span>
        </div>
        <div className='bg-white shadow rounded p-4 col-span-4 lg:col-span-2'>
          <CongestionCorridorTable
            rawDelayData={fullDelayData}
            setHoveredTMCs={ setHoveredTMCs }
          />
        </div>

        <div className='bg-white shadow rounded p-4 col-span-4 lg:col-span-2'>

          <CongestionMap
            rawDelayData={fullDelayData}
            hoveredTMCs={ hoveredTMCs }
          />
        </div>




    </DashboardLayout>
  )
}

const config = {
  name: "Congestion",
  title: 'Transportation Systems Management and Operations (TSMO) System Performance Dashboards',
  icon: "fa-duotone fa-traffic-light-slow fa-fw",
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

const precentFormat = d3format(",.1%")

const PieHoverComp = ({ data, keys, indexFormat, keyFormat, valueFormat, ...rest }) => {
  const theme = useTheme();
  const total = keys.reduce((a, c) => a + get(data, ["data", c], 0), 0);
  return (
    <div style={ { width: "22rem" } }
      className={ `
        px-2 py-1 rounded grid grid-cols-12 gap-1
        ${ theme.accent1 }
      ` }>
      <div className="font-bold text-lg leading-5 border-current border-b-2 col-span-12">
        { indexFormat(get(data, "index", null)) }
      </div>

        { keys.map(key => (
            <div key={ key }
              className={ `
                col-span-12 px-1
                grid grid-cols-12 items-center
                border-2 rounded transition
                ${ data.key === key ? "border-current" : "border-transparent" }
              `}>
              <div className="col-span-1">
                <div className="rounded-sm color-square w-5 h-5"
                  style={ {
                    backgroundColor: get(data, ["colorMap", data.index, key], null),
                    opacity: data.key === key ? 1 : 0.2
                  } }/>
              </div>
              <div className="col-span-5">
                { keyFormat(key) }:
              </div>
              <div className="col-span-4 text-right">
                { valueFormat(get(data, ["data", key], 0)) }
              </div>
              <div className="col-span-2 text-right">
                { precentFormat(get(data, ["data", key], 0) / total) }
              </div>
            </div>
          ))
        }

      <div className="col-span-12 grid grid-cols-12 px-1">
        <div className="col-span-1"/>
        <div className="col-span-5">
          Total:
        </div>
        <div className="col-span-4 text-right">
          {  valueFormat(total) }
        </div>
      </div>
    </div>
  )
}
