import React from "react";
import get from "lodash.get";

import mapboxgl from "mapbox-gl";

import { LayerContainer } from "modules/avl-map/src";





class FreightAtlasLayer extends LayerContainer {
  sources = [
      { 
        id: "freight_atlas",
        source: {
          type: "vector",
          url: "https://tiles.availabs.org/data/nysdot_freight_atlas_terse_2016.json"
      }
    }
  ];
  layers = [{ 
      id: 'primary_freight_network_v2016',
      source: 'freight_atlas',
      'source-layer': 'primary_freight_network_v2016',
      "type": "line",
      "paint": {
        "line-color": "hsl(185, 0%, 27%)",
        "line-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.4,
          1
        ],
        "line-width": [
          "interpolate",
          ["exponential", 1.5],
          ["zoom"],
          5,
          3,
          8,
          2,
          18,
          32
        ]
      }
  }]

  
  legend = {
    type: "quantile",
    domain: [0, 150],
    range: [],
    format: ".2s",
    show: false,
    Title: ''
  };

  onHover = {
    layers: [
      "primary_freight_network_v2016",
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
    console.log('----init----', this)
      // return falcor
      //   .get(["geo", "36", "geoLevels"])
  }


  render(map) {
    console.log('render')
  }
   
}

export const FreightAtlasFactory = (options = {}) => new FreightAtlasLayer(options);