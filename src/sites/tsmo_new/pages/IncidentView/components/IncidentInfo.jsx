import React from 'react'
import {
  useFalcor
} from "~/modules/avl-components/src";
import get from 'lodash/get'


const rawDataKeys = [
 "event_id",
 "event_class",
 "reporting_organization",
 "start_date_time",
 "end_date_time",
 "last_updatedate",
 "close_date",
 "estimated_duration_mins",
 "event_duration",
 "facility",
 "event_type",
 "lanes_total_count",
 "lanes_affected_count",
 "lanes_detail",
 "lanes_status",
 "description",
 "direction",
 "county",
 "city",
 "city_article",
 "primary_city",
 "secondary_city",
 "location_article",
 "primary_marker",
 "secondary_marker",
 "primary_location",
 "secondary_location",
 "state",
 "region_closed",
 "point_datum",
 "marker_units",
 "marker_article",
 "summary_description",
 "eventstatus",
 "is_highway",
 "icon_file",
 //"start_incident_occured",
 "started_at_date_time_comment",
 // "incident_reported",
 "incident_reported_comment",
 //"incident_verified",
 "incident_verified_comment",
 "response_identified_and_dispatched",
 "response_identified_and_dispatched_comment",
 "response_arrives_on_scene",
 "response_arrives_on_scene_comment",
 // "end_all_lanes_open_to_traffic",
 "ended_at_date_time_comment",
 "response_departs_scene",
 "response_departs_scene_comment",
 "time_to_return_to_normal_flow",
 "time_to_return_to_normal_flow_comment",
 "no_of_vehicle_involved",
 "secondary_event",
 "secondary_event_types",
 "secondary_involvements",
 "within_work_zone",
 "truck_commercial_vehicle_involved",
 "shoulder_available",
 "injury_involved",
 "fatality_involved",
 "maintance_crew_involved",
 "roadway_clearance",
 "incident_clearance",
 "time_to_return_to_normal_flow_duration",
 "duration",
 "associated_impact_ids",
 "secondary_event_ids",
 "is_transit",
 "is_shoulder_lane",
 "is_toll_lane",
 "lanes_affected_detail",
 "to_facility",
 "to_state",
 "to_direction",
 "fatality_involved_associated_event_id",
 "with_in_work_zone_associated_event_id",
 "to_lat",
 "to_lon",
 "primary_direction",
 "secondary_direction",
 "is_both_direction",
 "secondary_lanes_affected_count",
 "secondary_lanes_detail",
 "secondary_lanes_status",
 "secondary_lanes_total_count",
 "secondary_lanes_affected_detail",
 "event_location_latitude",
 "event_location_longitude",
 "tripcnt",
 "tmclist",
 "recoverytime",
 "year",
 "datasource",
 "datasourcevalue",
 "day_of_week",
 // "tmcs_arr",
 // "event_interval",
 "nysdot_general_category",
 "nysdot_sub_category",
 "nysdot_detailed_category",
 "nysdot_waze_category",
];

