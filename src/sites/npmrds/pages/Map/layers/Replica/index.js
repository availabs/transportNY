import React from 'react'
import get from 'lodash.get'

import { getColorRange, Legend } from "../../utils"
import { Select, useFalcor } from 'modules/avl-components/src'
import mapboxgl from "mapbox-gl"
import * as d3scale from "d3-scale"
import len from '@turf/length'
import flatten from 'lodash.flatten'

import { ckmeans } from 'simple-statistics'

// import { RISSources, RISLayers } from 'pages/map/map-styles/ris'
import { 
  ConflationSources, 
  ConflationLayers,
  // ConflationLayerCase
} from 'pages/auth/Map/map-styles/conflation'

import { 
  filters,
  updateSubMeasures,
  getMeasure,
  getMeasureName,
  updateLegend
} from './filters'
// import MeasureInfoBox from 'components/information/MeasureInfoBox'
import DataDownloader from "./DataDownload"
import MeasureVisBox from "./MeasureVisBox"
//import HoverComp from './HoverComp'
import { LayerContainer } from "modules/avl-map/src"

/* ---- To Do ----- 
X - Meta variables for RIS / TMC
X - OSM network support
2 - Data Overview
3 - Overview Graph
4 - get measures by geography
5 - data download
6 - routing
   ---------------- */


