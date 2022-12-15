import React from "react"

import HdsGraphComp, { CLASSES } from "./graphClasses/HdsGraphComp"

// import BarGraph from "./components/BarGraph"
import { BarGraph } from "modules/avl-graph/src"

import get from "lodash.get"

import {
	getResolutionFormat,
	getResolutionSort,
	getResolutionName
} from "./utils/resolutionFormats"

class HdsBarGraph extends HdsGraphComp {
	generateHeaderData() {
		return [
			{ type: "single-select-station" },
			{ type: "single-select-hds-data" }
		]
	}
  generateGraphData([station_comp], [displayData], resolution) {
    if (!station_comp) return [];

    return get(station_comp, ["data", displayData.key], []);
  }
	generateTableData(graphData, [station_comp], [displayData], res) {
		const { key } = displayData;

		if (key === "volume") {
			const data = graphData.map(({ resolution, value }) => ({
				"Station Name": station_comp.name,
				"Data Type": displayData.name,
				"Value": value,
				"Resolution Type": getResolutionName(res),
				"Resolution": resolution
			}))
			return {
				data,
				keys: ["Station Name", "Data Type", "Value", "Resolution Type", "Resolution"]
			};
		}

		const data = CLASSES.reduce((a, c) => {
			const cData = graphData.map(({ resolution, ...rest }) => ({
				"Station Name": station_comp.name,
				"Data Type": displayData.name,
				"Class": c,
				"Value": rest[c],
				"Resolution Type": getResolutionName(res),
				"Resolution": resolution
			}))
			a.push(...cData);
			return a;
		}, []);
		return {
			data,
			keys: ["Station Name", "Data Type", "Class", "Value", "Resolution Type", "Resolution"]
		};
	}
  renderGraph(graphData, [station_comp], [displayData], resolution) {
    const { key } = displayData;
		const resFormat = getResolutionFormat(resolution);
    return (
			<BarGraph data={ graphData }
				indexBy="resolution"
				keys={ key === "volume" ? ["value"] : CLASSES }
				hoverComp={ {
					indexFormat: resFormat,
					valueFormat: ",d",
					keyFormat: () => get(station_comp, "name", "")
				} }
				margin={ {
					top: 20,
					bottom: 25,
					right: 20,
					left: 75
				} }
			  axisLeft={ {
			    "label": displayData.label
			  } }
			  axisBottom={ {
			  	"format": resFormat
			  } }/>
    )
  }
}
export default HdsGraphComp.connect(HdsBarGraph)
