import React from "react";
import mapboxgl from "mapbox-gl";
import get from "lodash/get";
import set from "lodash/set";
import moment from "moment"
import { scaleLinear } from "d3-scale"

import { DAMA_HOST } from "~/config";
import { DamaContext } from "~/pages/DataManager/store";
import { CMSContext } from "~/modules/dms/src";


import {
  useFetchSources,
  useGetSources,
  useFetchSourceViews,
  useGetViews,
  SourceAndViewSelectors
} from "./utils"

const EMPTY_COLLECTION = {
  type: "FeatureCollection",
  features: []
}

const OsmResultSource = {
  id: "osm-result-source",
  source: {
    type: "geojson",
    data: EMPTY_COLLECTION
  }
}

const OsmResultLayer = {
  id: "osm-result-layer",
  type: "line",
  source: "osm-result-source",
  paint: {
    "line-width": 4,
    "line-color": "#ffffff",
    "line-offset": 2
  }
}

const IsochroneResultSource = {
  id: "isochrone-result-source",
  source: {
    type: "geojson",
    data: EMPTY_COLLECTION
  }
}

// const IsochroneResultLayer = {
//   id: "isochrone-result-layer",
//   type: "line",
//   source: "isochrone-result-source",
//   paint: {
//     "line-width": 2,
//     "line-color": ["get", "color"],
//     "line-offset": 1,
//   },
//   layout: {
//     "line-join": "miter",
//     "line-cap": "square"
//   }
// }
const IsochroneResultLayer = {
  id: "isochrone-result-layer",
  type: "fill",
  source: "isochrone-result-source",
  paint: {
    "fill-color": ["get", "color"],
    "fill-opacity": 0.5
  },
}

const MAJOR_OSM_HIGHWAY_TYPES = [
  "motorway",
  "motorway_link",
  "trunk",
  "trunk_link",
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
  "tertiary",
  "tertiary_link",
  "unclassified",
]
const ALL_OSM_HIGHWAY_TYPES = [
  ...MAJOR_OSM_HIGHWAY_TYPES,
  "residential",
  "living_street",
]

const getColorScale = num => {
  const scale = scaleLinear()
    .domain([0, num * 0.5, num])
    .range(["#1a9850", "#ffffbf", "#d73027" ]);
  return i => {
    if (num === 0) return scale.range()[0];
    return scale(i);
  }
}

