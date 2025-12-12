import React from "react";
import mapboxgl from "mapbox-gl";
import get from "lodash/get"

import { DAMA_HOST } from "~/config";
import { DamaContext } from "~/pages/DataManager/store";

import {
  SourceAttributes,
  ViewAttributes,
  getAttributes
} from "~/pages/DataManager/Source/attributes";

import {
  useFetchSources,
  useGetSources,
  useFetchSourceViews,
  useGetViews,
  SourceAndViewSelectors
} from "./utils"

const DEFAULT_CLICKED_INFO = {
  osm: null,
  osm_fwd: null,
  lngLat: null
}

const EMPTY_COLLECTION = {
  type: "FeatureCollection",
  features: []
}

const ResultSource = {
  id: "result-source",
  source: {
    type: "geojson",
    data: EMPTY_COLLECTION
  }
}

const ResultLayer = {
  id: "result-layer",
  type: "line",
  source: "result-source",
  paint: {
    "line-width": 4,
    "line-color": "#ffffff",
    "line-offset": 2
  }
}

const REROUTER_METHODS = [
  "one-to-one",
  "one-to-many",
  "many-to-many"
]

export const RerouterPlugin = {
  id: "rerouter",
  type: "plugin",
  mapRegister: (map, state, setState) => {
  },
  dataUpdate: (map, state, setState) => {
  },
  internalPanel: ({ state, setState }) => {
    return [];
  },
  externalPanel: ({ state, setState }) => {
    return [];
  },
  cleanup: (map, state, setState) => {
  },
  comp: ({ map }) => {

    const [conflationDataView, setConflationDataView] = React.useState(null);

    const [minimized, setMinimized] = React.useState(false);
    const toggle = React.useCallback(e => {
      setMinimized(min => !min);
    }, []);

    const viewAttributes = getViewAttributes({ viewId: conflationDataView });

    const [sources, layers] = React.useMemo(() => {
      const { sources, layers } = get(viewAttributes, ["metadata", "value", "tiles"], { sources: [], layers: [] });
      return [sources, layers];
    }, [viewAttributes]);

    const [clickedInfo, setClickedInfo] = React.useState(DEFAULT_CLICKED_INFO);
    const handleClick = React.useCallback(({ lngLat, features }) => {
      const [osm] = features.map(f => f.properties.osm);
      const [osm_fwd] = features.map(f => f.properties.osm_fwd);
      setClickedInfo({ osm, osm_fwd, lngLat });
    }, []);

    const clearInfo = React.useCallback(() => {
      setClickedInfo(DEFAULT_CLICKED_INFO);
    }, []);

    React.useEffect(() => {
      if (!map || map._removed) return;

      if (!map.getSource(ResultSource.id)) {
        map.addSource(ResultSource.id, ResultSource.source);
      }

      if (map.getSource(ResultSource.id)) {
        map.addLayer(ResultLayer);
      }
      
      return () => {
        if (!map || map._removed) return;

        if (map.getLayer(ResultLayer.id)) {
          map.removeLayer(ResultLayer.id);
        }
        if (map.getSource(ResultSource.id)) {
          map.removeSource(ResultSource.id);
        }
      }
    }, [map]);

    React.useEffect(() => {
      if (!map || map._removed) return;
      if (!clickedInfo.lngLat) return;

      const marker = new mapboxgl.Marker()
                          .setLngLat(clickedInfo.lngLat)
                          .addTo(map);
      return () => {
        if (!map || map._removed) return;

        marker.remove();
      }
    }, [map, clickedInfo]);

    React.useEffect(() => {
      if (!map || map._removed) return;

      sources.forEach(source => {
        const src = {
          id: source.id,
          source: {
            ...source.source,
            tiles: source.source.tiles.map(t =>
              t + "?cols=osm,osm_fwd"
            )
          }
        }
        if (!map.getSource(src.id)) {
          map.addSource(src.id, src.source);
        }
      });

      layers.forEach(layer => {
        const lyr = {
          ...layer,
          minzoom: 10
        }
        if (!map.getLayer(lyr.id)) {
          map.addLayer(lyr, ResultLayer.id);
          map.on("click", lyr.id, handleClick);
          map.setPaintProperty(lyr.id, "line-width", 6);
          map.setPaintProperty(lyr.id, "line-offset", 4);
        }
      });

      return () => {
        if (!map || map._removed) return;

        sources.forEach(src => {
          if (map.getSource(src.id)) {
            map.removeSource(src.id);
          }
        });

        layers.forEach(lyr => {
          if (map.getLayer(lyr.id)) {
            map.off("click", lyr.id, handleClick);
            map.removeLayer(lyr.id);
          }
        });
      }
    }, [map, sources, layers, handleClick]);

    const okToSend = React.useMemo(() => {
      const { osm, osm_fwd, lngLat } = clickedInfo;
      return Boolean(conflationDataView && osm && lngLat);
    }, [conflationDataView, clickedInfo]);

    const [method, setMethod] = React.useState(REROUTER_METHODS[0]);
    const doSetMethod = React.useCallback(e => {
      setMethod(e.target.value);
    }, []);

    const { pgEnv } = React.useContext(DamaContext);

    const [loading, setLoading] = React.useState(false);

    const [resultCollection, setResultCollection] = React.useState(EMPTY_COLLECTION);

    const sendRequest = React.useCallback(() => {
      if (!okToSend) return;

      setLoading(true);

      const formData = new FormData();

      const { osm, osm_fwd, lngLat } = clickedInfo;

      formData.append("conflation_view_id", conflationDataView);
      formData.append("method", method);
      formData.append("osm", osm);
      formData.append("reversed", !osm_fwd);
      formData.append("point", JSON.stringify(lngLat));

      fetch(
        `${ DAMA_HOST }/dama-admin/${ pgEnv }/osm/rerouter`,
        { method: "POST", body: formData }
      ).then(res => res.json())
        .then(json => {
          console.log("RES:", json);
          const c = json.ok ? json.result.collection : EMPTY_COLLECTION;
          setResultCollection(c);
        })
        .finally(() => setLoading(false));
    }, [pgEnv, okToSend, conflationDataView, clickedInfo, method]);

    React.useEffect(() => {
      if (!map || map._removed) return;

      if (map.getSource(ResultSource.id)) {
        map.getSource(ResultSource.id).setData(resultCollection);
      }
    }, [map, resultCollection]);
    
    return (
      <div
        style={ {
          left: "50%",
          transform: "translate(-50%, 0)"
        } }
        className={ `
          pointer-events-auto w-screen max-w-xl h-fit grid grid-cols-1 gap-1
          bg-white items-center absolute bottom-4 rounded-lg
          ${ minimized ? "px-2 pt-2" : "p-2" }
        ` }
      >

        <div onClick={ toggle }
          className={ `
            absolute right-0 top-0 px-3 py-1 z-50
            bg-gray-200 hover:bg-gray-400 cursor-pointer
            ${ minimized ? "rounded-r-lg" : "rounded-tr-lg" }
          ` }
        >
          { minimized ?
            <span className="fa fa-caret-up"/> :
            <span className="fa fa-caret-down"/>
          }
        </div>

        { !loading ? null :
          <div className={ `
              absolute inset-0 bg-black bg-opacity-75 z-40
              flex items-center justify-center rounded-lg
              font-bold text-2xl text-white pointer-events-auto
            ` }
          >
            Request sent{ minimized ? null : <>{ "..." }<br /></> }...please wait...
          </div>
        }

        { minimized ?
          <>
            <div>&nbsp;</div>
          </> :
          <>

            <div className="border-b-4 border-current text-xl font-bold">
              Rerouter Plugin
            </div>

            <div className="border-b-2 border-current font-bold">
              OSM Data Source and View
            </div>

            <ConflationDataViewSelector
              setConflationDataView={ setConflationDataView }/>

            <div className="border-b-2 border-current font-bold"/>

            <div className="text-sm flex items-center mb-1">

              <div className="font-medium mr-1 flex-1">
                Method:
              </div>

              <select
                value={ method }
                onChange={ doSetMethod }
                className='text-sm px-2 py-1 bg-white shadow w-3/5 cursor-pointer'
              >
                { REROUTER_METHODS.map(m =>
                    <option key={ m }
                      value={ m }
                      className="text-sm"
                    >
                      { m.replaceAll("-", " ") }
                    </option>
                  )
                }
              </select>

            </div>

            <div className="border-b-2 border-current font-bold"/>

            <div className="grid grid-cols-2 gap-1">

              <Button 
                disabled={ !clickedInfo.lngLat }
                onClick={ clearInfo }
              >
                Clear Point
              </Button>

              <div />
              <div />

              <Button
                className="bg-green-200 hover:bg-green-400 disabled:hover:bg-green-200"
                disabled={ !okToSend }
                onClick={ sendRequest }
              >
                Send Request
              </Button>

            </div>

            <div className="h-24"/>

          </>
        }

      </div>
    );
  },
}

