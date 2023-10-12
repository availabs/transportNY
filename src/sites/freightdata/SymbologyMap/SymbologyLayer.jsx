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
    setLayerVisibility
  } = props;

  const activeSymbology = get(props, ["layerState", "activeSymbology"], null);

  const [legend, setLegend] = React.useState(null);

  React.useEffect(() => {
    if (!maplibreMap) return;
    if (!resourcesLoaded) return;
    if (!activeSymbology) return;

    let legend = null;

    const [view] = get(activeSymbology, "views", []);

    if (!view) return;

    view.layers.forEach(layer => {
      Object.keys(layer.paintProperties)
        .forEach(ppId => {

          const paintProperty = get(layer, ["paintProperties", ppId], {});

          const {
            value,
            paintExpression,
            variable
          } = paintProperty;

          if (value) {
// console.log("SymbologyLayerRenderComponent::value", value);
            if (maplibreMap.getLayer(layer.layerId)) {
              maplibreMap.setPaintProperty(layer.layerId, ppId, value);
            }
          }
          else if (paintExpression) {
            // delete defaultPaint[ppId];
// console.log("SymbologyLayerRenderComponent::paintExpression", paintExpression);
          }
          else if (variable) {
// console.log("SymbologyLayerRenderComponent::variable", variable);
            if (maplibreMap.getLayer(layer.layerId)) {

              const { paintExpression, scale } = variable;

              if (ppId.includes("color")) {
                legend = {
                  name: variable.displayName,
                  ...scale
                };
              }

              maplibreMap.setPaintProperty(layer.layerId, ppId, paintExpression);
              setLayerVisibility(layer.id, "visible");
            }
          }
          else {
            setLayerVisibility(layer.id, "none");
          }
        })
    })

    setLegend(legend);

  }, [maplibreMap, resourcesLoaded, setLayerVisibility, activeSymbology])

  return !legend ? null : (
    <div className="p-1 pointer-events-auto bg-gray-100 rounded mb-1"
      style={ {
        width: "100%",
        maxWidth: "25rem"
      } }
    >
      <div className="bg-gray-300 border border-current rounded p-1">
        <div className="font-bold">
          { legend.name }
        </div>
        <div>
          <SymbologyLegend { ...legend }/>
        </div>
      </div>
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

    const [sources, layers] = damaSource.views
      .filter(view => Boolean(view.metadata?.symbologies?.length))
      .reduce((aa, cc) => {
        const sources = getValidSources(cc.metadata?.tiles?.sources || []);
        const layers = cc.metadata?.tiles?.layers || [];
        if (sources.length && layers.length) {
          aa[0].push(...sources);
          aa[1].push(...layers.map(l =>
            ({ ...cc, ...l })
          ));
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
