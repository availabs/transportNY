import React from "react"

import get from "lodash.get";
import { useSelector } from 'react-redux';



import {
  PieGraph,
  BarGraph
} from "modules/avl-graph/src"

import {
  useFalcor,
  useTheme
} from "modules/avl-components/src"

import { F_SYSTEMS, F_SYSTEM_MAP } from 'sites/tsmo/pages/Dashboards/components/metaData'

import DashboardLayout from 'sites/tsmo/pages/Dashboards/components/DashboardLayout'
import CongestionSegmentTable from './components/congestionSegmentTable'
import CongestionCorridorTable from './components/congestionCorridorTable'
import CongestionMap from './components/congestionMap'


import { fraction, CompareComp, displayDuration } from "sites/tsmo/pages/Dashboards/Incidents/components/CompareComp"


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
  const {region, month: tableDate, /*fsystem*/} = useSelector(state => state.dashboard)
  const [year, month] = tableDate.split("-").map(Number)

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
          { from: 2016, to: 2021 }, { from: 1, to: 12 },
          region, F_SYSTEMS,
          ["total", "non_recurrent"]
        ],
        ["excessive", "delay", region, "top", 10]
      )
      .then(() => setLoading(-1));
  }, [falcor, setLoading, region]);

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

   const [fullDelayData, setFullDelayData] = React.useState({});

  React.useEffect(() => {
    const data = get(
      falcorCache,
      [ "delay"],
      {}
    );
    if(Object.keys(data).length) {
      setFullDelayData(data)
    }
  }, [region,year,falcorCache]);



  const [pieData, setPieData] = React.useState({ data: [], keys: [] });
  // const [months, setMonths] = React.useState([])
  React.useEffect(() => {
    const data = [];
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
  }, [falcorCache, region]);

    const currentMonth = get(get(pieData,'data',[]).filter(d => d.index === tableDate),'[0]',{recurrent: 0, "non-recurrent": 0})
    const currentMonthTotal = (currentMonth['recurrent'] + currentMonth['non-recurrent'])

    const compareData = React.useMemo(() => {
      const py = year - 1,
        pm = (month - 2 + 12) % 12 + 1,
        prevMonth = `${ pm == 12 ? year - 1 : year }-${ `0${ pm }`.slice(-2) }`,
        prevYear = `${ py }-${ `0${ month }`.slice(-2) }`;
      return {
        currMonth: pieData.data.reduce((a, c) => {
            if (c.index === tableDate) {
              return c.recurrent + c["non-recurrent"];
            }
            return a;
          }, 0),
        prevMonth: pieData.data.reduce((a, c) => {
            if (c.index === prevMonth) {
              return c.recurrent + c["non-recurrent"];
            }
            return a;
          }, 0),
        prevYear: pieData.data.reduce((a, c) => {
            if (c.index === prevYear) {
              return c.recurrent + c["non-recurrent"];
            }
            return a;
          }, 0),
      }
    }, [pieData, tableDate, year, month]);

  return (
      <DashboardLayout
        loading={loading}>
        <div className='bg-white shadow rounded p-4 '>
          Total Congestion

          <div className='text-gray-800 text-center pt-2 grid grid-cols-2'>
            <div className="text-6xl col-span-2">
              { fraction(compareData.currMonth) }
            </div>
            <CompareComp title="Prev. Month"
              prev={ compareData.prevMonth }
              curr={ compareData.currMonth }/>
            <CompareComp title="Prev. Year"
              prev={ compareData.prevYear }
              curr={ compareData.currMonth }/>
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
            data={ pieData.data.filter(d => +d.index.substring(0,4) === +year) }
            keys={ pieData.keys }
            margin={ { top: 5, right: 5, bottom: 35, left: 70 } }
            padding={ 0.2 }
            axisBottom={ {
              tickDensity: 2
            } }
            axisLeft={ { ticks: 5 } }/>
        </div>

        <div className='bg-white shadow rounded p-4 col-span-2'>
          Highest Congestion Segments
          <CongestionCorridorTable
            rawDelayData={fullDelayData}
          />
        </div>

        <div className='bg-white shadow rounded p-4 col-span-2'>

          <CongestionMap
            rawDelayData={fullDelayData}
          />
        </div>

        <div className='bg-white shadow rounded p-4 col-span-4'>
          Highest Congestion Segments
          <CongestionSegmentTable
            rawDelayData={rawDelayData}
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
