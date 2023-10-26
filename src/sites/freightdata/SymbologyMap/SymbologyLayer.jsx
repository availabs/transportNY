import React from "react"

import get from "lodash/get"

import { AvlLayer, getColorRange, useTheme } from "~/modules/avl-map-2/src"

import { DAMA_HOST } from "~/config"

const $HOST = `${ DAMA_HOST }/tiles`

import SymbologyLegend from "~/pages/DataManager/DataTypes/gis_dataset/pages/Symbology/components/SymbologyLegend"

export const SymbologyLayerRenderComponent = props => {

  const {
    maplibreMap,
    resourcesLoaded,
    setLayerVisibility,
    layer: avlLayer
  } = props;

  const activeSymbology = get(props, ["layerState", "activeSymbology"], null);

  const [legends, setLegends] = React.useState([]);

  React.useEffect(() => {
    if (!maplibreMap) return;
    if (!resourcesLoaded) return;
    if (!activeSymbology) return;

    const legends = [];

    const [view] = get(activeSymbology, "views", []);

    const layerVisibilities = avlLayer.layers.reduce((a, c) => {
      a[c.id] = "none"
      return a;
    }, {});

    if (view) {
      view.layers.forEach(layer => {
        maplibreMap.setFilter(layer.uniqueId, null);
        Object.keys(layer.paintProperties)
          .forEach(ppId => {

            const paintProperty = get(layer, ["paintProperties", ppId], {});

            const {
              value,
              paintExpression,
              variable
            } = paintProperty;

            if (value) {
              if (maplibreMap.getLayer(layer.uniqueId)) {
                maplibreMap.setPaintProperty(layer.uniqueId, ppId, value);
                layerVisibilities[layer.uniqueId] = "visible";
              }
            }
            else if (paintExpression) {
              if (maplibreMap.getLayer(layer.uniqueId)) {
                maplibreMap.setPaintProperty(layer.uniqueId, ppId, paintExpression);
                layerVisibilities[layer.uniqueId] = "visible";
              }
            }
            else if (variable) {
              if (maplibreMap.getLayer(layer.uniqueId)) {

                const { paintExpression, scale } = variable;

                if (ppId.includes("color")) {
                  legends.push({
                    name: variable.displayName,
                    ...scale
                  });
                }

                maplibreMap.setPaintProperty(layer.uniqueId, ppId, paintExpression);
                layerVisibilities[layer.uniqueId] = "visible";
              }
            }
            else {
              if (maplibreMap.getLayer(layer.uniqueId)) {
                layerVisibilities[layer.uniqueId] = "none";
              }
            }
          })
        Object.values(layer.filters)
          .forEach(({ filterExpression }) => {
            maplibreMap.setFilter(layer.uniqueId, filterExpression);
          })
      })
    }

    setLegends(legends);
    setLayerVisibility(layerVisibilities);

  }, [maplibreMap, resourcesLoaded, setLayerVisibility, activeSymbology, avlLayer]);

  return !legends.length ? null : (
    <div className="p-1 pointer-events-auto bg-gray-100 rounded mb-1 absolute top-0 right-0 grid grid-cols-1 gap-1"
      style={ {
        width: "100%",
        maxWidth: "25rem"
      } }
    >
      { legends.map((legend, i) => (
          <div key={ i } className="bg-gray-300 border border-current rounded p-1">
            <div className="font-bold">
              { legend.name }
            </div>
            <div>
              <SymbologyLegend { ...legend }/>
            </div>
          </div>
        ))
      }
    </div>
  );
}

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
}

class SymbologyLayer extends AvlLayer {
  constructor(damaSource) {
    super();

    this.startActive = false;
    this.name = damaSource.name;
    this.id = damaSource.source_id;

    this.startState = { activeSymbology: null };

    this.viewsWithSymbologies = damaSource.views
      .filter(view => Boolean(view.metadata?.symbologies?.length))
      .map(view => {
        return {
          name: view.version || view.viewId,
          symbologies: view.metadata.symbologies
        }
      })

    const [sources, layers] = damaSource.views
      .filter(view => Boolean(view.metadata?.symbologies?.length))
      .reduce((aa, cc, ii) => {

        const sources = getValidSources(cc.metadata?.tiles?.sources || []);
        const layers = cc.metadata?.tiles?.layers || [];

        if (sources.length && layers.length) {
          cc.metadata.symbologies.forEach((sym, i) => {
            sym.views.forEach(symView => {
              const sourceIds = [];
              symView.layers.forEach(symLayer => {
                const { layerId, uniqueId = `sym-layer-${ ii }-${ i }` } = symLayer;
                const layer = layers.reduce((a, c) => {
                  return c.id === layerId ? c : a;
                });
                aa[1].push({
                  ...layer,
                  id: uniqueId,
                  name: symView.version || symView.viewId,
                  layout: { visibility: "none" }
                });
                if (!sourceIds.includes(layer.source)) {
                  sourceIds.push(layer.source);
                }
              })
              sourceIds.forEach(id => {
                const source = sources.reduce((a, c) => {
                  return c.id === id ? c : a;
                });
                aa[0].push(source);
              })
            })
          })
        }
        return aa;
      }, [[], []]);

    this.sources = sources;
    this.layers = layers;
  }
  RenderComponent = SymbologyLayerRenderComponent;
}

export const SymbologyLayerConstructor = sources => {
  return new SymbologyLayer(sources);
}
