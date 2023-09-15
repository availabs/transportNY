import React from "react"

import { AvlLayer, getColorRange } from "~/modules/avl-map-2/src"

import get from "lodash/get"
import { scaleQuantile, scaleLinear } from "d3-scale"
import { extent as d3extent } from "d3-array"

import { DAMA_HOST } from "~/config"

import SourceLegend from "./SourceLegend"

const $HOST = `${ DAMA_HOST }/tiles`

const getValidSources = sources => {
  return sources.map(src => {
    const { id, source: { url, type } } = src;
    return {
      id,
      source: {
        type,
        url: url.replace("$HOST", $HOST)
      }
    }
  });
  return sources.filter(src => REGEX.test(get(src, ["source", "url"], "")))
}

const SourceRenderComponent = props => {

  const {
    layerProps,
    maplibreMap,
    resourcesLoaded,
    layer
  } = props;

  const {
    layerData,
    activeViewId
  } = layerProps;

  React.useEffect(() => {
    if (!maplibreMap) return;
    if (!resourcesLoaded) return;
    if (!activeViewId) return;

    const values = layerData.map(d => +d.value);

    const colorScale = scaleQuantile()
      .domain(values)
      .range(getColorRange(7, "Blues"));

    const colors = layerData.reduce((a, c) => {
      a[c.id] = colorScale(+c.value);
      return a;
    }, {});

    const widthScale = scaleLinear()
      .domain(d3extent(values))
      .range([2, 10])
      .clamp(true);

    const widths = layerData.reduce((a, c) => {
      a[c.id] = +widthScale(+c.value);
      return a;
    }, {});

console.log("WIDTHS:", widths);

    const paint = ["get", ["to-string", ["get", "ogc_fid"]], ["literal", colors]];
    const width = ["get", ["to-string", ["get", "ogc_fid"]], ["literal", widths]];

    layer.layers.forEach(layer => {
      if ((layer.viewId === activeViewId) && maplibreMap.getLayer(layer.id)) {
        if (layerData.length) {
          maplibreMap.setPaintProperty(layer.id, layer.paintProperty, paint);
          if (layer.paintProperty.includes("line")) {
            // maplibreMap.setPaintProperty(layer.id, "line-width", widths);
          }
        }
        else {
          maplibreMap.setPaintProperty(layer.id, layer.paintProperty, "#000");
          if (layer.paintProperty.includes("line")) {
            maplibreMap.setPaintProperty(layer.id, "line-width", 2);
          }
        }
        maplibreMap.setLayoutProperty(layer.id, "visibility", "visible");
      }
      else if (maplibreMap.getLayer(layer.id)) {
        maplibreMap.setLayoutProperty(layer.id, "visibility", "none");
      }
    })

  }, [maplibreMap, resourcesLoaded, layer, layerData, activeViewId]);

  return (
    null
  )
}

class SourceLayer extends AvlLayer {
  constructor(source) {
    super();

    this.startActive = false;
    this.name = source.name;
    this.id = `source-${ source.source_id }`;

    this.categories = [...source.categories];
    this.metadata = JSON.parse(JSON.stringify(source.metadata));

    this.damaSource = source;

    const [sources, layers] = get(source, "views", []).reduce((a, c) => {
      const sources = getValidSources(c.metadata?.tiles?.sources || []);
      const layers = c.metadata?.tiles?.layers || [];
      if (sources.length && layers.length) {
        a[0].push(...sources);
        a[1].push(...layers.map(l =>
          ({ ...l,
            viewId: c.view_id,
            version: get(c, ["version", "value"], get(c, "version")) || "unknown version",
            paintProperty: `${ l.type }-color`
          })
        ));
      }
      return a;
    }, [[], []]);
    this.sources = sources;
    this.layers = layers;
  }
  RenderComponent = SourceRenderComponent;
  infoBoxes = [
    { Component: SourceLegend,
      Header: ({ layer }) => <div>{ layer.name }</div>
    }
  ]
}

export const SourceLayerConstructor = source => {
  return new SourceLayer(source);
}
