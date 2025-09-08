import React from "react";
import get from "lodash/get";

import mapboxgl from "mapbox-gl";
import bbox from "~/utils/geojson-bbox"
import { getColorRange } from "~/utils/color-ranges";
import * as d3scale from "d3-scale";

import { format as d3format } from "d3-format"

import { ckmeans } from "simple-statistics";

// import {
//   ConflationSources,
//   ConflationLayers,
//   //ConflationLayerCase
// } from "./map-styles/conflation";

// import { NpmrdsSources, NpmrdsLayers } from "./map-styles/npmrds";

// import {
//   TrafficSignalsSources,
//   TrafficSignalsLayers,
// } from "./map-styles/traffic_signals";


import { LayerContainer } from "~/modules/avl-map/src";
import { F_SYSTEM_MAP } from "~/sites/tsmo/pages/Dashboards/components/metaData"

import {getTMCs, getCorridors} from '../data_processing'
/* ---- To Do -----

   ---------------- */

   const TSMO_VIEW_ID = 1947;
const TMC_META_VIEW_ID = 984;
const siFormat = d3format(".3s")

class CongestionLayer extends LayerContainer {
  name = "Congestion Layer";
  sources = [
    {
      id: "geo-boundaries-source",
      source: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      },
    },
    {
      id: "corridors-source",
      source: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      },
    },
  ];
  layers = [
    {
      id: "geo-boundaries",
      type: "line",
      source: "geo-boundaries-source",
      paint: {
        "line-color": "#000",
      },
    },
    {
      id: "corridors-layer",
      type: "line",
      source: "corridors-source",
      paint: {
        'line-color': '#900',
        'line-width': [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          3,
          13,
          6,
          18,
          16
        ],
        'line-opacity': [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.4,
          1
        ],
        'line-offset': {
          base: 4,
          stops: [[5, 2], [9, 4], [15, 9], [18, 18]]
        }
      }
    },
  ];

  state = {
    zoom: 6.6,
    region: null
  };


  legend = {
    type: "quantile",
    domain: [0, 150],
    range: getColorRange(7, "Reds"),
    format: ".2s",
    show: true,
    Title: ({ layer }) => {
      if (!layer) return "Title test";
      return (
        <div className='text-sm font-medium text-gray-700 w-full text-right'>
          <span className=''>Delay (vehicle hours) / mile</span>
        </div>
      );
    },
  };
  onHover = {
    layers: [
      // ...ConflationLayers.map((d) => d.id),
      // ...NpmrdsLayers.map((d) => d.id),
      "corridors-layer"

    ],
    // filterFunc: function(layer, features, point, latlng) {
    //   const key = 'tmc',
    //     value = get(features, [0, "properties", key], "none"),
    //     dir = get(features, [0, "properties", "dir"], "none");
    //   return ["in", key, value]; //["all", ["in", key, value], ["in", "dir", dir]];
    // },
    callback: (layerId, features, lngLat) => {
      let feature = features[0];


      //console.log('hover', v)
      let data = [
        ...Object.keys(feature.properties).map((k) => [
          k,
          feature.properties[k],
        ])
      ];
      data.push(["hoverlayer", layerId]);
      //data.push([this.getMeasure(this.filters), v])

      return data;
    }
  };

  // onClick = {
  //   layers: [...ConflationLayers.map((d) => d.id)],
  //   callback: (features, lngLat) => {
  //     let feature = features[0];
  //     console.log("click", feature, features);
  //   },
  // };

  zoomToGeography(geo) {
    if (!this.mapboxMap) return;

    const bounds = new mapboxgl.LngLatBounds(bbox(geo));

    if (bounds.isEmpty()) return;

    const options = {
      padding: {
        top: 50,
        right: 25,
        bottom: 25,
        left: 25,
      },
      bearing: 0,
      pitch: 0,
      duration: 2000,
    };

    options.offset = [
      (options.padding.left - options.padding.right) * 0.2,
      (options.padding.top - options.padding.bottom) * 0.2,
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

  getTMCs (rawDelayData) {
    // console.time('getTMcs')
    const {region, month: tableDate} = this.props
    const [year, month] = tableDate.split("-").map(Number),
    pm = (month - 2 + 12) % 12 + 1,
    prevYearMonth = `${ +pm === 12 ? year - 1 : year }-${ `0${ pm }`.slice(-2) }`;

    const f_systems = get(F_SYSTEM_MAP, this.props.fsystem, []);
    return getTMCs(rawDelayData,year,month,region,f_systems,prevYearMonth)

  }

  getTMCMetaData (falcorCache,tmcs) {
    const { month: tableDate } = this.props
    const [year,] = tableDate.split("-").map(Number)
    console.log("tmcs: ", tmcs);
    
    return tmcs.reduce((a, c) => {
      a[c] = [year].reduce((aa, cc) => {
        const d = get(falcorCache, ["transcom3", TMC_META_VIEW_ID, "tmc", c, "meta", cc], null);
        const geom = get(falcorCache, ["transcom3", TMC_META_VIEW_ID, "tmc",c,'year',cc,'wkb_geometry','value'], null)
        if (d) {
          aa[cc] = d;
          aa[cc].geom = geom
        }
        return aa;
      }, {});
      return a;
    }, {});

  }

  getColorScale(domain) {
    if (this.legend.range.length > domain.length) {
      this.legend.domain = [];
      return false;
    }
    this.legend.domain = ckmeans(domain, this.legend.range.length).map((d) =>
      Math.min(...d)
    );
    // this.updateLegend(this.filters, this.legend);
    return d3scale
      .scaleLinear()
      .domain(this.legend.domain)
      .range(this.legend.range);
  }

  // init(map, falcor) {
  //   console.log('----init----')
  //     // return falcor
  //     //   .get(["geo", "36", "geoLevels"])
  // }

  fetchData(falcor) {
    const falcorCache = this.falcor.getCache();
    const {region, month: tableDate } = this.props
    const [year,] = tableDate.split("-").map(Number)
    const [geolevel, value] = region.split('|')
    const tmcs = this.getTMCs(this.props.rawDelayData)

    const tmcMetadata = this.getTMCMetaData(falcorCache,Object.values(tmcs).map(d => d.tmc))
    const corridorsTmcs =  getCorridors(tmcMetadata,year,tmcs)
      .filter((d,i) => i < 15)
      .reduce((out,cor) => {
         return [...out, ...Object.values(cor.tmcs)]

      },[])

    let requests = [["geo", geolevel.toLowerCase(), value, "geometry"]]
    // if(corridorsTmcs.length > 0) {
    //   requests.push(
    //     ['tmc',corridorsTmcs,'year',year,'geometries']
    //   )
    // }
// console.log('requests', requests)
    return falcor.get(...requests)
      // .then(d => {
      //   console.log('got data', d)
      // })
  }

  render(map,) {
    const falcorCache = this.falcor.getCache();

    // --- Set Boundary and Zoom to Regions
    const {region, month: tableDate } = this.props
    const [year,] = tableDate.split("-").map(Number)
    const [geolevel, value] = region.split('|')
    const geom =  get(
      falcorCache,
      ["geo", geolevel.toLowerCase(), value, "geometry", "value"],
      null
    )

    const collection = {
      type: "FeatureCollection",
      features: [{
          type: "Feature",
          properties: { geoid: region},
          geometry: geom
        }]
    };
    map.getSource("geo-boundaries-source").setData(collection);
    if(geom && region !== this.state.region){
      console.log('zoomToGeography', region, this.state.region)
      this.zoomToGeography(geom)
      this.updateState({...this.state, region: region})
    }
    // --- Process and Map Congestion Data
    const tmcMap = this.getTMCs(this.props.rawDelayData)
    const tmcs = Object.values(tmcMap)
// console.log('testing', tmcs)
    const tmcMetadata = this.getTMCMetaData(falcorCache,tmcs.map(d => d.tmc))
    const corridors =  getCorridors(tmcMetadata,year,tmcMap)

    const corridorsTmcs =  corridors.filter((d,i) => i < 15)
      .reduce((out,cor) => {
         return [...out, ...Object.values(cor.tmcs)]

      },[])
      
    const corridorCollection = {
      type: "FeatureCollection",
      features: []
    };
    if(corridorsTmcs.length) {
// console.log('corridorsTmcs to render', corridors, corridorsTmcs,tmcMetadata )
      corridorCollection.features = corridorsTmcs.map((tmc,i) => {
        let meta = get(tmcMetadata,`[${tmc}][${year}]`, {})
        let data = get(tmcMap, `[${tmc}]`, {})
        let geom = get(meta, ["wkb_geometry", "value"], null);
        if (geom) geom = JSON.parse(geom);
        
        return {
          type: "Feature",
          id: i,
          properties: {
            tmc,
            roadname: meta.roadname,
            firstname: meta.firstname,
            direction: meta.direction,
            length: meta.length,
            total_delay: siFormat(data.total),
            non_recurrent: siFormat(data.non_recurrent)
          },
          geometry: geom
        }
      })
      map.getSource("corridors-source").setData(corridorCollection);
// console.log('corridorsTmcs to render', corridorCollection )

    }

    if(Object.keys(tmcMetadata).length) {
      let corridorTmcData = tmcs
        .filter(d => corridorsTmcs.includes(d.tmc))
// console.log('testing', corridorsTmcs, tmcMetadata)

      const scale = this.getColorScale(
        corridorTmcData
          .map(d => (d.total / tmcMetadata[d.tmc][year].length))
          .sort((a, b) => a - b)
      );
      const colors = corridorTmcData.reduce((a, c) => {
        a[c.tmc] = scale((c.total / tmcMetadata[c.tmc][year].length));
        return a;
      }, {});

// console.log("colors", colors);

// console.log("HOVERED TMCs:", this.props.hoveredTMCs)

      if (this.props.hoveredTMCs.length) {
        map.setPaintProperty("corridors-layer", "line-opacity", [
          "case",
          ["in", ["get", "tmc"], ["literal", this.props.hoveredTMCs]],
          1,
          0.25
        ]);
        map.setPaintProperty("corridors-layer", "line-width", [
          "interpolate",
          ["linear"],
          ["zoom"],
          0, ["case",
              ["in", ["get", "tmc"], ["literal", this.props.hoveredTMCs]],
              3,
              1
            ],
          13, ["case",
              ["in", ["get", "tmc"], ["literal", this.props.hoveredTMCs]],
              13,
              4
            ],
          18, ["case",
              ["in", ["get", "tmc"], ["literal", this.props.hoveredTMCs]],
              16,
              6
            ]
        ]);
      }
      else {
        map.setPaintProperty("corridors-layer", "line-opacity", [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.4,
          1
        ]);
        map.setPaintProperty("corridors-layer", "line-width", [
          "interpolate",
          ["linear"],
          ["zoom"],
          0, 3,
          13, 6,
          18, 16
        ]);
      }

      map.setPaintProperty("corridors-layer", "line-color", [
        "case",
        ["has", ["to-string", ["get", 'tmc']], ["literal", colors]],
        ["get", ["to-string", ["get", 'tmc']], ["literal", colors]],
        "rgba(220, 220, 220,0.5)",
      ]);

    }
  }

}

export const MacroLayerFactory = (options = {}) => new CongestionLayer(options);
