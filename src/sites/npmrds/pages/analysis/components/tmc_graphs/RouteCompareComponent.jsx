import React from "react"

import GeneralGraphComp from "./graphClasses/GeneralGraphComp"

import TableContainer from "./components/TableContainer"

import get from "lodash/get"

import {
	BASE_DATA_TYPES,
	INDICES_BY_DATE_RANGE
} from "./utils/dataTypes"

import {
	hexColorToRgb
} from "./utils"

class RouteCompare extends GeneralGraphComp {
	DATA_TYPES = [
		...BASE_DATA_TYPES,
		...INDICES_BY_DATE_RANGE
	]

	getActiveRouteComponents() {
		const [main, ...rest] = get(this.props, 'state.activeRouteComponents', this.props.routes.map(r => r.compId));
		return [
			...this.props.routes.filter(r => r.compId === main),
			...this.props.routes.filter(r => rest.includes(r.compId))
		]
	}

	setMainRouteComp(main) {
		const [, ...rest] = this.getActiveRouteComponents(),
			update = [main, ...rest.map(r => r.compId).filter(d => d !== main)];
		this.props.updateGraphComp(this.props.index, { state: { activeRouteComponents: update } });
	}
	setSelectedRouteComps(others) {
		const [{ compId }] = this.getActiveRouteComponents(),
			update = [compId, ...others];
		this.props.updateGraphComp(this.props.index, { state: { activeRouteComponents: update } });
	}
	generateHeaderData(graphData, [main, ...rest], displayData, resolution) {
		if (!main) return [];
		
		const routeComps = this.mapRouteComps(this.props.routes, true);
		return [
			{
				title: "Main",
				value: main.compId,
				domain: routeComps,
				onChange: this.setMainRouteComp.bind(this),
				type: 'single-select'
			},
			{
				title: "Compare",
				value: rest.map(d => d.compId),
				domain: routeComps.filter(({ key }) => key !== main.compId),
				onChange: this.setSelectedRouteComps.bind(this),
				type: 'multi-select'
			},
			{ type: 'multi-select-data' }
		]
	}
	generateGraphData(routes, displayData, resolution) {
		return routes.map(route => {
			const year = this.getMaxYear(route),
				columns = displayData.map(dd => {
				const { key, group, reducer, allReducer } = dd,
					data = get(route, `data.${ key }`, []);
				switch(group) {
					case "indices-byDateRange": {
						const value = reducer(data, this.props.tmcGraph, year);
						return { displayData: dd, value };
					};
					default: {
						const value = allReducer(data, this.props.tmcGraph, year);
						return { displayData: dd, value };
					}
				}
			})
			return { route, columns }
		});
	}
	generateTableData([baseData, ...restData], [baseRoute, ...restRoutes], displayData, resolution) {
		const data = [];
		restData.forEach(({ columns, route }) => {
			columns.forEach(({ displayData, value }, i) => {
				const baseValue = baseData.columns[i].value;
				data.push({
					"Base Route": baseRoute.name,
					"Compare Route": route.name,
					"Data Type": displayData.name,
					"Base Value": baseValue,
					"Compare Value": value,
					"Percent Difference": ((baseValue - value) / baseValue) * 100
				})
			})
		})
		return { data, keys: ["Base Route", "Compare Route", "Data Type", "Base Value", "Compare Value", "Percent Difference"] };
	}
	renderGraph(graphData, routes, displayData, resolution) {
		return (
			<TableContainer>
				<thead>
					<tr>
						<th>Route Name</th>
						{ displayData.map(({ name, key }) => <th key={ key }>{ name || key }</th>)}
					</tr>
				</thead>
				<tbody>
					{
						graphData.slice(0, 1).map(row =>
							<tr key="main" style={ { backgroundColor: hexColorToRgb(row.route.color, 0.5) } }>
								<td>
									{ row.route.name }
								</td>
								{
									row.columns.map((c, i) => <td key={ i }>{ c.value ? c.displayData.format(c.value) : "No Data" } { c.value ? c.displayData.label : '' }</td>)
								}
							</tr>
						)
					}
					{
						graphData.slice(1).map((row, i) =>
							<CompareRow key={ i } row={ row } main={ graphData[0] }/>
						)
					}
				</tbody>
			</TableContainer>
		);
	}
}
export default GeneralGraphComp.connect(RouteCompare)

const CompareRow = ({ row, main }) => {
	return (
		<tr>
			<td style={ { backgroundColor: hexColorToRgb(row.route.color, 0.5) } }>
				{ row.route.name }
			</td>
			{
				row.columns.map((c, i) => <CompareTD key={ i } data={ c } main={ main.columns[i] }/>)
			}
		</tr>
	)
}
const BACKGROUND_COLORS = {
	"-1": "rgba(200, 0, 0, 0.25)",
	"0": "rgba(0, 0, 200, 0.25)",
	"1": "rgba(0, 200, 0, 0.25)"
}
const CompareTD = ({ data, main }) => {
	const { displayData: { reverseColors, label, format }, value } = data;
	let bg = 0;
	if (value && main.value) {
		bg = reverseColors ? Math.sign(main.value - value) : Math.sign(value - main.value);
	}
	return (
		<td style={ { backgroundColor: BACKGROUND_COLORS[bg] } }>
			<div>{ value ? format(value) : "No Data" } { value ? label : '' }</div>
			{ !value || !main.value ? null :
				<div>
					<span className={ `fa fa-lg ${ main.value > value ? 'fa-caret-down' : main.value < value ? 'fa-caret-up' : 'fa-minus' }` }/>
					{ " " }
					<span>
						{ Math.abs(((value - main.value) / main.value) * 100).toFixed(2) }%
					</span>
				</div>
			}
		</td>
	)
}