export const PointselectorPlugin = {
  id: "pointselector",
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

    const [clickedPoint, setClickedPoint] = React.useState(null);

    const click = React.useCallback(e => {
      if (e.originalEvent.ctrlKey) {
        setClickedPoint({ ...e.lngLat });
      }
    }, []);

    React.useEffect(() => {
      if (!map || map._removed) return;

      map.on("click", click);
      return () => {
        if (!map || map._removed) return;

        map.off("click", click);
      };
    }, [map, click]);

    const [markers, setMarkers] = React.useState([]);

    const removeMarker = React.useCallback(index => {
      if (!map || map._removed) return;

      const points = markers.map(m => {
        m.remove();
        return { ...m.getLngLat() };
      });
      points.splice(index, 1);

      const num = points.length - 1;

      const colorScale = getColorScale(num);

      setMarkers(
        points.map((p, i) =>
          new mapboxgl.Marker({ color: colorScale(i), draggable: true })
                        .setLngLat(p)
                        .on("dragend", dragend)
                        .addTo(map)
        )
      )
    }, [markers, map]);

    const removeLast = React.useCallback(e => {
      if (!map || map._removed) return;

      const points = markers.map(m => {
        m.remove();
        return { ...m.getLngLat() };
      });

      points.pop();

      const num = points.length - 1;

      const colorScale = getColorScale(num);

      setMarkers(
        points.map((p, i) =>
          new mapboxgl.Marker({ color: colorScale(i), draggable: true })
                        .setLngLat(p)
                        .on("dragend", dragend)
                        .addTo(map)
        )
      )
    }, [markers, map]);

    const clearMarkers = React.useCallback(() => {
      markers.forEach(m => m.remove());
      setMarkers([]);
    }, [markers]);

    const dragend = React.useCallback(e => {
      setMarkers(prev => [...prev]);
    }, []);

    React.useEffect(() => {
      if (!map || map._removed) return;

      if (clickedPoint) {

        const prevPoints = markers.map(m => {
          m.remove();
          return { ...m.getLngLat() };
        });

        const colorScale = getColorScale(prevPoints.length);

        setMarkers(
          [...prevPoints, clickedPoint].map((p, i) =>
            new mapboxgl.Marker({ color: colorScale(i), draggable: true })
                          .setLngLat(p)
                          .on("dragend", dragend)
                          .addTo(map)
          )
        )
        setClickedPoint(null);
      }
    }, [map, clickedPoint, markers, dragend]);

    const points = React.useMemo(() => {
      return markers.map(m => ({ ...m.getLngLat() }));
    }, [markers]);

    // const [osmDataView, setOsmDataView] = React.useState(null);
    const [conflationDataView, setConflationDataView] = React.useState(null);
    const [npmrdsViewId, setNpmrdsViewId] = React.useState(null);

    const [startDate, setStartDate] = React.useState(moment().subtract(1, "years").format("YYYY-MM-DD"));
    const doSetStartDate = React.useCallback(e => {
      setStartDate(e.target.value);
    }, []);

    const [endDate, setEndDate] = React.useState(moment().subtract(1, "years").format("YYYY-MM-DD"));
    const doSetEndDate = React.useCallback(e => {
      setEndDate(e.target.value);
    }, []);

    const [startTime, setStartTime] = React.useState("06:00");
    const doSetStartTime = React.useCallback(e => {
      setStartTime(e.target.value);
    }, []);

    const [endTime, setEndTime] = React.useState("21:00");
    const doSetEndTime = React.useCallback(e => {
      setEndTime(e.target.value);
    }, []);

    const okToSendRoutingRequest = React.useMemo(() => {
      return (points.length >= 2) &&
              Boolean(conflationDataView) &&
              Boolean(startDate) &&
              Boolean(endDate) &&
              Boolean(startTime) &&
              Boolean(endTime);
    }, [points, conflationDataView, startDate, endDate, startTime, endTime]);

    const okToSendIsochroneRequest = React.useMemo(() => {
      return (points.length === 1) &&
              Boolean(conflationDataView) &&
              Boolean(startDate) &&
              Boolean(endDate) &&
              Boolean(startTime) &&
              Boolean(endTime);
    }, [points, conflationDataView, startDate, endDate, startTime, endTime]);

    const [excludeResidential, setExcludeResidential] = React.useState(true);
    const toggleResidential = React.useCallback(e => {
      setExcludeResidential(prev => !prev);
    }, [okToSendIsochroneRequest]);

    const [loading, setLoading] = React.useState(false);


    // const dctx = React.useContext(DamaContext);
    // const cctx = React.useContext(CMSContext);
    // const ctx = dctx?.falcor ? dctx : cctx;
    // const { pgEnv } = ctx  || { pgEnv: 'npmrds2'};
    const pgEnv = 'npmrds2'
    const [osmResultFeature, setOsmResultFeature] = React.useState(EMPTY_COLLECTION);

    const hasOsmResultFeature = React.useMemo(() => {
      return osmResultFeature.type === "Feature";
    }, [osmResultFeature]);

    const clearOsmResultFeature = React.useCallback(() => {
      setOsmResultFeature(EMPTY_COLLECTION);
    }, []);

    const sendRoutingRequest = React.useCallback(() => {
      if (!okToSendRoutingRequest) return;

      setLoading(true);

      const formData = new FormData();

      // formData.append("osm_view_id", osmDataView);
      formData.append("conflation_view_id", conflationDataView);
      formData.append("start_date", startDate);
      formData.append("end_date", endDate);
      formData.append("start_time", startTime);
      formData.append("end_time", endTime);
      formData.append("points", JSON.stringify(points));

      fetch(
        `${ DAMA_HOST }/dama-admin/${ pgEnv }/osm/routing`,
        { method: "POST", body: formData }
      ).then(res => res.json())
        .then(json => {
          console.log("OSM RES:", json);
          const f = json.ok ? json.result.feature : EMPTY_COLLECTION;
          setOsmResultFeature(f);
        })
        .finally(() => setLoading(false));
    }, [okToSendRoutingRequest, points, conflationDataView, pgEnv,
        startDate, endDate, startTime, endTime
      ]);

    React.useEffect(() => {
      if (!map || map._removed) return;

      if (!map.getSource(OsmResultSource.id)) {
        map.addSource(OsmResultSource.id, OsmResultSource.source);
      }

      if (map.getSource(OsmResultSource.id)) {
        map.addLayer(OsmResultLayer);
      }

      return () => {
        if (!map || map._removed) return;

        if (map.getLayer(OsmResultLayer.id)) {
          map.removeLayer(OsmResultLayer.id);
        }
        if (map.getSource(OsmResultSource.id)) {
          map.removeSource(OsmResultSource.id);
        }
      }
    }, [map]);

    React.useEffect(() => {
      if (!map || map._removed) return;

      if (map.getSource(OsmResultSource.id)) {
        map.getSource(OsmResultSource.id).setData(osmResultFeature);
      }
    }, [map, osmResultFeature]);

    const [isochroneResultCollection, setIsochroneResultCollection] = React.useState(EMPTY_COLLECTION);

    const hasIsochroneResultCollection = React.useMemo(() => {
      return isochroneResultCollection.features.length > 0;
    }, [isochroneResultCollection]);

    const clearIsochroneResultCollection = React.useCallback(() => {
      setIsochroneResultCollection(EMPTY_COLLECTION);
    }, []);

    const sendIsochroneRequest = React.useCallback(() => {
      if (!okToSendIsochroneRequest) return;

      setLoading(true);

      const formData = new FormData();

      const [point] = points;

      // formData.append("osm_view_id", osmDataView);
      formData.append("conflation_view_id", conflationDataView);
      formData.append("start_date", startDate);
      formData.append("end_date", endDate);
      formData.append("start_time", startTime);
      formData.append("end_time", endTime);
      formData.append("point", JSON.stringify(point));
      formData.append("highway_filter", excludeResidential ?
                                        JSON.stringify(MAJOR_OSM_HIGHWAY_TYPES) :
                                        JSON.stringify(ALL_OSM_HIGHWAY_TYPES)
                      )

      fetch(
        `${ DAMA_HOST }/dama-admin/${ pgEnv }/osm/isochrone`,
        { method: "POST", body: formData }
      ).then(res => res.json())
        .then(json => {
          console.log("ISOCHRONE RES:", json);
          const c = json.ok ? json.result.collection : EMPTY_COLLECTION;
          setIsochroneResultCollection(c);
        })
        .finally(() => setLoading(false));

    }, [okToSendIsochroneRequest, points, conflationDataView,
        pgEnv, startDate, endDate, startTime, endTime, excludeResidential
      ]);

    React.useEffect(() => {
      if (!map || map._removed) return;

      if (!map.getSource(IsochroneResultSource.id)) {
        map.addSource(IsochroneResultSource.id, IsochroneResultSource.source);
      }

      if (map.getSource(IsochroneResultSource.id)) {
        map.addLayer(IsochroneResultLayer);
      }

      return () => {
        if (!map || map._removed) return;

        if (map.getLayer(IsochroneResultLayer.id)) {
          map.removeLayer(IsochroneResultLayer.id);
        }
        if (map.getSource(IsochroneResultSource.id)) {
          map.removeSource(IsochroneResultSource.id);
        }
      }
    }, [map]);

    React.useEffect(() => {
      if (!map || map._removed) return;

      if (map.getSource(IsochroneResultSource.id)) {
        map.getSource(IsochroneResultSource.id).setData(isochroneResultCollection);
      }
    }, [map, isochroneResultCollection]);

    const colorScale = React.useMemo(() => {
      const num = markers.length - 1;
      return getColorScale(num);
    }, [markers]);

    const [minimized, setMinimized] = React.useState(false);
    const toggle = React.useCallback(e => {
      setMinimized(min => !min);
    }, []);

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
            <div className="border-b-2 border-current font-bold">
              OSM Data Source and View
            </div>
{/*
            <div className="">
              <OsmDataViewSelector setOsmDataView={ setOsmDataView }/>
            </div>
*/}
            <div className="mb-2">
              <ConflationDataViewSelector setConflationDataView={ setConflationDataView }/>
            </div>

            <div className="border-b-2 border-current font-bold">
              Date and Time
            </div>
            <div className="grid grid-cols-2 gap-1 mb-2">
              <div className="text-sm">
                <div className="font-medium text-center">Start Date</div>
                <input type="date"
                  className="text-sm px-2 py-1 bg-white shadow cursor-pointer w-full"
                  onChange={ doSetStartDate }
                  value={ startDate }/>
              </div>
              <div className="text-sm">
                <div className="font-medium text-center">End Date</div>
                <input type="date"
                  className="text-sm px-2 py-1 bg-white shadow cursor-pointer w-full"
                  onChange={ doSetEndDate }
                  value={ endDate }/>
              </div>
              <div className="text-sm">
                <div className="font-medium text-center">Start Time</div>
                <input type="time"
                  className="text-sm px-2 py-1 bg-white shadow cursor-pointer w-full"
                  onChange={ doSetStartTime }
                  value={ startTime }/>
              </div>
              <div className="text-sm">
                <div className="font-medium text-center">End Time</div>
                <input type="time"
                  className="text-sm px-2 py-1 bg-white shadow cursor-pointer w-full"
                  onChange={ doSetEndTime }
                  value={ endTime }/>
              </div>
            </div>

            <div className="border-b-2 border-current font-bold">
              Residential Roadway Filter (Isochrone Requests only)
            </div>
            <div className="grid grid-cols-5 gap-1 mb-2">
              <div className={ `
                  col-span-4 text-sm
                  ${ !okToSendIsochroneRequest ? "opacity-50" : "" }
                ` }
              >
                Exlude Residential Roadways
              </div>
              <input type="checkbox"
                className="cursor-pointer disabled:hover:cursor-not-allowed disabled:opacity-50"
                checked={ excludeResidential }
                onChange={ toggleResidential }
                disabled={ !okToSendIsochroneRequest }/>
            </div>

            <div className="border-b-2 border-current font-bold">
              { !points.length ?
                "Hold control and click map to add a point..." :
                "Selected Points"
              }
            </div>
            { !points.length ?
                <PointInstructions /> :
                <div className="text-sm">
                  { points.map((p, i) => (
                      <Point key={ i } { ...p } index={ i }
                        bgColor={ colorScale(i) }
                        remove={ removeMarker }/>
                    ))
                  }
                </div>
            }

            <div className="grid grid-cols-2 gap-1 text-sm">

              <Button disabled={ !points.length || loading }
                onClick={ removeLast }
              >
                Remove Last Point
              </Button>
              <Button disabled={ !points.length || loading }
                onClick={ clearMarkers }
              >
                Remove All Points
              </Button>

              <Button disabled={ !okToSendRoutingRequest || loading }
                onClick={ sendRoutingRequest }
                className="bg-green-200 hover:bg-green-400 disabled:hover:bg-green-200"
              >
                Send Routing Request
              </Button>
              <div>
                <Button disabled={ !okToSendIsochroneRequest || loading }
                  onClick={ sendIsochroneRequest }
                  className="bg-green-200 hover:bg-green-400 disabled:hover:bg-green-200"
                >
                  Send Isochrone Request
                </Button>
              </div>

              <Button disabled={ !hasOsmResultFeature || loading }
                onClick={ clearOsmResultFeature }
              >
                Remove Routing Feature
              </Button>
              <Button disabled={ !hasIsochroneResultCollection || loading }
                onClick={ clearIsochroneResultCollection }
              >
                Remove Isochrone Collection
              </Button>

            </div>
          </>
        }

      </div>
    );
  },
};

