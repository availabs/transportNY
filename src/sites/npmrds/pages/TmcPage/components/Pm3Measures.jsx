import React from "react"

import get from "lodash.get"
import { format as d3format } from "d3-format"

import { useFalcor } from "~/modules/avl-components/src"

import { LineGraph } from "~/modules/avl-graph/src"

import { YEARS } from "./utils"

const MEASURES = [
  { key: "lottr", name: "Level of Travel Time Reliability" },
  { key: "tttr", name: "Truck Travel Time Reliability" },
  { key: "phed", name: "Peak Hours of Excessive Delay" }
]

const Pm3Measures = ({ tmc, year }) => {
  return (
    <div>
      <div className="font-bold text-2xl border-b-2 border-current mb-4">
        PM3 Measures
      </div>
      <div className="grid grid-cols-1 gap-4">
        { MEASURES.map(m =>
            <div key={ m.key }>
              <div>
                <Pm3Measure measure={ m }
                  tmc={ tmc } year={ year }/>
              </div>
              <div>
                <Pm3MesureLine measure={ m }
                  tmc={ tmc }/>
              </div>
            </div>
          )
        }
      </div>
    </div>
  )
}

export default Pm3Measures;

const floatFormat = d3format(",.2f");

const Pm3Measure = ({ tmc, year, measure: { key, name } }) => {

  const { falcorCache } = useFalcor();

  const value = React.useMemo(() => {
    return get(falcorCache, ["pm3", "measuresByTmc", tmc, year, key], "loading...");
  }, [falcorCache, tmc, year, key]);

  return (
    <div className="flex border-b border-current mb-2">
      <div className="font-bold flex-1">
        { name }
      </div>
      <div className="pr-2">
        Current Year: <span className="font-bold">{ floatFormat(value) }</span>
      </div>
    </div>
  )
}

const idFormat = () => "Value";

const Pm3MesureLine = ({ tmc, measure: { key, name } }) => {

  const { falcorCache } = useFalcor();

  const data = React.useMemo(() => {
    return [{
      id: key,
      data: [...YEARS].reverse().map(year => ({
        x: year,
        y: get(falcorCache, ["pm3", "measuresByTmc", tmc, year, key], 0)
      }))
    }]
  }, [falcorCache, tmc, key]);

  return (
    <div classname="h-40">
      <LineGraph data={ data }
        colors={ ["black"] }
        margin={ { left: 50, top: 5, right: 5, bottom: 25 } }
        hoverComp={ {
          showTotals: false,
          yFormat: ",.2f",
          idFormat
        } }
        axisBottom={ true }
        axisLeft={ { ticks: 5 } }/>
    </div>
  )
}
