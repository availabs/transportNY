import React from "react"

import deepequal from "deepequal"
import get from "lodash.get"
import { useParams } from "react-router-dom"

import {
  Button,
  useFalcor
} from "modules/avl-components/src"

import RouteSaveModal from "./RouteSaveModal"

const InfoBox = props => {

  const { falcor, falcorCache } = useFalcor();

  const ways = get(props, ["layer", "state", "ways"], []);
  const tmcs = get(props, ["layer", "state", "tmcs"], []);
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

  return (
    <>
      <div className="grid grid-cols-1 gap-2 pb-1">
        <div>
          { creationMode === "markers" ?
              "Click map to place markers to define a route." :
              "Select a geography and click TMCs to define a route."
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
            <div className="border-b-2 border-current mb-1 font-bold text-lg">
              TMC List
            </div>
            <div className="overflow-auto scrollbar-sm"
              style={ { maxHeight: "300px" } }
            >
              { tmcs.map(tmc => (
                  <div key={ tmc }>
                    { tmc }
                  </div>
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
