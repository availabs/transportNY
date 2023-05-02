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
            bgColor="#999999"
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

const Scale = scaleLinear()
  .domain([1/7, 2/7, 3/7, 4/7, 5/7, 6/7, 1])
  .range(ColorRange);

const percentFormat = d3format(".0%")

const Legend = () => {
  const [ref, setRef] = React.useState();
  const [height, setHeight] = React.useState(0);
  React.useEffect(() => {
    if (!ref) return;
    const rect = ref.getBoundingClientRect();
    setHeight(rect.height);
  }, [ref]);

  const labelScale = React.useMemo(() => {
    return scaleLinear()
      .domain([0, 1])
      .range([0, height]);
  }, [height]);

  return (
    <div ref={ setRef } className="h-full  flex">
      <div className="flex flex-col h-full w-1/2"
        style={ { backgroundColor: "#999999" } }
      >
        { d3range(0, 1, 0.01).map(n => (
            <div key={ n }
              className="opacity-75 hover:opacity-100"
              style={ {
                height: `1%`,
                backgroundColor: Scale(n)
              } }/>
          ))
        }
      </div>
      <div className="h-full w-1/2 relative">
        { d3range(0, 1, 0.1).map(n => (
            <div key={ n }
              className="absolute w-full flex justify-start items-start ml-1"
              style={ {
                top: `${ labelScale(n) }px`
              } }
            >
              { percentFormat(n) }
            </div>
          ))
        }
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