class MacroLayer extends LayerContainer {
  name = "Macro View"
  sources = [
    ...ConflationSources,
    { id: "geo-boundaries-source",
        source: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: []
          }
        }
      }
  ]
  layers = [
    // ...ConflationLayerCase,
    ...ConflationLayers,
    { id: "geo-boundaries",
      type: "line",
      source: "geo-boundaries-source",
      paint: {
        "line-color": "#fff"
      }
    }
  ]

  infoBoxes = [
    {
      Component: ({layer}) => (
        <div className='w-full bg-npmrds-600 text-npmrds-100'>
          <MeasureVisBox layer={layer} />
          {/*{layer.state.zoom.toFixed(2)}*/}
        </div>),
      show: true
    },
    {
      Component: ({ layer }) => (
          <DataDownloader layer={ layer }
            network={ layer.filters.network.value }
            allMeasures={ layer.allMeasures }
            measures={ layer.filters.measure.domain }
            measure={ layer.getMeasure(layer.filters) }
            risAttributes={ layer.risAttributes }
            tmcAttributes={ layer.tmcAttributes }
            year={ layer.filters.year.value }
            compareYear={ layer.filters.compareYear.value }
            loading={ layer.loading }
            geoids={ layer.filters.geography.value }
          />
        ),
        show: true
    }
  ]

  toolbar = []
  filters = filters
  legend = {
    type: "quantile",
    domain: [0, 150],
    range: getColorRange(9, "RdYlBu").reverse(),
    format: ",.1f",
    show: true,
    Title: ({ layer }) => {
      if(!layer) return
      return <React.Fragment>{ layer.getMeasureName(layer.falcor,layer.getMeasure(layer.filters)) }</React.Fragment>
    }
  }
  onHover = {
    layers: [...ConflationLayers.map(d => d.id)],
    filterFunc: function(layer, features, point, latlng) {

        const key = this.filters.network.value,
          value = get(features, [0, "properties", key], "none"),
          dir = get(features, [0, "properties", "dir"], "none");
        return ["in", key, value] //["all", ["in", key, value], ["in", "dir", dir]];
    },
    callback: (layerId, features, lngLat) => {
      let feature = features[0]
      let dataPath = ["conflation", 
        this.filters.network.value, 
        feature.properties[this.filters.network.value], 
        "data",
        this.filters.year.value
      ]
      /*
        'TMC_aadt',
        'TMC_miles',
        'RIS_aadt_current_yr_est',
        'RIS_section_length'
      */
      // const key = this.filters.network.value,
      // value = get(features, [0, "properties", key], "none"),
      // dir = get(features, [0, "properties", "dir"], "none");
      // let getFeat = ['major','local']
      // .map(l => this.mapboxMap.querySourceFeatures(ConflationSources[0].id, {
      //   sourceLayer: l,
      //   filter: ["all", ["in", key, value], ["in", "dir", dir]]
      // }))
      // let featLen = flatten(getFeat).reduce((out,curr) => out+len(curr.geometry,  {units: 'miles'}),0).toFixed(2)
      let v = get(this.state.falcorCache, dataPath, {})
      
      let data = [
        ...Object.keys(feature.properties).map(k=> [k, feature.properties[k]]),
        ...Object.keys(v).filter(k=> typeof v[k] !== 'object' ).map(k=> [k, v[k]])
      ]
      // console.log('hover', v, data)
      //data.push([this.getMeasure(this.filters), v])

      return data
    }
    
  }
  onClick = {
    layers: [...ConflationLayers.map(d => d.id)],
    callback: (features, lngLat) => {
      let feature = features[0]
      console.log('click', feature, features)
    }
   
  }

  state = {
    activeStation: null,
    zoom: 6.6,
    progress: 0,
    falcorCache: {},
    currentData: []
  }

  updateSubMeasures = updateSubMeasures
  getMeasure = getMeasure
  getMeasureName = getMeasureName
  updateLegend = updateLegend

  onFilterChange(filterName, newValue, prevValue) {
    
    switch(filterName) {
      case 'geography':
        this.zoomToGeography(newValue)
        this.saveToLocalStorage()
      break;
      case 'measure':
        this.updateSubMeasures(this.filters.measure.value, this.filters, this.falcor)
        this.updateLegend(this.filters,this.legend)
      break;
      case 'attributes':
        //this.updateSubMeasures(this.filters.measure.value, this.filters, this.falcor)
        this.updateLegend(this.filters,this.legend)
      break;
      default:
        console.log('no case for filter', filterName)
      break;
    }
  }

  loadFromLocalStorage() {
    return window.localStorage ?
      JSON.parse(window.localStorage.getItem("macro-view-geographies") || "[]")
      : [];
  }

  saveToLocalStorage(geographies = this.filters.geography.value) {
    if (window.localStorage) {
      if (geographies.length) {
        window.localStorage.setItem("macro-view-geographies", JSON.stringify(geographies));
      }
      else {
        window.localStorage.removeItem("macro-view-geographies")
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
        left: 200
      },
      bearing: 0,
      pitch: 0,
      duration: 2000
    }

    options.offset = [
      (options.padding.left - options.padding.right) * 0.5,
      (options.padding.top - options.padding.bottom) * 0.5
    ];

    const tr = this.mapboxMap.transform,
      nw = tr.project(bounds.getNorthWest()),
      se = tr.project(bounds.getSouthEast()),
      size = se.sub(nw);

    const scaleX = (tr.width - (options.padding.left + options.padding.right)) / size.x,
      scaleY = (tr.height - (options.padding.top + options.padding.bottom)) / size.y;

    options.center = tr.unproject(nw.add(se).div(2));
    options.zoom = Math.min(tr.scaleZoom(tr.scale * Math.min(scaleX, scaleY)), tr.maxZoom);

    this.mapboxMap.easeTo(options);
  }

  getBounds(geographies = this.filters.geography.value) {
    return this.filters.geography.domain
      .filter(d => geographies.includes(d.value))
      .reduce((a, c) => a.extend(c.bounds), new mapboxgl.LngLatBounds())
  }

  setActiveStation = () => {

  }
  
  init(map, falcor) {

    // map.on('zoomend', () => {
    //  this.updateState({zoom: map.getZoom()})
    // }) 
    return falcor.get(['pm3', 'measureIds'])
      .then(res => {
        const mIds = get(res, ["json", "pm3", "measureIds"], []);
        
        return falcor.get(
          ['geo', '36', 'geoLevels'],
          ['pm3', 'measureInfo', mIds,
            ['fullname', 'definition', 'equation', 'source']
          ]
        )
        .then(res => {
          const mInfo = get(res, ["json", "pm3", "measureInfo"], {});
          // this.filters.measure.domain = mIds
          //   .filter(m => !m.includes("_"))
          //   .map(id => ({
          //     name: get(mInfo, [id, "fullname"], id),
          //     value: id
          //   }));

          this.updateSubMeasures(this.filters.measure.value, this.filters, falcor)
          this.updateLegend(this.filters,this.legend)
    
          this.filters.measure.domain.push(
            { name: "OSM Attributes", value: 'OSM'},
            { name: "RIS Attributes", value: "RIS" },
            { name: "TMC Attributes", value: "TMC" }
          )
          
          this.filters.geography.domain = get(res, ["json", "geo", '36', "geoLevels"], [])
            .map(geo => ({
              name: `${ geo.geolevel === "STATE" ? geo.geoname.toUpperCase() : geo.geoname } ${ geo.geolevel === "COUNTY" ? "County" : geo.geolevel === "STATE" ? "State" : geo.geolevel }`,
              geolevel: geo.geolevel,
              value: geo.geoid,
              bounds: geo.bounding_box
            }));
          
          this.filters.network.value = 'osm'
          

        })
      })
      .then(() => {
        this.filters.geography.value = this.loadFromLocalStorage();
        this.zoomToGeography();
      })

       
  }

  fetchRequestsForGeography() {
    const year = +this.filters.year.value,
      geoids = this.filters.geography.value,
      filtered = this.filters.geography.domain
        .filter(({ value }) => geoids.includes(value));

    
    return filtered.reduce((a, c) => {
      a.push(["conflation", c.geolevel.toLowerCase(), c.value, year, this.filters.network.value]);
      a.push(["geo", c.geolevel.toLowerCase(), c.value, "geometry"]);
      return a;
    }, [])
      
  }

  getSelectionForGeography() {
    const year = +this.filters.year.value,
      geoids = this.filters.geography.value,
      filtered = this.filters.geography.domain
        .filter(({ value }) => geoids.includes(value)),
      falcorCache = this.falcor.getCache();

      return [...filtered.reduce((a, c) => {
        get(falcorCache,
          ["conflation", c.geolevel.toLowerCase(), c.value, year, this.filters.network.value, "value"]
        , []).forEach(d => a.add(d))
        return a;
      }, new Set())]  
    
  }

  getGeomRequest(selection) {
    switch (this.filters.network.value) {
      case "ris":
        return ["ris", selection, "meta", this.filters.year.value, "geom"]
      case "tmc":
        return ['tmc', selection, 'year', this.filters.year.value, 'geometries']
    }
    return [];
  }
  
  getColorScale(domain) {
    if(this.getMeasure(this.filters).indexOf('COMP') !== -1) {
      
      return d3scale.scaleThreshold()
        .domain([-.50,-.30, -.20, -.10, 0, .10, .20, .30, .50])
        .range(getColorRange(9, "RdYlGn").reverse())
    }
    if(this.legend.range.length > domain.length) {
      this.legend.domain = []
    } else {
      this.legend.domain = ckmeans(domain,this.legend.range.length).map(d => Math.min(...d))
    }

    return d3scale.scaleThreshold()
      .domain(this.legend.domain)
      .range(this.legend.range);
  }

  fetchData(falcor) {
    // console.log('fetchData')
    return falcor.get(...this.fetchRequestsForGeography())
      .then((data) => {
        const selection = this.getSelectionForGeography();
       
        const meta = {
          'tmc': ['TMC_aadt','TMC_miles'],
          'ris': ['RIS_aadt_current_yr_est','RIS_section_length', 'OSM_replica_aadt'],
          'osm': ['RIS_aadt_current_yr_est', 'OSM_replica_aadt', 'OSM_oneway']
        }
        return selection.length && falcor.chunk(
          ["conflation",
            this.filters.network.value,
            selection,
            "data",
            [this.filters.year.value,this.filters.compareYear.value].filter(y => y !== "none"),
            [
              ...meta[this.filters.network.value],
              'CON_miles'
            ]
          ],
          { onProgress: (curr, total) => {
              let progress = ((curr/total) * 100).toFixed(1)
              if(progress !== this.state.progress){
                this.updateState({progress})
              }
            },
            chunkSize: 500
          }
        )
      })
      .then(fullData => this.updateState({progress: 0}))
  }

  render(map) {
    // console.log('render')
    const falcorCache = this.falcor.getCache()
    const { network, year, compareYear } = this.filters,
    n = network.value,
    y = year.value,
    cy = compareYear.value,
    m = this.filters.attributes.value,
    selection = this.getSelectionForGeography(),
    toNaN = v => v === null ? NaN : +v;
    let m1 = m
    let m2 = "none"
      
    if(m.indexOf('COMP') !== -1){
      m1 = m.split('-')[1]
      m2 = m.split('-')[2]
    }
    console.log('render once', m1,m2,m)

    const getValue = id => {
      const v = toNaN(get(falcorCache, ["conflation", n, id, "data", y,m1], null));
      if (m2 === "none") {
        return v;
      }
      const c = toNaN(get(falcorCache, ["conflation", n, id, "data", y, m2], null));
      return ((v - c) / c);
    },
    domain = [],
    data = selection.reduce((a, c) => {
      const v = getValue(c);
      
        let meta = get(falcorCache, ["conflation", n, c, "data", y],{})
        //console.log(meta)
        if(!isNaN(v)){
          domain.push(v)
        
        a.push({
          id: c,
          value: isNaN(v) ? 0 : v,
          ...meta
          })
      }
      return a;
    }, []);
    // console.log('data', data)
    this.updateState({
      currentData: data,
      falcorCache
    })

    const scale = this.getColorScale(domain.sort((a,b) => a-b)),

    colors = data.reduce((a, c) => {
      a[c.id] = scale(c.value);
      return a;
    }, {});
    // console.log('MEASURE', m)

    const geoids = this.filters.geography.value,
      filtered = this.filters.geography.domain
        .filter(({ value }) => geoids.includes(value));

    const collection = {
      type: "FeatureCollection",
      features: filtered.map(f => ({
        type: "Feature",
        properties: { geoid: f.value },
        geometry: get(falcorCache, ["geo", f.geolevel.toLowerCase(), f.value, "geometry", "value"], null)
      })).filter(f => Boolean(f.geometry))
    }
    map.getSource("geo-boundaries-source").setData(collection);

    ConflationLayers.forEach(l => {
      // map.setFilter(l.id, [
      //   "case",
      //   ["has", ["to-string", ["get", n]], ["literal", colors]],
      //   true,
      //   false
      // ])
      map.setPaintProperty(l.id, "line-color",
        [
          "case",
          ["has", ["to-string", ["get", n]], ["literal", colors]],
          ["get", ["to-string", ["get", n]], ["literal", colors]],
          'hsl(185, 0%, 27%)'
        ]
      )
    })

  }


  

}

export const MacroLayerFactory = (options = {}) => new MacroLayer(options);
