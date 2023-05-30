import React from "react"

import get from "lodash/get"
import moment from "moment"
import {
  rollups as d3rollups,
  groups as d3groups,
  range as d3range,
  mean as d3mean,
  deviation as d3deviation,
  quantile as d3quantile,
  median as d3median,
  extent as d3extent
} from "d3-array"
import { select as d3select } from "d3-selection"

import {
  useFalcor,
  getColorRange
} from "~/modules/avl-components/src"

import { BarGraph } from "~/modules/avl-graph/src"

import {
  getResolutionGrouper,
  getResolutionFormat,
  MonthFormat,
  FullMonthFormat
} from "./utils"

const Peaks = ["Overnight", "AM Peak", "Off Peak", "PM Peak", "Weekend"];

const getPeak = (ts, { bins }) => {
  const epoch = +ts.slice(11) * bins;
  const hour = Math.floor(epoch / 12);
  const date = moment(ts.slice(0, 10), "YYYY-MM-DD");
  const dow = date.day();

  if ((hour < 6) || (hour >= 20)) {
    return "Overnight";
  }
  if ((dow === 0) || (dow === 6)) {
    return "Weekend";
  }
  if ((hour >= 6) && (hour < 10)) {
    return "AM Peak";
  }
  if ((hour >= 10) && (hour < 16)) {
    return "Off Peak";
  }
  return "PM Peak";
}

const ColorRange = getColorRange(5, "Set3");

const MetricByPeaks = ({ tmc, year, source, resolution, metric }) => {

  const { falcorCache } = useFalcor();

  const miles = React.useMemo(() => {
    return +get(falcorCache, ["tmc", tmc, "meta", year, "miles"], 0);
  }, [falcorCache, tmc, year]);

  const transform = React.useCallback(tt => {
    if (metric.key === "tt") return tt;
    return miles * (3600.0 / tt);
  }, [metric, miles]);

  const [devFilter, setDevFilter] = React.useState(0);

  const [RawData, median, p85] = React.useMemo(() => {
    const rawData = get(falcorCache, ["tmc", tmc, "year", year, "npmrds", source, "value"], [])
      .map(d => ({ ...d, tt: transform(d.tt) }));
    const median = Math.floor(d3median(rawData, d => d.tt));
    const p85 = Math.floor(d3quantile(rawData, 0.85, d => d.tt));
    return [rawData, median, p85];
  }, [falcorCache, tmc, year, source, transform]);

  const data = React.useMemo(() => {
    let rawData = RawData;
    if (devFilter > 0) {
      const mean = d3mean(rawData, d => d.tt);
      const dev = d3deviation(rawData, d => d.tt);
      const upper = mean + dev * devFilter;
      const lower = mean - dev * devFilter;
      rawData = RawData.filter(d => (d.tt >= lower) && (d.tt <= upper));
    }

    const grouper = getResolutionGrouper(resolution);
    const group1 = d => `${ d.ts.slice(0, 10) }-${ grouper(d) }`;
    const reducer1 = g => ({
      value: Math.floor(d3mean(g, d => d.tt)),
      count: g.length
    })
    const rollups1 = d3rollups(rawData, reducer1, group1);

    const reducer2 = d => d.reduce((a, c) => a + c[1].count, 0);
    const rollups2 = d3rollups(rollups1, reducer2, d => d[1].value, d => getPeak(d[0], resolution));

    const data = rollups2.map(([speed, peaks]) => {
      return {
        index: speed,
        ...peaks.reduce((a, c) => {
          const [peak, count] = c;
          a[peak] = count;
          return a;
        }, {})
      }
    }).sort((a, b) => a.index - b.index);

    return data;
  }, [RawData, resolution, transform, devFilter]);

  const xDomain = React.useMemo(() => {
    const extent = d3extent(data, d => d.index);
    return d3range(extent[0], extent[1] + 1);
  }, [data]);

  const resFormat = React.useMemo(() => {
    return getResolutionFormat(resolution);
  }, [resolution]);

  const indexFormat = React.useMemo(() => {
    if (metric.key === "tt") {
      return v => `${ v } seconds`
    }
    return v => `${ v } MPH`
  }, [metric]);

  const bottomLabel = React.useMemo(() => {
    if (metric.key === "tt") {
      return `${ metric.name } (Seconds)`
    }
    return `${ metric.name } (MPH)`
  }, [metric]);

  const AddOn = React.useMemo(() => {
    return getAddOn(median, p85);
  }, [median, p85]);

  return (
    <div>
      <div className="font-bold text-2xl border-b-2 border-current mb-4">
        { metric.name } Distributions by Peak
      </div>
      <div className="flex" style={ { height: "600px" } }>
        <div className="mr-4"
          style={ { width: "92.5%", height: "100%" } }
        >
          <BarGraph data={ data }
            keys={ Peaks }
            showAnimations={ false }
            margin={ { left: 75, top: 5, right: 5, bottom: 50 } }
            colors={ ColorRange }
            hoverComp={ {
              valueFormat: ",d",
              indexFormat
            } }
            xScale={ {
              domain: xDomain
            } }
            axisBottom={ {
              label: bottomLabel,
              tickDensity: 3
            } }
            axisLeft={ {
              label: "Count"
            } }
            addons={ [AddOn] }/>
        </div>
        <div style={ { width: "7.5%", height: "100%", paddingBottom: "25px" } }>
          <Legend />
        </div>
      </div>
      <div className="flex justify-center mt-4">
        <Radios value={ devFilter }
          onChange={ setDevFilter }/>
      </div>
    </div>
  )
}

