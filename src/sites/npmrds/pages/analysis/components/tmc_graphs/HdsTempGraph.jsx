import React from "react"

import HdsGraphComp from "./graphClasses/HdsGraphComp"

class HdsTempGraph extends HdsGraphComp {
	generateHeaderData() {
		return [
			{ type: "single-select-station" },
			{ type: "single-select-data" }
		]
	}
  renderGraph(graphData, stations, displayData, resolution) {
    return (
      <div>
        HDS TEMP GRAPH
        <div>
          { JSON.stringify(stations) }
        </div>
        <div>
          { JSON.stringify(displayData) }
        </div>
        <div>
          { JSON.stringify(resolution) }
        </div>
      </div>
    )
  }
}
export default HdsGraphComp.connect(HdsTempGraph)
