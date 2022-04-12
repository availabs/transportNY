import React from "react";
import get from "lodash.get";

import mapboxgl from "mapbox-gl";
import bbox from 'utils/geojson-bbox'
import { getColorRange } from "utils/color-ranges";
import * as d3scale from "d3-scale";

import { ckmeans } from "simple-statistics";
import { format as d3format } from "d3-format"



import { LayerContainer } from "modules/avl-map/src";
import { F_SYSTEMS } from 'sites/tsmo/pages/Dashboards/components/metaData'
/* ---- To Do -----



   ---------------- */


const fFormat = d3format(",.2s")


const duration2minutes = (dur) => {
    let [days, time] = dur.split('-')
    let [hours, minutes] = time.split(':')
    let out = 1440 * (+days) + 60 * (+hours) + (+minutes) 
    return isNaN(out) ? 0 : out
  }

function timeConvert(n) {
var num = n;
var hours = (num / 60);
var rhours = Math.floor(hours);
var minutes = (hours - rhours) * 60;
var rminutes = Math.round(minutes);
return rhours + " hour(s) and " + rminutes + " minute(s).";
}


const HoverComp = ({ data, layer }) => {
      return (
        <div className='bg-white p-4 w-72'>
          <div className='text-lg font-bold'>{data.facility} <span className='text-gray-600 text-base'>{data.type}</span></div>
          <div className='flex'>
            <div className='flex-1 text-center'>
              Cost.
              <div>${fFormat(data.delay*15)}</div>
            </div>
            <div className='flex-1 text-center'>
              Delay.
              <div>{get(data,'delay',0).toFixed(0)} min</div>
            </div>
            <div className='flex-1 text-center'>
              Dur.
              <div>{data.duration} min</div>
            </div>
            
          </div>
         {/* <div className='w-72' style={{overflowWrap: "break-word"}}>
            {data.description}
          </div>*/}
          
        </div>)


    }

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
      id: "events-source",
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
      id: "events-points",
      type: "circle",
      source: "events-source",
      paint: {
      "circle-radius": {
       stops: [[8, 5], [16, 8]]
      },
      'circle-opacity': [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        0.4,
        1
      ],
      "circle-color": "#b91c1c",
      },
    },
    {
      id: "geo-boundaries",
      type: "line",
      source: "geo-boundaries-source",
      paint: {
        "line-color": "#000",
      },
    },
  ];

  

  
  legend = {
    type: "quantile",
    domain: [0, 150],
    range: getColorRange(7, "Reds"),
    format: ".2s",
    show: false,
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
      "events-points",
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

      return feature.properties;
    },
    HoverComp
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
    const {region,events} = this.props
    const [geolevel, value] = region.split('|')
    
    // let request = []
    ///let tmcs = this.getTMCs()

    return falcor.get(["geo", geolevel.toLowerCase(), value, "geometry"])
  }

  render(map,) {
    const falcorCache = this.falcor.getCache();
    
    // --- Set Boundary and Zoom to Regions
    const {region, events} = this.props
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
    // --- Process and Map Event Data
    console.log('events', events)
    const eventsCollection = {
      type: "FeatureCollection",
      features: events.map(event => {
        return {
          type: "Feature",
          properties: { 
            id: event.event_id,
            facility: event.facility,
            type: event.event_type,
            delay: get(event, 'congestion_data.value.vehicleDelay', 0),
            duration: duration2minutes(event.duration),
            description: event.description


          },
          geometry: event.geom.value
        }
      })
    }
    map.getSource("events-source").setData(eventsCollection);
  }
   
}

export const MacroLayerFactory = (options = {}) => new CongestionLayer(options);