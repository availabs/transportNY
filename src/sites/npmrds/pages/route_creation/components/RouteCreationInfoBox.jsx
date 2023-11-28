import React from "react"

import get from "lodash/get"
import { format as d3format } from "d3-format"
import { useParams } from "react-router-dom"

import {
  Button,
  useFalcor
} from "~/modules/avl-components/src"

import RouteSaveModal from "./RouteSaveModal"

const format = d3format(",.2f")

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

  const { routeId } = useParams();

  React.useEffect(() => {
    if (!routeId) return;
    falcor.get([
      "routes2", "id", routeId,
      ["id", "name", "description", "folder",
        "points", "tmc_array"
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
        tmc_array: get(data, ["tmc_array", "value"], [])
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

  const totalMiles = React.useMemo(() => {
    return format(tmcs.reduce((a, c) => {
      return a + get(falcorCache, ["tmc", c, "meta", year, "miles"], 0)
    }, 0));
  }, [tmcs, falcorCache]);

  const doHighlight = React.useCallback(tmc => {
    props.layer.setHighlightedTmcs(tmc);
  }, [props.layer.setHighlightedTmcs])

  return (
    <>
      <div className="grid grid-cols-1 gap-2 pb-1">
        <div>
          { creationMode === "markers" ?
              "Click map to place markers to define a route." :
              "Click TMCs to define a route."
          }
        </div>
        <div className="border-t-2 border-current"/>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={ removeLast }
            disabled={ !(points.length || tmcs.length) }
          >
            Remove Last
          </Button>
          <Button onClick={ clearAll }
            disabled={ !(points.length || tmcs.length) }
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
              style={ { maxHeight: "450px" } }
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
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={ open }
            disabled={ !(points.length || tmcs.length) && !loadedRoute }
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
        loadedRoute={ loadedRoute }/>
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
        <div className="font-bold flex-1">
          { tmc }
        </div>
        <div className="text-sm">
          { format(get(falcorCache, ["tmc", tmc, "meta", year, "miles"], 0)) } miles
        </div>
      </div>
      <div className="text-sm">
        { get(falcorCache, ["tmc", tmc, "meta", year, "roadname"]) } { get(falcorCache, ["tmc", tmc, "meta", year, "direction"]) }
      </div>
    </div>
  )
}
