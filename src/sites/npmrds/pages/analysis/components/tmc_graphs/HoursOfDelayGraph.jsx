import React from "react"

import GeneralGraphComp from "./graphClasses/GeneralGraphComp"

// import BarGraph from "./components/BarGraph"
import { BarGraph } from "~/modules/avl-graph/src"

import get from "lodash/get"

import moment from "moment"

import * as d3array from "d3-array"
import * as d3scale from "d3-scale"

import {
	getResolutionFormat,
	getResolutionSort,
	getResolutionName
} from "./utils/resolutionFormats"

import DATA_TYPES from "./utils/dataTypes"

class HoursOfDelayGraph extends GeneralGraphComp {
	getDisplayData() {
		return DATA_TYPES.filter(d => d.key === "hoursOfDelay");
	}
	generateHeaderData(graphData, [route], [displayData], resolution) {
		return [{ type: "single-select-route" }];
	}
	generateGraphData([route], [displayData], resolution) {
		const routeData = get(route, `data[${ displayData.key }]`, []),
			grouped = d3array.group(routeData, d => d.resolution),
			graphData = [],
			costPerHour = get(this.props, 'state.costPerHour', 0);

		grouped.forEach((group, resolution) => {
			const stack = { resolution };
			group.forEach(({ tmc, value }) => {
				stack[tmc] = value * (+costPerHour || 1);
			})
			graphData.push(stack);
		})
		return graphData.sort(getResolutionSort(resolution));
	}
	axisBottomTickValues(graphData, resolution) {
		switch (resolution) {
			case "5-minutes":
			case "15-minutes":
			case "hour": {
				const xDomain = graphData.map(d => +d.resolution),
					xScale = d3scale.scaleLinear()
						.domain([d3array.min(xDomain), d3array.max(xDomain)]);
				return [...new Set(xScale.ticks(10).map(d => Math.trunc(d)))].sort();
			};
			default:
				// return graphData.map(d => d.resolution)

				const values = graphData.map(d => d.resolution),
					mod = Math.floor(values.length / 10);

				if (values.length > 10) {
					return values.filter((d, i) => (i !== 0) && (i < values.length - mod) && (i % mod === 0))
				}
				return values;
		}
	}
	getScaleDomain(graphData, resolution) {
		if (!graphData.length) return [];

		const WEEKDAYS = [
			"sunday",
			"monday",
			"tuesday",
			"wednesday",
			"thursday",
			"friday",
			"saturday"
		]
		switch (resolution) {
			case "weekday": {
				const extent = d3array.extent(graphData.map(d => WEEKDAYS.indexOf[d.resolution])),
					range = d3array.range(extent[0], extent[1] + 1);
				return range.map(r => WEEKDAYS[r]);
			};
			case "day": {
				const domain = [],
					start = graphData[0].resolution,
					end = graphData[graphData.length -1].resolution,

					startDate = moment(start, "YYYYMMDD");
				while (startDate.format("YYYYMMDD") != end) {
					domain.push(+startDate.format("YYYYMMDD"));
					startDate.add(1, "day");
				}
				domain.push(+startDate.format("YYYYMMDD"));
				return domain;
			};
			default: {
				const extent = d3array.extent(graphData.map(d => +d.resolution));
				return d3array.range(extent[0], extent[1] + 1);
			}
		}
	}
	generateTableData(graphData, [route], [displayData], resolution) {
		const tmcArray = get(route, "tmcArray", []),
			data = graphData.reduce((a, c) => {
				tmcArray.forEach((tmc, i) => {
					a.push({
						"Route Name": route.name,
						"TMC": tmc,
						"Data Type": displayData.name,
						"Value": c[tmc],
						"Resolution Type": getResolutionName(resolution),
						"Resolution": c.resolution
					})
				})
				return a;
			}, [])
		return {
			data, rowsPerPage: tmcArray.length,
			keys: ["Route Name", "TMC", "Data Type", "Value", "Resolution Type", "Resolution"]
		};
	}
	renderGraph(graphData, [route], [displayData], resolution) {
		const costPerHour = get(this.props, 'state.costPerHour', 0);
		const resFormat = getResolutionFormat(resolution);

		return (
			<BarGraph data={ graphData }
				shouldComponentUpdate={ ["data"] }
				showAnimations={ false }
				indexBy="resolution"
				keys={ get(route, "tmcArray", []) }
				margin={ {
					top: 20,
					bottom: 25,
					right: 20,
					left: 80
				} }
			  axisLeft={ {
			    "label": displayData.label,
			    "legendOffset": -65
			  } }
			  axisBottom={ {
			  	"format": resFormat,
			  	"tickDensity": 2
			  } }
				hoverComp={ {
					indexFormat: resFormat,
					valueFormat: ",.2f"
				} }/>
		);
	}
}
export default GeneralGraphComp.connect(HoursOfDelayGraph)
