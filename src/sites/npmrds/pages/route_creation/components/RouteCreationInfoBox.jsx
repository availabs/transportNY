import React from "react"

import get from "lodash/get"
import { format as d3format } from "d3-format"
import { useParams } from "react-router"

import {
  Button,
  Input,
  useFalcor
} from "~/modules/avl-components/src"

import RouteSaveModal from "./RouteSaveModal"

const format = d3format(",.2f");

const TMC_REGEX = /^\d{3}[pnPN+-]\d{5}$/;

const InfoBox = props => {

  const { falcor, falcorCache } = useFalcor();

  const ways = get(props, ["layer", "state", "ways"], []);
  const tmcs = get(props, ["layer", "state", "tmcs"], []);
  const highlighted = get(props, ["layer", "state", "highlighted"], []);
  const year = props.layer.getYear();
  const markers = get(props, ["layer", "state", "markers"], []);

  const points = markers.map(m => {
    const lngLat = m.getLngLat();
    return {
      lng: lngLat.lng,
      lat: lngLat.lat
    }
  });

  const creationMode = props.layer.state.creationMode;
  const cmDisplay = creationMode === "markers" ? "Marker Placement" : "TMC Clicks"

  const { routeId, folderId } = useParams();

  React.useEffect(() => {
    if (!routeId) return;
    falcor.get([
      "routes2", "id", routeId,
      ["id", "name", "description", "folder",
        "points", "tmc_array", "metadata"
      ]
    ]);
  }, [falcor, routeId]);

  React.useEffect(() => {
    if (!tmcs.length) return;
    falcor.get(["tmc", tmcs, "meta", year, ["roadname", "miles", "direction"]])
  }, [tmcs, year])

  const [loadedRoute, setLoadedRoute] = React.useState(null);

  React.useEffect(() => {
    const data = get(falcorCache, ["routes2", "id", routeId], null);
    if (data) {
      setLoadedRoute({
        id: data.id,
        name: data.name,
        folder: data.folder,
        description: data.description || "",
        points: get(data, ["points", "value"], []),
        tmc_array: get(data, ["tmc_array", "value"], []),
        dates: get(data, ["metadata", "value", "dates"], [])
      });
    }
    else {
      setLoadedRoute(null);
    }
  }, [falcorCache, routeId]);

  const [isOpen, setIsOpen] = React.useState(false);
  const open = React.useCallback(e => {
    setIsOpen(true);
  }, []);
  const close = React.useCallback(e => {
    setIsOpen(false);
  }, []);

  const removeLast = React.useCallback(e => {
    props.layer.removeLast();
  }, [props.layer.removeLast]);
  const clearAll = React.useCallback(e => {
    props.layer.clearAll();
  }, [props.layer.clearAll]);

  const toggleCreationMode = React.useCallback(e => {
    const cm = creationMode === "markers" ? "tmc-clicks" : "markers";
    props.layer.setCreationMode(cm);
  }, [creationMode, props.layer.setCreationMode]);

  const totalMiles = React.useMemo(() => {
    return format(tmcs.reduce((a, c) => {
      return a + get(falcorCache, ["tmc", c, "meta", year, "miles"], 0)
    }, 0));
  }, [tmcs, falcorCache]);

  const doHighlight = React.useCallback(tmc => {
    props.layer.setHighlightedTmcs(tmc);
  }, [props.layer.setHighlightedTmcs]);

  const [tmcSearch, setTmcSearch] = React.useState("");
  const [tmcBoundingBox, setTmcBoundingBox] = React.useState(null);
  const disabled = React.useMemo(() => {
    return !TMC_REGEX.test(tmcSearch);
  }, [tmcSearch]);
  const searchForTmc = React.useCallback(e => {
    falcor.get(["tmc", tmcSearch, "meta", year, "bounding_box"]);
    setTmcBoundingBox("searching");
  }, [falcor, tmcSearch, year]);
  React.useEffect(() => {
    if (tmcBoundingBox === "searching") {
      const bb = get(falcorCache, ["tmc", tmcSearch, "meta", year, "bounding_box", "value"], null);
      if (Array.isArray(bb)) {
        setTmcBoundingBox([[...bb[0]], [...bb[1]]]);
      }
    }
  }, [falcorCache, tmcSearch, year, tmcBoundingBox]);
  React.useEffect(() => {
    if (Array.isArray(tmcBoundingBox)) {
      props.mapboxMap.fitBounds(tmcBoundingBox, { padding: { top: 200, bottom: 200, left: 300, right: 300 } });
    }
  }, [props.mapboxMap, tmcBoundingBox]);

  return (
    <>
      <div className="grid grid-cols-1 gap-2 pb-1">
        <div>
          <Button onClick={ toggleCreationMode } themeOptions={ { width: "full" } }>
            Toggle Creation Mode
          </Button>
        </div>
        <div className="border-y-2 py-1">
          <span className="font-bold mr-1">Creation Mode:</span>{ cmDisplay }
        </div>
        <div>
          { creationMode === "markers" ?
              "Click map to place markers to define a route." :
              "Click TMCs to define a route."
          }
        </div>
        <div className="border-t-2 border-current"/>
        <div>
          <div className="font-bold">TMC Search</div>
          <Input type="text"
            placeholder="Search for a TMC..."
            value={ tmcSearch }
            onChange={ setTmcSearch }
            themeOptions={ { width: "full" } }/>
          <div className="mt-2">
            <Button onClick={ searchForTmc }
              themeOptions={ { width: "full" } }
              disabled={ disabled }
            >
              { disabled ? "Invalid TMC" : "Search for TMC" }
            </Button>
          </div>
        </div>
        <div className="border-t-2 border-current"/>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={ removeLast }
            disabled={ !points.length && !tmcs.length }
          >
            Remove Last
          </Button>
          <Button onClick={ clearAll }
            disabled={ !points.length && !tmcs.length }
          >
            Clear All
          </Button>
        </div>
        { !tmcs.length ? null :
          <div>
            <div className="border-b-2 border-current mb-1 flex items-center">
              <div className="font-bold text-lg flex-1">
                TMC List
              </div>
              <div className="text-sm">
                { totalMiles } total miles
              </div>
            </div>
            <div className="overflow-auto scrollbar-sm"
              style={ { maxHeight: "350px" } }
            >
              { tmcs.map(tmc => (
                  <TmcItem key={ tmc }
                    tmc={ tmc } year={ year }
                    highlight={ doHighlight }
                    highlighted={ highlighted.includes(tmc) }
                  />
                ))
              }
            </div>
            <div className="mt-1 border-t-2 border-current"/>
          </div>
        }
        <div>
          <Button onClick={ open }
            themeOptions={ { width: "full" } }
            disabled={ !tmcs.length && !loadedRoute }
          >
            Save Route
          </Button>
        </div>
      </div>

      <RouteSaveModal
        isOpen={ isOpen }
        close={ close }
        points={ points }
        tmc_array={ tmcs }
        loadedRoute={ loadedRoute }
        folderId={ folderId }/>
    </>
  )
}

export default InfoBox;

const TmcItem = ({ tmc, year, highlight, highlighted }) => {
  const { falcor, falcorCache } = useFalcor();
  const doHighlight = React.useCallback(e => {
    highlight(tmc);
  }, [tmc, highlight]);
  return (
    <div className={ `border-b hover:bg-gray-200 px-1 ${ highlighted ? "bg-gray-200" : "" }` }
      onMouseOver={ doHighlight }
      onMouseOut={ doHighlight }
    >
      <div className="flex items-center">
        <div className="font-bold text-sm flex-1">
          { tmc }
        </div>
        <div className="text-xs">
          { format(get(falcorCache, ["tmc", tmc, "meta", year, "miles"], 0)) } miles
        </div>
      </div>
      <div className="text-xs">
        { get(falcorCache, ["tmc", tmc, "meta", year, "roadname"]) } { get(falcorCache, ["tmc", tmc, "meta", year, "direction"]) }
      </div>
    </div>
  )
}
