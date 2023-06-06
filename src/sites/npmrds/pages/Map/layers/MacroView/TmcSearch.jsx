import React from "react"

import get from "lodash.get"

import {
  useFalcor
} from "~/modules/avl-components/src"

const TmcSearch = ({ layer }) => {

  const { falcor, falcorCache } = useFalcor();

  const n = layer.filters.network.value,
    year = +layer.filters.year.value,
    geoids = layer.filters.geography.value;

  const getRequests = React.useCallback(() => {
    const filtered = layer.filters.geography.domain.filter(({ value }) =>
      geoids.includes(value)
    );
    return filtered.reduce((a, c) => {
      a.push(
        n === "tmc"
          ? [
              "tmc",
              "identification",
              "type",
              c.geolevel,
              "geoid",
              c.value,
              "year",
              year,
            ]
          : [
              "conflation",
              c.geolevel.toLowerCase(),
              c.value,
              year,
              this.getNetwork(this.filters),
            ]
      );
      return a;
    }, []);
  }, [layer, n, year, geoids]);

  React.useEffect(() => {
    falcor.get(...getRequests());
  }, [falcor, getRequests]);

  React.useEffect(() => {
    const tmcSet = getRequests().reduce((a, c) => {
      get(falcorCache, [...c, "value"], [])
        .forEach(tmc => a.add(tmc));
      return a;
    }, new Set());

    const tmcs = [...tmcSet];

console.log("TMCs:", tmcs)

  }, [falcorCache, getRequests]);

  const [tmc, setTmc] = React.useState("");
  const doSearch = React.useCallback(e => {
    setTmc(e.target.value);
  }, []);

  return (
    <div>
      <input type="text" className="w-full px-2 py-1"
        onChange={ doSearch }
        value={ tmc }/>
    </div>
  )
}

export default TmcSearch
