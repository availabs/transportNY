import React from "react"

import get from "lodash/get";
import { format as d3format } from "d3-format"
import { Link } from "react-router-dom"

import {
  useFalcor
} from "~/modules/avl-components/src"

import {
  // useFalcor,
  /*useTheme,*/
  Table,
} from "~/modules/avl-components/src"

import {duration2minutes, timeConvert, /*vehicleDelay2cost*/} from './utils'

import { calcCost } from "~/sites/tsmo/pages/Dashboards/Congestion/components/data_processing"

const siFormat = d3format(".3s");

const calcDelayCost = (data, cache) => {
  if (!data) return 0;

  let cost = 0;

  const tmcDD = get(data, "tmcDelayData", {});
  const year = get(data, ["dates", 0], "").slice(0, 4);

  for (const tmc in tmcDD) {
    const tmcMeta = get(cache, ["tmc", tmc, "meta", year], {})
    const c = calcCost(tmcDD[tmc], tmcMeta);
    cost += c;
  }
  return cost;
}

const IncidentsTable = ({ events, setHoveredEvent }) => {

console.log("IncidentsTable::events", events);

  const { falcorCache } = useFalcor();

  const onRowEnter = React.useCallback((e, row) => {
    setHoveredEvent(row.original.event_id);
  }, [setHoveredEvent]);

  const onRowLeave = React.useCallback((e, row) => {
    setHoveredEvent(null);
  }, [setHoveredEvent]);

  const Events = React.useMemo(() => {
    return events.map(ev => {
      const newEvent = {
        general_cat: ev.nysdot_general_category,
        sub_cat: ev.nysdot_sub_category,
        event_id: ev.event_id,
        start_date_time: ev.start_date_time,
        facility: ev.facility,
        event_duration: ev.event_duration,
        vehicle_delay: get(ev, 'congestion_data.value.vehicleDelay', 0),
        delay_cost: calcDelayCost(get(ev, 'congestion_data.value', null), falcorCache)
      }
      return newEvent
    })//.sort((a, b) => b.delay_cost - a.delay_cost).slice(0, 20);
  }, [falcorCache, events]);

// console.log("EVENTS:", events, Events)

  return (
    <Table
      onRowEnter={ onRowEnter }
      onRowLeave={ onRowLeave }
      disableFilters={ true }
      data={Events}
      columns={ Columns }
      sortBy="delay_cost"
      sortOrder="DESC"
      initialPageSize={20}
      pageSize={20}
    />
  )
}

export default IncidentsTable

const Columns = [
  { accessor: "event_id",
    Header: "Event",
    Cell: (d) => (
      <Link className='min-w-20' to={ `/incidents/${d.value}`}>
        <div className='text-xs whitespace-nowrap'>
           {get(d, 'row.original.general_cat','')} ({get(d, 'row.original.sub_cat','')})
        </div>

        <div>
          <span className='text-xs text-gray-500'>{get(d, 'row.original.start_date_time','').split(' ')[0]}</span>
        </div>
      </Link>
    ),
  },
  { accessor: "facility",
    Header: "Facility",
    canFilter: true,
    Cell: (d) => (
        <div>
          <div>
         <span className='text-xs'>{get(d, 'value','')}</span>
         </div>
          <span className='text-xs text-gray-500'>{get(d, 'row.original.start_date_time','').split(' ')[1]}</span>

        </div>
    )
  },
  // { accessor: "start_date_time",
  //   Header: "Date Time",
  //   Cell: (d) => <div>
  //       <span className='text-xs'>{get(d, 'row.original.start_date_time','')}</span>
  //       </div>
  // },
  { accessor: 'delay_cost',
    Header: "Cost",
    id: 'delay_cost',
    Cell: (d) => <span className='text-sm'>${siFormat(d.value)}</span>
  },
  { accessor: d => duration2minutes(d.event_duration),
    Header: "Duration",
    Cell: (d) => <span className='text-sm'>{timeConvert(d.value)}</span>
  },

  { accessor: 'vehicle_delay',
    Header: "Vhcl. Delay",
    id: 'vehicle_delay',
    Cell: (d) => <span className='text-sm'>{timeConvert(d.value)}</span>
  },
]
