import React from "react";
import get from "lodash/get";

import mapboxgl from "mapbox-gl";
import bbox from "~/utils/geojson-bbox"
import { getColorRange } from "~/utils/color-ranges";
import * as d3scale from "d3-scale";

import { ckmeans } from "simple-statistics";
import { format as d3format } from "d3-format"

import { Link } from "react-router"

import { LayerContainer } from "~/modules/avl-map/src";
/* ---- To Do -----



   ---------------- */


const fFormat = d3format(",.2s")


const duration2minutes = (dur) => {
  if(!dur) return 0
  let [days, time] = dur.split('-')
  let [hours, minutes] = time.split(':')
  let out = 1440 * (+days) + 60 * (+hours) + (+minutes)
  return isNaN(out) ? 0 : out
}

const HoverComp = ({ data, layer }) => {
  return (
    <div className='bg-white p-4 max-w-xs grid grid-cols-1 gap-1'>

      { data.sort((a, b) => b.delay - a.delay).slice(0, 3)
          .map(d =>
            <div key={ d.id }>
              <Link to={ `/incidents/${ d.id }`}>
                <div className='font-bold border-b-2 border-current'>
                  {d.facility}: {d.type} <i className="fa fa-arrow-up-right-from-square"/>
                </div>
              </Link>
              <div>
                <span className="font-semibold">Open Time:</span> { d.start }
              </div>
              <div className='flex'>
                <div className='flex-1 text-center'>
                  <span className="font-semibold">Cost</span>
                  <div>${ fFormat(d.delay * 15) }</div>
                </div>
                <div className='flex-1 text-center'>
                  <span className="font-semibold">Delay</span>
                  <div>{ d.delay.toFixed(0) } min</div>
                </div>
                <div className='flex-1 text-center'>
                  <span className="font-semibold">Dur.</span>
                  <div>{d.duration} min</div>
                </div>
              </div>
              <div className="whitespace-pre-wrap">
                { d.description }
              </div>
            </div>
          )
      }

     {/* <div className='w-72' style={{overflowWrap: "break-word"}}>
        {data.description}
      </div>*/}

    </div>
  )
}

class CongestionLayer extends LayerContainer {
  name = "Congestion Layer";
  doZoom = true;
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
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["number", ["get", "delay"], 0],
          0, 6,
          1000, 20,
          4000, 40
        ],
        // 'circle-opacity': [
        //   "case",
        //   ["boolean", ["feature-state", "hover"], false],
        //   0.4,
        //   1
        // ],
        "circle-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          "#d92",
          ["get", "color"]
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#333"
      },
    },
    {
      id: "geo-boundaries",
      type: "line",
      source: "geo-boundaries-source",
      paint: {
        "line-color": "#ccc",
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
    layers: ["events-points"],
    // filterFunc: function(layer, features, point, latlng) {
    //   const key = 'tmc',
    //     value = get(features, [0, "properties", key], "none"),
    //     dir = get(features, [0, "properties", "dir"], "none");
    //   return ["in", key, value]; //["all", ["in", key, value], ["in", "dir", dir]];
    // },
    callback: (layerId, features, lngLat) => {
      // let feature = features[0];


      //console.log('hover', v)
      // let data = [
      //   ...Object.keys(feature.properties).map((k) => [
      //     k,
      //     feature.properties[k],
      //   ])
      // ];
      // data.push(["hoverlayer", layerId]);
      //data.push([this.getMeasure(this.filters), v])

      return features.map(f => f.properties);
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
    if (!this.mapboxMap || !this.doZoom) return;

    const bounds = new mapboxgl.LngLatBounds(bbox(geo));

    if (bounds.isEmpty()) return;

    const options = {
      padding: {
        top: 25,
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

    this.doZoom = false;
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
    // console.log('----init----')
      // return falcor
      //   .get(["geo", "36", "geoLevels"])
  }

  fetchData(falcor) {
    // console.log('falcor',falcor)
    const {region} = this.props
    const [geolevel, value] = region.split('|')

    // let request = []
    ///let tmcs = this.getTMCs()

    return falcor.get(["geo", geolevel.toLowerCase(), value, "geometry"])
  }

  render(map,) {
    const falcorCache = this.falcor.getCache();

    // --- Set Boundary and Zoom to Regions
    const {region, events, hoveredEvent} = this.props
    console.log("region, events: ", region, events);
    
    const [geolevel, value] = region.split('|')
    const geom =  get(
      falcorCache,
      ["geo", geolevel.toLowerCase(), value, "geometry", "value"],
      null
    )
    
    // const geom =  events.map(e => e.geom)

    const collection = {
      type: "FeatureCollection",
      features: [{
          type: "Feature",
          properties: { geoid: region},
          geometry: geom
        }]
    };
    map.getSource("geo-boundaries-source").setData(collection);
    if(geom){
      this.doZoom = true;
      this.zoomToGeography(geom)
    }

    if (hoveredEvent) {
      map.setPaintProperty("events-points", "circle-stroke-width",
        ["case",
          ["boolean", ["==", ["get", "id"], hoveredEvent], false],
          4, 2
        ]
      )
    }
    else {
      map.setPaintProperty("events-points", "circle-stroke-width", 2)
    }

// console.log('events', events)

    // --- Process and Map Event Data
    const eventsCollection = {
      type: "FeatureCollection",
      features: events
        .sort((a, b) => a.event_id.localeCompare(b.event_id))
        .map((event, i) => {
          return {
            type: "Feature",
            id: i,
            properties: {
              id: event.event_id,
              facility: event.facility,
              type: event.event_type,
              start: event.start_date_time,
              delay: +get(event, 'congestion_data.value.vehicleDelay', 0),
              duration: duration2minutes(event.event_duration),
              description: event.description,
              color: get(this, ["props", "colorsForTypes", event.nysdot_sub_category], "#009")
            },
            geometry: event.geom.value
          }
        })
    }
    // console.log('eventsCollection', eventsCollection)
    map.getSource("events-source").setData(eventsCollection);
  }

}

export const MacroLayerFactory = (options = {}) => new CongestionLayer(options);
