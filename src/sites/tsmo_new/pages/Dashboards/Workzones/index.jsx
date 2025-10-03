import React from "react"

import get from "lodash/get";

import { useSelector } from 'react-redux';

import {
  // PieGraph,
  BarGraph
} from "~/modules/avl-graph/src"

import {
  useFalcor,
  useTheme
} from "~/modules/avl-components/src"

import {
  useGeographies,
  useComponentDidMount
} from '~/sites/tsmo/pages/Dashboards/components/utils'

import IncidentTable from '../Incidents/components/IncidentsTable'
import IncidentMap from '../Incidents/components/IncidentsMap'

import DashboardLayout from "~/sites/tsmo/pages/Dashboards/components/DashboardLayout"

import { HeroStatComp } from "../Incidents/components/CompareComp"

import { F_SYSTEM_MAP } from '../components/metaData'

import { duration2minutes, vehicleDelay2cost } from '../Incidents/components/utils'
const TSMO_VIEW_ID = 1947;
const TMC_META_VIEW_ID = 984;
const Incidents = props => {
  const theme = useTheme()
  const { falcor, falcorCache } = useFalcor();
  const { region, month, fsystem } = useSelector(state => state.dashboard)
  const geography = region.replace('|', '-')
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

    if (geographies.length === 0 || !geography || !(month)) return [];

    let [y, m] = month.split('-')
    let geo = geographies.filter(v => v.geoid === geography)[0];

    return [
      JSON.stringify([new Date(y, m - 1, 1).toISOString().substring(0, 10), //start date
      new Date(y, m, 0).toISOString().substring(0, 10), //end date
      get(geo, 'geoid', ""),
      ['construction'], //eCategory.startsWith("All") ? null : eCategory,
        null //eType.startsWith("All") ? null : eType
      ]),
      JSON.stringify([new Date(y, m - 2, 1).toISOString().substring(0, 10), //start date
      new Date(y, m - 1, 0).toISOString().substring(0, 10), //end date
      get(geo, 'geoid', ""),
      ['construction'], //eCategory.startsWith("All") ? null : eCategory,
        null //eType.startsWith("All") ? null : eType
      ]),
      JSON.stringify([new Date(y - 1, m - 1, 1).toISOString().substring(0, 10), //start date
      new Date(y - 1, m, 0).toISOString().substring(0, 10), //end date
      get(geo, 'geoid', ""),
      ['construction'], //eCategory.startsWith("All") ? null : eCategory,
        null //eType.startsWith("All") ? null : eType
      ])
    ];
  }, [geographies, geography, month])

  React.useEffect(() => {

    if (!requests.length) return

    setLoading(1)

    falcor.get(["transcom3", "eventsbyGeom", TSMO_VIEW_ID, requests])
      .then(res => {
        const eventIds = requests.reduce((a, c) => {
          const ids = get(res, ["json", "transcom3", "eventsbyGeom", TSMO_VIEW_ID, c], []);
          a.push(...ids);
          return a;
        }, []);

        if (eventIds.length) {
          return falcor.chunk([
            "transcom3", TSMO_VIEW_ID, "eventsbyId", eventIds,
            ["event_id",
              "n",
              "cost",
              "congestion_data",
              "facility",
              "description",
              "start_date_time",
              "event_duration",
              "event_type",
              "event_category",
              "nysdot_general_category",
              "nysdot_sub_category",
              "start_date_time",
              "f_system",
              "geom"]
          ])
        }
      })
      .then((resp) => {
        setLoading(-1);
      });
  }, [falcor, requests, setLoading]);

  let data = React.useMemo(() => {

    const fSystems = F_SYSTEM_MAP[fsystem];
    let request = requests[0];
    let eventIds = get(falcorCache, ["transcom3", "eventsbyGeom", TSMO_VIEW_ID, request, "value"], [])
    let keys = []
    let events = []
    let currentMonthDays = []
    let prevMonthDays = []

    let data = eventIds.reduce((out, eventId) => {
      let event = get(falcorCache, ["transcom3", TSMO_VIEW_ID, "eventsbyId", eventId],  null)
      
      if (event && (!fSystems.length || fSystems.includes(event.n))) {
        let day = event.start_date_time.split(' ')[0]
        events.push(event)
        if (!keys.includes(event.nysdot_sub_category)) {
          keys.push(event.nysdot_sub_category)
        }
        if (!out[day]) {
          out[day] = { index: day }
        }
        if (!out[day][event.nysdot_sub_category]) {
          out[day][event.nysdot_sub_category] = 0
          out[day][`${event.nysdot_sub_category} duration`] = 0
        }
        out[day][event.nysdot_sub_category] += 1
        out[day][`${event.nysdot_sub_category} duration`] += duration2minutes(event.event_duration)
      }
      return out
    }, {})

    const currentMonthbyCat = get(falcorCache, ["transcom3", "eventsbyGeom", TSMO_VIEW_ID, requests[0], "value"], [])
      .map(c => get(falcorCache, ["transcom3", TSMO_VIEW_ID, "eventsbyId", c], {}))
      .sort((a, b) => get(a, 'congestion_data.value.vehicleDelay', 0) - get(b, 'congestion_data.value.vehicleDelay', 0))
      .reduce((a, e, i) => {
        if (e && (!fSystems.length || fSystems.includes(e.n))) {
          if (!a[e.nysdot_sub_category]) {
            a[e.nysdot_sub_category] = { count: 0, duration: 0, v_delay: 0, top_20_v_delay: 0 }
          }
          let day = get(e, 'start_date_time', '').split(' ')[0]
          if (!currentMonthDays.includes(day)) {
            currentMonthDays.push(day)
          }
          a[e.nysdot_sub_category].v_delay += get(e, 'congestion_data.value.vehicleDelay', 0)
          if (i < 20) {
            a[e.nysdot_sub_category].top_20_v_delay += get(e, 'congestion_data.value.vehicleDelay', 0)
          }
          a[e.nysdot_sub_category].duration += duration2minutes(e.event_duration);
          a[e.nysdot_sub_category].count += 1;
          a['Total'].v_delay += get(e, 'congestion_data.value.vehicleDelay', 0)
          a['Total'].duration += duration2minutes(e.event_duration);
          a['Total'].count += 1;
          return a
        }
        return a
      }, { Total: { count: 0, duration: 0, v_delay: 0, top_20_v_delay: 0 } });

    const prevMonthByCat = get(falcorCache, ["transcom3", "eventsbyGeom", TSMO_VIEW_ID, requests[1], "value"], [])
      .map(c => get(falcorCache, ["transcom3", TSMO_VIEW_ID, "eventsbyId", c], {}))
      .sort((a, b) => get(a, 'congestion_data.value.vehicleDelay', 0) - get(b, 'congestion_data.value.vehicleDelay', 0))
      .reduce((a, e, i) => {
        if (e && (!fSystems.length || fSystems.includes(e.n))) {
          if (!a[e.nysdot_sub_category]) {
            a[e.nysdot_sub_category] = { count: 0, duration: 0, v_delay: 0, top_20_v_delay: 0 }
          }
          let day = get(e, 'start_date_time', '').split(' ')[0]
          if (!prevMonthDays.includes(day)) {
            prevMonthDays.push(day)
          }
          if (i < 20) {
            a[e.nysdot_sub_category].top_20_v_delay += get(e, 'congestion_data.value.vehicleDelay', 0)
          }
          a[e.nysdot_sub_category].v_delay += get(e, 'congestion_data.value.vehicleDelay', 0)
          a[e.nysdot_sub_category].duration += duration2minutes(e.event_duration);
          a[e.nysdot_sub_category].count += 1;
          a['Total'].v_delay += get(e, 'congestion_data.value.vehicleDelay', 0)
          a['Total'].duration += duration2minutes(e.event_duration);
          a['Total'].count += 1;
          return a
        }
        return a
      }, { Total: { count: 0, duration: 0, v_delay: 0, top_20_v_delay: 0 } });

    keys.sort((a, b) => a.localeCompare(b));

    const nc = theme.graphCategorical.length;
    const colorsForTypes = keys.reduce((a, c, i) => {
      a[c] = theme.graphCategorical[i % nc];
      return a;
    }, {})

    return {
      events: events
        .sort((a, b) => get(b, 'congestion_data.value.vehicleDelay', 0) - get(a, 'congestion_data.value.vehicleDelay', 0))
        .filter((d, i) => i < 20),
      numEvents: events.length,
      currentMonthbyCat,
      prevMonthByCat,
      currentMonthDays,
      prevMonthDays,
      keys,
      colorsForTypes,
      data: Object.values(data),
    }

  }, [falcorCache, requests, theme.graphCategorical, fsystem])

  const [hoveredEvent, setHoveredEvent] = React.useState(null);
  console.log('output', data)

  return (
    <DashboardLayout loading={loading}>
      <div className='bg-white shadow rounded p-4 col-span-4 md:col-span-2 lg:col-span-1'>
        <div className='w-full font-medium text-gray-400 border-b px-2 pb-3 border-gray-100 text-xs mb-4 '> Reported Workzones ( vs Prev Month/day )</div>
        <HeroStatComp data={data} stat={'count'} />
      </div>

      <div className='bg-white shadow rounded p-4 col-span-4 md:col-span-2 lg:col-span-1'>
        <div className='w-full font-medium text-gray-400 border-b px-2 pb-3 border-gray-100 text-xs mb-1 '>Total Workzone Delay Cost ( vs Prev Month/day )</div>
        <HeroStatComp
          data={data}

          stat={'v_delay'}
          display={vehicleDelay2cost}
        />
      </div>

      <div className='bg-white shadow rounded p-4 col-span-4 lg:col-span-2  flex flex-col'>
        <div className='w-full font-medium text-gray-400 border-b px-2 pb-3 border-gray-100 text-xs mb-4 '>Workzones Type by Day</div>
        <div className="flex-1">

          <BarGraph
            colors={theme.graphCategorical}
            keys={data.keys}
            indexBy="index"
            data={data.data.sort((a, b) => a.index.localeCompare(b.index))}
            margin={{ top: 5, right: 5, bottom: 40, left: 30 }}
            padding={0.2}
            axisBottom={{ tickDensity: 7, format: d => d.split('-')[2].replace(/^0+/, ''), label: 'Day of Month' }}
            axisLeft={{ ticks: 5 }} />

        </div>
      </div>



      <div className='pt-4 pb-2 px-2 col-span-4'>
        <span className='text-xl font-medium uppercase text-gray-700'>
          Top 20 Workzones by Delay Cost {month}
        </span>
      </div>
      <div className='bg-white shadow rounded col-span-4 lg:col-span-2'>

        <IncidentTable
          events={data.events}
          setHoveredEvent={setHoveredEvent}
        />
      </div>

      <div className='bg-white shadow rounded col-span-4 lg:col-span-2'>
        <IncidentMap
          colorsForTypes={data.colorsForTypes}
          events={data.events}
          hoveredEvent={hoveredEvent}
        />
      </div>


    </DashboardLayout>

  )
}



const WorkzonesConfig = {
  name: 'Work Zones',
  path: "/workzones",
  exact: true,
  auth: false,
  mainNav: true,
  icon: 'fa-duotone fa-triangle-person-digging',
  title: 'Transportation Systems Management and Operations (TSMO) System Performance Dashboards',
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: Incidents,
};

export default WorkzonesConfig
