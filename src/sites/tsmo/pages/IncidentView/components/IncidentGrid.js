import React from 'react'
import {
  useFalcor,
  getColorRange,
  useTheme,
  Legend
} from "modules/avl-components/src";
import {
  range as d3range,
  rollup as d3rollup,
} from "d3-array";
import { format as d3format } from "d3-format";
import { /*scaleQuantile,*/ scaleLinear, scaleThreshold } from "d3-scale";

import { GridGraph,/* BarGraph, LineGraph*/} from "modules/avl-graph/src";
import get from "lodash.get";
import { congestionController } from './CongestionInfo'
import {  makeNpmrdsRequestKeys } from './utils'

const ColorRange = getColorRange(7, "RdYlGn");
const DiffColorRange = getColorRange(8, "YlOrBr", true);

const epochFormat = (de) => {
  const [, e] = de.split("|");
  const m = e * 5;
  let hour = Math.floor(m / 60);
  const am = hour < 12 ? "am" : "pm";
  if (hour === 0) {
    hour = 12;
  } else if (hour > 12) {
    hour -= 12;
  }
  return ` ${hour}:${`0${m % 60}`.slice(-2)}${am}`;
};

const displayFormats  = {
	"diff": d3format("+,.0%"),
	"mph" : (v) => isNaN(String(v)) ? "No Data" : `${ Math.round(v) } MPH`,
	"round" : (v) => `${ Math.round(v) }`

}

const compare1d = (arr1, arr2) => {
	if(arr1.length === arr2.length) {
		return arr1.reduce((out, elem, i) => {
			if(elem !== arr2[i]){
				return false
			}
			return out
		},
		true)
	} else {
		return false
	}
}

