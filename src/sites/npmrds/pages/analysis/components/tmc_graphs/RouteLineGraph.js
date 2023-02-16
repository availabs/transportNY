import React from "react"

import styled from "styled-components"

import GeneralGraphComp from "./graphClasses/GeneralGraphComp"

// import LineGraph from "./components/LineGraph"
// import { ResponsiveLine } from "@nivo/line"
import { LineGraph } from "modules/avl-graph/src"

import { rollup } from "d3-array"

import get from "lodash.get"

import {
	getResolutionFormat,
	getResolutionSort,
	getResolutionLabel,
	getResolutionName,
	getXscaleType,
	getXscaleTickDensity
} from "./utils/resolutionFormats"

import {
	register,
	unregister
} from "./utils/DomainManager"

import DEFAULT_DATA_TYPES from "./utils/dataTypes"
const NONE_DATA = { key: 'none', name: 'None' };
const DATA_TYPES = [
	NONE_DATA,
	...DEFAULT_DATA_TYPES
]

const GraphColors = d => d.color;

class RouteLineGraph extends GeneralGraphComp {
	componentDidUpdate(oldProps) {
		super.componentDidUpdate(...arguments);

		const stateRes = get(this.props, `state.resolution`, null);
		if ((stateRes !== null) && (stateRes !== this.getResolution())) {
			this.setResolution(null);
		}
	}
	componentWillUnmount() {
		super.componentWillUnmount();

    unregister(`${ this.props.id }-left`);
    unregister(`${ this.props.id }-right`);
	}
	getResolution() {
		const defaultRes = get(this.props.routes, `[0].settings.resolution`, '5-minutes'),
			stateRes = get(this.props, `state.resolution`, defaultRes),
			routes = this.props.routes.filter(route => route.settings.resolution === stateRes);
		return routes.length ? stateRes : defaultRes;
	}
	getActiveRouteComponents() {
		const resolution = this.getResolution(),
			activeRouteComponents = get(this.props, 'state.activeRouteComponents', []);
		if (activeRouteComponents.length) {
			return this.props.routes.filter(({ compId }) => activeRouteComponents.includes(compId));
		}
		return this.props.routes.filter(route => route.settings.resolution === resolution);
	}
	setResolution(resolution) {
		this.props.updateGraphComp(this.props.index, { state: { resolution, activeRouteComponents: null } });
	}
	setDisplayData1(dd1) {
		const [, { key }] = this.getDisplayData();
		this.props.updateGraphComp(this.props.index, { state: { displayData: [dd1, key] } });
	}
	setDisplayData2(dd2) {
		const [{ key }] = this.getDisplayData();
		this.props.updateGraphComp(this.props.index, { state: { displayData: [key, dd2] } });
	}
	getDisplayData() {
		const keys = get(this.props, 'state.displayData', ['speed', 'none']);
		if (keys.length === 1) {
			keys.push('none');
		}

		return keys.map(key => DATA_TYPES.find(d => d.key === key));
	}
	generateHeaderData(graphData, routeComps, [dd1, dd2], resolution) {
		const resolutions = [...new Set(this.props.routes.map(r => r.settings.resolution))],
			routes = this.mapRouteComps(this.props.routes.filter(({ settings }) => settings.resolution === resolution)),

			headerData = [
				{ type: 'single-select-data',
					onChange: this.setDisplayData1.bind(this)
				},

				{ type: 'single-select',
					title: "Display Data 2",
					value: get(dd2, 'key', 'none'),
					domain: DATA_TYPES,
					onChange: this.setDisplayData2.bind(this)
				},
			];

		if (routes.length > 1) {
			headerData.unshift({
				type: "multi-select-route",
				domain: routes
			})
		}
		if (resolutions.length > 1) {
			headerData.unshift({
				title: "Resolution",
				value: resolution,
				domain: [...resolutions],
				onChange: this.setResolution.bind(this),
				type: 'single-select',
				keyAccessor: d => d,
				nameAccessor: d => d
			})
		}
		return headerData;
	}
	generateGraphData(routeComps, displayData, resolution) {
		return displayData.reduce((graphData, dd, i) => {
			if (dd.key === 'none') return graphData;

			const { key, reducer, label } = dd;

			const data = routeComps
				.filter(route => get(route, `data[${ key }].length`, 0))
				.reduce((a, route, ii) => {
					const routeData = get(route, `data[${ key }]`, []),
						year = this.getMaxYear(route);

					const rolled = rollup(routeData, v => reducer(v, this.props.tmcGraph, year), d => d.resolution);

					const lineData = {
						id: `${ route.compId }-${ i }`,
						name: route.name,
						color: route.color,
						yAxis: i === 0 ? "left" : "right",
						label,
						data: []
					};
					rolled.forEach((y, x) => {
						lineData.data.push({ x: isNaN(x) ? x : +x, y: +y })
					})
					lineData.data.sort(getResolutionSort(resolution, d => d.x))
					a.push(lineData);
					return a;
				}, []);

			graphData.push(...data);

			return graphData;
		}, [])
	}
	generateTableData(graphData, routeComps, [dd1, dd2], resolution) {
		const data = graphData.reduce((data, line) => {
			line.data.forEach(({ x, y }) => {
				data.push({
					"Route Name": line.name,
					"Data Type": line.yAxis === "left" ? dd1.name : dd2.name,
					"Value": y,
					"Resolution Type": getResolutionName(resolution),
					"Resolution": x
				})
			})
			return data;
		}, [])
		return { data, keys: ["Route Name", "Data Type", "Value", "Resolution Type", "Resolution"] };
	}
	renderGraph(graphData, routeComps, [dd1, dd2], resolution) {
		const resFormat = getResolutionFormat(resolution);

		const leftGraphData = graphData.filter(({ yAxis }) => yAxis === "left"),
			[, lMax] = register(this.props.type, dd1, resolution, `${ this.props.id }-left`, leftGraphData.reduce((a, c) => [...a, ...c.data.map(({ y }) => y)], []));

		const rightGraphData = graphData.filter(({ yAxis }) => yAxis === "right"),
			[, rMax] = register(this.props.type, dd2, resolution, `${ this.props.id }-right`, rightGraphData.reduce((a, c) => [...a, ...c.data.map(({ y }) => y)], []));

		const marginLeft = dd1.key === "hoursOfDelay" ? 100 : dd1.key === "co2Emissions" ? 75 : 50;
		const marginRight = dd2.key === "hoursOfDelay" ? 100 : dd2.key === "co2Emissions" ? 75 : dd2.key === "none" ? 20 : 50;

		return (
			<LineGraph data={ leftGraphData }
				secondary={ rightGraphData }
				colors={ GraphColors }
				shouldComponentUpdate={
					["data", "secondary", "yScale", "secScale"]
				}
				xScale={ {
					type: "point"
				} }
				yScale={ {
					domain: [0, lMax]
				} }
				secScale={ {
					domain: [0, rMax]
				} }
				margin={ {
					top: 20,
					bottom: 25,
					left: marginLeft,
					right: marginRight
				} }
			  axisBottom={ {
			  	format: resFormat,
					tickDensity: 2
			  } }
			  axisLeft={ {
			    label: dd1.label,
					showGridLines: false
			  } }
			  axisRight={ {
			  	label: dd2.label,
					showGridLines: false
			  } }
			  hoverComp={ {
					idFormat: (id, data) => data.name,
					yFormat: ",.2f",
					showTotals: false
				} }/>
		)
	}
}
export default GeneralGraphComp.connect(RouteLineGraph)
// //
const HoverComp = ({ data, xFormat, xLabel, leftFormat, rightFormat }) =>
	<Table className="table table-sm">
		<thead>
			<tr>
				<th colSpan={ 2 }>{ xLabel }</th>
				<th>{ xFormat(data.x) }</th>
			</tr>
		</thead>
		<tbody>
			{
				data.data.map(d =>
					<tr key={ d.id }>
						<td><Square color={ d.color } align={ d.yAxis }/></td>
						<td>{ d.name }</td>
						<td>{ (d.yAxis === "left" ? leftFormat : rightFormat)(d.data.y) } { d.label }</td>
					</tr>
				)
			}
		</tbody>
	</Table>

const Table = styled.table`
	&.table {
		margin: 0px;
	}

	thead > tr > th,
	tbody > tr > td {
		padding-bottom: 0px;
	}
`

const Square = styled.div`
	width: 14px;
	height: 14px;
	background: ${
		props => props.align === "left" ? props.color :
			`repeating-linear-gradient(90deg, ${ props.color }, ${ props.color } 2px, #fff 2px, #fff 4px)`
	};
	display: inline-block;
`