const Button = ({ children, className="bg-gray-200 hover:bg-gray-400 disabled:hover:bg-gray-200", ...props }) => {
  return (
    <button className={ `
      w-full block rounded py-1 ${ className }
      disabled:opacity-50
      cursor-pointer disabled:cursor-not-allowed
    ` }
      { ...props }
    >
      { children }
    </button>
  )
}

const getViewAttributes = ({ viewId }) => {

  const { pgEnv, falcorCache } = React.useContext(DamaContext);
  
// dama[{keys:pgEnvs}].views.byId[{keys:ids}].attributes[${viewAttrs}]

  return React.useMemo(() => {
    return get(falcorCache, ["dama", pgEnv, "views", "byId", viewId, "attributes"], {});
  }, [falcorCache, pgEnv, viewId]);

}

const CONFLATION_DATA_CATEGORIES = ["OSM Conflation"];
const CONFLATION_DATA_COLUMNS = ["osm", "ris", "tmc", "osm_fwd"];

const ConflationDataViewSelector = ({ setConflationDataView }) => {

  const { pgEnv, falcor, falcorCache } = React.useContext(DamaContext);

  const [sourceState, setSourceState] =   React.useState({
    conflationDataSourceId: null,
    conflationDataViewId: null
  });

  useFetchSources({ falcor, falcorCache, pgEnv });
  const conflationDataSources = useGetSources({ falcorCache,
                                          pgEnv,
                                          categories: CONFLATION_DATA_CATEGORIES,
                                          columns: CONFLATION_DATA_COLUMNS
                                      });

  useFetchSourceViews({ falcor, falcorCache, pgEnv, source_id: sourceState.conflationDataSourceId });
  const conflationDataViews = useGetViews({ falcorCache, pgEnv, source_id: sourceState.conflationDataSourceId });

  React.useEffect(() => {
    setConflationDataView(sourceState.conflationDataViewId);
  }, [setConflationDataView, sourceState.conflationDataViewId]);

  return (
    <SourceAndViewSelectors
      label="Conflation Data"

      sources={ conflationDataSources }
      sourceKey="conflationDataSourceId"
      sourceValue={ sourceState.conflationDataSourceId }

      views={ conflationDataViews }
      viewKey="conflationDataViewId"
      viewValue={ sourceState.conflationDataViewId }

      setCreateState={ setSourceState }/>
  )
}