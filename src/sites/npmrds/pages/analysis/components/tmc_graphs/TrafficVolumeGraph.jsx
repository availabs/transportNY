import React from "react"

import GeneralGraphComp from "./graphClasses/GeneralGraphComp"

// import BarGraph from "./components/BarGraph"
import { BarGraph } from "~/modules/avl-graph/src"

import get from "lodash/get"

import * as d3array from "d3-array"
import * as d3scale from "d3-scale"
// import * as d3format from "d3-format"

import {
	TRAFFIC_VOLUME
} from "./utils/dataTypes"

import {
	disaggregateAADT,
	getDist2
} from "~/sites/npmrds/components"

import {
	getResolutionFormat,
	getResolutionSort,
	getResolutionName
} from "./utils/resolutionFormats"

import DateObject from "./utils/DateObject"

import {
	register
} from "./utils/DomainManager"

const getResolutionNumber = resolution => {
	switch (resolution) {
		case "hour":
			return 12;
		case "15-minutes":
			return 3;
		default:
			return 1;
	}
}

class TrafficVolumeGraph extends GeneralGraphComp {
	DATA_TYPES = TRAFFIC_VOLUME

	getDisplayData() {
		const [key] = get(this.props, 'state.displayData', ["vmt"]);
		return TRAFFIC_VOLUME.filter(d => d.key === key);
	}
	getResolution() {
		const [route] = this.getActiveRouteComponents();
		if (route) {
			const { resolution } = route.settings;
			switch (resolution) {
				case "hour":
				case "15-minutes":
					return resolution;
				default:
					return "5-minutes";
			}
		}
		return "5-minutes"
	}
	generateHeaderData() {
		return [
			{ type: "single-select-route" },
			{ type: "single-select-data" }
		]
	}
	generateGraphData([route], [{ key, reducer, transform }], resolution) {
		if (!route) return [];

		const aadtMap = get(route, ["data", "aadt"], [])
			.reduce((a, c) => {
				a[c.tmc] = c.value;
				return a;
			}, {})

		const year = this.getMaxYear(route),
			tmcArray = get(route, "tmcArray", []),

			// overrideAADT = get(route, ["settings", "overrides", "aadt"], false),

			resNum = getResolutionNumber(resolution),

			{ startTime, endTime } = get(route, "settings", {}),
			start = Math.floor(DateObject.timeStringToEpoch(startTime) / resNum),
			end = Math.floor(DateObject.timeStringToEpoch(endTime) / resNum),

			data = tmcArray.reduce((data, tmc) => {

				// const graph = get(this.props.tmcGraph, `${ tmc }.meta.${ year }`, {}),
					// aadt = overrideAADT || get(graph, `aadt`, 0),
				const graph = get(this.props.tmcGraph, `${ tmc }.meta.${ year }`, {}),
					aadt = get(aadtMap, tmc, 0),
					dist = getDist2(graph, tmc),
					disagg = disaggregateAADT(aadt, dist, 7, resNum * 5),
					length = this.getTmcLength(year, tmc);
				return [...data, ...disagg.map((v, i) => ({ tmc, value: transform(v, length), resolution: i }))]
			}, [])
			.filter(({ resolution }) => (resolution >= start) && (resolution < end));

		const graphData = [];

		switch (key) {
			case "vmt":
				d3array.group(data, d => d.resolution)
					.forEach((group, resolution) => {
						const stack = {
							resolution: resolution.toString()
						}
						group.forEach(({ tmc, value }) => stack[tmc] = value);
						graphData.push(stack)
					});
				break;
			case "aadt":
				d3array.rollup(data, v => reducer(v), d => d.resolution)
					.forEach((value, resolution) => {
							graphData.push({ resolution, value });
					})
				break;
		}
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
				return xScale.ticks(10);
			};
			default:
				return graphData.map(d => d.resolution)
		}
	}
	generateTableData(graphData, [route], [displayData], res) {
		const tmcArray = get(route, "tmcArray", []);

		let data = [],
			keys = [];
		if (displayData.key === "aadt") {
			data = graphData.map(({ resolution, value }) => ({
				"Route Name": get(route, "name", ""),
				"Data Type": displayData.name,
				"Value": value,
				"Resolution Type": getResolutionName(res),
				"Resolution": resolution
			}));
			keys = [
				"Route Name",
				"Data Type",
				"Value",
				"Resolution Type",
				"Resolution"
			]
		}
		else {
			data = graphData.reduce((a, c) => {
				tmcArray.forEach(tmc => {
					a.push({
						"Route Name": get(route, "name", ""),
						"TMC": tmc,
						"Data Type": displayData.name,
						"Value": c[tmc],
						"Resolution Type": getResolutionName(res),
						"Resolution": c.resolution
					})
				})
				return a;
			}, []);
			keys = [
				"Route Name",
				"TMC",
				"Data Type",
				"Value",
				"Resolution Type",
				"Resolution"
			]
		}
		const tableData = { data, keys };
		if (displayData.key === "vmt") {
			tableData.rowsPerPage = tmcArray.length;
		}
		return tableData;
	}
	renderGraph(graphData, [route], [displayData], resolution) {
		const tmcArray = get(route, "tmcArray", []),
			domain = displayData.key === "aadt" ?
			graphData.map(({ value }) => value) :
			graphData.reduce((a, c) => [...a, tmcArray.reduce((aa, tmc) => aa + c[tmc], 0)], []);

		const [, max] = register(this.props.type,
												displayData,
												resolution,
												this.props.id,
												domain);

		const resFormat = getResolutionFormat(resolution)

		return (
			<BarGraph data={ graphData }
				shouldComponentUpdate={ ["data"] }
				indexBy="resolution"
				keys={ displayData.key === "vmt" ? tmcArray : ["value"] }
				margin={ {
					"top": 20,
					"bottom": 25,
					"right": 20,
					"left": 70
				} }
				hoverComp={ {
					indexFormat: resFormat,
					valueFormat: ",.2f"
				} }
			  axisLeft={ {
			    "label": displayData.label
			  } }
			  axisBottom={ {
			  	"format": resFormat,
			  	"tickDensity": 2
			  } }/>
		)
	}
}
export default GeneralGraphComp.connect(TrafficVolumeGraph)
