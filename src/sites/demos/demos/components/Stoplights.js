import React from "react"

import get from "lodash.get"

import { scaleOrdinal } from "d3-scale"

const Stoplights = ({ stoplights }) => {
  const [ref, setRef] = React.useState(null);

  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    if (!ref) return;
    const { width } = ref.getBoundingClientRect();
    if (width) {
      setWidth(width);
    }
  }, [ref]);

  React.useEffect(() => {

  }, [width])

console.log("???", stoplights)

  return (
    <div ref={ setRef } className="w-full border-b-4 flex">
      { stoplights.map(sl => (
          <div key={ sl.tmc }
            className="flex relative font-bold text-3xl"
            style={ { width: `${ sl.length * 100 }%` } }>
            { sl.lights.map(sl => (
                <span key={ sl.osm_node_id }
                  className="absolute h-6"
                  style={ {
                    left: `${ sl.percent_from_start * 100 }%`,
                    transform: "translate(-50%, -100%)"
                  } }>
                  |
                </span>
              ))
            }
          </div>
        ))
      }
    </div>
  )
}

export default Stoplights
