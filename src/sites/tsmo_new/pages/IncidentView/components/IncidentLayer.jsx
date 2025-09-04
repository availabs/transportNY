import mapboxgl from "mapbox-gl";
import get from "lodash/get";
import { extent as d3extent } from "d3-array"
import { scaleQuantize } from "d3-scale";

import { LayerContainer } from "~/modules/avl-map/src";
import { getCorridors } from './utils'

import {
  getColorRange,
} from "~/modules/avl-components/src";

import {
  ConflationSources,
  ConflationLayers,
  ConflationCaseLayers,
} from "./conflation";

import { DelayFormat } from "./utils";

const TSMO_VIEW_ID = 1947;
const TMC_META_VIEW_ID = 984;
const ColorRange = getColorRange(7, "RdYlGn");

const BaseLayerFilters = ConflationLayers.reduce((a, { id, filter }) => {
  a[id] = filter;
  return a;
}, {});

const CaseLayerFilters = ConflationCaseLayers.reduce((a, { id, filter }) => {
  a[id] = filter;
  return a;
}, {});

class ConflationLayer extends LayerContainer {

  fetchData(falcor) {
    const { year, tmcs = [] } = this.props;
    if (!(year && tmcs.length)) {
      return Promise.resolve();
    }
    return falcor.get([
      "transcom3", TMC_META_VIEW_ID, "tmc", tmcs, "meta", year, ["aadt", "wkb_geometry", "altrtename", "bounding_box", "length", "road", "direction","tmclinear","road_order","county_code", "intersection"]
    ]);

  }
  render(mapboxMap, falcor) {
    // if (this.zoomToBounds || (this.props.tmcs !== this.props.prevTmcs)) {
       this.doZoom(mapboxMap);
    // }
    //map
    const falcorCache = falcor.getCache();
    const { tmcs, year, activeBranch } = this.props;


    const tmcKey = this.props.showRaw ? "rawTmcDelayData" : "tmcDelayData";

    const tmcData = get(this.props, ["congestionData", tmcKey], {}),
      tmcsWithData = Object.keys(tmcData)
        .filter(tmc => Boolean(tmcData[tmc]) && tmcs.includes(tmc)),
      tmcMetaData = tmcs.reduce((a, c) => {
        a[c] = [year].reduce((aa, cc) => {
          const d = get(falcorCache, ["transcom3", TMC_META_VIEW_ID, "tmc", c, "meta", cc], null);
          if (d) {
            aa[cc] = d;
          }
          return aa;
        }, {});
        return a;
      }, {});

    let corridors = getCorridors(tmcMetaData,year,tmcs,tmcData)

    // console.log("tmcMetaData: ", tmcMetaData);
    // console.log("year: ", year);
    // console.log("tmcs: ", tmcs);
    // console.log("tmcData: ", tmcData);
    
    
    let corridorTmcs = Object.values(
      get(corridors
        .filter(c => c.corridor === activeBranch),'[0].tmcs',{})
      )
      console.log("corridorTmcs: ", corridorTmcs);
      
    
    const id2Caseid = (a) => [a.slice(0, 3), 'case', a.slice(3)].join('');

    const string = `^con-${year}(?:-\\w+)+?`,
      regex = new RegExp(string);

    ConflationLayers.forEach(({ id }) => {
      console.log("id: ", id);
      
      if (regex.test(id)) {

        console.log("regex.test(id) ", regex.test(id));
        
        mapboxMap.setLayoutProperty(id, "visibility", "visible");
        mapboxMap.setFilter(id,
          ["all",
            BaseLayerFilters[id],
            ["any",
              ["in", ["get", "tmc"], ["literal", tmcs]]/*,
              ["in", ["get", "id"], ["literal", ways]]*/
            ]
          ]
        );
        mapboxMap.setLayoutProperty(id2Caseid(id), "visibility", "visible");
        mapboxMap.setFilter(id2Caseid(id),
          ["all",
            CaseLayerFilters[id2Caseid(id)],
            ["any",
              ["in", ["get", "tmc"], ["literal", corridorTmcs]]/*,
              ["in", ["get", "id"], ["literal", ways]]*/
            ]
          ]
        );
      }
      else {
        mapboxMap.setLayoutProperty(id, "visibility", "none");
        mapboxMap.setFilter(id, BaseLayerFilters[id]);
        mapboxMap.setLayoutProperty(id2Caseid(id), "visibility", "none");
        mapboxMap.setFilter(id2Caseid(id), CaseLayerFilters[id2Caseid(id)]);
      }
    })

    if (tmcsWithData.length) {
      const extent = d3extent(
        tmcs.map(tmc => tmcData[tmc]).filter(Boolean)
      );

      const scale = scaleQuantize()
        .domain(extent)
        .range(ColorRange.slice().reverse());
      const colors = tmcsWithData.reduce((a, tmc) => {
        a[tmc] = scale(tmcData[tmc]);
        return a;
      }, {});
      ConflationLayers.forEach(({ id }) => {
        mapboxMap.setPaintProperty(id, "line-color", [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          "rgb(241, 245, 249)",
          ["has", ["get", "tmc"], ["literal", colors]],
          ["get", ["get", "tmc"], ["literal", colors]],
          "rgb(15, 23, 42)",
        ]);
      });
    }
  }
  doZoom() {
    this.zoomToBounds = true;

    const tmcs = get(this, ["props", "tmcs"], []),
      center = get(this, ["props", "point", "coordinates"], []);

    const falcorCache = this.falcor.getCache();

    const bounds = tmcs.reduce((a, c) => {
      const bbox = get(falcorCache, ["transcom3", TMC_META_VIEW_ID, "tmc", c, "meta", this.props.year, "bounding_box", "value"], null);

      if (bbox) {
        return a.extend(bbox);
      }
      return a;
    }, new mapboxgl.LngLatBounds());

    if (!bounds.isEmpty()) {
      center.length && bounds.extend(center);
      this.zoomToBounds = false;
      this.mapboxMap.fitBounds(bounds, { padding: 75, pitch: 0 });
    } else if (center.length) {
      // this.zoomToBounds = false;
      this.mapboxMap.flyTo({ center, zoom: 10, pitch: 0 });
    }
  }
  name = "Conflation Layer";
  zoomToBounds = true;
  sources = ConflationSources;
  layers = [
    ...ConflationLayers.map((layer) => ({
      ...layer,
      paint: {
        ...layer.paint,
        "line-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          "rgb(241, 245, 249)",
          "rgb(15, 23, 42)",
        ],
      },
    })),
    ...ConflationCaseLayers
  ];
  onHover = {
    layers: ConflationLayers.map((l) => l.id),
    callback: function(layerId, features) {
      const year = this.props.year;
      const tmcs = new Set();
      const fCache = this.falcor.getCache();
      const tmcKey = this.props.showRaw ? "rawTmcDelayData" : "tmcDelayData";
      return features.reduce((a, { properties }) => {
        const { tmc } = properties;
        if (tmc && !tmcs.has(tmc)) {
          tmcs.add(tmc);
          const d = get(
            this,
            [
              "props",
              "congestionData",
              tmcKey,
              tmc,
            ],
            "No Data"
          );
          a.push(
            [tmc],
            [
              "Road Name",
              `${get(fCache, [
                "transcom3", TMC_META_VIEW_ID, "tmc",
                tmc,
                "meta",
                year,
                "road",
              ])} ${get(fCache, ["transcom3", TMC_META_VIEW_ID, "tmc", tmc, "meta", year, "direction"])}`,
            ],
            [
              "V. Delay",
              `${DelayFormat(d)} ${d === "No Data" ? "" : "(hh:mm:ss)"}`,
            ],
            ['layer',layerId]
          );
        }
        return a;
      }, []);
    },
    property: "tmc",
  };
  mapActions = [{ tooltip: "Zoom", icon: "fa fa-home", action: this.doZoom }];
}


class PointLayer extends LayerContainer {

  render(mapboxMap) {
    const { point, eventData } = this.props;

    if (point) {
      mapboxMap.getSource("point-source").setData({
        type: "Feature",
        properties: { ...eventData },
        geometry: point,
      });
    } else {
      mapboxMap.getSource("point-source").setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  }
  name = "Point Layer";
  sources = [
    {
      id: "point-source",
      source: {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      },
    },
  ];
  layers = [
    {
      id: "point-layer",
      source: "point-source",
      type: "circle",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 2, 22, 22],
        "circle-color": "rgb(241, 245, 249)",
      },
    },
  ];
  onHover = {
    layers: ["point-layer"],
    sortOrder: 0,
    callback: function(layerId, features) {
      return features.reduce((a, c) => {
        const eData = get(c, "properties", null);
        if (eData) {
          a.push(
            [get(eData, "event_id", null)],
            ["Open Time", get(eData, "open_time", null)],
            ["Close Time", get(eData, "close_time", null)]
          );
        }
        return a;
      }, []);
    },
  };
}

const Layers = { ConflationLayer, PointLayer }
export default Layers