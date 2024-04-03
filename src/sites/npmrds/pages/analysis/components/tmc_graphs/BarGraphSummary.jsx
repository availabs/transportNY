import React from "react"

// import { ResponsiveBar } from "@nivo/bar"
import { BarGraph } from "~/modules/avl-graph/src"

import GeneralGraphComp from "./graphClasses/GeneralGraphComp"

import get from "lodash/get"

import {
	BASE_DATA_TYPES,
	INDICES_BY_DATE_RANGE
} from "./utils/dataTypes"

class BarGraphSummary extends GeneralGraphComp {
	DATA_TYPES = [
		...BASE_DATA_TYPES,
		...INDICES_BY_DATE_RANGE
	]
	getActiveRouteComponents() {
		const compIds = get(this.props, 'state.activeRouteComponents', this.props.routes.map(d => d.compId));
		return this.props.routes.filter(r => compIds.includes(r.compId));
	}
	generateGraphData(routes, [displayData], resolution) {
		const { key, group, reducer, allReducer } = displayData;
		return routes.reduce((graphData, route) => {
			const year = this.getMaxYear(route),
				data = get(route, `data.${ key }`, []);
			let value = undefined;
			if (data.length) {
				if (group === "indices-byDateRange") {
					value = reducer(data, this.props.tmcGraph, year);
				}
				else {
					value = allReducer(data, this.props.tmcGraph, year);
				}
			}
			graphData.push({
				key: route.compId,
				name: route.name,
				value,
				color: route.color
			})
			return graphData;
		}, [])
	}
	generateHeaderData(graphData, routes, [displayData]) {
		return [
			{ type: "multi-select-route" },
			{ type: 'single-select-data' }
		]
	}
	generateTableData(graphData, [route], [displayData], resolution) {
		const data = graphData.map(d => ({
			"Route Name": d.name,
			"Data Type": displayData.name,
			"Value": d.value
		}))
		return { data, keys: ["Route Name", "Data Type", "Value"] };
	}
	renderGraph(graphData, routes, [displayData]) {

		const indexFormat = compId => routes.reduce((a, c) => c.compId === compId ? c.name : a, "unknown");

		return (
			<BarGraph
				data={ graphData }
				shouldComponentUpdate={ ["data"] }
				showAnimations={ false }
				indexBy="key"
				keys={ ["value"] }
				colors={ (v, i, data) => data.color }
				padding={ 0.25 }
				hoverComp={ {
					valueFormat: ",.2f",
					indexFormat
				} }
				axisLeft={ {
					label: displayData.label
				} }
				axisBottom={ {
					format: indexFormat,
					tickDensity: 0.5
				} }
				margin={ {
					top: 20,
					right: 20,
					bottom: 25,
					left: displayData.key === "hoursOfDelay" ? 100 : 50
				} }/>
		)
	}
}
export default GeneralGraphComp.connect(BarGraphSummary)

const Tooltip = ({ data, displayData }) =>
	<div>
		<div style={ { width: "15px", height: "15px", backgroundColor: data.color, display: "inline-block" } }/>
		<span style={ { paddingLeft: "10px" } }>{ data.data.name }</span>
		<span style={ { paddingLeft: "10px" } }>{ displayData.name } { displayData.format(data.value) } { displayData.label }</span>
	</div>
