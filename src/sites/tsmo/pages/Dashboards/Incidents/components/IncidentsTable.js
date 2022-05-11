import React from "react"

import get from "lodash.get";
// import { useSelector } from 'react-redux';
import { Link } from "react-router-dom"

import { format as d3format } from "d3-format"
import {
  // useFalcor,
  /*useTheme,*/
  Table,
} from "modules/avl-components/src"

import { F_SYSTEMS } from 'sites/tsmo/pages/Dashboards/components/metaData'

const fFormat = d3format(",.2s")


const duration2minutes = (dur) => {
    let [days, time] = dur.split('-')
    let [hours, minutes] = time.split(':')
    let out = 1440 * (+days) + 60 * (+hours) + (+minutes)
    return isNaN(out) ? 0 : out
  }

function timeConvert(n) {
var num = n;
var hours = (num / 60);
var rhours = Math.floor(hours);
var minutes = (hours - rhours) * 60;
var rminutes = Math.round(minutes);
return rhours + " h  " + rminutes + " m";
}

const IncidentsTable = ({ events, setHoveredEvent }) => {

  const onRowEnter = React.useCallback((e, row) => {
    setHoveredEvent(row.original.event_id);
  }, [setHoveredEvent]);

  const onRowLeave = React.useCallback((e, row) => {
    setHoveredEvent(null);
  }, [setHoveredEvent]);

  return (
    <>
      <div>
        <Table
          onRowEnter={ onRowEnter }
          onRowLeave={ onRowLeave }
          disableFilters={ true }
          data={events}
          columns={[
            { accessor: "event_id",
              Header: "Event",
              Cell: (d) => (
                <Link className='min-w-20' to={ `/incidents/${get(d, 'row.original.event_id','')}`}>
                  <div className='text-sm'>
                    {get(d, 'row.original.event_type', '')}
                  </div>
                   
                  <div>
                  <span className='text-xs text-gray-500'>{get(d, 'row.original.open_time','').split(' ')[0]}</span>
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
                    <span className='text-xs text-gray-500'>{get(d, 'row.original.open_time','').split(' ')[1]}</span>
                   
                  </div>
              )
            },
            // { accessor: "open_time",
            //   Header: "Date Time",
            //   Cell: (d) => <div>
            //       <span className='text-xs'>{get(d, 'row.original.open_time','')}</span>
            //       </div>
            // },
            { accessor: d => get(d, 'congestion_data.value.vehicleDelay', 0),
              Header: "Cost",
              id: 'delay_cost',
              Cell: (d) => <span className='text-sm'>${fFormat(d.value*15)}</span>
            },
            { accessor: d => duration2minutes(d.duration),
              Header: "Duration",
              Cell: (d) => <span className='text-sm'>{timeConvert(d.value)}</span>
            },

            { accessor: d => get(d, 'congestion_data.value.vehicleDelay', 0),
              Header: "Veh_Delay",
              id: 'vehicle_delay',
              Cell: (d) => <span className='text-sm'>{timeConvert(d.value)}</span>
            },

          ]}
          sortBy="delay_cost"
          sortOrder="DESC"
          initialPageSize={20}
        />
      </div>
    </>

  )
}


export default IncidentsTable
