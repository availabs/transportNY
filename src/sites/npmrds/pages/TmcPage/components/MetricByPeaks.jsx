import React from "react"

import get from "lodash/get"
import moment from "moment"
import {
  rollups as d3rollups,
  groups as d3groups,
  range as d3range,
  mean as d3mean,
  extent as d3extent
} from "d3-array"

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
    if (metric.key === "tt") return Math.floor(tt);
    return Math.floor(miles * (3600.0 / tt));
  }, [metric, miles]);

  const data = React.useMemo(() => {
    const rawData = get(falcorCache, ["tmc", tmc, "year", year, "npmrds", source, "value"], []);

    const grouper = getResolutionGrouper(resolution);
    const group1 = d => `${ d.ts.slice(0, 10) }-${ grouper(d) }`;
    const reducer1 = g => ({
      value: transform(d3mean(g, d => d.tt)),
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
  }, [falcorCache, tmc, year, source, resolution, transform]);

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
              label: metric.name,
              tickDensity: 3
            } }
            axisLeft={ {
              label: "Count"
            } }/>
        </div>
        <div style={ { width: "7.5%", height: "100%", paddingBottom: "25px" } }>
          <Legend />
        </div>
      </div>
    </div>
  )
}

export default MetricByPeaks;

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
