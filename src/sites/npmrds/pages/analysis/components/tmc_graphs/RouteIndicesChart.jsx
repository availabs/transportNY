import React from "react"

import GeneralGraphComp from "./graphClasses/GeneralGraphComp"

import get from "lodash.get"

import { rollup } from "d3-array"

import {
	INDICES_BY_DATE_RANGE
} from "./utils/dataTypes"

import {
	hexColorToRgb
} from "./utils"

class RouteIndicesChart extends GeneralGraphComp {
	getActiveRouteComponents() {
		const compIds = get(this.props, 'state.activeRouteComponents', this.props.routes.map(d => d.compId));
		return this.props.routes.filter(r => compIds.includes(r.compId));
	}
	getDisplayData() {
		const keys = get(this.props, 'state.displayData', INDICES_BY_DATE_RANGE.map(i => i.key));
		return INDICES_BY_DATE_RANGE.filter(i => keys.includes(i.key));
	}
	generateHeaderData() {
		return [
			{ type: "multi-select-route" },
			{ type: "multi-select-data",
				domain: INDICES_BY_DATE_RANGE }
		]
	}
	generateGraphData(routes, displayData) {
		return routes.map(route => ({
			route,
			columns: displayData.map(dd => {
				const { key, round, reducer, indexReducer, transform } = dd,
					data = get(route, `data.${ key }`, []);
				let value = undefined;
				if (data.length) {
					if (indexReducer) {
						value = round(indexReducer(data, this.props.tmcGraph))
					}
					else {
// FIXME: Deprecated tmc_attributes API Route/Graph Path
						value = round(reducer(data, d => transform(d.value, get(this.props.tmcGraph, `${ d.tmc }.attributes.length`, 0))));
					}
				}
				return {
					dd,
					value
				}
			})
		}))
	}
	renderGraph(graphData, routes, displayData) {
		return (
			<div style={ { height: "100%", padding: "10px 20px", overflowY: "auto" } }>
				<table className="table table-sm">
					<thead>
						<tr>
							<th>Route Name</th>
							{
								displayData.map(dd => <th key={ dd.key }>{ dd.name }</th>)
							}
						</tr>
					</thead>
					<tbody>
						{
							graphData.map(({ route, columns }, i) =>
								<tr key={ i } style={ { backgroundColor: hexColorToRgb(route.color, 0.5) } }>
									<td>{ route.name }</td>
									{
										columns.map(({ dd, value }) =>
											<td key={ dd.key }>
												{ value || "No Data" }{ value ? dd.label ? ` ${ dd.label }` : "" : "" }
											</td>
										)
									}
								</tr>
							)
						}
						{ graphData.length !== 2 ? null :
							<CompareRow data={ graphData } displayData={ displayData }/>
						}
					</tbody>
				</table>
			</div>
		)
	}
}
export default GeneralGraphComp.connect(RouteIndicesChart)

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
