import React from "react";
import get from "lodash.get";

import mapboxgl from "mapbox-gl";
import bbox from 'utils/geojson-bbox'
import { getColorRange } from "utils/color-ranges";
import * as d3scale from "d3-scale";

import { ckmeans } from "simple-statistics";

import {
  ConflationSources,
  ConflationLayers,
  //ConflationLayerCase
} from "./map-styles/conflation";

import { NpmrdsSources, NpmrdsLayers } from "./map-styles/npmrds";

import {
  TrafficSignalsSources,
  TrafficSignalsLayers,
} from "./map-styles/traffic_signals";


import { LayerContainer } from "modules/avl-map/src";
import { F_SYSTEMS } from 'pages/Dashboards/components/metaData'
/* ---- To Do -----

   ---------------- */

class CongestionLayer extends LayerContainer {
  name = "Congestion Layer";
  sources = [
    ...ConflationSources,
    ...NpmrdsSources,
    ...TrafficSignalsSources,
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
  ];
  layers = [
    // ...ConflationLayerCase,
    ...ConflationLayers,
    ...NpmrdsLayers,
    ...TrafficSignalsLayers,
    {
      id: "geo-boundaries",
      type: "line",
      source: "geo-boundaries-source",
      paint: {
        "line-color": "#000",
      },
    },
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

  /*filters = {
    geography: {
      name: 'Geography',
      type: 'select',
      domain: [],
      value: [],
      searchable: true,
      accessor: d => d.name,
      valueAccessor: d => d.value,
      multi: true,
    }
  }
*/
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
      ...ConflationLayers.map((d) => d.id),
      ...NpmrdsLayers.map((d) => d.id),
      "bottlnecks",
      "incidents",
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

  onClick = {
    layers: [...ConflationLayers.map((d) => d.id)],
    callback: (features, lngLat) => {
      let feature = features[0];
      console.log("click", feature, features);
    },
  };

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
    console.time('getTMcs')
    const {region, month: tableDate} = this.props
    const [year, month] = tableDate.split("-").map(Number)
    
     let total = F_SYSTEMS.reduce((out,fclass) => {
      // console.log('tmcs get', rawDelayData, get(rawDelayData,`[${year}][${+month}][${region}][${fclass}].total.value`,[]))
      get(rawDelayData,`[${year}][${+month}][${region}][${fclass}].total.value`,[])
        .forEach(tmc => {
          if(!out[tmc.tmc]){
            out[tmc.tmc] = tmc 
          }
        })
      return out 
    },{})

     F_SYSTEMS.forEach((fclass) => {
      // console.log('tmcs get', rawDelayData, get(rawDelayData,`[${year}][${+month}][${region}][${fclass}].total.value`,[]))
      get(rawDelayData,`[${year}][${+month}][${region}][${fclass}].non_recurrent.value`,[])
        .forEach(tmc => {
          if(total[tmc.tmc]){
            total[tmc.tmc].non_recurrent = tmc.value 
          }
        })
      
    },{})
    console.timeEnd('getTMcs')
    return Object.values(total)
  }

  getTMCMetaData (falcorCache,tmcs) {
    const { month: tableDate } = this.props
    const [year,] = tableDate.split("-").map(Number)
    return tmcs.reduce((a, c) => {
      const d = get(falcorCache, ["tmc", c, "meta", year], null);
      if (d) {
        a[c] = d;
      }

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

  init(map, falcor) {
    console.log('----init----')
      // return falcor
      //   .get(["geo", "36", "geoLevels"])
  }

  fetchData(falcor) {
    const {region} = this.props
    const [geolevel, value] = region.split('|')
    
    // let request = []
    ///let tmcs = this.getTMCs()

    return falcor.get(["geo", geolevel.toLowerCase(), value, "geometry"])
  }

  render(map,) {
    const falcorCache = this.falcor.getCache();
    
    // --- Set Boundary and Zoom to Regions
    const {region} = this.props
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
    this.zoomToGeography(geom)
    // --- Process and Map Congestion Data
    const tmcs = this.getTMCs(this.props.rawDelayData)
    const tmcMetadata = this.getTMCMetaData(falcorCache,tmcs.map(d => d.tmc))
    if(Object.keys(tmcMetadata).length) {
      const scale = this.getColorScale(tmcs.map(d => (d.value / tmcMetadata[d.tmc].length)).sort((a, b) => a - b));
      const colors = tmcs.reduce((a, c) => {
        a[c.tmc] = scale((c.value / tmcMetadata[c.tmc].length));
        return a;
      }, {});
      console.log("colors", colors);
      NpmrdsLayers.map((d) => d.id)
        .forEach((l) => {
        //console.log('set paint', l, colors)
        map.setPaintProperty(l, "line-color", [
          "case",
          ["has", ["to-string", ["get", 'tmc']], ["literal", colors]],
          ["get", ["to-string", ["get", 'tmc']], ["literal", colors]],
          "rgba(220, 220, 220,0.5)",
        ]);
      });
    }
  }
   
}

export const MacroLayerFactory = (options = {}) => new CongestionLayer(options);