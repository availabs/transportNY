import React from "react"

import get from "lodash/get"
import { extent as d3extent } from "d3-array"

import {
  useFalcor
} from "~/modules/avl-components/src"

import {
  LineGraph
} from "~/modules/avl-graph/src"

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
            y: d[measure] || 0
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

export default MeasureLineGraph;