export default MetricByPeaks;

const getAddOn = (median, p85) => {
  return ({ xScale, adjustedHeight }) => {

    const [state, setState] = React.useState("entering");

    React.useEffect(() => {
      setState(Boolean(xScale) ? "updating" : "entering")
    }, [xScale]);

    const [ref1, setRef1] = React.useState(null);
    const [ref2, setRef2] = React.useState(null);

    React.useEffect(() => {
      if (state === "entering") {
        d3select(ref1)
          .style("transform", "translateX(0px)")
      }
      else if (state === "updating") {
        const x = xScale(median) + xScale.bandwidth() * 0.5;
        if (x) {
          d3select(ref1)
            .transition().duration(1000)
              .style("transform", `translateX(${ x }px)`)
        }
      }
    }, [ref1, median, xScale, adjustedHeight, state]);

    React.useEffect(() => {
      if (state === "entering") {
        d3select(ref2)
          .style("transform", "translateX(0px)")
      }
      else if (state === "updating") {
        const x = xScale(p85) + xScale.bandwidth() * 0.5;
        if (x) {
          d3select(ref2)
            .transition().duration(1000)
              .style("transform", `translateX(${ x }px)`)
        }
      }
    }, [ref2, p85, xScale, adjustedHeight, state]);

    return (
      <g className="pointer-events-none"
        strokeOpacity={ 0.5 }
        fillOpacity={ 0.5 }
      >
        <g ref={ setRef1 }>
          { state === "entering" ? null :
            <>
              <line stroke="black"
                x1={ 0 } y1={ 0 }
                x2={ 0 } y2={ adjustedHeight }/>
              <text x={ 5 } y={ 15 }
                style={ { transform: "rotate(90deg)" } }
              >
                Median
              </text>
            </>
          }
        </g>
        <g ref={ setRef2 }>
          { state === "entering" ? null :
            <>
              <line stroke="black"
                x1={ 0 } y1={ 0 }
                x2={ 0 } y2={ adjustedHeight }/>
              <text x={ 5 } y={ -5 }
                style={ { transform: "rotate(90deg)" } }
              >
                85th Percentile
              </text>
            </>
          }
        </g>
      </g>
    )
  }
}

const Legend = () => {
  return (
    <div className="grid grid-cols-1 grid-rows-5 gap-2">
      { ColorRange.slice().reverse().map((c, i) => (
          <div key={ c }>
            <div className="w-full h-6 rounded opacity-75 hover:opacity-100"
              style={ { backgroundColor: c } }
            />
            <div className="whitespace-nowrap">
              { Peaks.slice().reverse()[i] }
            </div>
          </div>
        ))
      }
    </div>
  )
}

const Radios = ({ value, onChange }) => {
  const doOnChange = React.useCallback(e => {
    onChange(+e.target.id);
  }, [onChange]);
  return (
    <div className="flex items-end">
      <div className="mr-8">
        <div className="mr-1">Show all data</div>
        <div className="mr-1">(No filter)</div>
        <input type="radio" name="deviation" id="0"
          checked={ value === 0 }
          onChange={ doOnChange }/>
      </div>
      <div className="flex flex-col">
        <div className="border-b">
          Filter all data within...
        </div>
        <div className="flex">
          <div className="mr-8">
            <div className="mr-1">3 Std. Deviations</div>
            <div className="mr-1">(No Extreme Outliers)</div>
            <input type="radio" name="deviation" id="3"
              checked={ value === 3 }
              onChange={ doOnChange }/>
          </div>
          <div className="mr-8">
            <div className="mr-1">2 Std. Deviations</div>
            <div className="mr-1">(No Outliers)</div>
            <input type="radio" name="deviation" id="2"
              checked={ value === 2 }
              onChange={ doOnChange }/>
          </div>
{/*
          <div className="mr-8">
            <div className="mr-1">1 Std. Deviation</div>
            <input type="radio" name="deviation" id="1"
              checked={ value === 1 }
              onChange={ doOnChange }/>
          </div>
*/}
        </div>
      </div>
    </div>
  )
}
