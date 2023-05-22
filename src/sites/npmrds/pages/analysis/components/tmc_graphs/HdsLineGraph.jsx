import React from "react"

import styled from "styled-components"

import HdsGraphComp, { HDS_DATA_TYPES } from "./graphClasses/HdsGraphComp"

// import LineGraph from "./components/LineGraph"
// import { ResponsiveLine } from "@nivo/line"
import { LineGraph } from "~/modules/avl-graph/src"

import { rollup } from "d3-array"

import get from "lodash/get"

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

const NONE_DATA = { key: 'none', name: 'None' };
const HDS_DATA_TYPES_2 = [
  NONE_DATA,
  ...HDS_DATA_TYPES
]

class RouteLineGraph extends HdsGraphComp {
	componentWillUnmount() {
		super.componentWillUnmount();

		unregister(`${ this.props.id }-left`);
		unregister(`${ this.props.id }-right`);
	}
	componentDidUpdate(oldProps) {
		super.componentDidUpdate(...arguments);

		const stateRes = get(this.props, `state.resolution`, null);
		if ((stateRes !== null) && (stateRes !== this.getResolution())) {
			this.setResolution(null);
		}
	}
	// componentWillUnmount() {
	// 	super.componentWillUnmount();
  //
  //   unregister(`${ this.props.id }-left`);
  //   unregister(`${ this.props.id }-right`);
	// }
	getResolution() {
		const defaultRes = get(this.props, `station_comps[0].settings.resolution`, 'hour'),
			stateRes = get(this.props, `state.resolution`, defaultRes),
			stations = this.props.station_comps.filter(station => station.settings.resolution === stateRes);
		return stations.length ? stateRes : defaultRes;
	}
	getActiveStationComponents() {
		const resolution = this.getResolution(),
			activeStationComponents = get(this.props, 'state.activeStationComponents', []);
		if (activeStationComponents.length) {
			return this.props.station_comps.filter(({ compId }) => activeStationComponents.includes(compId));
		}
		return this.props.station_comps.filter(station => station.settings.resolution === resolution);
	}
	setResolution(resolution) {
		this.props.updateGraphComp(this.props.index, { state: { resolution, activeStationComponents: null } });
	}
	setHdsData1(dd1) {
		const [, { key }] = this.getHdsData();
		this.props.updateGraphComp(this.props.index, { state: { hdsData: [dd1, key] } });
	}
	setHdsData2(dd2) {
		const [{ key }] = this.getHdsData();
		this.props.updateGraphComp(this.props.index, { state: { hdsData: [key, dd2] } });
	}
	getHdsData() {
		const keys = get(this.props, 'state.hdsData', ['volume', 'none']);
		if (keys.length === 1) {
			keys.push('none');
		}

		return keys.map(key => HDS_DATA_TYPES_2.find(d => d.key === key));
	}
	generateHeaderData(graphData, stationComps, [dd1, dd2], resolution) {
		const resolutions = [...new Set(this.props.routes.map(r => r.settings.resolution))],
			stations = this.props.station_comps.filter(({ settings }) => settings.resolution === resolution)
        .map(sc => ({ key: sc.compId, name: sc.name })),

			headerData = [
				{ type: 'single-select-hds-data',
					onChange: this.setHdsData1.bind(this)
				},

				{ type: 'single-select',
					title: "HDS Data 2",
					value: get(dd2, 'key', 'none'),
					domain: HDS_DATA_TYPES_2,
					onChange: this.setHdsData2.bind(this)
				},
			];

		if (stations.length > 1) {
			headerData.unshift({
				type: "multi-select-station",
				domain: stations
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
	generateGraphData(stationComps, hdsData, resolution) {
		return hdsData.reduce((graphData, dd, i) => {
			if (dd.key === 'none') return graphData;

			const { key, reducer, label } = dd;

			const data = stationComps
				.filter(station => get(station, `data[${ key }].length`, 0))
				.reduce((a, station, ii) => {
					const stationData = get(station, `data[${ key }]`, []);

					const rolled = rollup(stationData, v => reducer(v), d => d.resolution);

					const lineData = {
						id: `${ station.compId }-${ i }`,
						name: station.name,
						color: station.color,
						yAxis: i === 0 ? "left" : "right",
						label,
						data: []
					};
					rolled.forEach((y, x) => {
						lineData.data.push({ x, y })
					})
					lineData.data.sort(getResolutionSort(resolution, d => d.x))
					a.push(lineData);
					return a;
				}, []);

			graphData.push(...data);

			return graphData;
		}, [])
	}
	generateTableData(graphData, stationComps, [dd1, dd2], resolution) {
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
	renderGraph(graphData, stationComps, [dd1, dd2], resolution) {
		const resFormat = getResolutionFormat(resolution);

		const leftGraphData = graphData.filter(({ yAxis }) => yAxis === "left"),
			[, lMax] = register(this.props.type, dd1, resolution, `${ this.props.id }-left`, leftGraphData.reduce((a, c) => [...a, ...c.data.map(({ y }) => y)], []));

		const rightGraphData = graphData.filter(({ yAxis }) => yAxis === "right"),
			[, rMax] = register(this.props.type, dd2, resolution, `${ this.props.id }-right`, rightGraphData.reduce((a, c) => [...a, ...c.data.map(({ y }) => y)], []));

		const marginLeft = 75, marginRight = dd2.key === "none" ? 20 : 75;

		return (
			<LineGraph data={ leftGraphData }
				shouldComponentUpdate={ ["data"] }
				secondary={ rightGraphData }
				colors={ d => d.color }
				margin={ {
					top: 20,
					bottom: 25,
					left: marginLeft,
					right: marginRight
				} }
				hoverComp={ {
					yFormat: ",d",
					xFormat: resFormat,
					idFormat: (v, data) => data.name,
					showTotals: false
				} }
			  axisBottom={ {
			  	format: resFormat,
					tickDensity: 2
			  } }
			  axisLeft={ {
			    label: `${ dd1.label } (${ dd1.key })`,
					showGridLines: false
			  } }
			  axisRight={ {
			  	label: `${ dd2.label } (${ dd2.key })`,
					showGridLines: false
			  } }/>
		)
	}
}
export default HdsGraphComp.connect(RouteLineGraph)
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
