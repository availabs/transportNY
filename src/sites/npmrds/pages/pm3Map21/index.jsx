import React from "react"

import get from "lodash/get"
import { groups as d3groups } from "d3-array"

import {
  useFalcor,
  Select,
  ScalableLoading
} from "~/modules/avl-components/src"

import {
  capitalize,
  MultiLevelSelect
} from "~/sites/npmrds/components"

import PM3Viewer from "./components/PM3Viewer"

const InitialState = {
  geoid: "STATE|36",
  geolevels: [],
  loading: 0,
  versions: [],
  year: null
}
const Reducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "update-state":
      return {
        ...state,
        ...payload
      }
    case "loading":
      return {
        ...state,
        loading: state.loading + payload.loading
      }
    default:
      return state;
  }
}
const LoadState = initial => {
  let geoid = initial.geoid;
  if (window.localStorage) {
    const id = window.localStorage.getItem("pm3-geoid");
    if (id) {
      geoid = id;
    }
  }
  return {
    ...initial,
    geoid
  }
}

const GeoLevelNames = {
  "STATE": "State",
  "COUNTY": "Counties",
  "MPO": "MPOs",
  "REGION": "Regions",
  "UA": "Urban Areas"
}

const getGeoName = (geolevel, geoid, geoname) => {
  if (["MPO", "UA"].includes(geolevel)) {
    return geoname;
  }
  return `${ geoname === "ny" ? "NY" : geoname } ${ capitalize(geolevel) }`
}

const PM3 = () => {
  const { falcor, falcorCache } = useFalcor();

  const [state, dispatch] = React.useReducer(Reducer, InitialState, LoadState);

  const loadingStart = React.useCallback(() => {
    dispatch({
      type: "loading",
      loading: 1
    })
  }, []);
  const loadingEnd = React.useCallback(() => {
    dispatch({
      type: "loading",
      loading: -1
    })
  }, []);

  const setGeoid = React.useCallback(v => {
    if (window.localStorage) {
      window.localStorage.setItem("pm3-geoid", v);
    }
    dispatch({
      type: "update-state",
      geoid: v
    })
  }, []);

  React.useEffect(() => {
    loadingStart();
    const path = ["pm3", "versionedCalculations", "geoLevelVersionsMetadata"];
    falcor.get(path, ["geo", 36, "geoLevels"])
      .then(res => {
        console.log('resp', res)
        const geoLevels = get(res, ["json", "geo", 36, "geoLevels"], []);
        const groups = d3groups(geoLevels, d => d.geolevel);
        const geolevels = groups.map(([geolevel, geos]) => {
          if (geolevel === "STATE") {
            return {
              name: "NY State",
              geoid: "STATE|36"
            }
          }
          return {
            name: GeoLevelNames[geolevel],
            children: geos.map(({ geolevel, geoid, geoname }) => ({
              name: getGeoName(geolevel, geoid, geoname),
              geoid: `${ geolevel }|${ geoid }`,
              sort: ["MPO", "COUNTY", "UA"].includes(geolevel) ? geoname : +geoid
            }))
            .sort((a, b) => {
              if (["MPO", "COUNTY", "UA"].includes(geolevel)) {
                return a.sort.localeCompare(b.sort);
              }
              return a.sort - b.sort;
            })
          }
        });
        const metadata = get(res, ["json", ...path], {});
        const versionsByYear = Object.keys(metadata)
          .reduce((acc, version) => {
            const { year, is_authoritative } = metadata[version];
            if (year && is_authoritative) {
              acc.push({ year, version });
            }
            return acc;
          }, []);
        if (versionsByYear.length) {
          dispatch({
            type: "update-state",
            versions: versionsByYear,
            year: versionsByYear[versionsByYear.length - 1].year,
            geolevels
          })
        }
      }).then(() => loadingEnd());
  }, [falcor, loadingStart, loadingEnd]);

  React.useEffect(() => {
    if (!state.versions.length) return;
    loadingStart();
    falcor.get(
      ["geoAttributes", state.geoid, state.versions.map(v => v.year)],
      ["pm3",
        "versionedCalculations",
        "version",
        state.versions.map(v => v.version),
        "geolevel",
        state.geoid
      ]
    ).then(() => loadingEnd());
  }, [falcor, state.versions, state.geoid, loadingStart, loadingEnd]);

  return (
    <div className="px-4 py-4 mx-10 grid grid-cols-1 gap-4">

      { !state.loading ? null :
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ScalableLoading />
        </div>
      }
      <div className="font-bold text-4xl">
        MAP-21 PM3 Measures
      </div>
      <div className="grid grid-cols-3">
        <MultiLevelSelect options={ state.geolevels }
          removable={ false }
          value={ state.geoid }
          onChange={ setGeoid }
          displayAccessor={ v => v.name }
          valueAccessor={ v => v.geoid }/>
      </div>
      <div>
        <PM3Viewer { ...state }/>
      </div>
    </div>
  )
}


const config = {
  icon: 'fa fa-chart-bar',
  path: '/map21',
  exact: true,
  mainNav: true,
  menuSettings: {
    display: 'none',
    image: 'none',
    scheme: 'color-scheme-dark',
    position: 'menu-position-side',
    layout: 'menu-layout-mini',
    style: 'color-style-default'
  },
  name: 'PM3',
  auth: true,
  component: PM3
}

export default config;