const PointInstructions = () => {
  return (
    <div className="text-sm">
      <div>
        Routes require at least 2 points.
      </div>
      <div>
        Isochrones must include only a single point.
      </div>
    </div>
  );
}

const Point = ({ lng, lat, index, remove, bgColor }) => {
  const doRemove = React.useCallback(e => {
    remove(index);
  }, [remove, index]);
  return (
    <div className="px-2 py-1 flex items-center first:rounded-t last:rounded-b"
      style={ {
        backgroundColor: bgColor
      } }
    >
      <div className="flex-1 text-sm">
        { lng.toFixed(4) }, { lat.toFixed(4) }
      </div>
      <div className="flex justify-center w-8 text-red-600 hover:text-red-700">
        <Button onClick={ doRemove }>
          <span className="fa-solid fa-trash"/>
        </Button>
      </div>
    </div>
  )
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

const OSM_DATA_CATEGORIES = ["OSM Data"];
const OSM_DATA_COLUMNS = ["osm_id", "wkb_geometry"];

// const OsmDataViewSelector = ({ setOsmDataView }) => {

//   const { pgEnv, falcor, falcorCache } = React.useContext(DamaContext);

//   const [createState, setCreateState] = React.useState({
//     osmDataSourceId: null,
//     osmDataViewId: null
//   });

//   useFetchSources({ falcor, falcorCache, pgEnv });
//   const osmDataSources = useGetSources({ falcorCache,
//                                           pgEnv,
//                                           categories: OSM_DATA_CATEGORIES,
//                                           columns: OSM_DATA_COLUMNS
//                                       });

//   useFetchSourceViews({ falcor, falcorCache, pgEnv, source_id: createState.osmDataSourceId });
//   const osmDataViews = useGetViews({ falcorCache, pgEnv, source_id: createState.osmDataSourceId });

//   React.useEffect(() => {
//     setOsmDataView(createState.osmDataViewId);
//   }, [setOsmDataView, createState.osmDataViewId]);

//   return (
//     <SourceAndViewSelectors
//       label="OSM Data"

//       sources={ osmDataSources }
//       sourceKey="osmDataSourceId"
//       sourceValue={ createState.osmDataSourceId }

//       views={ osmDataViews }
//       viewKey="osmDataViewId"
//       viewValue={ createState.osmDataViewId }

//       setCreateState={ setCreateState }/>
//   )
// }

const CONFLATION_DATA_CATEGORIES = ["OSM Conflation"];
const CONFLATION_DATA_COLUMNS = ["osm", "ris", "tmc", "osm_fwd"];

const ConflationDataViewSelector = ({ setConflationDataView }) => {

  const dctx = React.useContext(DamaContext);
  const cctx = React.useContext(CMSContext);
  const ctx = dctx?.falcor ? dctx : cctx;
  const { falcor, falcorCache } = ctx || {};
  const pgEnv = 'npmrds2'

  const [createState, setCreateState] = React.useState({
    conflationDataSourceId: null,
    conflationDataViewId: null
  });

  useFetchSources({ falcor, falcorCache, pgEnv });
  const conflationDataSources = useGetSources({ falcorCache,
                                          pgEnv,
                                          categories: CONFLATION_DATA_CATEGORIES,
                                          columns: CONFLATION_DATA_COLUMNS
                                      });

  useFetchSourceViews({ falcor, falcorCache, pgEnv, source_id: createState.conflationDataSourceId });
  const conflationDataViews = useGetViews({ falcorCache, pgEnv, source_id: createState.conflationDataSourceId });

  React.useEffect(() => {
    setConflationDataView(createState.conflationDataViewId);
  }, [setConflationDataView, createState.conflationDataViewId]);

  return (
    <SourceAndViewSelectors
      label="Conflation Data"

      sources={ conflationDataSources }
      sourceKey="conflationDataSourceId"
      sourceValue={ createState.conflationDataSourceId }

      views={ conflationDataViews }
      viewKey="conflationDataViewId"
      viewValue={ createState.conflationDataViewId }

      setCreateState={ setCreateState }/>
  )
}
