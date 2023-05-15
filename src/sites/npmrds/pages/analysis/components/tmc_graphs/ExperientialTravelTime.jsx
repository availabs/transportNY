import React from "react"

// import { ResponsiveBar } from "@nivo/bar"
// import BarGraph from "./components/BarGraph"
import { BarGraph } from "~/modules/avl-graph/src"

import GeneralGraphComp from "./graphClasses/GeneralGraphComp"

import { toMinutesWithSeconds } from "./utils/dataTypes"

import get from "lodash/get"

import * as d3array from "d3-array"
import * as d3scale from "d3-scale"
import { format } from "d3-format"

import {
	getResolutionFormat,
	// getResolutionSort
} from "./utils/resolutionFormats"

const DATA_TYPES = [
  { key: "experiential",
    label: "Minutes" }
];

const makeTimeString = time => {
	const f = format("02d"),
		hour = Math.floor(time / 60),
		minutes = Math.floor(time - hour * 60),
		seconds = (time - Math.trunc(time)) * 60;
	return `${ f(hour) }:${ f(minutes) }:${ f(seconds) }`;
}

const HoverComp = ({ data, format, indexBy, resFormat }) =>
	<table className="table table-sm">
		<thead>
			<tr>
				<th>{ data.k }</th>
				<th>{ format(data.v) }</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>Start Time</td>
				<td>{ resFormat(data[indexBy]) }</td>
			</tr>
			<tr>
				<td>End Time</td>
				<td>{ resFormat(+data[indexBy] + (+data.bar.total / 5)) }</td>
			</tr>
			<tr>
				<td>Total</td>
				<td>{ format(data.bar.total) }</td>
			</tr>
		</tbody>
	</table>

class ExperientialTravelTime extends GeneralGraphComp {
  DATA_TYPES = [...DATA_TYPES]
	getDisplayData() {
		return this.DATA_TYPES;
	}
	generateGraphData([route], [displayData]) {
    const experiential = get(route, 'data.experiential', []),
      groups = d3array.group(experiential, d => d.start),
      data = [];
    groups.forEach((rows, start) => {
      const stack = { start: start.toString(), asSeconds: {}, total: 0 };
      rows.sort((a, b) => a.index - b.index)
        .forEach(({ tmc, tt }) => {
          stack[tmc] = tt / 60;
					stack.asSeconds[tmc] = tt;
          stack.total += stack[tmc];
        })
      data.push(stack)
    })
    return data;
	}
	generateTableData(graphData, [route], [displayData], resolution) {
		if (!route) return [];
		const tmcArray = route.tmcArray,
			data = graphData.reduce((a, c) => {
				const start = +c.start *5;
				let travelTime = 0;
				tmcArray.forEach((tmc, i) => {
					a.push({
						"Route Name": route.name,
						"Start Time": makeTimeString(start),
						"End Time": makeTimeString(start + +c.total),
						"Total Travel Time": `${ toMinutesWithSeconds(c.total) } Minutes`,
						"TMC": tmc,
						"TMC Index": i,
						"Arrival Time": makeTimeString(start + travelTime),
						"Travel Time": `${ toMinutesWithSeconds(c[tmc]) } Minutes`,
						"Data Type": "Experiential Travel Time",
					})
					travelTime += c[tmc];
				})
				return a;
			}, [])
		return {
			data, rowsPerPage: tmcArray.length,
			keys: ["Route Name", "Data Type", "Start Time", "End Time", "Total Travel Time", "TMC", "TMC Index", "Arrival Time", "Travel Time"]
		};
	}
	generateHeaderData(graphData, [route], [displayData]) {
		return [
			{ type: "single-select-route" }
		]
	}
// 	axisBottomTickValues(graphData) {
//     const xDomain = graphData.map(d => +d.start),
//       xScale = d3scale.scaleLinear()
//         .domain([d3array.min(xDomain), d3array.max(xDomain)]);
//
// console.log("TICK VALUES:", [...new Set(xScale.ticks(10).map(d => Math.trunc(d)))].sort())
//
//     return [...new Set(xScale.ticks(10).map(d => Math.trunc(d)))].sort();
// 	}
	renderGraph(graphData, [route], [displayData]) {
    const resFormat = getResolutionFormat("5-minutes");
		return (
			<BarGraph data={ graphData }
				shouldComponentUpdate={ ["data"] }
				indexBy="start"
				keys={ get(route, "tmcArray", []) }
				axisLeft={ {
					"label": displayData.label
				} }
			  axisBottom={ {
			  	"format": resFormat,
					tickDensity: 2
			  	// "tickValues": this.axisBottomTickValues(graphData)
			  } }
				margin={ {
					top: 20,
					right: 20,
					bottom: 25,
					left: 50
				} }/>
		)
	}
}
export default GeneralGraphComp.connect(ExperientialTravelTime)
