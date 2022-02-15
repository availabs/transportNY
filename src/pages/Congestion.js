import React from "react"

import get from "lodash.get";

import {
  PieGraph,
  BarGraph,
  generateTestPieData
} from "modules/avl-graph/src"

import {
  useFalcor,
  useTheme,
  Select,
  ScalableLoading,
  BooleanInput,
  Table,
  Button
} from "modules/avl-components/src"

const REGIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const NY_REGION = { name: "NY State", region: "STATE|36" };
const F_SYSTEMS = [1, 2, 3, 4, 5, 6, 7];

const InitialState = {
  region: "REGION|1",
  fSystems: F_SYSTEMS,
  month: '' 
}
const Reducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "update-state":
      return {
        ...state,
        ...payload,
      };
    default:
      return state;
  }
};

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

  const MOUNTED = useComponentDidMount();

  const [loading, _setLoading] = React.useState(0);
  const setLoading = React.useCallback(
    (loading) => {
      if (MOUNTED) {
        _setLoading((prev) => Math.max(0, prev + loading));
      }
    },
    [MOUNTED]
  );

  const [state, dispatch] = React.useReducer(Reducer, InitialState);

  const setRegion = React.useCallback((region) => {
    dispatch({
      type: "update-state",
      region,
    });
  }, []);

  const setMonth = React.useCallback((month) => {
    dispatch({
      type: "update-state",
      month,
    });
  }, []);

  const setFsystems = React.useCallback(fSystems => {
    dispatch({
      type: "update-state",
      fSystems
    });
  }, [])

  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    setLoading(1);
    falcor
      .get(["hds", "regions", "byId", REGIONS, ["region", "name"]])
      .then(() => setLoading(-1));
  }, [falcor, setLoading]);

  React.useEffect(() => {
    if (!state.region || !state.fSystems.length) return;
    setLoading(1);
    falcor
      .get(
        ["delay",
          { from: 2016, to: 2021 }, { from: 1, to: 12 },
          state.region, state.fSystems,
          ["total", "non_recurrent"]
        ],
      )
      .then(res => console.log("RES:", res))
      .then(() => setLoading(-1));
  }, [falcor, setLoading, state.region, state.fSystems]);

  const Regions = [
    {
        "region": "REGION|1",
        "name": "Capital District"
    },
    {
        "region": "REGION|2",
        "name": "Mohawk Valley"
    },
    {
        "region": "REGION|3",
        "name": "Central New York"
    },
    {
        "region": "REGION|4",
        "name": "Genesee Valley"
    },
    {
        "region": "REGION|5",
        "name": "Western New York"
    },
    {
        "region": "REGION|6",
        "name": "Southern Tier/Central New York"
    },
    {
        "region": "REGION|7",
        "name": "North Country"
    },
    {
        "region": "REGION|8",
        "name": "Hudson Valley"
    },
    {
        "region": "REGION|9",
        "name": "Southern Tier"
    },
    {
        "region": "REGION|10",
        "name": "Long Island"
    },
    {
        "region": "REGION|11",
        "name": "New York City "
    }
]

  const [pieData, setPieData] = React.useState({ data: [], keys: [] });
  const [months, setMonths] = React.useState([])
  React.useEffect(() => {
    const data = [], keys = [];
    for (let y = 2016; y <= 2020; ++y) {
      for (let m = 1; m <= 12; ++m) {
        const index = `${ y }-${ `0${ m }`.slice(-2) }`
        const [total, non_recurrent] = state.fSystems.reduce((a, c) => {
          const d = get(falcorCache, ["delay", y, m, state.region, c], null);
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
      let months = data.map(d => d.index).reverse()
      setMonths(months)
      if(!state.month) {
        setMonth(months[0])
      }
    }
  }, [falcorCache, state.region, state.fSystems]);

  const currentMonth = get(get(pieData,'data',[]).filter(d => d.index === state.month),'[0]',{recurrent: 0, "non-recurrent": 0})
  const currentMonthTotal = (currentMonth['recurrent'] + currentMonth['non-recurrent'])

  const totalByYear = get(pieData,'data',[])
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
    },{})

  const year = state.month.substring(0,4)
  const curMonth = state.month.substring(5,7)
  console.log('testing',pieData, pieData.data)

  return (
    <div className='px-4 max-w-7xl mx-auto'> 
      NYSDOT TISMO DASHBOARD 
    <div className="grid grid-cols-1 gap-4">

      <div className={ `
        inset-0 ${ loading ? "fixed" : "hidden" }
        flex justify-center items-center z-50 bg-black opacity-50
      `}>
        <ScalableLoading />
      </div>

      <div className="font-bold text-3xl">
        Congestion
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-2">
          <span className="">REGION</span>
          <Select options={ Regions }
            accessor={ v => v.name }
            valueAccessor={ v => v.region }
            value={ state.region }
            onChange={ setRegion }
            multi={ false }/>
        </div>
        <div>
          <span className="">MONTH</span>
          <Select options={ months }
            value={state.month}
            onChange={ setMonth }
            multi={ false }/>
        </div>
        <div>
          <span className="">ROAD CLASS</span>
          <Select options={ F_SYSTEMS }
            value={ state.fSystems }
            onChange={ setFsystems }
            multi={ true }/>
        </div>
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
         
          Monthly Avg Congestion {curMonth}
          <div className='text-5xl text-extrabold text-gray-800 w-full text-center pt-2'>
            {
              get(totalByYear,`[${curMonth}].avg`,0)
                .toLocaleString('en-US',{maximumFractionDigits: 0})
            }
          </div>
          <div className='text-sm text-extrabold text-gray-600 w-full text-center '>
          Vehicle Hours of Delay
          </div>
          
        </div>
        <div className='bg-white shadow rounded p-4 '>
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
              data={get(pieData,'data',[]).filter(d => d.index === state.month)}
              hoverComp={ {
                valueFormat: ",.2f"
              } }/>
          </div>
          
        </div>
        <div className='bg-white shadow rounded p-4 col-span-2'>
          Bar Graph
          <BarGraph indexBy="index"
                    data={ pieData.data.filter(d => d.index.substring(0,4) === year) }
                    keys={ pieData.keys }
                    margin={ { top: 5, right: 5, bottom: 35, left: 70 } }
                    padding={ 0.2 }
                    axisBottom={ {
                      tickDensity: 2
                    } }
                    axisLeft={ { ticks: 5 } }/>
        </div>
        <div className='bg-white shadow rounded p-4 col-span-2'>
          Info Tab
          <div>{currentMonth.recurrent + currentMonth['non-recurrent']}</div>
          <pre>
            {JSON.stringify(state)}
            {JSON.stringify(totalByYear,null,3)}
            
          </pre>
        </div>

      </div>

      

      

    </div>
    </div>
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
