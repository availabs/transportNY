import React from "react"


const getTransform = i => {
  return `
    translate(${ i % 2 ? "0.25rem" : "-0.5rem" }, 2rem) rotate(45deg)
  `
}

const Stoplights = ({ stoplights }) => {
  return (
    <div className="w-full border-current flex relative h-60">
      { stoplights.map((SL, i) => (
          <div key={ SL.tmc }
            className="flex relative border-b-4 border-l border-current h-8"
            style={ { width: `${ SL.length * 100 }%` } }
          >
            { SL.lights.map(sl => (
                <div key={ sl.osm_node_id }
                  className="absolute bg-black top-0 bottom-0"
                  style={ {
                    height: "1.5rem",
                    width: "0.375rem",
                    left: `${ sl.percent_from_start * 100 }%`,
                    transform: "translate(-50%, 0)"
                  } }>
                  |
                </div>
              ))
            }
            <div style={ { transform: getTransform(i) } }
              className="whitespace-nowrap text-sm origin-left"
            >
              { SL.firstname }
            </div>
          </div>
        ))
      }
    </div>
  )
}

export default Stoplights