const TSMO_VIEW_ID = 1947;
const TMC_META_VIEW_ID = 984;
export const IncidentTitle = ({event_id}) => {
	const { falcor, falcorCache } = useFalcor();

	React.useEffect(() => {
		falcor.get(["transcom3", TSMO_VIEW_ID,"eventsbyId",event_id, rawDataKeys])
  	}, [event_id, falcor]);
  	
  	const incident = React.useMemo(() => {
	    const eData = get(
	      falcorCache,
	      ["transcom3", TSMO_VIEW_ID, "eventsbyId", event_id],
	      {}
	    );

	    return Object.keys(eData)
	      .filter((key) => rawDataKeys.includes(key))
	      .reduce((out,key) => {
	        out[key] = eData[key]
	        return out
	      },{}) 
    }, [event_id, falcorCache]);

  	let start = new Date(get(incident, 'start_date_time', ''))
  	
    return (
    	<div>
    		<div>
    			<span className='font-medium text-blue-300'>
	    			{event_id}
	    		</span>
	    	</div>
    		<div className='text-3xl uppercase font-bold text-gray-600'>
	    		<span className='text-blue-600'>{get(incident, 'event_type', '')}</span> - {get(incident, 'facility', '')}	{get(incident, 'direction', '')}	
	    	</div>
	    	<div >
	    		<span className='text-gray-700 text-xl font-thin'>
	    			{start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
	    		</span>
	    		
	    	</div>
	    </div>
	    
    )
}



const IncidentInfo = ({event_id}) => {
	const { falcor, falcorCache } = useFalcor();

	React.useEffect(() => {
		falcor.get(["transcom3", TSMO_VIEW_ID,"eventsbyId",event_id, rawDataKeys])
  	}, [event_id, falcor]);
  	
  	const incident = React.useMemo(() => {
	    const eData = get(
	      falcorCache,
	      ["transcom3", TSMO_VIEW_ID, "eventsbyId", event_id],
	      {}
	    );

	    return Object.keys(eData)
	      .filter((key) => rawDataKeys.includes(key))
	      .reduce((out,key) => {
	        out[key] = eData[key]
	        return out
	      },{}) 
    }, [event_id, falcorCache]);

	console.log("incident: ", incident);
	
  	let start = new Date(get(incident, 'start_date_time', ''))
  	let end = new Date(get(incident, 'close_date', ''))
  	// let duration = Math.floor((Math.abs(start - end)/1000)/60);
//   SELECT ogc_fid, event_id, event_class, reporting_organization, start_date_time, end_date_time, last_updatedate, close_date, estimated_duration_mins, event_duration, facility, event_type, lanes_total_count, lanes_affected_count, lanes_detail, lanes_status, description, direction, county, city, city_article, primary_city, secondary_city, point_lat, point_long, location_article, primary_marker, secondary_marker, primary_location, secondary_location, state, region_closed, point_datum, marker_units, marker_article, summary_description, eventstatus, is_highway, icon_file, start_incident_occured, started_at_date_time_comment, incident_reported, incident_reported_comment, incident_verified, incident_verified_comment, response_identified_and_dispatched, response_identified_and_dispatched_comment, response_arrives_on_scene, response_arrives_on_scene_comment, end_all_lanes_open_to_traffic, ended_at_date_time_comment, response_departs_scene, response_departs_scene_comment, time_to_return_to_normal_flow, time_to_return_to_normal_flow_comment, no_of_vehicle_involved, secondary_event, secondary_event_types, secondary_involvements, within_work_zone, truck_commercial_vehicle_involved, shoulder_available, injury_involved, fatality_involved, maintance_crew_involved, roadway_clearance, incident_clearance, time_to_return_to_normal_flow_duration, duration, associated_impact_ids, secondary_event_ids, is_transit, is_shoulder_lane, is_toll_lane, lanes_affected_detail, to_facility, to_state, to_direction, fatality_involved_associated_event_id, with_in_work_zone_associated_event_id, to_lat, to_lon, primary_direction, secondary_direction, is_both_direction, secondary_lanes_affected_count, secondary_lanes_detail, secondary_lanes_status, secondary_lanes_total_count, secondary_lanes_affected_detail, event_location_latitude, event_location_longitude, tripcnt, tmclist, recoverytime, year, datasource, datasourcevalue, day_of_week, tmc_geometry, month, day_of_month, month_year, nysdot_general_category, nysdot_sub_category, nysdot_detailed_category, nysdot_waze_category, state_code, region_name, region_code, county_name, county_code, f_system, congestion_data, vehicle_delay, cost, wkb_geometry, _created_timestamp, _modified_timestamp
// 	FROM transcom.s956_v1947_transcom_main_v2;

	return (
		<div className="p-8 bg-white shadow">
	    	

	    	<div className='text-xl pb-2 leading-8'>
	    		<div className='text-sm font-bold text-gray-500'>Description</div>
	    		<div className='p-4 text-lg font-thin'>{get(incident, 'description', '')}.</div>
	    	</div>
	    	<div className='text-xl py-2'>
	    		<div className='text-sm font-bold text-gray-500'>Reporting Organization</div>
	    		<div className='px-4'>{get(incident, 'reporting_organization', '')}</div>
	    	</div>
	    	<div className='flex py-2'>
		    	<div className='leading-8 flex-1'>
		    		<div className='text-sm font-bold text-gray-500'>Open Time</div>
		    		<div className='px-4 text-sm'>{start.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
		    		<div className='px-4 text-2xl'>{start.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })}</div>
		    	</div>
		    	<div className='leading-8 flex-1'>
		    		<div className='text-sm font-bold text-gray-500'>Close Time</div>
		    		<div className='px-4 text-sm'>{end.toLocaleDateString('en-US', {  year: 'numeric', month: 'long', day: 'numeric' })}</div>
		    		<div className='px-4 text-2xl'>{end.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })}</div>
		    	</div>
		    	<div className='leading-8 flex-1 '>
		    		<div className='text-sm font-bold text-gray-500'>Duration</div>
		    		<div className='px-4 text-sm '>d hh:mm</div>
		    		<div className='px-4 text-2xl'>{get(incident, 'duration', '')}</div>
		    	</div>
		    </div>
		    <div className='flex py-2'>
		    	<div className='leading-8 flex-1'>
		    		<div className='text-sm font-bold text-gray-500'>Total Lanes</div>
		    		<div className='px-4 text-2xl py-2'>{get(incident, 'lanes_total_count', '')}</div>
		    	</div>
		    	<div className='leading-8 flex-1'>
		    		<div className='text-sm font-bold text-gray-500'>Affected Lanes</div>
		    		<div className=' text-xl py-2'>{get(incident, 'lanes_detail', '')} {get(incident, 'lanes_status', '')}</div>
		    	</div>
		    	<div className='leading-8 flex-1'>
		    		<div className='text-sm font-bold text-gray-500'>Lane Detail</div>
		    		{/*<div className='px-4 text-sm '>d hh:mm</div>*/}
		    		<div className='px-4 text-xl py-2'>{get(incident, 'lanes_affected_detail', '')}</div>
		    	</div>
		    </div>

	    	
	    	{/*<pre>{JSON.stringify(incident,null,3)}</pre>*/}
	   	</div>
	)
}

export default IncidentInfo