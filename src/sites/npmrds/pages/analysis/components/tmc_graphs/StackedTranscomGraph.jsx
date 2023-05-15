import React from "react"

// import { ResponsiveBar } from "@nivo/bar"

import { BarGraph } from "~/modules/avl-graph/src"

import GeneralGraphComp from "./graphClasses/GeneralGraphComp"

import get from "lodash/get"

import * as d3array from "d3-array"

const CATEGORIES = [
	"accident",
	"construction",
	"other"
]

class StackedTranscomGraph extends GeneralGraphComp {
	getActiveRouteComponents() {
		return this.props.routes;
	}
	getDisplayData() {
		return [{ key: "transcom" }]
	}
	generateGraphData(routeComps, displayData, resolution) {
		return routeComps.reduce((graphData, route, i) => {
			const transcom = get(route, 'data.transcom', []),
				groups = d3array.group(transcom, d => d.event_category),
				data = {
					compId: route.compId,
					name: route.name,
					color: route.color,
					types: {
						accident: [],
						construction: [],
						other: []
					}
				};
			let hasData = false;
			groups.forEach((categoryGroup, category) => {
				hasData = hasData || Boolean(categoryGroup.length);
				data[category] = categoryGroup.length;
				d3array.group(categoryGroup, d => d.event_type.toLowerCase())
					.forEach((typeGroup, type) => {
						data.types[category].push({ type: type, num: typeGroup.length });
					});
			})
			if (hasData) {
				graphData.push(data);
			}
			return graphData;
		}, []);
	}
	generateTableData(graphData, routes, [displayData], res) {
		const data = graphData.reduce((a, c) => {
			Object.keys(c.types)
				.forEach(category => {
					c.types[category].forEach(({ type, num }) => {
						a.push({
							"Route Name": c.name,
							"Event Category": category,
							"Event Type": type,
							"Number of Events": num
						})
					})
				})
			return a;
		}, []);
		return {
			data,
			keys: ["Route Name", "Event Category", "Event Type", "Number of Events"]
		};
	}
	renderGraph(graphData, routeComps) {
		const indexFormat = compId => routeComps
			.reduce((a, c) => compId === c.compId ? c.name : a, "unknown");
		return (
			<BarGraph data={ graphData }
				shouldComponentUpdate={ ["data"] }
				indexBy="compId"
				padding={ 0.25 }
				keys={ CATEGORIES }
				margin= { {
					top: 20,
					right: 120,
					bottom: 25,
					left: 35
				} }
				hoverComp={ {
					indexFormat,
					valueFormat: ",d"
				} }
				axisBottom={ {
					"format": indexFormat
				}	}/>
		)
	}
}

export default GeneralGraphComp.connect(StackedTranscomGraph)

const Tooltip = ({ id, data }) => {
	const tableData = data.types[id].sort((a, b) => b.num - a.num),
		numTds = Math.ceil(tableData.length / 5),
		rows = [];
	for (let i = 0; i < tableData.length; i += numTds) {
		rows.push(tableData.slice(i, i + numTds).reduce((a, c) => [...a, c.type, c.num], []));
	}
	return (
		<table className="table table-sm" style={ { marginBottom: 0 } }>
			<tbody>
				{
					rows.map((row, i) =>
						<tr key={ i }>
							{
								row.map((d, i) =>
									<td key={ i }>{ d }</td>
								)
							}
						</tr>
					)
				}
			</tbody>
		</table>
	)
}
