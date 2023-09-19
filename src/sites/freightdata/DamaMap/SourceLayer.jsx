import React from "react"

import { AvlLayer, getColorRange, useTheme } from "~/modules/avl-map-2/src"

import { useFalcor } from "~/modules/avl-components/src";

import get from "lodash/get"
import {
  scaleQuantile,
  scaleQuantize,
  scaleThreshold
} from "d3-scale"
import {
  extent as d3extent,
  range as d3range
} from "d3-array"

import { DAMA_HOST } from "~/config"

import SourceLegend from "./SourceLegend"
import useSourceLegend from "./useSourceLegend"

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

const getScale = (type, domain, range) => {
  switch (type) {
    case "quantize":
      return scaleQuantize(domain, range)
    case "quantile":
      return scaleQuantile(domain, range)
    case "threshold":
      return scaleThreshold(domain, range)
  }
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
    activeViewId,
    legend
  } = layerProps;

  React.useEffect(() => {
    if (!maplibreMap) return;
    if (!resourcesLoaded) return;

    if (legend) {
      const colorScale = getScale(legend.type, legend.domain, legend.range);

      const dataValues = layerData.map(d => +d.value);

      const widthScale = getScale("quantile", dataValues, d3range(2, 7));
      const offsetScale = getScale("quantile", dataValues, d3range(1, 4));

      const [colors, widths, offsets] = layerData.reduce((a, c) => {
        a[0][c.id] = colorScale(+c.value);
        a[1][c.id] = widthScale(+c.value);
        a[2][c.id] = offsetScale(+c.value);
        return a;
      }, [{}, {}, {}]);

      const colorExpression = [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        "#ff7518",
        ["get", ["to-string", ["get", "ogc_fid"]], ["literal", colors]]
      ];
      const widthExpression = ["get", ["to-string", ["get", "ogc_fid"]], ["literal", widths]];
      const offsetExpression = ["get", ["to-string", ["get", "ogc_fid"]], ["literal", offsets]];

      layer.layers.forEach(layer => {
        if ((layer.view_id === activeViewId) && maplibreMap.getLayer(layer.id)) {
          maplibreMap.setPaintProperty(layer.id, layer.paintProperty, colorExpression);
          if (layer.paintProperty.includes("line")) {
            maplibreMap.setPaintProperty(layer.id, "line-width", widthExpression);
            maplibreMap.setPaintProperty(layer.id, "line-offset", offsetExpression);
          }
        }
      });
    }
    else {
      layer.layers.forEach(layer => {
        if ((layer.view_id === activeViewId) && maplibreMap.getLayer(layer.id)) {
          maplibreMap.setPaintProperty(layer.id, layer.paintProperty, "#000");
          if (layer.paintProperty.includes("line")) {
            maplibreMap.setPaintProperty(layer.id, "line-width", 1);
            maplibreMap.setPaintProperty(layer.id, "line-offset", 1);
          }
        }
      });
    }

    layer.layers.forEach(layer => {
      if ((layer.view_id === activeViewId) && maplibreMap.getLayer(layer.id)) {
        maplibreMap.setLayoutProperty(layer.id, "visibility", "visible");
      }
      else if (maplibreMap.getLayer(layer.id)) {
        maplibreMap.setLayoutProperty(layer.id, "visibility", "none");
      }
    });
  }, [maplibreMap, resourcesLoaded, activeViewId, layer, layerData, legend]);

  return (
    null
  )
}

const SourceLayerHoverComp = ({ data, layer, layerProps }) => {

  const pgEnv = React.useMemo(() => {
    return get(layerProps, [layer.id, "pgEnv"], []);
  }, [layer, layerProps]);

  const activeViewId = React.useMemo(() => {
    return get(layerProps, [layer.id, "activeViewId"]);
  }, [layer, layerProps]);

  const activeDataVariable = React.useMemo(() => {
    return get(layerProps, [layer.id, "activeDataVariable"]);
  }, [layer, layerProps]);

  const {
    layerName,
    featureIds
  } = data;

  const { falcorCache } = useFalcor();

  const featureData = React.useMemo(() => {
    return featureIds.map(id => {
      return get(falcorCache, ["dama", pgEnv, "viewsbyId", activeViewId, "databyId", id, activeDataVariable], null);
    }).filter(Boolean);
  }, [falcorCache, featureIds, pgEnv, activeViewId, activeDataVariable]);

  const theme = useTheme();

  return (
    <div className={ `p-1 ${ theme.bg }` }>
      <div className={ `border ${ theme.border } rounded` }>
        <div className={ `p-1 font-bold border-b border-current ${ theme.bgAccent1 }` }>
          { layerName }
        </div>
        <div className="p-1 grid grid-cols-1 gap-1">
          { featureData.map((d, i) => (
              <div key={ i } className="flex">
                <div className="font-bold mr-1">{ activeDataVariable }:</div>
                <div>{ d }</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
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
          ({ ...c,
            ...l,
            paintProperty: `${ l.type }-color`
          })
        ));
      }
      return a;
    }, [[], []]);

    this.sources = sources;
    this.layers = layers;

    this.onHover = {
      layers: layers.map(l => l.id),
      Component: SourceLayerHoverComp,
      callback: (layerId, features) => {
        return { layerId, layerName: this.name, featureIds: features.map(f => f.id) };
      }
    }
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
