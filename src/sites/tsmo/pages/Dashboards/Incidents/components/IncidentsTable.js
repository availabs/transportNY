import React from "react"

import get from "lodash.get";
// import { useSelector } from 'react-redux';
import { Link } from "react-router-dom"

import {
  // useFalcor,
  /*useTheme,*/
  Table,
} from "modules/avl-components/src"



import {duration2minutes, timeConvert, vehicleDelay2cost} from './utils'

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
            { accessor: d => get(d, 'congestion_data.value.vehicleDelay', 0),
              Header: "Cost",
              id: 'delay_cost',
              Cell: (d) => <span className='text-sm'>{vehicleDelay2cost(d.value)}</span>
            },
            { accessor: d => duration2minutes(d.event_duration),
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
