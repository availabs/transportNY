import React, { useState, useEffect } from 'react';

import get from "lodash/get";
import { format as d3format } from "d3-format"
import { Link } from "react-router-dom"

import {
  useFalcor,
  Table
} from "~/modules/avl-components/src"

// import {duration2minutes, timeConvert, /*vehicleDelay2cost*/} from '~/utils'
import { duration2minutes, timeConvert, /*vehicleDelay2cost*/ } from '~/sites/tsmo/pages/Dashboards/Incidents/components/utils'

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

  const { falcor, falcorCache } = useFalcor();

  const [eventsIds, startDate, endDate, selectedFacility, selectedEventType, selectedGeneralCategory, selectedSubCategory] = events;
  
  const [TMCs, setTMCs] = React.useState([]);

  React.useEffect(() => {
    if (eventsIds.length) {
      const tmcSet = eventsIds.reduce((a, c) => {
        const d = get(falcorCache, ["transcom2", "eventsbyId", c, "congestion_data", "value", "tmcDelayData"], {});
        for (const tmc in d) {
          if (d[tmc]) {
            a.add(tmc);
          }
        };
        return a;
      }, new Set());

      if (tmcSet.size) {
        setTMCs([...tmcSet]);
      }
    }
  }, [falcorCache, eventsIds]);
  
  React.useEffect(() => {
    if(startDate && endDate) {
      const [y1, m1] = startDate.split("-");
      const [y2, m2] = endDate.split("-");

      if (TMCs.length) {
        falcor.chunk([
          "tmc", TMCs, "meta", [...new Set([+y1, +y2])],
          ["aadt", "aadt_combi", "aadt_singl"]
        ]);
      }
    }
  }, [falcor, startDate, endDate, TMCs]);

  let Events = React.useMemo(() => {
    falcor.chunk([
      "transcom2", "eventsbyId", eventsIds,
      ["event_id",
        "n",
        "congestion_data",
        "facility",
        "description",
        "start_date_time",
        "event_duration",
        "event_type",
        "event_category",
        "nysdot_general_category",
        "nysdot_sub_category",
        "end_date_time",
        "event_duration",
        "close_date",
        "geom"]
    ]);


    const facility = eventsIds.map((eventId, i) => {
      const eventFacility = get(falcorCache, ["transcom2", "eventsbyId", eventId], null);
      return {
        [`${eventId}`]: eventFacility?.facility,
      }
    });

    const eventFacilityData = Object.assign({}, ...facility);
    const eventsData = eventsIds.map((eventId, i) => {
      const eventData = get(falcorCache, ["transcom2", "eventsbyId", eventId], null);
      const delay_cost = get(falcorCache, ["transcom2", "eventsbyId", eventId, "congestion_data", "value"], null);

      return {
        [`${eventId}`]: {
          'general_category': eventData?.nysdot_general_category,
          'sub_category': eventData?.nysdot_sub_category,
          'event_type': eventData?.event_type,
          'description': eventData?.description,
          'start_date_time': eventData?.start_date_time,
          "close_date_time": eventData?.close_date,
          "end_date_time": eventData?.end_date,
          "event_duration": eventData?.event_duration,
          "delay_cost": delay_cost ? calcDelayCost(delay_cost, falcorCache) : 0,
        }
      }
    })

    const eachEventData = Object.assign({}, ...eventsData);
    const rawEvents = (eventsIds || []).map((eventId) => {
      return {
        event_id: eventId,
        facility: eventFacilityData[eventId],
        general_category: eachEventData[eventId].general_category,
        sub_category: eachEventData[eventId].sub_category,
        event_type: eachEventData[eventId].event_type,
        description: eachEventData[eventId].description,
        start_date_time: eachEventData[eventId].start_date_time,
        end_date_time: eachEventData[eventId].end_date_time || eachEventData[eventId].close_date_time,
        event_duration: eachEventData[eventId].event_duration,
        delay_cost: eachEventData[eventId].delay_cost,
      }
    })

    const filterEventsFacility = (selectedFacility ? rawEvents.filter(a => a.facility === selectedFacility?.value) : rawEvents);
    const filterEventsGeneralCategory = (selectedGeneralCategory ? filterEventsFacility.filter(a => a.general_category === selectedGeneralCategory?.value) : filterEventsFacility);
    const filterEventsSubCategory = (selectedSubCategory ? filterEventsGeneralCategory.filter(a => a.sub_category === selectedSubCategory?.value) : filterEventsGeneralCategory);
    const filterEventType = (selectedEventType ? filterEventsSubCategory.filter(a => a.event_type === selectedEventType?.value) : filterEventsSubCategory);

    return filterEventType;
  }, [falcorCache, events]);

    if (eventsIds.length != 0)
      localStorage.setItem("Events", JSON.stringify(Events));

    let getLocalStorageData = localStorage.getItem("Events");
    if(getLocalStorageData != null) {
      getLocalStorageData = JSON.parse(getLocalStorageData);

      if ((getLocalStorageData != "" && getLocalStorageData !== null && getLocalStorageData.length > 0) || Events.length == 0) {
        Events = getLocalStorageData;
      }
    }


  return (
    <Table
      disableFilters={true}
      data={Events}
      columns={Columns}
      sortBy="start_date_time"
      sortOrder="DESC"
      initialPageSize={50}
    />
  )
}

