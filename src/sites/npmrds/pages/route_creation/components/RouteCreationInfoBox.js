import React from "react"

import get from "lodash.get"

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

  // const [tmcs, setTmcs] = React.useState([]);
  //
  // React.useEffect(() => {
  //   if (!ways.length) return;
  //   falcor.call(["conflation", "tmcs", "from", "ways"], [ways, [year]]);
  // }, [falcor, ways, year]);
  //
  // React.useEffect(() => {
  //   const tmcs = get(falcorCache, ["conflation", "tmcs", "from", "ways", year, "value"], []);
  //   setTmcs(tmcs);
  // }, [falcorCache, year]);

  const [isOpen, setIsOpen] = React.useState(false);
  const open = React.useCallback(e => {
    setIsOpen(true);
  }, []);
  const close = React.useCallback(e => {
    setIsOpen(false);
  }, []);

  const points = React.useMemo(() => {
    return markers.map(m => {
      const lngLat = m.getLngLat();
      return {
        lng: lngLat.lng,
        lat: lngLat.lat
      }
    })
  }, [markers]);

  return (
    <>
      <div className="grid grid-cols-1 gap-2 pb-1">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={ e => props.layer.removeLastMarker() }
            disabled={ !points.length }
          >
            Remove Last
          </Button>
          <Button
            onClick={ e => props.layer.clearAllMarkers() }
            disabled={ !points.length }
          >
            Clear All
          </Button>
        </div>
        { !tmcs.length ? null :
          <div>
            <div className="border-b-2 border-current mb-1 font-bold text-lg">
              TMC List
            </div>
            <div className="overflow-auto"
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
          <Button
            onClick={ open }
            disabled={ !points.length }
          >
            Save Route
          </Button>
        </div>
      </div>

      <RouteSaveModal
        isOpen={ isOpen }
        close={ close }
        points={ points }
        tmc_array={ [] }
        conflation_array={ ways }/>
    </>
  )
}

export default InfoBox;
