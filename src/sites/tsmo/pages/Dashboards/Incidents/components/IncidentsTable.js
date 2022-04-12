import React from "react"

import get from "lodash.get";
// import { useSelector } from 'react-redux';

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
return rhours + " hour(s) and " + rminutes + " minute(s).";
}

const IncidentsTable = ({events}) => {
  // const theme = useTheme()
  
  
  return (
    <>
      <div>
        <Table
          disableFilters={ true }
          data={events}
          columns={[
            { accessor: "event_id",
              Header: "Event",
              Cell: (d) => {
                  return (<div>

                    <div className='text-sm'>
                      {get(d, 'row.original.event_type', '')} 
                    </div>
                     <div>
                      <span className='text-xs  text-gray-500'>
                      {get(d, 'row.original.event_id','')} 
                      </span>
                    </div>
                  </div>)
               
              },
            },
            { accessor: "facility",
              Header: "Facility",
              canFilter: true
            },
          /*  { accessor: "open_time",
              Header: "Date Time",
              Cell: (d) => <span className='text-sm'>{d.value}</span>
            },*/
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
        />
        
        {/* <Table 
            data={ corridors }
            columns={[
              // { accessor: "corridor",
              //   Header: "TMC",
              //   disableSortBy: true
              // },
              { accessor: "roadname",
                Header: "Road Name",
                Cell: (d) => {
                  let from = get(d, 'row.original.from', ''),
                      to = get(d, 'row.original.to', '')

                  return (<div>
                    <div>
                      {get(d, 'row.original.roadname', '')} 
                      <span className='font-bold text-sm'>
                      &nbsp;{get(d, 'row.original.direction','')}
                      </span>
                      <span className='font-bold text-sm float-right text-gray-500'>
                      &nbsp;{get(d, 'row.original.length',0).toFixed(2)} mi
                      </span>
                    </div>
                    <div className='text-xs font-italic text-gray-600'> 
                      {from} {from !== to ? `to ${to}` : ''}
                    </div>
                  </div>)
                } 
              },
              { accessor: "fsystem",
                Header: "F cls"
              },
              { accessor: "total_delay_per_mile",
                Header: "Delay / Mile",
                Cell: ({ value }) => floatFormat(value)
              },
              { accessor: "total_delay",
                Header: () => <div>Total Delay</div>,
                Cell: ({ value }) => floatFormat(value)
              }
            ]}
            disableFilters={ true }
            sortBy="total_delay_per_mile"
            sortOrder="DESC"
          />*/}
      </div>
    </>
   
  )
}


export default IncidentsTable