import React from "react"

import mapboxgl from "mapbox-gl"

import get from "lodash.get"
import { scaleLinear } from "d3-scale"
import { select as d3select } from "d3-selection"

import { LayerContainer } from "modules/avl-map/src"

import {
  ConflationSources,
  ConflationLayers,
  YEARS, VERSION
} from "./ConflationStyles"

import InfoBox from "./RouteCreationInfoBox"
// import WayCache from "./WayCache"

const ConflationLayerIds = ConflationLayers.map(l => l.id);

const COLORS = ["#1a9641", "#ffffbf", "#d7191c"];

const GEO_LEVEL_ORDER = {
  COUNTY: 0,
  MPO: 1,
  REGION: 2,
  UA: 3
}

class RouteCreationLayer extends LayerContainer {
  name = "Route Creation";

  state = {
    markers: [],
    ways: [],
    tmcs: [],
    creationMode: "markers"
  }

  onClick = {
    callback: function (layer, features, lngLat) {
      const { creationMode: mode } = this.state;
      if ((mode === "markers") && (layer === "mapboxMap")) {
        this.addMarker(lngLat);
      }
      else if ((mode === "tmc-clicks") && ConflationLayerIds.includes(layer)) {
        console.log("CLICKED:", layer, features)
        const tmcs = features.reduce((a, c) => {
          const tmc = get(c, ["properties", "tmc"], null);
          if (tmc && !a.includes(tmc)) {
            a.push(tmc);
          }
          return a;
        }, []);
        this.toggleTmcs(tmcs);
      }
    },
    layers: ["mapboxMap", ...ConflationLayerIds]
  }

  infoBoxes = [
    { Header: "Route Creation",
      Component: InfoBox
    }
  ]

  filters = {
    geography: {
      name: "Geography",
      type: "select",
      multi: true,
      domain: [],
      value: [],
      accessor: g => g.name,
      valueAccessor: g => g.value,
      searchable: true
    },
    year: {
      name: "Year",
      type: "single",
      domain: YEARS,
      value: YEARS[0]
    }
  }

  sources = [
    ...ConflationSources
  ]
  layers = [
    ...ConflationLayers
  ]

  onHover = {
    layers: [...ConflationLayerIds],
    property: "tmc"
  }

  init(mapboxMap, falcor) {
    return falcor.get(['geo', '36', 'geoLevels'])
      .then(res => {
        const cache = falcor.getCache();
        const geos = get(cache, ["geo", "36", "geoLevels", "value"], []);

        this.filters.geography.domain = geos
          .filter(g => g.geolevel !== "STATE")
          .sort((a, b) => {
            if (a.geolevel === b.geolevel) {
              if (a.geolevel === "REGION") {
                return +a.geoid - +b.geoid;
              }
              return a.geoname.localeCompare(b.geoname);
            }
            return GEO_LEVEL_ORDER[a.geolevel] - GEO_LEVEL_ORDER[b.geolevel];
          })
          .map(g => {
            return {
              value: `${ g.geolevel.toLowerCase() }|${ g.geoid }`,
              name: g.geolevel === "COUNTY" ? `${ g.geoname } County` : g.geoname
            }
          });

        this.filters.geography.value = this.loadFromLocalStorage();
      })
  }

  onAdd(mapboxMap, falcor) {
    this.state.markers.forEach(m => m.addTo(mapboxMap));

    this.layers.forEach(({ id }) => {
      mapboxMap.setLayoutProperty(id, "visibility", "none");
      mapboxMap.setFilter(id, ["in", ["get", "id"], "none"])
    });

    const { routeId } = this.props;

    if (routeId) {

      return falcor.get([
        "routes2", "id", routeId,
        ["id", "name", "description", "folder",
          "points", "tmc_array"]
      ]).then(res => {
        const {
          points = [],
          tmc_array = []
        } = get(res, ["json", "routes2", "id", routeId], {});
        if (points.length) {
          const num = Math.max(points.length - 1, 1);
          const scale = scaleLinear().domain([0, num * 0.5, num]).range(COLORS);
          const markers = points.map((p, i) => {
            return new mapboxgl.Marker({ draggable: true, color: scale(i) })
              .setLngLat(p)
              .on("dragend", () => {
                this.getWays()
                  .then(res => this.updateState(res));
              })
              .addTo(mapboxMap);
          })
          this.updateState({ tmcs: [], markers, creationMode: "markers" });
        }
        else if (tmc_array.length) {
          this.updateState({ tmcs: tmc_array, creationMode: "tmc-clicks" });
        }
      });
    }

    return Promise.resolve();
  }

  onRemove(mapboxMap) {
    this.state.markers.forEach(m => m.remove());
  }

  fetchData(falcor) {
    const year = this.getYear();

    const requests = [];

    this.filters.geography.value.forEach(geo => {
      const [geolevel, geoid] = geo.split("|");
      requests.push([
        "conflation", geolevel, geoid, year, "tmc"
      ])
    })

    return Promise.resolve()
      .then(() => falcor.get(...requests))
      .then(() => this.getWays())
      .then(({ tmcs }) => {
        if (tmcs.length) {
          this.updateState({ tmcs });
        }
      });
  }

