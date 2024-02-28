import React from "react"

import GeneralGraphComp from "./graphClasses/GeneralGraphComp"

import TableContainer from "./components/TableContainer"

import get from "lodash/get"

import {
	BASE_DATA_TYPES,
	TMC_ATTRIBUTES,
	INDICES_BY_DATE_RANGE
} from "./utils/dataTypes"

import {
	hexColorToRgb
} from "./utils"

class RouteInfoBox extends GeneralGraphComp {
	DATA_TYPES = [
		...BASE_DATA_TYPES,
		...TMC_ATTRIBUTES,
		...INDICES_BY_DATE_RANGE
	]
	getActiveRouteComponents() {
		const compIds = get(this.props, 'state.activeRouteComponents', this.props.routes.map(d => d.compId));
		return this.props.routes.filter(r => compIds.includes(r.compId));
	}
	setShowCompare(showCompare) {
		this.props.updateGraphComp(this.props.index, { state: { showCompare } });
	}
	getShowCompare() {
		return get(this.props, 'state.showCompare', false);
	}
	generateHeaderData(graphData, routes, displayData, resolution) {
		const headerData = [
			{ type: "multi-select-route" },
			{ type: "multi-select-data" }
		]
		if (routes.length === 2) {
			const showCompare = this.getShowCompare();
			headerData.push({
				title: showCompare ? "Hide Compare" : "Show Compare",
				value: showCompare,
				onChange: this.setShowCompare.bind(this),
				type: 'boolean-toggle'
			})
		};
		return headerData;
	}
	generateTableData(graphData, routes, displayData, resolution) {
		const data = graphData.reduce((a, c) => {
			c.columns.forEach(({ displayData, value }) => {
				a.push({
					"Route Name": c.route.name,
					"Data Type": displayData.name,
					"Value": value
				})
			})
			return a;
		}, [])
		return { data, keys: ["Route Name", "Data Type", "Value"] };
	}
	generateGraphData(routes, displayData, resolution) {
		return routes.map(route => {
			const year = this.getMaxYear(route),
				overrides = get(route, ["settings", "overrides"], {});
			return {
				route,
				columns: displayData.map(dd => {
					const { key, group, reducer, allReducer, overrideData } = dd;
					let value = undefined;
					switch (group) {
						case "tmcAttribute":
						case "indices-byDateRange": {
							const data = get(route, ["data", key], []);
							value = reducer(data, this.props.tmcGraph, year);
							break;
						};
						default: {
							const data = get(route, ["data", key], []);
							value = allReducer(data, this.props.tmcGraph, year);
							break;
						}
					}
					return { displayData: dd, value };
				})
			}
		})
	}
	renderGraph(graphData, routes, displayData, resolution) {
		const showCompare = this.getShowCompare();
		return (
			<TableContainer>
				<thead>
					<tr>
						<th>Route Name</th>
						{ displayData.map(({ name, key }) => <th key={ key }>{ name }</th>)}
					</tr>
				</thead>
				<tbody>
					{
						graphData.map((row, i) =>
							<tr key={ i } style={ { backgroundColor: hexColorToRgb(row.route.color, 0.5) } }>
								<td>{ row.route.name }</td>
								{
									row.columns.map((c, i) => <td key={ i }>{ c.value ? c.displayData.format(c.value) : "No Data" } { c.value ? c.displayData.label : '' }</td>)
								}
							</tr>
						)
					}
					{ graphData.length !== 2 || !showCompare ? null :
						<CompareRow data={ graphData } displayData={ displayData }/>
					}
				</tbody>
			</TableContainer>
		);
	}
}
export default GeneralGraphComp.connect(RouteInfoBox)

const CompareRow = ({ data: [data1, data2], displayData }) => {
	return (
		<tr>
			<td/>
			{
				displayData.map((dd, i) =>
					<CompareTD key={ dd.key }
						displayData={ dd }
						data1={ data1.columns[i].value }
						data2={ data2.columns[i].value }/>
				)
			}
		</tr>
	)
}
const BACKGROUND_COLORS = {
	"-1": "rgba(200, 0, 0, 0.25)",
	"0": "rgba(0, 0, 200, 0.25)",
	"1": "rgba(0, 200, 0, 0.25)"
}
const CompareTD = ({ displayData, data1, data2 }) => {
	const { reverseColors } = displayData;
	let bg = 0;
	if (data1 && data2) {
		bg = reverseColors ? Math.sign(data1 - data2) : Math.sign(data2 - data1);
	}
	return (
		<td style={ { backgroundColor: BACKGROUND_COLORS[bg] } }>
			{ !data1 || !data2 ? "No Data" :
				<div>
					<span className={ `fa fa-lg ${ data1 > data2 ? 'fa-caret-down' : data1 < data2 ? 'fa-caret-up' : 'fa-minus' }` }/>
					{ " " }
					<span>
						{ bg === 0 ? "" : `${ Math.abs(((data1 - data2) / data1) * 100).toFixed(2) }%` }
					</span>
				</div>
			}
		</td>
	)
}
