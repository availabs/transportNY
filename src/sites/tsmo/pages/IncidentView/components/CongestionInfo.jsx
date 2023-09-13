import React from 'react'
import {
  useFalcor
} from "~/modules/avl-components/src";
import get from 'lodash/get'

import { timeConvert } from '~/sites/tsmo/pages/Dashboards/Incidents/components/utils'
//import {getTMCs, getCorridors} from 'sites/tsmo/pages/Dashboards/Congestion/components/data_processing'

import { getCorridors } from './utils'



export const congestionController = (Component) => (props) => {
  const { falcor, falcorCache } = useFalcor();
  const { event_id } = props;

  React.useEffect(() => {
    console.log('congestionController falcor', event_id )
    if(event_id){
        falcor.get([
        "transcom2",
        "eventsbyId",
        event_id,
        [
          "congestion_data",
          "start_date_time",
          "geom"
        ]
      ])
    }
  }, [falcor,event_id]);

  const congestionData = React.useMemo(() => {
    return get(
      falcorCache,
      ["transcom2", "eventsbyId", event_id, "congestion_data", "value"],
      {}
    );
  }, [event_id, falcorCache]);

  const tmcs = React.useMemo(() => Object.keys(get(congestionData, 'rawTmcDelayData', {}))
    ,[congestionData])

  const year = React.useMemo(() => {
    const start_date = get(
      falcorCache,
      ["transcom2", "eventsbyId", event_id, "start_date_time"],
      new Date().toISOString() //if no date, use now 
    );
    return  new Date(start_date).getFullYear();
  }, [event_id, falcorCache]);
  

  React.useEffect(() => {
    if (tmcs.length === 0 )
    falcor.get(
        [
        "tmc",tmcs, "meta", year, ["length", "roadname", "tmclinear","road_order","county_code", "firstname", "direction", "avg_speedlimit"]
        ]
    );
  }, [falcor,tmcs,year]);

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
  ,[tmcMetaData,year,tmcs,congestionData])


  //console.log('congestionController', Component, corridors)

  return (
    <Component
      {...props}
      year={year}
      tmcs={tmcs}
      corridors={corridors}
      tmcMetaData={tmcMetaData}
      congestionData={congestionData}
    />
  );
} 



const CongestionInfo = ({
  event_id, 
  year,
  tmcs,
  corridors,
  tmcMetaData,
  congestionData,
  activeBranch,
  setActiveBranch
}) => {

  React.useEffect(() => {
   let eventTmc = get(congestionData, 'eventTmcs[0]', null)
    if(!activeBranch) {
      let activeBranch = null
      corridors.forEach(c => {
        if(Object.values(c.tmcs).includes(eventTmc)) {
          activeBranch = c.corridor
        } 
      })
      console.log('activeBranch', activeBranch, eventTmc, congestionData)
      if(activeBranch) {
        setActiveBranch(activeBranch)
      }
    }
  },[corridors,congestionData,activeBranch,setActiveBranch])

  
	return !congestionData ? <div className='p-24 bg-white shadow font-medium'>Speed / Congestion data is not yet available for this incident. Check back next month.</div> : (
		<div className="p-4 bg-white shadow">
				<div className='leading-8 flex-1'>
          <div className='font-medium text-gray-500'>Congestion Totals by Branch</div>
		    	<div className='text-xs text-blue-400'>Click branch to view on map / grid.</div>
		    	
		    </div>
		    <div className=''>
		    	<div className='flex'>
			    	<div className='flex-1'>Branch</div>
			    	<div> Delay </div>
			    </div>
			    {corridors.map((cor,i) => {
			    	return (
			    		<div onClick={(e) => setActiveBranch(cor.corridor) }className={`flex flex-1 hover:bg-blue-100 cursor-pointer  ${cor.corridor === activeBranch ? 'border-blue-600 border-b-2 bg-blue-100' :  'border-gray-100 border-b-2'}`} key={i}>
					    	<div className='flex-1'>
					    		<div className='text-xl'>{cor.roadname} {cor.direction} </div>
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
	    {/*	<pre>{JSON.stringify(congestionData,null,3)}</pre>*/}
	  </div>
	)
}

export default congestionController(CongestionInfo)