  addMarker(lngLat) {
    if (this.state.creationMode !== "markers") return;

    const num = Math.max(this.state.markers.length, 1);
    const scale = scaleLinear().domain([0, num * 0.5, num]).range(COLORS);

    const markers = this.state.markers.map((m, i) => {
      m.remove();
      return new mapboxgl.Marker({ draggable: true, color: scale(i) })
        .setLngLat(m.getLngLat())
        .on("dragend", () => {
          this.getWays()
            .then(res => this.updateState(res));
        })
        .addTo(this.mapboxMap);
    })

    markers.push(
      new mapboxgl.Marker({ draggable: true, color: scale(markers.length) })
        .setLngLat(lngLat)
        .on("dragend", () => {
          this.getWays()
            .then(res => this.updateState(res));
        })
        .addTo(this.mapboxMap)
    )

    this.getWays(markers)
      .then(res => this.updateState({ markers, ...res }));
  }

  removeLast() {
    if (this.state.creationMode === "markers") {
      this.removeLastMarker();
    }
    else {
      this.removeLastTmc();
    }
  }
  removeLastMarker() {
    if (this.state.creationMode !== "markers") return;

    const num = Math.max(this.state.markers.length - 2, 1);
    const scale = scaleLinear().domain([0, num * 0.5, num]).range(COLORS);

    this.state.markers.forEach(m => m.remove());

    const markers = this.state.markers
      .slice(0, -1)
      .map((m, i) => {
        return new mapboxgl.Marker({ draggable: true, color: scale(i) })
          .setLngLat(m.getLngLat())
          .on("dragend", () => {
            this.getWays()
              .then(res => this.updateState(res));
          })
          .addTo(this.mapboxMap);
      });

    this.getWays(markers)
      .then(res => this.updateState({ markers, ...res }));
  }
  removeLastTmc() {
    if (this.state.creationMode !== "tmc-clicks") return;

    this.updateState({ tmcs: this.state.tmcs.slice(0, -1) });
  }

  clearAll() {
    if (this.state.creationMode === "markers") {
      this.clearAllMarkers();
    }
    else {
      this.clearAllTmcs();
    }
  }
  clearAllMarkers() {
    this.state.markers.forEach(m => m.remove());
    this.updateState({ markers: [], ways: [], tmcs: [] });
  }
  clearAllTmcs() {
    this.updateState({ tmcs: [] });
  }

  toggleTmcs(tmcs) {
    const TMCs = tmcs.reduce((a, c) => {
      if (a.includes(c)) {
        return a.filter(tmc => tmc !== c);
      }
      a.push(c);
      return a;
    }, [...this.state.tmcs]);

    this.updateState({ tmcs: TMCs });
  }

  getYear() {
    return get(this, ["filters", "year", "value"], YEARS[0]);
  }

  getWays(markers = this.state.markers) {

    if (markers.length < 2) {
      return Promise.resolve({ tmcs: [], ways: [] });
    }
    const year = this.getYear();

    const locations = markers.map(m => {
      const p = m.getLngLat();
      return {
        lon: p.lng,
        lat: p.lat
      }
    });

    const request = [JSON.stringify(locations), year].join("|");

    return this.falcor.get(["routes2", "get", "route", request])
      .then(res => {
        const tmcs = get(res, ["json", "routes2", "get", "route", request], [])
        return { tmcs, ways: [] };
      })
  }

  toggleVisibility(mapboxMap) {
    super.toggleVisibility(mapboxMap);

    if (this.isVisible) {
      this.state.markers.forEach(m => m.addTo(mapboxMap));
    }
    else {
      this.state.markers.forEach(m => m.remove());
    }
  }

  onFilterChange(filterName, newValue, prevValue) {
    if ((filterName === "geography") && window.localStorage) {
      const value = JSON.stringify(newValue);
      window.localStorage.setItem("route-creation-geo", value);
    }
  }
  loadFromLocalStorage() {
    if (window.localStorage) {
      const value = window.localStorage.getItem("route-creation-geo");
      if (value) {
        return JSON.parse(value);
      }
    }
    return [];
  }

  getTmcsForGeos() {
    const cache = this.falcor.getCache();
    const geos = this.filters.geography.value;
    const year = this.getYear();

    return geos.reduce((a, c) => {
      const [geolevel, geoid] = c.split("|");
      const tmcs = get(cache, ["conflation", geolevel, geoid, year, "tmc", "value"], []);
      a.push(...tmcs);
      return a;
    }, [])
  }

  render(mapboxMap) {
    const ways = get(this, ["state", "ways"], []);
    const tmcs = get(this, ["state", "tmcs"], []);
    const geoTmcs = this.getTmcsForGeos();

    const year = this.getYear();

    this.layers.forEach(({ id, filter }) => {
      const visibility = id.includes(year) ? "visible" : "none";
      mapboxMap.setLayoutProperty(id, "visibility", visibility);

      if (visibility === "visible") {
        mapboxMap.setFilter(id, [
          "all",
          filter,
          ["any",
            ["in", ["get", "id"], ["literal", ways]],
            ["in", ["get", "tmc"], ["literal", tmcs]],
            ["in", ["get", "tmc"], ["literal", geoTmcs]]
          ]
        ])
        const LineColor = [
          "case",
          ["all",
            ["boolean", ["feature-state", "hover"], false],
            ["in", ["get", "tmc"], ["literal", this.state.tmcs]]
          ],
          "#990099",
          ["boolean", ["feature-state", "hover"], false],
          "#000000",
          ["in", ["get", "tmc"], ["literal", this.state.tmcs]],
          "#000099",
          "#999999"
        ]
        mapboxMap.setPaintProperty(id, "line-color", LineColor);
      }
    });
  }
}

export default function createLayer () {
  return new RouteCreationLayer();
};