export default IncidentsTable

const Columns = [
  {
    accessor: "start_date_time",
    Header: "When",
    Cell: (d) => (

      <Link className='min-w-20' to={`/incidents/${get(d, 'row.original.event_id', '').split(' ')[0]}`}>
        <div>
          <span className='text-xs text-gray-500'>{get(d, 'row.original.start_date_time', '').split(' ')[0]} ({get(d, 'row.original.start_date_time', '').split(' ')[1]})</span>
          <hr></hr>
          <span className='text-xs text-gray-500'>{get(d, 'row.original.end_date_time', '').split(' ')[0]} ({get(d, 'row.original.end_date_time', '').split(' ')[1]})</span>
        </div>
      </Link>
    ),
  },
  {
    accessor: "category",
    Header: "Category",
    Cell: (d) => (
      <Link className='min-w-20' to={`/incidents/${get(d, 'row.original.event_id', '').split(' ')[0]}`}>
        <div className='min-w-30'>
          <div>
            <span className='text-xs'>{get(d, 'value', '')}</span>
          </div>
          <span className='text-xs text-gray-500'>{get(d, 'row.original.general_category', '').split(' ')[0]} / {get(d, 'row.original.sub_category', '').split(' ')[0]}</span>
          <hr></hr>
          <span className='text-xs text-gray-500'>{get(d, 'row.original.event_type', '').split(' ')[0]}</span>
        </div>
      </Link>
    ),
  },
  {
    accessor: "facility",
    Header: "Facility",
    canFilter: true,
    Cell: (d) => (
      <Link className='min-w-20' to={`/incidents/${get(d, 'row.original.event_id', '').split(' ')[0]}`}>
        <div className='w-60'>
          <div>
            <span className='text-x'>{get(d, 'value', '')}</span>
          </div>
        </div>
      </Link>
    )
  },
  {
    accessor: "delay_cost",
    Header: "Impact",
    Cell: (d) => (
      <Link className='min-w-20' to={`/incidents/${get(d, 'row.original.event_id', '').split(' ')[0]}`}>
        <div>
          <div>
            <span className='text-xs text-gray-500'>Duration : {timeConvert(duration2minutes(get(d, 'row.original.event_duration', '')))}</span>
            <hr></hr>
            <span className='text-xs text-gray-500'>Cost : $ {siFormat(get(d, 'value'))}</span>
          </div>
        </div>
      </Link>
    ),
  },
  {
    accessor: "description",
    Header: "Description",
    Cell: (d) => (
      <Link className='min-w-20' to={`/incidents/${get(d, 'row.original.event_id', '').split(' ')[0]}`}>
        <div className='w-80'>
          <div>
            <span className='text-xs text-gray-800 w-80'>{get(d, 'value', '')}</span>
          </div>
        </div>
      </Link>
    ),
  },
]
