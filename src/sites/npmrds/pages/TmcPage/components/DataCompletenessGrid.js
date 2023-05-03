import React from "react"

import get from "lodash.get"
import {
  rollups as d3rollups,
  range as d3range
} from "d3-array"
import { format as d3format } from "d3-format"
import {
  scaleQuantize,
  scaleLinear
} from "d3-scale"

import {
  useFalcor,
  getColorRange
} from "modules/avl-components/src"
import { GridGraph } from "modules/avl-graph/src"

import {
  numDaysPerMonth,
  getResolutionFormat,
  getResolutionGrouper,
  MonthKeys,
  MonthFormat,
  FullMonthFormat
} from "./utils"

const ColorRange = getColorRange(7, "BrBG");
const ColorScale = scaleQuantize().domain([0, 1]).range(ColorRange);

const BgColor = "#999999";

const DataCompletenessGrid = ({ tmc, year, source, resolution }) => {

  const { falcorCache } = useFalcor();

  const data = React.useMemo(() => {
    const rawData = get(falcorCache, ["tmc", tmc, "year", year, "npmrds", source, "value"], []);
    const grouper = getResolutionGrouper(resolution);
    const rolls = d3rollups(rawData, d => d.length, d => +d.ts.slice(5, 7), grouper);
    const days = numDaysPerMonth(year);

    const data = d3range(288 / resolution.bins).map(e => ({
      index: e,
      ...d3range(1, 13).reduce((a, c) => ({ ...a, [c]: 0 }), {})
    }))

    rolls.forEach(([m, mData]) => {
      mData.forEach(([d, num]) => {
        data[d][m] = num / days[m] / resolution.bins;
      })
    });

    return data.reverse();
  }, [falcorCache, tmc, year, source, resolution]);

  const axisLeftTickValues = React.useMemo(() => {
    const { bins, density } = resolution;
    return d3range(0, 288 / resolution.bins, density).reverse()
  }, [resolution]);

  const resFormat = React.useMemo(() => {
    return getResolutionFormat(resolution);
  }, [resolution]);

  return (
    <div>
      <div className="font-bold text-2xl border-b-2 border-current mb-4">
        Data Completeness
      </div>
      <div className="flex" style={ { height: "600px" } }>
        <div className="mr-4"
          style={ { width: "92.5%", height: "100%" } }
        >
          <GridGraph data={ data }
            keys={ MonthKeys }
            showAnimations={ false }
            colors={ ColorScale }
            margin={ { left: 75, top: 5, right: 5, bottom: 50 } }
            bgColor={ BgColor }
            hoverComp={ {
              HoverComp: HoverComp,
              indexFormat: resFormat,
              keyFormat: FullMonthFormat,
              valueFormat: ".1%"
            } }
            axisBottom={ {
              format: MonthFormat,
              tickValues: MonthKeys,
              label: "Months"
            } }
            axisLeft={ {
              format: resFormat,
              tickValues: axisLeftTickValues,
              label: "Time"
            } }/>
        </div>
        <div style={ { width: "7.5%", height: "100%", paddingBottom: "25px" } }>
          <Legend />
        </div>
      </div>
    </div>
  )
}

export default DataCompletenessGrid;

const percentFormat = d3format(".1%")

const LegendColor = ({ color }) => {
  return (
    <div className="w-full h-6 rounded relative">
      <div className="w-full h-6 rounded absolute z-10"
        style={ { backgroundColor: BgColor } }
      />
      <div className="w-full h-6 rounded absolute z-20 opacity-75 hover:opacity-100"
        style={ { backgroundColor: color } }
      />
    </div>
  )
}

const Legend = () => {
  const thresholds = React.useMemo(() => {
    return ColorScale.thresholds();
  });
  return (
    <div className="grid grid-cols-1 grid-rows-5 gap-2 text-center">
      <div className="whitespace-nowrap">
        { percentFormat(0)}
      </div>
      <LegendColor color={ ColorScale(0) }/>
      { thresholds.map((v, i) => (
          <React.Fragment key={ i }>
            <div className="whitespace-nowrap">
              { percentFormat(v)}
            </div>
            <LegendColor color={ ColorScale(v) }/>
          </React.Fragment>
        ))
      }
      <div className="whitespace-nowrap">
        { percentFormat(1)}
      </div>
    </div>
  )
}

const HoverComp = ({ data, indexFormat, keyFormat, valueFormat }) => {
  return (
    <div className={ `
      grid grid-cols-1 gap-1 px-2 pt-1 pb-2 rounded bg-gray-100
    ` }>
      <div className="font-bold text-lg leading-6 border-b-2 border-current pl-2">
        { keyFormat(get(data, "key", null)) }
      </div>

      <div className={ `
        flex items-center px-2 rounded transition
      `}>
        <div className="mr-2 rounded-sm color-square w-5 h-5"
          style={ {
            backgroundColor: get(data, ["indexData", data.index, "color"], null)
          } }/>
        <div className="mr-4">
          { indexFormat(data.index) }
        </div>
        <div className="text-right flex-1">
          { valueFormat(get(data, ["indexData", data.index, "value"], 0)) }
        </div>
      </div>

    </div>
  )
}
