import React from "react";
import get from "lodash/get";

import { getColorRange, Legend, rgb2rgba } from "../../utils";
import { Select, useFalcor } from "~/modules/avl-components/src";
import mapboxgl from "mapbox-gl";
import * as d3scale from "d3-scale";
import len from "@turf/length";
import flatten from "lodash/flatten";

import { ckmeans } from "simple-statistics";

// import { RISSources, RISLayers } from 'pages/map/map-styles/ris'
import {
  ConflationSources,
  ConflationLayers,
  //ConflationLayerCase
} from "../../map-styles/conflation";

import { NpmrdsSources, NpmrdsLayers } from "../../map-styles/npmrds";

import {
  TrafficSignalsSources,
  TrafficSignalsLayers,
} from "../../map-styles/traffic_signals";

import {
  filters,
  updateSubMeasures,
  getMeasure,
  getMeasureName,
  updateLegend,
  getNetwork,
  setActiveLayer,
} from "./filters";

// import MeasureInfoBox from "./MeasureInfoBox";
import DataDownloader from "./DataDownload";
// import MeasureVisBox from "./MeasureVisBox";
// import BottlenecksBox from "./BottlenecksBox";
import InfoBoxController from "./InfoBoxController";
import HoverComp from "./HoverComp";
import { LayerContainer } from "~/modules/avl-map/src";
import TmcSearch from "./TmcSearch"

/* ---- To Do -----

   ---------------- */

