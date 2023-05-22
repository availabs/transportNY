import React from 'react'
import get from 'lodash/get'
import { format as d3format } from "d3-format"
import { useFalcor } from "~/modules/avl-components/src";
import { /*LineGraph,*/ BarGraph } from "~/modules/avl-graph/src";

const MeasureVisBox = ({ layer }) => {
	const { falcor, falcorCache } = useFalcor();
	const currentData = get(layer, 'state.currentData', []);

	const f_system_meta = {
	  "0": "Total",
	  "1": "Interstate",
	  "2": "Freeways",
	  "3": "Principal ",
	  "4": "Minor Arterial",
	  "5": "Major Collector",
	  "6": "Minor Collector",
	  "7": "Local"
	}

	const YEARS = [2016,2017,2018,2019,2020, 2021, 2022]

	const f = d3format(",.3~s");

	let sum_measures = ['ted', 'phed','emmissions']

	const aadt_measure = ['TMC_aadt','RIS_aadt_current_yr_est']

	const summarize = (inputData) => {
	return inputData.reduce((o,c) => {
	  if(c[aadt_measure[0]] && c.TMC_miles) {
	  	o[0].vmt += (c[aadt_measure[0]] * c.TMC_miles)
	  	o[0].count += 1
	  	o[0].miles += c.TMC_miles

	  	o[0].measure += sum_measures.includes(layer.filters.measure.value) ?
	  		c.value :
	  		c.value * (+c[aadt_measure[0]] * +c.TMC_miles)

	   	//console.log(c.TMC_frc)
	  	o[+c.TMC_frc].vmt += c[aadt_measure[0]] * c.TMC_miles
	  	o[+c.TMC_frc].count += 1
	  	o[+c.TMC_frc].miles += c.TMC_miles
	  	o[+c.TMC_frc].measure += sum_measures.includes(layer.filters.measure.value) ?
	  		c.value :
	  		c.value * (+c[aadt_measure[0]] * +c.TMC_miles)

	  }

	  return o
	},[0,1,2,3,4,5,6,7].map(d => { return {frc:d, vmt:0, count:0, miles:0, measure: 0}}))
}

	React.useEffect(() => {
		console.log('loading too much data')
		falcor.get([
	    "conflation",
	    "byGeo",
	    layer.getGeographies(),
	   	YEARS,
	    layer.getNetwork(layer.filters),
	    layer.getMeasures().join("|"),
	  ])
	 }, [layer]);

	let annualSummaries = React.useMemo(() => {
		return YEARS.reduce((out, year) => {
			//console.time(`process ${year}`)
			let currentYearData = layer.getGeographies().reduce((out,geo)=> {
	      let gdata = get(falcorCache,[
	        "conflation",
	        "byGeo",
	        layer.getGeographies(),
	        year,
	        layer.getNetwork(layer.filters),
	        layer.getMeasures().join("|"),
	        'value'
	      ],{})
	      return {...out,...gdata}
	    },{})

	    let data = Object.keys(currentYearData).reduce((a, c) => {
        let meta = get(currentYearData, [c], {});
        a.push({
          id: c,
          value: get(currentYearData, [c,layer.getMeasure(layer.filters)], 0),
          ...meta,
        });
        return a;
      }, [])
      out[year] = summarize(data)
      //console.timeEnd(`process ${year}`)
      return out
		},{})
	},[falcorCache, layer])

	//console.log('annualSummaries',annualSummaries )


	//console.log('values',values)

  return (
    <div className="p-1">
      <div className=" px-2">
	      <div className='flex flex-col flex-wrap'>
		     	{get(annualSummaries, layer.filters.year.value, []).filter((d,i) => d.count > 0).map((value,ix) =>
			     <React.Fragment key={ix}>
			     <div  className='flex-1 flex border-b border-gray-700 pt-2 h-12'>
			        <div className='text-base text-npmrds-100 flex-1'>
			        	<div className='text-xs text-npmrds-100'>{f_system_meta[value.frc]} </div>
			        </div>
			        <div className='flex-1 text-base text-npmrds-100'>
			        	<div className='text-xs text-npmrds-100 pr-2'>{layer.filters.measure.value}</div>{
			        		sum_measures.includes(layer.filters.measure.value) ? f(value.measure) : f(value.measure/value.vmt)}
			        </div>
			        <div className='flex-1 text-base text-npmrds-100'>
			        	<div className='text-xs text-npmrds-100'>VMT</div>{f(value.vmt)}
			        </div>

			        <div className='text-npmrds-200 w-10'><div className='text-xs'># seg</div>{value.count}</div>
			        <div className='text-npmrds-200 w-10'><div className='text-xs'>mi</div>{f(value.miles)}</div>
			     </div>
			     <div className="h-16">
						<BarGraph
							data={Object.keys(annualSummaries).map((year) => {
								let v = sum_measures.includes(layer.filters.measure.value) ?
									+(annualSummaries[year][ix].measure).toFixed(2) :
									+(annualSummaries[year][ix].measure / annualSummaries[year][ix].vmt).toFixed(2)
								return {
									index: year,
									value: v ? v : 0
								}
							})}
							keys={["value"]}
							margin={{ left: 0, bottom: 10 }}

						/>
						</div>
			     </React.Fragment>
			    )}
	    	</div>
      </div>
    </div>
  )
}


export default MeasureVisBox
