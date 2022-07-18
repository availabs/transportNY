import React from 'react'
import {
  useFalcor,
  Select,
  getColorRange,
  useTheme
} from "modules/avl-components/src";
import {
  range as d3range,
  rollup as d3rollup,
} from "d3-array";
import { format as d3format } from "d3-format";
import { scaleQuantile, scaleLinear } from "d3-scale";

import { GridGraph,/* BarGraph, LineGraph*/} from "modules/avl-graph/src";
import get from "lodash.get";

const ColorRange = getColorRange(7, "RdYlGn");

const epochFormat = (de) => {
  const [d, e] = de.split("|");
  const m = e * 5;
  let hour = Math.floor(m / 60);
  const am = hour < 12 ? "am" : "pm";
  if (hour === 0) {
    hour = 12;
  } else if (hour > 12) {
    hour -= 12;
  }
  return `${ d } ${hour}:${`0${m % 60}`.slice(-2)}${am}`;
};

const changeFormat = d3format("+,.1%")
const gridValueFormat1 = (v) =>
  isNaN(String(v)) ? "No Data"
    : `${ Math.round(v) } MPH`;
const gridValueFormat2 = (v) =>
  isNaN(String(v)) ? "No Data"
    : changeFormat(v);


const IncidentGrid = ({eventData,requestKeys,activeBranches}) => {
	const {falcor, falcorCache} = useFalcor();
	const [activeGrid, setActiveGrid] = React.useState('Speed Differences')
	
	const getFF = (tmc, year, falcorCache) => {
	  const fftt = get(
	    falcorCache,
	    ["pm3", "measuresByTmc", tmc, year, "freeflow_tt"],
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
	};

	const gridData = React.useMemo(() => {
	    const cData = get(eventData, ["congestion_data", "value"], null);
	    if (!cData) {
	      return [];
	    }

	    const { dates, branches = [], tmcDelayData = {}, eventTmcs = [] } = cData;

	    const year = dates[0].slice(0, 4);

	    const branchMap = branches.reduce((a, c) => {
	      a[c.branch.join("|")] = c;
	      return a;
	    }, {})

	    const upBranch = get(branchMap, activeBranches[0], { branch: [] });
	    const downBranch = get(branchMap, activeBranches[1], { branch: [] });

	    const tmcs = new Set([
	      ...upBranch.branch,//.filter(tmc => Boolean(tmcDelayData[tmc])),
	      ...downBranch.branch//.filter(tmc => Boolean(tmcDelayData[tmc]))
	    ])

	    const tmcMap = new Map();

	    upBranch.branch.forEach((tmc) => {
	      if (!tmcMap.has(tmc)) {
	        tmcMap.set(tmc, -tmcMap.size);
	      }
	    });
	    downBranch.branch.forEach((tmc) => {
	      if (!tmcMap.has(tmc)) {
	        tmcMap.set(tmc, tmcMap.size);
	      }
	    });

	    const expandedData = expandData(tmcs, year, requestKeys, falcorCache);

	    const dataDomain = requestKeys.reduce((a, c) => {
	      const data = get(expandedData, c, [])
	        .filter(({ tmc }) => tmcs.has(tmc))
	        .map((d) => {
	          const { tmc, value } = d;
	          const length = get(falcorCache, ["tmc", tmc, "meta", year, "length"]);
	          return length * (3600.0 / value);
	        });
	      a.push(...data);
	      return a;
	    }, []);

	    // const _colors = scaleQuantize()
	    //   .domain([33, d3extent(dataDomain)[1]])
	    //   .range(ColorRange);

	    const _colors = scaleQuantile()
	      .domain(dataDomain)
	      .range(ColorRange);

	    const colors = (v, i, d, x) => {
	      const c = _colors(v);
	      return d.interpolated.includes(x) ? `${c}88` : c;
	    };

	    const keys1 = dates.reduce((a, c) => {
	      d3range(288).forEach(e => a.push(`${ c }|${ e }`));
	      return a;
	    }, []);

	    const tmcLengths = [...tmcs].reduce((a, c) => {
	      a[c] = get(falcorCache, ["tmc", c, "meta", year, "length"], 1);
	      return a;
	    }, {})

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
	    }, { data: [], keys: keys1, colors });

	    grid1.data.sort((a, b) => tmcMap.get(a.index) - tmcMap.get(b.index))


	    const keys2 = d3range(288).map(e => `${ year }|${ e }`);

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
	    }, { data: [], keys: keys2, colors });

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
	          diffData.data[i][k1] = (diffData.data[i][k1] - rest[k2]) / rest[k2];
	          diffDomain.push(diffData.data[i][k1]);
	        }
	      });
	    });

	    keySets.forEach((set, i) => {
	      set.forEach((k) => delete diffData.data[i][k]);
	    });

	    diffData.colors = scaleQuantile()
	      .domain(diffDomain)
	      .range(ColorRange);

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
  	}, [requestKeys, eventData, falcorCache, activeBranches]);

	const points = React.useMemo(() => {
	    const cData = get(eventData, ["congestion_data", "value"], null);
	    if (!cData) {
	      return [[], []];
	    }
	    const { startTime, endTime, eventTmcs, dates } = cData;

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
	}, [eventData]);

	const bounds = React.useMemo(() => {
	    const cData = get(eventData, ["congestion_data", "value"], null);
	    if (!cData) {
	      return [[], []];
	    }
	    const { tmcBounds } = cData;

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
	}, [eventData]);

	const axisLeftFormat = React.useCallback(tmc => {
	    const year = get(eventData, ["congestion_data", "value", "dates", 0], "").slice(0, 4);
	    return get(falcorCache, ["tmc", tmc, "meta", year, "roadname"]);
	}, [falcorCache, eventData])

	return (
		<div>
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
                    <div className="font-bold  border-b-2 mb-1">
                      <select 
                      	value={activeGrid} 
                      	onChange={(e) => setActiveGrid(e.target.value)}
                      	className={'bg-gray-100 p-2 text-2xl'}
                      >
                      	{gridData.map(({gData,label},i) => <option key={i} value={label}>{label}</option>)}
                      </select>

                    </div>
                    <div
                      style={{
                        height: `${Math.max(gData.data.length * 4, 36)}rem`,
                      }}
                    >
                      <GridGraph
                        {...gData}
                        showAnimations={false}
                        margin={{ top: 5, right: 5, bottom: 25, left: 150 }}
                        axisBottom={{
                          format: epochFormat,
                          tickDensity: 0.5,
                        }}
                        points={ points[i % 2] }
                        bounds={ bounds[i % 2] }
                        axisLeft={ {
                          format: axisLeftFormat
                        } }
                        hoverComp={ {
                          HoverComp: GridHoverComp,
                          valueFormat: i === 2 ? gridValueFormat2 : gridValueFormat1,
                          keyFormat: epochFormat,
                        } }
                      />
                    </div>
                  </div>
                ))}
		</div>
	)
}

export default IncidentGrid

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