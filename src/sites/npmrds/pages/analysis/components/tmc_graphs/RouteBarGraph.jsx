import React from "react"

import GeneralGraphComp from "./graphClasses/GeneralGraphComp"

// import BarGraph from "./components/BarGraph"
import { BarGraph } from "~/modules/avl-graph/src"

import * as d3array from "d3-array"
import * as d3scale from "d3-scale"

import get from "lodash/get"

import moment from "moment"

import {
	getResolutionFormat,
	getResolutionSort,
	getResolutionName
} from "./utils/resolutionFormats"

import {
	register
} from "./utils/DomainManager"

const HoverComp = ({ data, format, indexBy, resFormat, name }) =>
	<div>
		{ name } { format(data.v) } { resFormat(data[indexBy]) }
	</div>
// //
class RouteBarGraph extends GeneralGraphComp {
	generateHeaderData() {
		return [
			{ type: "single-select-route" },
			{ type: "single-select-data" }
		]
	}
	generateGraphData([route], [displayData], resolution) {
		if (!route) return [];

		const { key, reducer } = displayData,
			routeData = get(route, `data[${ key }]`, []),
			graphData = [],
			year = this.getMaxYear(route),
			rolled = d3array.rollup(routeData, v => reducer(v, this.props.tmcGraph, year), d => d.resolution);

		rolled.forEach((value, resolution) => {
			graphData.push({
				value,
				resolution: resolution.toString()
			})
		})
		return graphData.sort(getResolutionSort(resolution));
	}
	generateTableData(graphData, [route], [displayData], res) {
		const data = graphData.map(({ resolution, value }) => ({
			"Route Name": route.name,
			"Data Type": displayData.name,
			"Value": value,
			"Resolution Type": getResolutionName(res),
			"Resolution": resolution
		}))
		return {
			data,
			keys: ["Route Name", "Data Type", "Value", "Resolution Type", "Resolution"]
		};
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
			default: {
				const values = graphData.map(d => d.resolution),
					mod = Math.floor(values.length / 10);

				if (values.length > 10) {
					return values.filter((d, i) => (i !== 0) && (i < values.length - mod) && (i % mod === 0))
				}
				return values;
			}
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
				const extent = d3array.extent(graphData.map(d => WEEKDAYS.indexOf(d.resolution))),
					range = d3array.range(extent[0], extent[1] + 1);
				return range.map(r => WEEKDAYS[r]);
			};
			case "day": {
				const domain = [],
					start = graphData[0].resolution,
					end = graphData[graphData.length -1].resolution,
					startDate = moment(start, "YYYYMMDD");

				while (startDate.format("YYYYMMDD") != end) {
					domain.push(startDate.format("YYYYMMDD"));
					startDate.add(1, "day");
				}
				domain.push(startDate.format("YYYYMMDD"));
				return domain;
			};
			default: {
				return graphData.map(d => d.resolution);
				// const extent = d3array.extent(graphData.map(d => +d.resolution));
				// return d3array.range(extent[0], extent[1] + 1);
			}
		}
	}
	renderGraph(graphData, [route], [displayData], resolution, colorRange) {
		const [min, max] = register(this.props.type,
												displayData,
												resolution,
												this.props.id,
												graphData.map(d => d.value));

		const colorScale = d3scale.scaleQuantize()
			.domain([min, max])
			.range(colorRange);

		const resFormat = getResolutionFormat(resolution);

		const xDomain = this.getScaleDomain(graphData, resolution);

// if (!deepequal(oldProps.data, this.props.data) ||
// !deepequal(oldProps.yScale, this.props.yScale) ||
// !deepequal(oldProps.xScale, this.props.xScale) ||
// !deepequal(oldProps.colorRange, this.props.colorRange)) {
// 	this.updateGraph();
// }

// console.log("RouteBarGraph::graphData", graphData);

		return (
			<BarGraph data={ graphData }
				shouldComponentUpdate={ ["data", "xScale", "yScale", "colorRange"] }
				colorRange={ colorRange }
				indexBy="resolution"
				keys={ ["value"] }
				colors={ colorScale }
				margin={ {
					top: 20,
					bottom: 25,
					right: 20,
					left: displayData.key === "hoursOfDelay" ? 100 :
						displayData.key === "co2Emissions" ? 75 : 50
				} }
				hoverComp={ {
					valueFormat: ",.2f",
					indexFormat: resFormat
				} }
			  axisBottom={ {
			  	format: resFormat,
			  	tickDensity: 1
			  } }
				xScale={ {
					domain: xDomain
				} }
			  axisLeft={ {
			    label: displayData.label
			  } }
				yScale={ {
					domain: [0, max]
				} }/>
		);
	}
}
export default GeneralGraphComp.connect(RouteBarGraph)