const IncidentGrid = ({
	event_id, 
  year,
  tmcs,
  corridors,
  tmcMetaData,
  congestionData,
  activeBranch
},...rest) => {
	const {falcor, falcorCache} = useFalcor();
	const [activeGrid, setActiveGrid] = React.useState('Event Speeds')
	const [requestKeys, setRequestKeys] = React.useState([]);



	React.useEffect(() => {
		if(congestionData && congestionData.dates) { 
			const [newRequestKeys,,] = makeNpmrdsRequestKeys(congestionData);
     	if(!compare1d(newRequestKeys, requestKeys)){
     		setRequestKeys(newRequestKeys);
     	}
   	}
    if (requestKeys.length && tmcs.length && year) {
      falcor
        .get(
          ["routes", "data", requestKeys],
          ["pm3", "measuresByTmc", tmcs, Math.max(year-1, 2016), "freeflow_tt"]
        )
    }
  }, [falcor,falcorCache,requestKeys,congestionData, tmcs, year]);
	
	const getFF = (tmc, year, falcorCache) => {
	  const fftt = get(
	    falcorCache,
	    ["pm3", "measuresByTmc", tmc, Math.max(year-1, 2016), "freeflow_tt"],
	    {}
	  );

	  if (fftt) {
	    return fftt;
	  }

	  const { length, avg_speedlimit } = get(
	    falcorCache,
	    ["tmc", tmc, "meta", year],
	    {}
	  );

	  return (length / avg_speedlimit) * 3600;
	};

	const expandData = (tmcs, year, requestKeys, falcorCache) => {

		return requestKeys.reduce((a, rk) => {
	    const data = [...get(falcorCache, ["routes", "data", rk, "value"], [])];

	    const tmcMap = d3rollup(
	      data,
	      (d) => d.pop(),
	      (d) => d.tmc,
	      (d) => +d.resolution
	    );

	    tmcMap.forEach((epochs, tmc) => {
	      const domain = [],
	        range = [];

	      for (let e = 0; e < 288; ++e) {
	        if (epochs.has(e)) {
	          domain.push(e);
	          range.push(epochs.get(e).value);
	        } else if (e === 0 || e === 287) {
	          const ff = getFF(tmc, year, falcorCache);
	          if (ff) {
	            domain.push(e);
	            range.push(ff);
	          }
	        }
	      }
	      const scale = scaleLinear()
	        .domain(domain)
	        .range(range);

	      for (let e = 0; e < 288; ++e) {
	        if (!epochs.has(e)) {
	          const row = {
	            tmc,
	            resolution: e,
	            value: scale(e),
	            interpolated: true,
	          };
	          data.push(row);
	        }
	      }
	    });

	    a[rk] = data;
	    return a;
	  }, {});
	}

	const gridData = React.useMemo(() => {
	   	if(!congestionData || !congestionData.dates) return []
	    const { startTime, endTime, dates } = congestionData;
	    
	    let corridorTmcs = Object.values(
	      get(corridors.filter(c => c.corridor === activeBranch),'[0].tmcs',{})
	    )

	    const tmcs =  new Set([...Object.values(corridorTmcs)])
	    const tmcMap = new Map();

	    Object.keys(corridorTmcs).forEach((orderKey) => {
	      if (!tmcMap.has(corridorTmcs[orderKey])) {
	        tmcMap.set(corridorTmcs[orderKey], -1 * orderKey);
	      }
	    });

	    const expandedData = expandData(tmcs, year, requestKeys, falcorCache);

	    // const dataDomain = requestKeys.reduce((a, c) => {
	    //   const data = get(expandedData, c, [])
	    //     .filter(({ tmc }) => tmcs.has(tmc))
	    //     .map((d) => {
	    //       const { tmc, value } = d;
	    //       const length = get(falcorCache, ["tmc", tmc, "meta", year, "length"]);
	    //       return length * (3600.0 / value);
	    //     });
	    //   a.push(...data);
	    //   return a;
	    // }, []);

	    // const _colors = scaleQuantize()
	    //   .domain([33, d3extent(dataDomain)[1]])
	    //   .range(ColorRange);

	   	let timeRange = [Math.max(startTime-24, 0),Math.min(endTime +24, 288)]

	    const keys1 = dates.reduce((a, c) => {
	      d3range(...timeRange).forEach(e => a.push(`${ c }|${ e }`));
	      return a;
	    }, []);

	    const tmcLengths = [...tmcs].reduce((a, c) => {
	      a[c] = get(falcorCache, ["tmc", c, "meta", year, "length"], 1);
	      return a;
	    }, {})

	    let avgFF = Math.round([...tmcs].reduce((a,b) =>  {
	    	return a + (get(tmcLengths, b, 1) * (3600.0 / getFF(b,year,falcorCache)))
	    },0) / [...tmcs].length)
	    

	     const _colors = scaleThreshold()
	      .domain([avgFF-20,avgFF-15,avgFF-8,avgFF-5, avgFF-2, avgFF-1, avgFF ])
	      .range(ColorRange);

	    const colors = (v, i, d, x) => {
	      const c = _colors(v);
	      return d.interpolated.includes(x) ? `${c}88` : c;
	    };


	    const grid1 = [...tmcs].reduce((a, tmc) => {

	      const length = get(tmcLengths, tmc, 1);

	      const tmcData = requestKeys.slice(0, -1).reduce((aa, rk, i) => {
	        const data = get(expandedData, rk, []).filter(d => d.tmc === tmc);
	        aa.push(...data.map(d => ({
	          ...d,
	          value: length * (3600.0 / d.value),
	          key: `${ dates[i] }|${ d.resolution }`
	        })));
	        return aa;
	      }, [])

	      a.data.push({
	        index: tmc,
	        roadname: get(
	          falcorCache,
	          ["tmc", tmc, "meta", year, "roadname"],
	          ""
	        ),
	        //freeflow: ,
	        height: length,
	        interpolated: tmcData.reduce((a, c) => {
	          if (c.interpolated) {
	            a.push(c.key);
	          }
	          return a;
	        }, []),
	        ...tmcData.reduce((a, c) => {
	          a[c.key] = c.value;
	          return a;
	        }, {})
	      })

	      return a;
	    }, { data: [], keys: keys1, colors, _colors});



	    grid1.data.sort((a, b) => tmcMap.get(a.index) - tmcMap.get(b.index))


	    const keys2 = d3range(...timeRange).map(e => `${ year }|${ e }`);

	    const grid2 = [...tmcs].reduce((a, tmc) => {

	      const length = get(tmcLengths, tmc, 1);

	      const tmcData = requestKeys.slice(-1).reduce((aa, rk, i) => {
	        const data = get(expandedData, rk, []).filter(d => d.tmc === tmc);
	        aa.push(...data.map(d => ({
	          ...d,
	          value: length * (3600.0 / d.value),
	          key: `${ year }|${ d.resolution }`
	        })));
	        return aa;
	      }, [])

	      a.data.push({
	        index: tmc,
	        roadname: get(
	          falcorCache,
	          ["tmc", tmc, "meta", year, "roadname"],
	          ""
	        ),
	        height: length,
	        interpolated: tmcData.reduce((a, c) => {
	          if (c.interpolated) {
	            a.push(c.key);
	          }
	          return a;
	        }, []),
	        ...tmcData.reduce((a, c) => {
	          a[c.key] = c.value;
	          return a;
	        }, {})
	      })

	      return a;
	    }, { data: [], keys: keys2, colors, _colors });

	    grid2.data.sort((a, b) => tmcMap.get(a.index) - tmcMap.get(b.index))


	    const diffData = { keys: keys1, data: [] },
	      indexMap = new Map(),
	      keySets = [],
	      diffDomain = [];

	    grid1.data.forEach(({ index, height, ...rest }, i) => {
	      indexMap.set(index, i);
	      const dData = { index, height };
	      keySets.push(new Set());
	      keys1.forEach((k) => {
	        if (k in rest) {
	          keySets[i].add(k);
	          dData[k] = rest[k];
	        }
	      });
	      diffData.data.push(dData);
	    });

	    grid2.data.forEach(({ index, height, ...rest }) => {
	      if (!indexMap.has(index)) return;
	      const i = indexMap.get(index);
	      keys1.forEach((k1, ii) => {
	        const k2 = keys2[ii % 288];
	        if ((k2 in rest) && keySets[i].has(k1)) {
	          keySets[i].delete(k1);
	          diffData.data[i][k1] = ((diffData.data[i][k1] - rest[k2]) / rest[k2]) ;
	          diffDomain.push(diffData.data[i][k1]);
	        }
	      });
	    });

	    keySets.forEach((set, i) => {
	      set.forEach((k) => delete diffData.data[i][k]);
	    });

	    diffData.colors = scaleThreshold()
	      .domain([-1,-0.8,-0.6,-0.4,-0.3,-0.2,-0.1,0,.1])
	      .range(DiffColorRange);

	    const gData = [grid1, grid2, diffData];

	    return gData.map((gData, i) => ({
	      gData,
	      label:
	        i === 0
	          ? "Event Speeds"
	          : i === 1
	          ? "Yearly Avg. Speeds"
	          : "Speed Differences",
	    }));
  	}, [requestKeys, falcorCache,activeBranch, corridors, congestionData,year, expandData]);

	const points = React.useMemo(() => {
	    if(!congestionData || !congestionData.dates) return []
	    const { startTime, endTime, eventTmcs, dates } = congestionData;
	   

	    return [
	      [...eventTmcs.map((tmc) => ({
	        index: tmc,
	        key: `${ dates[0] }|${ startTime }`,
	        spanTo: `${ dates[dates.length - 1] }|${ endTime }`,
	        strokeWidth: 2,
	        stroke: "#0cf",
	      })),
	      ...eventTmcs.map((tmc) => ({
	        index: tmc,
	        key: `${ dates[dates.length - 1] }|${ endTime }`,
	        strokeWidth: 2,
	        stroke: "#0cf",
	      }))],
	      
	    ];
	}, [congestionData]);

	const bounds = React.useMemo(() => {
	    if (!congestionData || !congestionData.tmcBounds) {
	      return [[], []];
	    }
	    const { tmcBounds } = congestionData;

	    const bounds1 = [], bounds2 = [];

	    for (const tmc in tmcBounds) {
	      bounds1.push({
	        index: tmc,
	        bounds: tmcBounds[tmc].map(b => b.join("|")),
	        strokeWidth: 2,
	        stroke: "#0cf",
	      });
	     
	    }
	    return [bounds1, bounds2];
	}, [congestionData]);

	const axisLeftFormat = React.useCallback(tmc => {
			return get(falcorCache, ["tmc", tmc, "meta", year, "firstname"]);
	}, [falcorCache, year])

	const corridorName = React.useMemo(() => {
		return `${get(corridors.filter(c => c.corridor === activeBranch),'[0].roadname','')} ${get(corridors.filter(c => c.corridor === activeBranch),'[0].direction','')}` 
	},
	[corridors, activeBranch])

	    	
	return !congestionData ? <span /> : (
		<div className ='flex w-full bg-white p-2'>
			<div className='w-10'>
				<div className='  flex content-center justify-center h-full flex-col'>
					<div  className='flex-1' />
					<div className=' rotate-[270deg] text-3xl text-gray-600 font-bold w-[400px] relative -left-[160px] text-center'>
						<div>
						{corridorName}
						</div>
						<div className='-mt-2'>
							<i className="fad fa-arrow-right-long text-5xl"/>
						</div>
					</div>
					<div  className='flex-1' />
				</div>
			</div>
			<div className='flex-1'>

			 {!gridData.length ? null
      	: gridData
      	.filter(({gData,label},i) => {
      		return label === activeGrid
      	})
        .map(({ gData, label }, i) => (
          <div
            key={i}
            className={``}
          >
            <div className='flex pb-1 -ml-10'>
	            <div className="">
	            	<div className='text-xs'>Grid Display</div>
	              <select 
	              	value={activeGrid} 
	              	onChange={(e) => setActiveGrid(e.target.value)}
	              	className={'bg-gray-100 p-2 text-lg border border-gray-300'}
	              >
	              	{gridData.map(({gData,label},i) => <option key={i} value={label}>{label}</option>)}
	              </select>
	            	
	            </div>
	            <div className='flex-1'>
	            	<GridLegend 
	            		scale={label === 'Speed Differences' ? gData.colors : gData._colors}
		            	format={label === 'Speed Differences' ? displayFormats['diff'] : displayFormats['round']}
		            	title={label === 'Speed Differences' ? 'Speed Difference (%)' : 'Speed (mph)'}
		            />
	            	
	          	</div>
	          </div>
            <div
              style={{
                height: `${Math.max(gData.data.length * 4, 46)}rem`,
              }}
            >
              <GridGraph
                {...gData}
                showAnimations={false}
                margin={{ top: 5, right: 5, bottom: 25, left: 120 }}
                axisBottom={{
                  format: epochFormat,
                  tickDensity: 0.5,
                }}
                points={ points[i % 2] }
                bounds={ bounds[i % 2] }
                axisLeft={ {
                  format: axisLeftFormat,
                  rotate: 60
                }}
                hoverComp={ {
                  HoverComp: GridHoverComp,
                  valueFormat: label === 'Speed Differences' ? displayFormats['diff'] : displayFormats['mph'],
                  keyFormat: epochFormat,
                } }
              />
            </div>
          </div>
        ))}
      </div>
		</div>
	)
}

