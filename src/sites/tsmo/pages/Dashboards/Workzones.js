import React from "react"

import get from "lodash.get";

import { useSelector } from 'react-redux';

import {
  PieGraph,
  BarGraph
} from "modules/avl-graph/src"

import {
  useFalcor,
  useTheme,
} from "modules/avl-components/src"

import {
  useGeographies,
  useComponentDidMount
} from './components/utils'

import DashboardLayout from './components/DashboardLayout'


import IncidentTable from 'sites/tsmo/pages/Dashboards/Incidents/components/IncidentsTable'
import IncidentMap from 'sites/tsmo/pages/Dashboards/Incidents/components/IncidentsMap'

import { F_SYSTEMS, F_SYSTEM_MAP } from 'sites/tsmo/pages/Dashboards/components/metaData'

const duration2minutes = (dur) => {
  let [days, time] = dur.split('-')
  let [hours, minutes] = time.split(':')
  let out = 1440 * (+days) + 60 * (+hours) + (+minutes)
  return isNaN(out) ? 0 : out
}

const Construction = props => {


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

    const requests = React.useMemo(() => {

      if (geographies.length ===0 || !geography || !(month)) return [];

      let [y, m] = month.split('-')
      let geo = geographies.filter(v => v.geoid === geography)[0];

      return [
        JSON.stringify([new Date(y, m-1, 1).toISOString().substring(0, 10), //start date
          new Date(y, m, 0).toISOString().substring(0, 10), //end date
          get(geo,'geoid',""),
          ['construction'], //eCategory.startsWith("All") ? null : eCategory,
          null //eType.startsWith("All") ? null : eType
        ]),
        JSON.stringify([new Date(y, m-2, 1).toISOString().substring(0, 10), //start date
          new Date(y, m-1, 0).toISOString().substring(0, 10), //end date
          get(geo,'geoid',""),
          ['construction'], //eCategory.startsWith("All") ? null : eCategory,
          null //eType.startsWith("All") ? null : eType
        ]),
        JSON.stringify([new Date(y-1, m-1, 1).toISOString().substring(0, 10), //start date
          new Date(y-1, m, 0).toISOString().substring(0, 10), //end date
          get(geo,'geoid',""),
          ['construction'], //eCategory.startsWith("All") ? null : eCategory,
          null //eType.startsWith("All") ? null : eType
        ])
      ];
    }, [geographies, geography, month])

    React.useEffect(() => {

      if(!requests.length) return

      setLoading(1)

      falcor.get(["transcom", "historical", "events", "byGeom", requests])
        .then(res => {

          const eventIds = requests.reduce((a, c) => {
            const ids = get(res, ["json", "transcom", "historical", "events", "byGeom", c], []);
            a.push(...ids);
            return a;
          }, []);

          if (eventIds.length) {
            return falcor.chunk([
              "transcom", "historical", "events", eventIds,
              ["event_id", "n", "congestion_data","facility","from_mile_marker", "description","open_time", "close_time", "duration","event_type", "event_category","geom"]
            ])
          }
        })
        .then(() => { setLoading(-1); });
    }, [falcor,requests, setLoading]);



    let data = React.useMemo(()=> {
      let request = requests[0];
      let eventIds = get(falcorCache, ["transcom", "historical", "events", "byGeom", request, "value"], [])
      let keys = []
      let events = []
      let totalDuration = 0;

      let data = eventIds.reduce((out, eventId) => {
        let event = get(falcorCache, ["transcom", "historical", "events", eventId],  null)
        // if(['accident', 'other'].includes(event.event_category)){

        const fSystems = F_SYSTEM_MAP[fsystem];

        if (event && (!fSystems.length || fSystems.includes(event.n))) {
          let day = event.open_time.split(' ')[0]
          totalDuration += duration2minutes(event.duration)
          events.push(event)
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

      const prevMonthIds = get(falcorCache, ["transcom", "historical", "events", "byGeom", requests[1], "value"], []);
      const prevMonth = prevMonthIds.length;
      const prevMonthDur = prevMonthIds
        .reduce((a, c) => {
          const e = get(falcorCache, ["transcom", "historical", "events", c], { duration: "0 - 0:0" })
          return a + duration2minutes(e.duration);
        }, 0);

      const prevYearIds = get(falcorCache, ["transcom", "historical", "events", "byGeom", requests[2], "value"], []);
      const prevYear = prevYearIds.length;
      const prevYearDur = prevYearIds
        .reduce((a, c) => {
          const e = get(falcorCache, ["transcom", "historical", "events", c],  { duration: "0 - 0:0" })
          return a + duration2minutes(e.duration);
        }, 0);

      let pieData = events.reduce((out, event) => {

          let day = event.open_time.split(' ')[0]

          if(!out[event.event_type]) {
            out[event.event_type] = 0

            out[`${event.event_type} duration`] = 0
          }
          out[event.event_type] += 1
          out[`${event.event_type} duration`] += duration2minutes(event.duration)

        return out

      },{index: month})

      let durationData = events.reduce((out, e) => {
        // let e = get(falcorCache, ["transcom", "historical", "events", eventId],  null)

          let duration = duration2minutes(e.duration)
          if (duration < 30) {
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

        return out
      }, {
          'under 30': 0,
          '30 to 60': 0,
          '60 to 90': 0,
          '90 to 120': 0,
          '120 to 240': 0,
          'above 240': 0
        }
      )

      keys.sort((a, b) => a.localeCompare(b));

      const nc = theme.graphColors.length;
      const colorsForTypes = keys.reduce((a, c, i) => {
        a[c] = theme.graphColors[i % nc];
        return a;
      }, {})

console.log("colorsForTypes", colorsForTypes)

      return {
        events,
        numEvents: events.length,
        prevMonth,
        prevMonthDur,
        prevYear,
        prevYearDur,
        totalDuration,
        keys,
        colorsForTypes,
        durationData: Object.keys(durationData).map(k => ({ index: k, count: durationData[k] })),
        data: Object.values(data),
        pieData: [pieData]
      }

    }, [falcorCache,requests,month, theme.graphColors,fsystem])

    const [hoveredEvent, setHoveredEvent] = React.useState(null);

  return (
      <DashboardLayout loading={loading}>

        <div className='bg-white shadow rounded p-4 '>
          Reported Constructions
          <div className='text-gray-800 text-center pt-2 grid grid-cols-2'>
            <div className="text-6xl col-span-2">
              { fraction(data.numEvents) }
            </div>
            <CompareComp title="Prev. Month"
              prev={ data.prevMonth }
              curr={ data.numEvents }/>
            <CompareComp title="Prev. Year"
              prev={ data.prevYear }
              curr={ data.numEvents }/>
          </div>
        </div>
        <div className='bg-white shadow rounded p-4 '>
          Work Zones by Type
          <div className='h-64'>
            <PieGraph
                keys={data.keys}
                data={get(data,'pieData',[])}
                colors={theme.graphColors}
                hoverComp={ {
                  valueFormat: ","
                } }
            />
          </div>
        </div>
        <div className='bg-white shadow rounded p-4 col-span-2 flex flex-col'>
          <div>Work Zones Type by Day</div>
          <div className="flex-1">

            <BarGraph
              colors={theme.graphColors}
              indexBy="index"
              data={ data.data }
              keys={ data.keys }
              margin={ { top: 5, right: 5, bottom: 25, left: 50 } }
              padding={ 0.2 }
              axisBottom={ { tickDensity: 1 } }
              axisLeft={ { ticks: 5 } }/>

          </div>
        </div>

        <div className='bg-white shadow rounded p-4 '>
          Work Zones Duration
          <div className='text-gray-800 text-center pt-2 grid grid-cols-2 gap-x-2'>
            <div className="text-6xl col-span-2">
              { displayDuration(data.totalDuration) }
            </div>
            <div className='text-sm col-span-2 text-center '>
              Hours : Minutes
            </div>
            <CompareComp title="Prev. Month"
              prev={ data.prevMonthDur }
              curr={ data.totalDuration }
              display={ displayDuration }/>
            <CompareComp title="Prev. Year"
              prev={ data.prevYearDur }
              curr={ data.totalDuration }
              display={ displayDuration }/>
          </div>

        </div>

        <div className='bg-white shadow rounded p-4 '>
          Work Zones Duration by Type
          <div className='h-64'>
            <PieGraph
                keys={data.keys.map(k => k+' duration')}
                data={get(data,'pieData',[])}
                colors={theme.graphColors}
                hoverComp={ {
                  valueFormat: ","
                } }
            />
          </div>
        </div>

        <div className='bg-white shadow rounded p-4 col-span-2 flex flex-col'>
          <div>Work Zones Type Duration by Day</div>
          <div className="flex-1">

            <BarGraph
              colors={theme.graphColors}
              indexBy="index"
              data={ data.durationData }
              keys={ ['count'] }
              margin={ { top: 5, right: 5, bottom: 25, left: 50 } }
              padding={ 0.2 }
              axisBottom={ { tickDensity: 2 } }
              axisLeft={ { ticks: 5 } }/>

          </div>
        </div>

        <div className='bg-white shadow rounded p-4 col-span-2'>
          <IncidentTable events={data.events} setHoveredEvent={ setHoveredEvent }/>
        </div>

        <div className='bg-white shadow rounded p-4 col-span-2'>
          <IncidentMap colorsForTypes={ data.colorsForTypes }
            events={data.events}
            hoveredEvent={ hoveredEvent }/>
        </div>

        <div className='bg-white shadow rounded p-4 col-span-2'>

        </div>
        {/*<div className='bg-white shadow rounded p-4 col-span-2'>
          <pre>
            {JSON.stringify(data.pieData,null,3)}
          </pre>
        </div>*/}
   </DashboardLayout>
  )
}

const fraction = (f, d = 0) => f.toLocaleString('en-US', { maximumFractionDigits: d } );

const lessThan0 = v => v < 0.0;

const CompareComp = ({ prev, curr, title, display = fraction, green = lessThan0 }) => {
  const diff = curr - prev;
  const percent = diff / prev * 100;
  const icon = diff < 0.0 ? "fa fa-down" :
                diff > 0.0 ? "fa fa-up":
                "";
  const color = diff === 0 ? "" : green(diff) ? "text-green-600" : "text-red-600";
  return (
    <div>
      <div>{ title }</div>
      <div className='text-3xl'>
        { display(prev) }
      </div>
      <div className={ `text-3xl ${ color }` }>
        <span className={ `pr-1 ${ icon }` }/>
        { fraction(Math.abs(percent), 1) }%
      </div>
    </div>
  )
}

const displayDuration = duration =>
  `${ fraction(Math.floor(duration / 60)) }:${ duration % 60 }`;

const page = {
  name: 'Work Zones',
  path: "/workzones",
  exact: true,
  auth: false,
  mainNav:true,
  icon: 'fa-duotone fa-triangle-person-digging',
  title: 'Transportation Systems Management and Operations (TSMO) System Performance Dashboards',
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: Construction
};
export default page
