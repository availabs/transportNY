import React from 'react'
import {
  useFalcor
} from "modules/avl-components/src";
import get from 'lodash.get'

import { timeConvert } from 'sites/tsmo/pages/Dashboards/Incidents/components/utils'
//import {getTMCs, getCorridors} from 'sites/tsmo/pages/Dashboards/Congestion/components/data_processing'


const getCorridors = (tmcMetaData,year,tmcs,congestionData) => { 
  let corridors = tmcs.reduce((corridors,tmcId) => {
      let tmc = tmcMetaData[tmcId]

      let tmcLinear = get(tmc, `[${year}].tmclinear`, false)
      let county_code = get(tmc, `[${year}].county_code`, false)
      let direction = get(tmc, `[${year}].direction`, false)

      let corridor = `${county_code}_${tmcLinear}_${direction}`

      if(tmcLinear) {
        if(!corridors[corridor]) {
          corridors[corridor] = {
            corridor: corridor,
            roadnames: [],
            directions: [],
            fsystems: [],
            length: 0,
            tmcs: {},           
            total_delay: 0,
          }
        }
        corridors[corridor].length += tmc[year].length
        if(!corridors[corridor].roadnames.includes(tmc[year].roadname)){
          corridors[corridor].roadnames.push(tmc[year].roadname)
        }
        if(!corridors[corridor].directions.includes(tmc[year].direction)){
          corridors[corridor].directions.push(tmc[year].direction)
        }
        if(get(tmcs,`[${tmcId}].fsystem`,false) && !corridors[corridor].fsystems.includes(tmcs[tmcId].fsystem)){
          corridors[corridor].fsystems.push(tmcs[tmcId].fsystem)
        }
        // console.log(get(tmcs,`[${tmcId}].total`,0), tmcId)
        corridors[corridor].tmcs[tmc[year].road_order*10] = tmcId
        corridors[corridor].total_delay += get(congestionData,`[${tmcId}]`,0)
        

      }
      return corridors
    },{})

    //console.log('corridors corridors', corridors)
  
    return Object.values(corridors).map((c,i) => {
      c.roadname = c.roadnames.join(',')
      c.direction = c.directions.join(',')
      c.fsystem = c.fsystems.join(',')
      c.from = tmcMetaData[Object.values(c.tmcs)[0]][year].firstname
      c.to = tmcMetaData[Object.values(c.tmcs)[Object.values(c.tmcs).length-1]][year].firstname
      return c
    })
    .filter(d => d.total_delay > 0)
    
}



const CongestionInfo = ({event_id}) => {
	const { falcor, falcorCache } = useFalcor();

	React.useEffect(() => {
    falcor.get([
      "transcom2",
      "eventsbyId",
      event_id,
      [
        "congestion_data"
      ]
    ])
  }, [event_id]);

	const congestionData = React.useMemo(() => {
    return get(
      falcorCache,
      ["transcom2", "eventsbyId", event_id, "congestion_data", "value"],
      {}
    );
  }, [event_id, falcorCache]);

	const tmcs = React.useMemo(() => Object.keys(get(congestionData, 'rawTmcDelayData', {}))
		,[congestionData])

	const year = React.useMemo(() => 2022
		,[congestionData])

  React.useEffect(() => {
    if (tmcs.length === 0 ) return
   	falcor.get(
        [
        "tmc",tmcs, "meta", year, ["length", "roadname", "tmclinear","road_order","county_code", "firstname", "direction"]
        ]
    );
  }, [tmcs,year]);

  const [tmcMetaData, setTmcMetaData] = React.useState({});
  React.useEffect(() => {
    const data = tmcs.reduce((a, c) => {
      a[c] = [year].reduce((aa, cc) => {
        const d = get(falcorCache, ["tmc", c, "meta", cc], null);
        if (d) {
          aa[cc] = d;
        }
        return aa;
      }, {});
      return a;
    }, {});
    setTmcMetaData(data);
  }, [falcorCache, tmcs, year]);


  const corridors = React.useMemo(() => getCorridors(tmcMetaData,year,tmcs,get(congestionData,'rawTmcDelayData',{}))
  ,[tmcMetaData,year,tmcs])

  

  
	return (
		<div className="p-4 bg-white shadow">
				<div className='leading-8 flex-1'>
		    	<div className='text-sm font-bold'>Total Delay (vehicle hours)</div>
		    	<div className='px-4 text-2xl'>{timeConvert(get(congestionData, 'rawVehicleDelay', 0))}</div>
		    </div>
		    <div className=''>
		    	<div className='flex'>
			    	<div className='flex-1'>Branch</div>
			    	<div> Delay </div>
			    </div>
			    {corridors.map(cor => {
			    	return (
			    		<div className='flex flex-1 border-b border-gray-100'>
					    	<div className='flex-1'>
					    		<div className='text-xl'>{cor.roadname} {cor.direction} {Object.keys(cor.tmcs).length}</div>
					    		<div className='text-xs'>
					    			{cor.from}
					    		</div>
					    	</div>
					    	<div> {timeConvert(cor.total_delay)} </div>
					    </div>
			    	)
			    })}
			    <div className='flex'>
			    	<div className='text-xl flex-1'>Incident Total Congestion</div>
			    	<div className='font-medium'>{timeConvert(get(congestionData, 'rawVehicleDelay', 0))}</div>
			    </div>

		    </div>
		   {/* <pre>{JSON.stringify(corridors,null,3)}</pre>*/}
	    	{/*<pre>{JSON.stringify(congestionData,null,3)}</pre>*/}
	  </div>
	)
}

export default CongestionInfo