class MacroLayer extends LayerContainer {
  name = "Macro View";
  setActive = true;
  sources = [
    ...ConflationSources,
    ...NpmrdsSources,
    ...TrafficSignalsSources,
    { id: "geo-boundaries-source",
      source: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      },
    },
    { id: "incidents-source",
      source: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      },
    },
    { id: "bottlenecks-source",
      source: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      },
    }
  ];
  layers = [
    // ...ConflationLayerCase,
    ...TrafficSignalsLayers,
    ...ConflationLayers,
    ...NpmrdsLayers,
    { id: "geo-boundaries",
      type: "line",
      source: "geo-boundaries-source",
      paint: {
        "line-color": "#fff",
      },
    },
    { id: "geo-incidents",
      type: "circle",
      source: "incidents-source",
      paint: {
        "circle-radius": {
         stops: [[8, 1], [16, 8]]
        },
        'circle-opacity': [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.4,
          1
        ],
        "circle-color": ["string", ["get", "color"], "white"],
      },
    },
    { id: "geo-bottlenecks",
      type: "circle",
      source: "bottlenecks-source",
  		paint: {
  			"circle-radius": ["number", ["get", "radius"]],
  			"circle-opacity": 0.8,
  			"circle-color": ["string", ["get", "color"]],
  		}
    },
    { id: "geo-bottlenecks-hover",
      type: "circle",
      source: "bottlenecks-source",
      filter: ["in", "tmc", "none"],
      paint: {
        "circle-radius": ["number", ["get", "radius"]],
        "circle-opacity": 0,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff"
      }
    }
  ];

  state = {
    activeStation: null,
    zoom: 6.6,
    progress: 0,
    qaLevel: 0.3,
    allMeasures: [],
    risAttributes: [],
    tmcAttributes: [],
    currentData: [],
    activeLayers: [],
    infoBoxes: ["Measure Definition"],
  };

  infoBoxes = [
    { Component: TmcSearch,
      Header: "TMC Search"
    },
    { Component: ({ layer }) => <InfoBoxController layer={layer} />,
      show: true,
      width: 420,
    },
    { Component: ({ layer }) => (
        <DataDownloader
          layer={layer}
          network={layer.filters.network.value}
          allMeasures={layer.state.allMeasures}
          measures={layer.filters.measure.domain}
          measure={layer.getMeasure(layer.filters)}
          risAttributes={layer.state.risAttributes}
          tmcAttributes={layer.state.tmcAttributes}
          year={layer.filters.year.value}
          compareYear={layer.filters.compareYear.value}
          loading={layer.loading}
          geoids={layer.filters.geography.value}
          customTheme={layer.customTheme}
        />
      ),
      show: true,
    },
  ];
  toolbar = [];
  filters = filters;
  legend = {
    type: "quantile",
    domain: [0, 150],
    range: getColorRange(9, "RdYlBu").reverse(),
    format: ",.1f",
    show: true,
    Title: ({ layer }) => {
      if (!layer) return "Title test";
      return (
        <React.Fragment>
          {layer.getMeasureName(layer.falcor, layer.getMeasure(layer.filters))}
        </React.Fragment>
      );
    },
  };
  onHover = {
    layers: [
      ...ConflationLayers.map((d) => d.id),
      ...NpmrdsLayers.map((d) => d.id),
      "geo-bottlenecks",
      "geo-incidents",
    ],
    filterFunc: function(layer, features, point, latlng) {
      const key = this.getNetwork(this.filters),
        value = get(features, [0, "properties", key], "none"),
        dir = get(features, [0, "properties", "dir"], "none");
      return ["in", key, value]; //["all", ["in", key, value], ["in", "dir", dir]];
    },
    callback: (layerId, features, lngLat) => {
      let feature = features[0];
      let dataPath = [
        "conflation",
        this.getNetwork(this.filters),
        feature.properties[this.getNetwork(this.filters)],
        "data",
        this.filters.year.value,
      ];
      /*
        'TMC_aadt',
        'TMC_miles',
        'RIS_aadt_current_yr_est',
        'RIS_section_length'
      */
      const key = this.getNetwork(this.filters),
        value = get(features, [0, "properties", key], "none"),
        dir = get(features, [0, "properties", "dir"], "none");
      let getFeat = ["major", "local"].map((l) =>
        this.mapboxMap.querySourceFeatures(ConflationSources[0].id, {
          sourceLayer: l,
          filter: ["all", ["in", key, value], ["in", "dir", dir]],
        })
      );
      //let featLen = flatten(getFeat).reduce((out,curr) => out+len(curr.geometry,  {units: 'miles'}),0).toFixed(2)

      let v = get(this.falcor.getCache(), dataPath, {});

      //console.log('hover', v)
      let data = [
        ...Object.keys(feature.properties).map((k) => [
          k,
          feature.properties[k],
        ]),
        ...Object.keys(v)
          .filter((k) => typeof v[k] !== "object")
          .map((k) => [k, v[k]]),
      ];
      data.push(["hoverlayer", layerId]);
      //data.push([this.getMeasure(this.filters), v])

      return data;
    },
    HoverComp,
  };
  onClick = {
    layers: [...ConflationLayers.map((d) => d.id)],
    callback: (features, lngLat) => {
      let feature = features[0];
      console.log("click", feature, features);
    },
  };

  updateSubMeasures = updateSubMeasures;
  getMeasure = getMeasure;
  getMeasureName = getMeasureName;
  updateLegend = updateLegend;
  getNetwork = getNetwork;
  setActiveLayer = setActiveLayer;
  qaFilter = (d) =>
    Math.max(
      d.pct_bins_reporting_am,
      d.pct_bins_reporting_pm,
      d.pct_bins_reporting_off
    ) > this.state.qaLevel;

  onFilterChange(filterName, newValue, prevValue) {
    switch (filterName) {
      case "network":
        this.filters.conflation.active = newValue === "con";
        break;
      case "geography":
        this.zoomToGeography(newValue);
        this.saveToLocalStorage();
        break;
      case "measure":
        this.updateSubMeasures(
          this.filters.measure.value,
          this.filters,
          this.falcor
        );
        this.updateLegend(this.filters, this.legend);
        break;
      default:
        console.log("no case for filter", filterName);
        break;
    }
  }

  loadFromLocalStorage() {
    return window.localStorage
      ? JSON.parse(
          window.localStorage.getItem("macro-view-geographies") || "[]"
        )
      : [];
  }

  saveToLocalStorage(geographies = this.filters.geography.value) {
    if (window.localStorage) {
      if (geographies.length) {
        window.localStorage.setItem(
          "macro-view-geographies",
          JSON.stringify(geographies)
        );
      } else {
        window.localStorage.removeItem("macro-view-geographies");
      }
    }
  }

  zoomToGeography(geographies = this.filters.geography.value) {
    if (!this.mapboxMap) return;

    const bounds = this.getBounds(geographies);

    if (bounds.isEmpty()) return;

    const options = {
      padding: {
        top: 25,
        right: 200,
        bottom: 25,
        left: 200,
      },
      bearing: 0,
      pitch: 0,
      duration: 2000,
    };

    options.offset = [
      (options.padding.left - options.padding.right) * 0.5,
      (options.padding.top - options.padding.bottom) * 0.5,
    ];

    const tr = this.mapboxMap.transform,
      nw = tr.project(bounds.getNorthWest()),
      se = tr.project(bounds.getSouthEast()),
      size = se.sub(nw);

    const scaleX =
        (tr.width - (options.padding.left + options.padding.right)) / size.x,
      scaleY =
        (tr.height - (options.padding.top + options.padding.bottom)) / size.y;

    options.center = tr.unproject(nw.add(se).div(2));
    options.zoom = Math.min(
      tr.scaleZoom(tr.scale * Math.min(scaleX, scaleY)),
      tr.maxZoom
    );

    this.mapboxMap.easeTo(options);
  }

  getBounds(geographies = this.filters.geography.value) {
    return this.filters.geography.domain
      .filter((d) => geographies.includes(d.value))
      .reduce((a, c) => a.extend(c.bounds), new mapboxgl.LngLatBounds());
  }

  setActiveStation = () => {};

  init(map, falcor) {
    this.updateSubMeasures(this.filters.measure.value, this.filters, falcor);
    // console.log('----init----')
    // map.on('zoomend', () => {
    //  this.updateState({zoom: map.getZoom()})
    // })

    return falcor
      .get(["pm3", "measureIds"])
      .then((res) => {
        const mIds = get(res, ["json", "pm3", "measureIds"], []);

        return falcor
          .get(
            ["geo", "36", "geoLevels"],
            [
              "pm3",
              "measureInfo",
              mIds,
              ["fullname", "definition", "equation", "source"],
            ]
          )
          .then((res) => {
// console.log("RES:", res)
            const mInfo = get(res, ["json", "pm3", "measureInfo"], {});
            // console.log('measureInfo', res)
            this.filters.measure.domain = mIds
              .filter(
                (m) => !m.includes("_") || ["pct_bins_reporting"].includes(m)
              )
              .map((id) => ({
                name: get(mInfo, [id, "fullname"], id),
                value: id,
              }))
              .sort((a, b) => a.name - b.name);

            //console.log('measures', this.filters.measure.domain)

            this.filters.measure.domain.push(
              { name: "Percentile Speed", value: "speed" },
              { name: "Transit AADT", value: "OSM_transit_aadt" },
              { name: "RIS Attributes", value: "RIS" },
              { name: "TMC Attributes", value: "TMC" }
            );
            let risAttributes = mIds
              .filter((m) => /^RIS_/.test(m))
              .map((id) => ({
                name: get(mInfo, [id, "fullname"], id),
                value: id.replace("RIS_", ""),
              }));
            let tmcAttributes = mIds
              .filter((m) => /^TMC_/.test(m))
              .map((id) => ({
                name: get(mInfo, [id, "fullname"], id),
                value: id.replace("TMC_", ""),
              }));


            this.updateState({
              allMeasures: [...mIds],
              risAttributes,
              tmcAttributes,
            });

            //console.log('allMeasures', this.state.allMeasures, [...mIds])
            this.filters.geography.domain = get(
              res,
              ["json", "geo", "36", "geoLevels"],
              []
            ).map((geo) => ({
              name: `${
                geo.geolevel === "STATE"
                  ? geo.geoname.toUpperCase()
                  : geo.geoname
              } ${
                geo.geolevel === "COUNTY"
                  ? "County"
                  : geo.geolevel === "STATE"
                  ? "State"
                  : geo.geolevel
              }`,
              geolevel: geo.geolevel,
              value: geo.geoid,
              bounds: geo.bounding_box,
            }));
            //console.log(this.filters.geography)
          });
      })
      .then(() => {
        this.filters.geography.value = this.loadFromLocalStorage();

        const {
          geoid,
          year,
          measure
        } = get(this, ["props", "params"], {});

        if (geoid) {
          this.filters.geography.value = [geoid];
          this.filters.year.value = +year;
          this.filters.measure.value = measure;
        }
        this.zoomToGeography();

      });
  }

  getColorScale(domain) {
    if (this.legend.range.length > domain.length) {
      this.legend.domain = [];
      return false;
    }
    this.legend.domain = ckmeans(domain, this.legend.range.length).map((d) =>
      Math.min(...d)
    );
    this.updateLegend(this.filters, this.legend);
    return d3scale
      .scaleLinear()
      .domain(this.legend.domain)
      .range(this.legend.range);
  }

  fetchRequestsForGeography() {
    const n = this.filters.network.value,
      year = +this.filters.year.value,
      geoids = this.filters.geography.value,
      filtered = this.filters.geography.domain.filter(({ value }) =>
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
      a.push(["geo", c.geolevel.toLowerCase(), c.value, "geometry"]);
      return a;
    }, []);
  }

  getSelectionForGeography() {
    const n = this.filters.network.value,
      year = +this.filters.year.value,
      geoids = this.filters.geography.value,
      filtered = this.filters.geography.domain.filter(({ value }) =>
        geoids.includes(value)
      ),
      falcorCache = this.falcor.getCache();

      console.log('getSelectionForGeography', n, year,geoids,filtered, falcorCache)

    return [
      ...filtered.reduce((a, c) => {
        get(
          falcorCache,
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
                "value",
              ]
            : [
                "conflation",
                c.geolevel.toLowerCase(),
                c.value,
                year,
                this.getNetwork(this.filters),
                "value",
              ],
          []
        ).forEach((d) => a.add(d));
        return a;
      }, new Set()),
    ];
  }

  getGeomRequest(selection) {
    switch (this.getNetwork(this.filters)) {
      case "ris":
        return ["ris", selection, "meta", this.filters.year.value, "geom"];
      case "tmc":
        return [
          "tmc",
          selection,
          "year",
          this.filters.year.value,
          "geometries",
        ];
    }
    return [];
  }

  getMeasures() {
    // ---------------------------
    // get current measure
    // and measures needed for display and calculation
    // ---------------------------
    const meta = {
      tmc: [
        "TMC_tmc",
        "TMC_aadt",
        "TMC_miles",
        "RIS_aadt_current_yr_est",
        "TMC_frc",
        "TMC_f_system",
        "pct_bins_reporting_am",
        "pct_bins_reporting_off",
        "pct_bins_reporting_pm"
      ],
      ris: [
        "TMC_tmc",
        "RIS_aadt_current_yr_est",
        "RIS_section_length",
        "TMC_f_system",
        "pct_bins_reporting_am",
        "pct_bins_reporting_off",
        "pct_bins_reporting_pm"
      ],
      osm: [
        "TMC_tmc",
        "RIS_aadt_current_yr_est",
        "TMC_f_system",
        "TMC_miles",
        "pct_bins_reporting_am",
        "pct_bins_reporting_off",
        "pct_bins_reporting_pm"
      ],
    };

    return [
      this.getMeasure(this.filters), // current measure
      ...meta[this.getNetwork(this.filters)], // meta by network
      // this.filters.network.value === "con" ? "CON_miles" : null,
    ].filter((d) => d);
  }

  getGeographies() {
    // -----
    // get selected geographies as array of goetype|geoid
    // ex [COUNTY|36001, REGION|6]
    // -----
    const geoids = this.filters.geography.value;
    return this.filters.geography.domain
      .filter(({ value }) => geoids.includes(value))
      .map((g) => `${g.geolevel}|${g.value}`);
  }

  fetchData(falcor) {
// console.log("FETCHING DATA");
    let request = [
      [
        "conflation",
        "byGeo",
        this.getGeographies(),
        [this.filters.year.value, this.filters.compareYear.value].filter(
          (y) => y !== "none"
        ),
        this.getNetwork(this.filters),
        this.getMeasures().join("|"),
      ],
    ];
// console.log("REQUEST:", request)
    this.getGeographies().forEach((geo) => {
      let g = geo.split("|");
      request.push(["geo", g[0].toLowerCase(), g[1], "geometry"]);
    });
    // console.log("fetchData request", request);

    return falcor.get(...request).then((d) => {
      this.processData();
    });
  }

  processData() {
    const falcorCache = this.falcor.getCache();
    // console.log("processData falcorCache", falcorCache);

    const { year, compareYear } = this.filters;
    const n = this.getNetwork(this.filters);
    const y = year.value;
    const cy = compareYear.value;
    const m = this.getMeasure(this.filters);
    const toNaN = (v) => (v === null ? NaN : +v);

    const currentYearData = this.getGeographies().reduce((out, geo) => {
      let gdata = get(
        falcorCache,
        [
          "conflation",
          "byGeo",
          geo,
          y,
          n,
          this.getMeasures().join("|"),
          "value",
        ],
        {}
      );
      return { ...out, ...gdata };
    }, {});

    const compareYearData = this.getGeographies().reduce((out, geo) => {
      let gdata = get(
        falcorCache,
        [
          "conflation",
          "byGeo",
          geo,
          cy,
          n,
          this.getMeasures().join("|"),
          "value",
        ],
        {}
      );
      return { ...out, ...gdata };
    }, {});

    const getValue = (id) => {
      const v = toNaN(get(currentYearData, [id, m], null));
      if (cy === "none") {
        return v;
      }
      const c = toNaN(get(compareYearData, [id, m], null));
      return (v - c) / c;
    };

    let data = Object.keys(currentYearData).reduce((a, c) => {
      const v = getValue(c);
      if (!isNaN(v)) {
        let meta = get(currentYearData, [c], {});
        //console.log(meta)
        a.push({
          id: c,
          value: v,
          ...meta,
        });
      }
      return a;
    }, []);

    this.updateState({ currentData: data });
  }

  onAdd() {
  }

  render(map) {
    const data = this.state.currentData;
    const falcorCache = this.falcor.getCache();
    const n = this.getNetwork(this.filters);

// console.log("RENDERING", this.state, falcorCache, n)

    const domain = data /*.filter((d) => this.qaFilter(d))*/
      .map((d) => d.value);

    const scale = this.getColorScale(domain.sort((a, b) => a - b));
    const colors = data.reduce((a, c) => {
      a[c.id] = this.qaFilter(c)
        ? scale(c.value)
        : rgb2rgba(scale(c.value), 0.5);
      return a;
    }, {});
    // console.log("colors", colors);

    const geoids = this.filters.geography.value,
      filtered = this.filters.geography.domain.filter(({ value }) =>
        geoids.includes(value)
      );

    const collection = {
      type: "FeatureCollection",
      features: filtered
        .map((f) => ({
          type: "Feature",
          properties: { geoid: f.value },
          geometry: get(
            falcorCache,
            ["geo", f.geolevel.toLowerCase(), f.value, "geometry", "value"],
            null
          ),
        }))
        .filter((f) => Boolean(f.geometry)),
    };
    map.getSource("geo-boundaries-source").setData(collection);

    let activeLayers = this.setActiveLayer(
      this.layers,
      this.filters,
      this.mapboxMap
    );

// console.log("activeLayers", activeLayers)

    activeLayers.forEach((l) => {
      //console.log('set paint', l, colors)
      map.setPaintProperty(l, "line-color", [
        "case",
        ["has", ["to-string", ["get", n]], ["literal", colors]],
        ["get", ["to-string", ["get", n]], ["literal", colors]],
        "hsla(185, 0%, 27%,0.8)",
      ]);
    });
  }
}

export const MacroLayerFactory = (options = {}) => new MacroLayer(options);