export default congestionController(IncidentGrid)

const GridLegend = ({scale, format, title}) => {
	return <div className='px-4'>
			<div className='text-xs'>{title}</div>
			<div>
				<Legend  domain={scale.domain()} range={scale.range()} type='threshold' format={format} />
			</div>
		</div>
}

const GridHoverComp = ({ data, indexFormat, keyFormat, valueFormat }) => {
  const theme = useTheme();
  const indexes = get(data, "indexes", []);
  const cols = Math.max(2, Math.ceil(indexes.length / 20));
  return (
    <div
      className={`
        grid grid-cols-${cols}
        grid-flow-col gap-1 px-2 pt-1 pb-2 rounded
        ${theme.accent1}
      `}
      style={{
        gridTemplateRows: `repeat(${Math.ceil(indexes.length / cols) +
          1}, minmax(0, 1fr))`,
      }}
    >
      <div
        className={`
        font-bold text-lg leading-6 border-b-2 pl-2 col-span-${cols}
      `}
      >
        {keyFormat(get(data, "key", null))}
      </div>
      {indexes.map((i) => (
        <div
          key={i}
          className={`
            flex items-center px-2 rounded transition
          `}
        >
          <div
            className="mr-2 rounded-sm color-square w-5 h-5"
            style={{
              backgroundColor: get(data, ["indexData", i, "color"], null),
              opacity: data.index === i ? 1 : 0.2,
            }}
          />
          <div className="mr-4">{indexFormat(i)}:</div>
          <div className="text-right flex-1">
            {valueFormat(get(data, ["indexData", i, "value"], 0))}
          </div>
        </div>
      ))}
    </div>
  );
};