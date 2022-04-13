import React from "react";
import get from "lodash.get";

import mapboxgl from "mapbox-gl";

import { LayerContainer } from "modules/avl-map/src";





class FreightAtlasSimple extends LayerContainer {
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

      return data
    }
  };



  
 

 

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