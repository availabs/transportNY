import React from "react"

import get from "lodash.get"
import { format as d3format } from "d3-format"
import { useParams } from "react-router-dom"

import { useFalcor } from "modules/avl-components/src"

import {
  tmcAttributes,
  routeSigningCodes,
  routeQualifierCodes,
  fSystemCodes,
  facilityTypeCodes,
  nationalHighwaySystemCodes,
  strategicHighwayNetworkCodes
} from "./utils"

const isNotNum = num => (num === null) || isNaN(num);

const float2format = d3format(",.2f");
const float2 = num => {
  if (isNotNum(num)) return "0.00";
  return float2format(num);
}

const decimalFormat = d3format(",d");
const decimal = num => {
  if (isNotNum(num)) return "0";
  return decimalFormat(num);
}

const TmcInfo = ({ tmc, year }) => {

  const { falcorCache } = useFalcor();

  const getAtt = React.useCallback((att, def = null) => {
    if (att === "route_sign") {
      const rs = get(falcorCache, ["tmc", tmc, "meta", year, att], 10);
      return get(routeSigningCodes, rs);
    }
    if (att === "route_qual") {
      const rq = get(falcorCache, ["tmc", tmc, "meta", year, att], 10);
      return get(routeQualifierCodes, rq);
    }
    if (att === "f_system") {
      const fs = get(falcorCache, ["tmc", tmc, "meta", year, att], 8);
      return `${ get(fSystemCodes, fs) } (${ fs })`;
    }
    if (att === "faciltype") {
      const ft = get(falcorCache, ["tmc", tmc, "meta", year, att], 8);
      return get(facilityTypeCodes, ft);
    }
    if (att === "aadt_pass") {
      const aadt = get(falcorCache, ["tmc", tmc, "meta", year, "aadt"], 0);
      const single = get(falcorCache, ["tmc", tmc, "meta", year, "aadt_singl"], 0);
      const combi = get(falcorCache, ["tmc", tmc, "meta", year, "aadt_combi"], 0);
      return aadt - (single + combi);
    }
    if (att === "nhs") {
      const nhs = get(falcorCache, ["tmc", tmc, "meta", year, att], 0);
      return get(nationalHighwaySystemCodes, nhs);
    }
    if (att === "strhnt_typ") {
      const st = get(falcorCache, ["tmc", tmc, "meta", year, att], 0);
      return get(strategicHighwayNetworkCodes, st);
    }
    return get(falcorCache, ["tmc", tmc, "meta", year, att], def);
  }, [falcorCache, tmc, year]);

  return (
    <div>
      <div className="font-bold text-2xl">
        TMC: { tmc }
      </div>

      <FlexRow className="font-bold text-2xl border-b-2 border-current">
        { getAtt("state_name") }
        { getAtt("roadname") }
        { getAtt("direction") }
        { !getAtt("altrtename") ? null :
          <div>({ getAtt("altrtename") })</div>
        }
      </FlexRow>

      <div className="grid grid-cols-2 mt-1">
        <AttDisplay title="Route Signing" value={ getAtt("route_sign") }/>
        <AttDisplay title="Route Qualifier" value={ getAtt("route_qual") }/>

        <div className="col-span-2 border-t-2 pb-1 mt-1"/>

        <AttDisplay title="State" value={ getAtt("state_name") }/>
        <AttDisplay title="County" value={ getAtt("county_name") }/>

        <AttDisplay title="MPO" value={ getAtt("mpo_name") }/>
        <AttDisplay title="Urban Area" value={ getAtt("ua_name") }/>

        <div className="col-span-2 border-t-2 pb-1 mt-1"/>

        <AttDisplay title="length" value={ `${ float2(getAtt("miles")) } miles` }/>
        <AttDisplay title="Avg. Speed Limit" value={ `${ decimal(getAtt("avg_speedlimit")) } MPH` }/>

        <div className="col-span-2 border-t-2 pb-1 mt-1"/>

        <AttDisplay title="AADT" value={ decimal(getAtt("aadt")) }/>
        <AttDisplay title="Passenger Vehicle AADT" value={ decimal(getAtt("aadt_pass")) }/>

        <AttDisplay title="Single-Unit Truck AADT" value={ decimal(getAtt("aadt_singl")) }/>
        <AttDisplay title="Combination Truck AADT" value={ decimal(getAtt("aadt_combi")) }/>

        <div className="col-span-2 border-t-2 pb-1 mt-1"/>

        <AttDisplay title="Functional Classification" value={ getAtt("f_system") }/>
        <AttDisplay title="Facility Type" value={ getAtt("faciltype") }/>
        <div />
        <AttDisplay title="Through Lanes" value={ getAtt("thrulanes") }/>

        <div className="col-span-2 border-t-2 pb-1 mt-1"/>

        <AttDisplay title="NHS Component Type" value={ getAtt("nhs") }/>
        <AttDisplay title="Percent of TMC on NHS" value={ `${ getAtt("nhs_pct", 0) }%` }/>

        <div className="col-span-2 border-t-2 pb-1 mt-1"/>

        <AttDisplay title="STRAHNET Component Type" value={ getAtt("strhnt_typ") }/>
        <AttDisplay title="Percent of TMC on STRAHNET" value={ `${ getAtt("strhnt_pct", 0) }%` }/>
      </div>

    </div>
  )
}

export default TmcInfo

const FlexRow = ({ className = "", children }) => {
  const Children = React.Children.toArray(children);
  return (
    <div className={ `flex ${ className }` }>
      { Children[0] }
      { Children.slice(1).map((child, i) => (
          <div key={ i } className="ml-1">
            { child }
          </div>
        ))
      }
    </div>
  )
}
const AttDisplay = ({ title, value }) => {
  return (
    <FlexRow>
      <div className="font-bold">{ title }:</div><div>{ value }</div>
    </FlexRow>
  )
}
