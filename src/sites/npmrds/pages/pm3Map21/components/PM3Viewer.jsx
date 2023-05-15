import React from "react"

import get from "lodash/get"
import { format as d3format } from "d3-format"
import { extent as d3extent } from "d3-array"

import {
  useFalcor
} from "~/modules/avl-components/src"

import {
  LineGraph
} from "~/modules/avl-graph/src"

import {
  capitalize
} from "~/sites/npmrds/components"

const PM3Measures = [
  { measure: "lottr_interstate",
    name: "Interstate Level of Travel Time Reliability",
    colors: ["red", "black", "green"]
  },
  { measure: "lottr_noninterstate",
    name: "Non-Interstate Level of Travel Time Reliability",
    colors: ["red", "black", "green"]
  },
  { measure: "tttr_interstate",
    name: "Truck Travel Time Reliability",
    colors: ["green", "black", "red"]
  },
  { measure: "phed",
    name: "Peak Hours of Excessive Delay",
    colors: ["green", "black", "red"]
  }
]

const Radios = ({ view, setView }) => {
  const doSetView = React.useCallback(e => {
    setView(e.target.id);
  }, [setView]);
  return (
    <div className="flex">
      <div className="flex mr-8">
        <div className="mr-1">View Graphs</div>
        <input type="radio" name="view" id="graphs"
          checked={ view === "graphs" }
          onChange={ doSetView }/>
      </div>
      <div className="flex">
        <div className="mr-1">View Charts</div>
        <input type="radio" name="view" id="charts"
          checked={ view === "charts" }
          onChange={ doSetView }/>
      </div>
    </div>
  )
}

const StatePM3 = props => {
  const [view, setView] = React.useState("graphs")
  return (
    <div className="grid grid-cols-1 gap-4">
      <GeoAtts { ...props }/>
      <Radios view={ view } setView={ setView }/>
      <div className={ view === "graphs" ? "block grid grid-cols-1 gap-4" : "hidden" }>
        { PM3Measures.map(m => (
            <MeasureLineGraph key={ m.measure } { ...m } { ...props }/>
          ))
        }
      </div>
      <div className={ view === "charts" ? "block grid grid-cols-1 gap-4" : "hidden" }>
        { PM3Measures.map(m => (
            <MeasureList key={ m.measure } { ...m } { ...props }/>
          ))
        }
      </div>
    </div>
  )
}

export default StatePM3

const decimal = d3format(",d");
const float = d3format(",.1f");

const GeoAtt = props => {
  const {
    year,
    interstate_miles,
    noninterstate_miles,
    interstate_tmcs_ct,
    noninterstate_tmcs_ct
  } = props;
  return (
    <div className="border border-current text-center">
      <div className="border-b-2 border-current font-bold">{ year }</div>
      <div className="grid grid-cols-2 content-end">
        <div className="flex items-end justify-center font-bold border-b border-r border-current">
          Interstate
        </div>
        <div className="flex items-end justify-center font-bold border-b border-l border-current">
          Non-Interstate
        </div>

        <div className="font-bold col-span-2 border-b border-current">Miles</div>

        <div className="border-b border-r border-current">{ float(interstate_miles) }</div>
        <div className="border-b border-l border-current">{ float(noninterstate_miles) }</div>

        <div className="font-bold col-span-2 border-b border-current">Number of TMCs</div>

        <div className="border-r border-current">{ decimal(interstate_tmcs_ct) }</div>
        <div className="border-l border-current">{ decimal(noninterstate_tmcs_ct) }</div>
      </div>
    </div>
  )
}

const GeoAtts = ({ versions, geoid }) => {

  const { falcorCache } = useFalcor();

  const geoAtts = React.useMemo(() => {
    return versions.map(({ year, version }) => {
      return get(falcorCache, ["geoAttributes", geoid, year, "value"], null);
    }).filter(Boolean).sort((a, b) => a.year - b.year);
  }, [falcorCache, versions, geoid]);

  return (
    <div className={ `grid grid-cols-${ versions.length }` }>
      { geoAtts.map(atts => <GeoAtt key={ atts.year } { ...atts }/>) }
    </div>
  )
}

const idFormat = () => "Value";

const MeasureLineGraph = ({ versions, geoid, measure, name }) => {

  const { falcorCache } = useFalcor();

  const [data, domain] = React.useMemo(() => {
    const values = [];
    const data = [{
      id: measure,
      data: versions.reduce((a, c) => {
        const d = get(falcorCache, ["pm3", "versionedCalculations", "version", c.version, "geolevel", geoid, "value"], null);
        if (d) {
          values.push(d[measure]);
          a.push({
            x: c.year,
            y: d[measure]
          })
        }
        return a;
      }, [])
    }];
    const extent = d3extent(values);
    return [data, [extent[0] * 0.9, extent[1]]];
  }, [falcorCache, versions, geoid, measure]);

  return (
    <div>
      <div className="font-bold">
        { name }
      </div>
      <div>
        <LineGraph data={ data }
          colors={ ["black"] }
          margin={ { left: 100, top: 5, right: 5, bottom: 25 } }
          hoverComp={ {
            showTotals: false,
            yFormat: ",.2f",
            idFormat
          } }
          padding={ 0.25 }
          axisBottom={ true }
          axisLeft={ { ticks: 5 } }
          yScale={ { domain } }/>
      </div>
    </div>
  )
}

const Measure = ({ value, year, prev, color }) => {
  return (
    <div className="border border-current text-center">
      <div className="border-b-2 border-current font-bold">{ year }</div>
      <div className="border-b border-current">
        { value }
      </div>
      <div style={ { color } }>
        { prev }
      </div>
    </div>
  )
}

const valueFormat = d3format(",.2f");
const percentFormat = d3format("+,.2%")

const MeasureList = ({ versions, geoid, measure, name, colors }) => {

  const { falcorCache } = useFalcor();

  const data = React.useMemo(() => {
    return versions.map(({ version, year }, i) => {
      const curr = get(falcorCache, ["pm3", "versionedCalculations", "version", version, "geolevel", geoid, "value"], null);
      const prev = get(falcorCache, ["pm3", "versionedCalculations", "version", get(versions, [i - 1, "version"]), "geolevel", geoid, "value"], null);
      const cv = get(curr, measure, 0);
      const pv = get(prev, measure, null);
      const change = pv ? (cv - pv) / pv : null;
      return {
        value: valueFormat(cv),
        prev: i === 0 ? "---" : percentFormat(change),
        color: change > 0 ? colors[2] : change < 0 ? colors[0] : colors[1],
        year
      };
    })
  }, [falcorCache, versions, geoid, measure]);

  return (
    <div>
      <div className="font-bold">
        { name }
      </div>
      <div className={ `grid grid-cols-${ versions.length }` }>
        { data.map(d => <Measure key={ d.year } { ...d }/>) }
      </div>
    </div>
  )
}
