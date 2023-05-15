import React from "react"

import { format as d3format } from "d3-format"
import get from "lodash.get"

import {
  useFalcor
} from "modules/avl-components/src"

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
    <div className="grid"
      style={ { gridTemplateColumns: `repeat(${ geoAtts.length }, minmax(0, 1fr))` } }
    >
      { geoAtts.map(atts => <GeoAtt key={ atts.year } { ...atts }/>) }
    </div>
  )
}

export default GeoAtts
