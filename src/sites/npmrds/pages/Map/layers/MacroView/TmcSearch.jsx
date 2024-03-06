import React from "react"

import get from "lodash/get"

import { TypeAhead, MultiLevelSelect } from "~/sites/npmrds/components"

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
              layer.getNetwork(layer.filters),
            ]
      );
      return a;
    }, []);
  }, [layer, n, year, geoids]);

  const [tmcs, setTmcs] = React.useState([]);

  React.useEffect(() => {
    falcor.get(...getRequests());
  }, [falcor, getRequests]);

  React.useEffect(() => {
    const tmcSet = getRequests().reduce((a, c) => {
      get(falcorCache, [...c, "value"], [])
        .forEach(tmc => a.add(tmc));
      return a;
    }, new Set());
    setTmcs([...tmcSet]);
  }, [falcorCache, getRequests]);

  const [tmc, setTmc] = React.useState("");

  React.useEffect(() => {
    if (!tmc) return;
    falcor.get(["tmc", tmc, "meta", year, "bounding_box"]);
  }, [falcor, tmc, year]);

  React.useEffect(() => {
    if (!tmc) return;
    const bbox = get(falcorCache, ["tmc", tmc, "meta", year, "bounding_box", "value"], []);
    if (bbox.length) {
      layer.mapboxMap.fitBounds(bbox);
    }
  }, [falcorCache, layer, tmc, year]);

  return (
    <div>
      <MultiLevelSelect
        onChange={ setTmc }
        value={ tmc }
        options={ tmcs }
        maxOptions={ 8 }
        searchable/>
    </div>
  )
}

export default TmcSearch
