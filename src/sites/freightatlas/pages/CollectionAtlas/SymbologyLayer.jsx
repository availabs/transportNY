import React from "react"
import get from "lodash/get"
import { AvlLayer, getColorRange, useTheme } from "~/modules/avl-map-2/src"
import { DAMA_HOST } from "~/config"
const $HOST = `${ DAMA_HOST }/tiles`
import SymbologyLegend from "~/pages/DataManager/DataTypes/gis_dataset/pages/Symbology/components/SymbologyLegend"
import { useSearchParams } from "react-router";
export const SymbologyLayerRenderComponent = props => {
	const [searchParams, setSearchParams] = useSearchParams();
	const urlActiveLayers = searchParams.get("layers")?.split('|').map(id => parseInt(id)).filter(item => !isNaN(item)) || [];

  const { symbology_id } = props.layer;

  const {
    maplibreMap,
    resourcesLoaded,
    setLayerVisibility
  } = props;

  const activeSymbology = get(props, ["layerState", "activeSymbology"], null);

  console.log(`symb: ${symbology_id}, props:`,props)
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
            if (maplibreMap.getLayer(layer.layerId)) {
              maplibreMap.setPaintProperty(layer.layerId, ppId, value);
              setLayerVisibility(layer.layerId, "visible");
            }
          }
          else if (paintExpression) {
            if (maplibreMap.getLayer(layer.layerId)) {
              maplibreMap.setPaintProperty(layer.layerId, ppId, paintExpression);
              setLayerVisibility(layer.layerId, "visible");
            }
          }
          else if (variable) {
            if (maplibreMap.getLayer(layer.layerId)) {

              const { paintExpression, scale, filterExpression } = variable;

              if (ppId.includes("color")) {
                legend = {
                  name: variable.displayName,
                  ...scale
                };
              }

              maplibreMap.setPaintProperty(layer.layerId, ppId, paintExpression);
              maplibreMap.setFilter(layer.layerId, filterExpression);
              setLayerVisibility(layer.layerId, "visible");
            }
          }
          else {
            if (maplibreMap.getLayer(layer.layerId)) {
              setLayerVisibility(layer.layerId, "none");
            }
          }
        })
    })

    setLegend(legend);

  }, [maplibreMap, resourcesLoaded, setLayerVisibility, activeSymbology])

  return !legend ? null : (
    <div className="p-1 pointer-events-auto bg-gray-100 rounded mb-1 "
      style={ {
        width: "100%",
        maxWidth: "25rem"
      } }
    >
      <div className="bg-slate-100 border p-2">
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
    let { id, source: { url, type } } = src;
    if(url.includes('.pmtiles')){
      url = url
        .replace("$HOST", $HOST)
        .replace('https://', 'pmtiles://')
        .replace('http://', 'pmtiles://')

    } else {
      url = url.replace("$HOST", $HOST)
    }
    
    return {
      id,
      source: {
        type,
        url: url
      }
    }
  });
}

class SymbologyLayer extends AvlLayer {
  constructor(damaSource) {
    super();

    this.startActive = false;
    this.name = damaSource.name;
    this.categories = damaSource.categories
    this.id = damaSource.collection_id;

    this.startState = { activeSymbology: null };
    const [sources, layers] = damaSource?.symbologies
      //.filter(sym => Boolean(view.metadata?.symbologies?.length))
      .reduce((aa, cc) => {
        //TODO add check for identical source urls
        const sources = getValidSources(cc?.symbology?.[0]?.tiles?.sources || []);
        const layers = cc?.symbology?.[0]?.tiles?.layers || [];
        if (sources.length && layers.length) {
          aa[0].push(...sources);
          aa[1].push(...layers.map(l =>
            ({ ...cc, ...l })
          ));
        }
        return aa;
      }, [[], []]);

    this.symbology_id = damaSource?.symbologies[0].symbology_id; //TODO may need to change this to array depending on how multi layered symbologies is implemented
    this.sources = sources;
    this.layers = layers;
  }
  RenderComponent = SymbologyLayerRenderComponent;
}

export const SymbologyLayerConstructor = sources => {
  return new SymbologyLayer(sources);
}
