import React from "react"

import GeneralGraphComp from "./graphClasses/GeneralGraphComp"

import get from "lodash.get"

import { rollup } from "d3-array"

import TableContainer from "./components/TableContainer"

import {
	BASE_DATA_TYPES,
	TMC_ATTRIBUTES,
	INDICES_BY_DATE_RANGE
} from "./utils/dataTypes"

import {
	hexColorToRgb
} from "./utils"

class TmcInfoBox extends GeneralGraphComp {
	DATA_TYPES = [
		...BASE_DATA_TYPES,
		...TMC_ATTRIBUTES,
		...INDICES_BY_DATE_RANGE
	]

	generateHeaderData(graphData, [route], displayData, resolution) {
		return [
			{ type: 'single-select-route' },
			{ type: "multi-select-data" }
		]
	}
	generateGraphData([route], displayData) {
		if (!route) return [];

		const year = this.getMaxYear(route),
			tmcArray = route.tmcArray,
			overrides = get(route, ["settings", "overrides"], {}),
			rolls = displayData.reduce((rolls, dd) => {
				const { key, alias, group, tmcReducer, transform, overrideValue } = dd,
					KEY = alias || key;
				if (group === 'tmcAttribute') {
					const data = get(route, `data.${ key }`, []);
					rolls.push({
						dd,
						roll: rollup(data, ([{ tmc, value }]) => transform(value, this.getTmcLength(year, tmc)), d => d.tmc)
					})
				}
				else if (group === 'indices-byDateRange') {
					const data = get(route, `data.${ key }`, []);
					rolls.push({
						dd,
						roll: rollup(data, ([{ tmc, value }]) => transform(value, this.getTmcLength(year, tmc)), d => d.tmc)
					})
				}
				else {
					const data = get(route, `data.${ key }`, []);
					rolls.push({
						dd,
						roll: rollup(data, v => tmcReducer(v, this.props.tmcGraph, year), d => d.tmc)
					})
				}
				return rolls;
			}, [])

		if (rolls.length !== displayData.length) return [];

		return tmcArray.map(tmc => {
			return {
				tmc,
				columns: rolls.map(({ dd, roll }) => {
					const value = roll.get(tmc);
					return {
						dd,
						value
					}
				})
			}
		});
	}
	generateTableData(graphData, [route], displayData, resolution) {
		const data = graphData.reduce((a, c) => {
			c.columns.forEach(({ dd, value }) => {
				a.push({
					"Route Name": route.name,
					"TMC": c.tmc,
					"Data Type": dd.name,
					"Value": value
				})
			})
			return a;
		}, [])
		return { data, keys: ["Route Name", "TMC", "Data Type", "Value"] };
	}
	renderGraph(graphData, [route], displayData) {
		return (
			<TableContainer>
				<thead>
					<tr style={ { backgroundColor: hexColorToRgb(get(route, "color", "#fff"), 0.5) } }>
						<th>TMC List</th>
						{ displayData.map(({ name, key }) => <th key={ key }>{ name || key }</th>)}
					</tr>
				</thead>
				<tbody>
					{
						graphData.map(({ tmc, columns }) =>
							<tr key={ tmc } style={ this.props.highlightedTmcs.includes(tmc) ? { backgroundColor: hexColorToRgb(route.color, 0.25) } : null }
								onMouseEnter={ e => this.props.highlightTmcs([tmc]) }
								onMouseLeave={ e => this.props.unhighlightTmcs([tmc]) }>

								<td>{ tmc }</td>
								{
									columns.map(({ dd, value }, i) =>
										<td key={ i }>{ value ? dd.format(value) : "No Data" } { value ?  dd.label : "" }</td>
									)
								}
							</tr>
						)
					}
				</tbody>
			</TableContainer>
		);
	}
}
export default GeneralGraphComp.connect(TmcInfoBox)
