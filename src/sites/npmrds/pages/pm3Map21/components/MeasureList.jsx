import React from "react"

import get from "lodash/get"
import { format as d3format } from "d3-format"

import {
  useFalcor
} from "~/modules/avl-components/src"

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
      <div className="grid"
        style={ { gridTemplateColumns: `repeat(${ data.length }, minmax(0, 1fr))` } }
      >
        { data.map(d => <Measure key={ d.year } { ...d }/>) }
      </div>
    </div>
  )
}

export default MeasureList;
