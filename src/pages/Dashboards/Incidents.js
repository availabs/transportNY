import React from "react"

import get from "lodash.get";

import { useSelector } from 'react-redux';

import {
  PieGraph,
  BarGraph,
  generateTestPieData
} from "modules/avl-graph/src"

import {
  useFalcor,
  useTheme,
  Table
} from "modules/avl-components/src"

import {
  useGeographies,
  useComponentDidMount
} from './components/utils'

import DashboardLayout from './components/DashboardLayout'

const F_SYSTEMS = [1, 2, 3, 4, 5, 6, 7];




const Incidents = props => {

  const theme = useTheme()
  const { falcor, falcorCache } = useFalcor();
  const {region, month, fsystem} = useSelector(state => state.dashboard)
  const geography = region.replace('|','-')
  const geographies = useGeographies();
  
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
  
  
  const getRequest = () => {
    if (geographies.length ===0 || !geography || !(month)) return false;

    let [y,m] = month.split('-')
    let geo = geographies.filter(v => v.geoid === geography)[0]

    
    return JSON.stringify([
      new Date(y, m-1, 1).toISOString().substring(0, 10), //start date
      new Date(y, m, 0).toISOString().substring(0, 10), //end date
      get(geo,'bounding_box',[]),
      null, //eCategory.startsWith("All") ? null : eCategory,
      null //eType.startsWith("All") ? null : eType
    ]);
  }
 
  React.useEffect(() => {
    let request = getRequest()
    if(!request) return     

    setLoading(1)

    falcor.get(["transcom", "historical", "events", request])
      .then(res => {
        const eventIds = get(res, ["json", "transcom", "historical", "events", request], []);
        if (eventIds.length) {
          return falcor.chunk([
            "transcom", "historical", "events", eventIds,
            ["event_id", "congestion_data", "open_time", "close_time", "duration","event_type", "event_category"]
          ])
        }
      })
      .then(() => {
        if (MOUNTED) {
          setLoading(-1)
        }
      });
  }, [month, geography, geographies, MOUNTED]);
  
  const duration2minutes = (dur) => {
    let [days, time] = dur.split('-')
    let [hours, minutes] = time.split(':')
    let out = 1440 * (+days) + 60 * (+hours) + (+minutes) 
    return isNaN(out) ? 0 : out
  }

  let data = React.useMemo(()=> {
    let request = getRequest()
    let eventIds = get(falcorCache, ["transcom", "historical", "events", request, "value"], [])
    let keys = []
    let numEvents = 0
    let totalDuration = 0 
    let data = eventIds.reduce((out, eventId) => {
      let event = get(falcorCache, ["transcom", "historical", "events", eventId],  {})
      if(['accident', 'other'].includes(event.event_category)){
        let day = event.open_time.split(' ')[0]
        numEvents += 1
        totalDuration += duration2minutes(event.duration)
        if(!keys.includes(event.event_type)){
          keys.push(event.event_type)
        }
        if(!out[day]) {
          out[day] = { index: day }
        }
        if(!out[day][event.event_type]) {
          out[day][event.event_type] = 0
          out[day][`${event.event_type} duration`] = 0
        }
        out[day][event.event_type] += 1
         out[day][`${event.event_type} duration`] += duration2minutes(event.duration)
      }
      return out

    },{})

    let pieData = eventIds.reduce((out, eventId) => {
      let event = get(falcorCache, ["transcom", "historical", "events", eventId],  {})
      if(['accident', 'other'].includes(event.event_category)){
        let day = event.open_time.split(' ')[0]
        
        if(!out[event.event_type]) {
          out[event.event_type] = 0

          out[`${event.event_type} duration`] = 0
        }
        out[event.event_type] += 1
        out[`${event.event_type} duration`] += duration2minutes(event.duration)
      }
      return out

    },{index: month})

    let durationData = eventIds.reduce((out, eventId) => {
      let event = get(falcorCache, ["transcom", "historical", "events", eventId],  {})
      if(['accident', 'other'].includes(event.event_category)){
        let duration = duration2minutes(event.duration)
        if(duration < 30) {
          out['under 30'] += 1
        } else if (duration < 60) {
          out['30 to 60'] += 1
        } else if (duration < 90) {
          out['60 to 90'] += 1
        } else if (duration < 120) {
          out['90 to 120'] += 1
        } else if (duration < 240) {
          out['120 to 240'] += 1
        } else  {
          out['above 240'] += 1
        }
        
      }
      return out
    },{
        'under 30':0,
        '30 to 60':0,
        '60 to 90': 0,
        '90 to 120': 0,
        '120 to 240': 0,
        'above 240': 0
      } 
    )
    // console.log('durationData',durationData, Object.keys(durationData).map(k => {return {index: k, value: durationData[k]}}))
    return {
      numEvents,
      totalDuration,
      keys,
      durationData: Object.keys(durationData).map(k => {return {index: k, value: durationData[k]}}),
      data: Object.values(data)
        .sort((a,b) => { 
          return a.index.localeCompare(b.index) 
        }),
      pieData: [pieData]
    }

  },[falcorCache,geography,month])

 
  
  return (
      <DashboardLayout loading={loading}>
        <div className='bg-white shadow rounded p-4 '>
          Reported Transcom Accidents
          <div className='text-6xl text-extrabold text-gray-800 w-full text-center pt-2'>
            {
              data.numEvents
                .toLocaleString('en-US',{maximumFractionDigits: 0})
            }
          </div>
         
        </div>
        <div className='bg-white shadow rounded p-4 '>
          Incidents by Type
          <div className='h-64'>
            <PieGraph 
                keys={data.keys}
                data={get(data,'pieData',[])}
                colors={theme.graphCategorical}
                hoverComp={ {
                  valueFormat: ","
                } }
            />
          </div>
        </div>
        <div className='bg-white shadow rounded p-4 col-span-2'>
          Incidents Type by Day
          <BarGraph 
            colors={theme.graphCategorical.reverse()}
            indexBy="index"
            data={ data.data }
            keys={ data.keys }
            margin={ { top: 5, right: 5, bottom: 35, left: 70 } }
            padding={ 0.2 }
            axisBottom={ {
              tickDensity: 2
            } }
            axisLeft={ { ticks: 5 } }/>
        </div>
        <div className='bg-white shadow rounded p-4 '>
          Total Incident Duration
          <div className='text-6xl text-extrabold text-gray-800 w-full text-center pt-2'>
            {
              (Math.floor(data.totalDuration/60)).toLocaleString('en-US',{maximumFractionDigits: 0})
                
            }:{data.totalDuration % 60}
            <div className='text-sm text-extrabold text-gray-600 w-full text-center '>
              Hours : Minutes
            </div>
          </div>
          Avg Incident Duration
          <div className='text-6xl text-extrabold text-gray-800 w-full text-center pt-2'>
            {
              (Math.floor((data.totalDuration/data.numEvents)/60)).toLocaleString('en-US',{maximumFractionDigits: 0})
                
            }:{(Math.floor((data.totalDuration/data.numEvents))% 60).toString().padStart(2,'0') }
            <div className='text-sm text-extrabold text-gray-600 w-full text-center '>
              Hours : Minutes
            </div>
          </div>
        </div>
        <div className='bg-white shadow rounded p-4 '>
          Incident Duration by Type
          <div className='h-64'>
            <PieGraph 
                keys={data.keys.map(k => k+' duration')}
                data={get(data,'pieData',[])}
                colors={theme.graphCategorical}
                hoverComp={ {
                  valueFormat: ","
                } }
            />
          </div>
        </div>
        <div className='bg-white shadow rounded p-4 col-span-2 '>
          Incidents Type Duration by Day
          <BarGraph 
            colors={theme.graphCategorical.reverse()}
            indexBy="index"
            data={ data.data }
            keys={ data.keys.map(k => k+' duration') }
            margin={ { top: 5, right: 5, bottom: 35, left: 70 } }
            padding={ 0.2 }
            axisBottom={ {
              tickDensity: 2
            } }
            axisLeft={ { ticks: 5 } }/>
        </div>
        <div className='bg-white shadow rounded p-4 col-span-2 min-h-64'>
          Incidents Type Duration by Day
          <BarGraph 
            colors={theme.graphColors}
            indexBy="index"
            data={ data.durationData }
            keys={ ['value'] }
            margin={ { top: 5, right: 5, bottom: 35, left: 70 } }
            padding={ 0.2 }
            axisBottom={ {
              tickDensity: 2
            } }
            axisLeft={ { ticks: 5 } }/>
        </div>
        <div className='bg-white shadow rounded p-4 col-span-2'>
          {/*<pre>
            {JSON.stringify(theme.graphColors,null,3)}
          </pre>*/}
        </div>
        {/*<div className='bg-white shadow rounded p-4 col-span-2'>
          <pre>
            {JSON.stringify(data.durationData,null,3)}
          </pre>
        </div>*/}
      </DashboardLayout>
    
  )
}




export default [{
  name:'Incidents',
  icon: 'fal fa-chart-line',
  path: "/",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: Incidents,
},
{
  name:'Incidents',
  icon: 'fal fa-chart-line',
  path: "/incidents",
  exact: true,
  auth: false,
  mainNav: true,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: Incidents,
}];
