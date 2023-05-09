import React from "react"

import GeoAtts from "./GeoAtts"
import MeasureLineGraph from "./MeasureLineGraph"
import MeasureList from "./MeasureList"

const PM3Measures = [
  { measure: "lottr_interstate",
    name: "Interstate Level of Travel Time Reliability",
    colors: ["red", "black", "green"]
  },
  { measure: "lottr_noninterstate",
    name: "Non-Interstate Level of Travel Time Reliability",
    colors: ["red", "black", "green"]
  },
  { measure: "tttr_interstate",
    name: "Truck Travel Time Reliability",
    colors: ["green", "black", "red"]
  },
  { measure: "phed",
    name: "Peak Hours of Excessive Delay",
    colors: ["green", "black", "red"]
  }
]

const Radios = ({ view, setView }) => {
  const doSetView = React.useCallback(e => {
    setView(e.target.id);
  }, [setView]);
  return (
    <div className="flex">
      <div className="flex mr-8">
        <div className="mr-1">View Graphs</div>
        <input type="radio" name="view" id="graphs"
          checked={ view === "graphs" }
          onChange={ doSetView }/>
      </div>
      <div className="flex">
        <div className="mr-1">View Charts</div>
        <input type="radio" name="view" id="charts"
          checked={ view === "charts" }
          onChange={ doSetView }/>
      </div>
    </div>
  )
}

const PM3Viewer = props => {
  const [view, setView] = React.useState("graphs")
  return (
    <div className="grid grid-cols-1 gap-4">
      <GeoAtts { ...props }/>
      <Radios view={ view } setView={ setView }/>
      <div className={ view === "graphs" ? "block grid grid-cols-1 gap-4" : "hidden" }>
        { PM3Measures.map(m => (
            <MeasureLineGraph key={ m.measure } { ...m } { ...props }/>
          ))
        }
      </div>
      <div className={ view === "charts" ? "block grid grid-cols-1 gap-4" : "hidden" }>
        { PM3Measures.map(m => (
            <MeasureList key={ m.measure } { ...m } { ...props }/>
          ))
        }
      </div>
    </div>
  )
}

export default PM3Viewer
