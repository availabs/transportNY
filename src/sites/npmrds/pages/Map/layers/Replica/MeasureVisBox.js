import React from 'react'
import get from 'lodash.get'
// import { useFalcor } from 'modules/avl-components/src'

const MeasureVisBox = ({ layer }) => {
const currentData = get(layer, 'state.currentData', []);
const values = React.useMemo(() => currentData.reduce((o,c) => {
  const divisor = c['OSM_oneway'] === 'yes' ? 1 : 2
  o.ris_vmt += c['RIS_aadt_current_yr_est']*(c['CON_miles'] / divisor)
  o.ris_count += (c['RIS_aadt_current_yr_est'] ? 1 : 0)
  o.ris_miles += (c['RIS_aadt_current_yr_est'] ? (c['CON_miles'] / divisor) : 0)
  o.osm_vmt += c['OSM_replica_aadt']*(c['CON_miles'] / divisor)
  o.osm_count += (c['OSM_replica_aadt'] ? 1 : 0)
  o.osm_miles += (c['OSM_replica_aadt'] ? (c['CON_miles'] / divisor) : 0)
  return o
},{
	ris_vmt:0,
	ris_count:0,
	ris_miles:0,
	osm_vmt:0,
	osm_count:0,
	osm_miles:0
}), [currentData]);





  return (
    <div className="p-1">
      <div className=" px-2">
      	<div className='flex flex-rows'>
	      	<div className='flex-1'>
		        <div className='text-lg text-npmrds-100'><div className='text-xs text-npmrds-100'>RIS VMT</div>{values.ris_vmt.toLocaleString()}</div>
		        <div className='text-npmrds-200'><div className='text-xs'>RIS #segments</div>{values.ris_count.toLocaleString()}</div>
		        <div className='text-npmrds-200'><div className='text-xs'>RIS miles</div>{values.ris_miles.toLocaleString()}</div>
		     </div>
		     <div className='flex-1'> 
		         <div className='text-lg text-npmrds-100'><div className='text-xs text-npmrds-100'>OSM VMT</div>{values.osm_vmt.toLocaleString()}</div>
		         <div className='text-npmrds-200'><div className='text-xs text-npmrds-300'>OSM segments</div>{values.osm_count.toLocaleString()}</div>
		         <div className='text-npmrds-200'><div className='text-xs text-npmrds-300'>OSM miles</div>{values.osm_miles.toLocaleString()}</div>
	        </div>
	    </div>
      </div>
    </div>
  )
}


export default MeasureVisBox