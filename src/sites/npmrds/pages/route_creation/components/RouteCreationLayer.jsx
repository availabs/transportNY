import React from "react"

import mapboxgl from "mapbox-gl"

import get from "lodash/get"
import { scaleLinear } from "d3-scale"
import { select as d3select } from "d3-selection"

import { LayerContainer } from "~/modules/avl-map/src"

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
    creationMode: "markers",
    highlighted: []
  }

  tmcsbyLayerId = {};

  setCreationMode(creationMode) {
    if (creationMode === "tmc-clicks") {
      this.state.markers.forEach(m => m.remove());
      this.updateState({ creationMode, markers: [] });
    }
    else {
      this.updateState({ creationMode, markers: [], tmcs: [] });
    }
  }

  setHighlightedTmcs(tmc) {
    const tmcs = this.state.highlighted;
    if (tmcs.includes(tmc)) {
      this.updateState({
        highlighted: tmcs.filter(t => t !== tmc)
      });
    }
    else {
      this.updateState({
        highlighted: [...tmcs, tmc]
      })
    }
  }

  onClick = {
    callback: function (layer, features, lngLat) {
      const { creationMode: mode } = this.state;
      if ((mode === "markers") && (layer === "mapboxMap")) {
        this.addMarker(lngLat);
      }
      else if ((mode === "tmc-clicks") && ConflationLayerIds.includes(layer)) {
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
    year: {
      name: "Year",
      type: "single",
      domain: YEARS,
      value: YEARS[0]
    }
  }

  mapActions = [
    { icon: "fa-home",
      action: function(MapActions, layer) {
        layer.zoomToBounds();
      }
    }
  ]

  sources = [
    ...ConflationSources
  ]
  layers = [
    ...ConflationLayers
  ]

  onHover = {
    layers: [...ConflationLayerIds],
    property: "tmc",
    hoverEnter: function(layerId, features = []) {
      const route = this.state.tmcs;
      const highlighted = this.state.highlighted;
      features.forEach(f => {
        const tmc = f.properties.tmc;
        if (route.includes(tmc) && !highlighted.includes(tmc)) {
          this.updateState({ highlighted: [...highlighted, tmc] });
        }
      })
    },
    hoverLeave: function(layerId, features = []) {
      this.updateState({ highlighted: [] });
    }
  }

  init(mapboxMap, falcor) {
    return Promise.resolve();
  }

  onAdd(mapboxMap, falcor) {
    this.state.markers.forEach(m => m.addTo(mapboxMap));

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

        if (points && points.length) {
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
        else if (tmc_array && tmc_array.length) {
          const year = this.getYear();
          return falcor.get(["tmc", tmc_array, "meta", year, "bounding_box"])
            .then(() => {
              this.updateState({ tmcs: tmc_array, creationMode: "tmc-clicks" });
            })
        }
      }).then(() => this.zoomToBounds());
    }

    return Promise.resolve();
  }

  onRemove(mapboxMap) {
    this.state.markers.forEach(m => m.remove());
  }

  fetchData(falcor) {
    return Promise.resolve()
      .then(() => this.getWays())
      .then(({ tmcs }) => {
        if (tmcs.length) {
          this.updateState({ tmcs });
        }
      });
  }

  zoomToBounds() {
    if (this.state.markers.length === 1) {
      const [marker] = this.state.markers;
      this.mapboxMap.flyTo({
        center: marker.getLngLat(),
        zoom: 10,
        bearing: 0,
        pitch: 0
      });
    }
    else if (this.state.markers.length >= 2) {
      const [m1, m2, ...rest] = this.state.markers;
      const bounds = rest.reduce((a, c) => {
        a.extend(c.getLngLat());
        return a;
      }, new mapboxgl.LngLatBounds(m1.getLngLat(), m2.getLngLat()));
      this.mapboxMap.fitBounds(bounds, {
        bearing: 0,
        pitch: 0,
        padding: 150
      });
    }
    else if (this.state.tmcs.length) {
      const cache = this.falcor.getCache();
      const year = this.getYear();
      const [tmc, ...rest] = this.state.tmcs;
      const bbox = get(cache, ["tmc", tmc, "meta", year, "bounding_box", "value"]);
      if (bbox && (bbox.length === 2)) {
        const bounds = rest.reduce((a, c) => {
          const bbox = get(cache, ["tmc", c, "meta", year, "bounding_box", "value"]);
          if (bbox && (bbox.length === 2)) {
            a.extend(bbox);
          }
          return a;
        }, new mapboxgl.LngLatBounds(bbox));
        this.mapboxMap.fitBounds(bounds, {
          bearing: 0,
          pitch: 0,
          padding: 150
        });
      }
    }
    else {
      this.mapboxMap.flyTo({
        center: [-73.75619435918802, 42.65102710658],
        zoom: 10,
        bearing: 0,
        pitch: 0
      });
    }
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

  async toggleTmcs(tmcs) {
    const TMCs = tmcs.reduce((a, c) => {
      if (a.includes(c)) {
        return a.filter(tmc => tmc !== c);
      }
      a.push(c);
      return a;
    }, [...this.state.tmcs]);

    const year = this.getYear();

    return this.falcor.get(["tmc", TMCs, "meta", year, "bounding_box"])
      .then(res => this.updateState({ tmcs: TMCs }));
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
console.log("RES:", res)
        const tmcs = get(res, ["json", "routes2", "get", "route", request], []);
        return this.falcor.get(["tmc", tmcs, "meta", year, "bounding_box"])
          .then(() => ({ tmcs, ways: [] }));
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

  render(mapboxMap) {
    const ways = get(this, ["state", "ways"], []);
    const tmcs = get(this, ["state", "tmcs"], []);

    const year = this.getYear();

    this.layers.forEach(({ id, filter }) => {
      const visibility = id.includes(year) ? "visible" : "none";
      mapboxMap.setLayoutProperty(id, "visibility", visibility);

      if (visibility === "visible") {
        mapboxMap.setFilter(id, [
          "any",
          filter,
          ["in", ["get", "id"], ["literal", ways]],
          ["in", ["get", "tmc"], ["literal", tmcs]]
        ])
        const LineColor = [
          "case",
          ["any",
            ["all",
              ["boolean", ["feature-state", "hover"], false],
              ["in", ["get", "tmc"], ["literal", this.state.tmcs]]
            ],
            ["in", ["get", "tmc"], ["literal", this.state.highlighted]]
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
