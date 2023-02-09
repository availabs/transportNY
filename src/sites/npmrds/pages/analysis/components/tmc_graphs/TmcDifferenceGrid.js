import React from "react"

import GeneralGraphComp from "./graphClasses/GeneralGraphComp"

// import TmcGridGraph from "./components/TmcGridGraph"
import { GridGraph } from "modules/avl-graph/src"

import get from "lodash.get"

import deepequal from "deep-equal"

import * as d3array from "d3-array"
import * as d3format from "d3-format"
import * as d3scale from "d3-scale"

import {
	getResolutionFormat,
	getResolutionLabel,
	getResolutionName
} from "./utils/resolutionFormats"

class TmcDifferenceGrid extends GeneralGraphComp {
	getActiveRouteComponents() {
		if (this.props.routes.length < 2) return [];

		let comp1, comp2;

		const [fromState1, fromState2] = get(this.props, 'state.activeRouteComponents', []);

		comp1 = this.props.routes.find(r => r.compId === fromState1);
		comp2 = this.props.routes.find(r => r.compId === fromState2);

		if (!comp1 && !comp2) {
			comp1 = this.props.routes[0];
			comp2 = this.props.routes
								.find(r => r.compId !== comp1.compId &&
											r.settings.resolution === comp1.settings.resolution &&
											deepequal(r.tmcArray, comp1.tmcArray));
		}
		else if (comp1 && !comp2) {
			comp2 = this.props.routes
								.find(r => r.compId !== comp1.compId &&
											r.settings.resolution === comp1.settings.resolution &&
											deepequal(r.tmcArray, comp1.tmcArray));
		}
		else if (!comp1 && comp2) {
			comp1 = this.props.routes
								.find(r => r.compId !== comp2.compId &&
											r.settings.resolution === comp2.settings.resolution &&
											deepequal(r.tmcArray, comp2.tmcArray));
		}

		return [comp1, comp2].filter(Boolean);
	}
	setMainRouteComponent(main) {
		const [, compare] = get(this.props, 'state.activeRouteComponents', []),
			update = [main, compare].filter(Boolean);
		this.props.updateGraphComp(this.props.index, { state: { activeRouteComponents: update } });
	}
	setCompareRouteComponent(compare) {
		const [main] = get(this.props, 'state.activeRouteComponents', []),
			update = [main, compare].filter(Boolean);
		this.props.updateGraphComp(this.props.index, { state: { activeRouteComponents: update } });
	}
	setReverseTMCs(reverseTMCs) {
		this.props.updateGraphComp(this.props.index, { state: { reverseTMCs } });
	}
	getReverseTMCs() {
		return get(this.props, 'state.reverseTMCs', false);
	}
	generateHeaderData(graphData, [route1, route2]) {
		const reverse = this.getReverseTMCs();
		const routes = this.mapRouteComps(this.props.routes),
			compareRoutes = this.mapRouteComps(
				this.props.routes.filter(r =>
					(r.compId === get(route2, 'compId', null)) || (
						(r.settings.resolution === get(route1, 'settings.resolution', 'unknown')) &&
						(r.compId !== get(route1, 'compId', null)) &&
						(deepequal(r.tmcArray, get(route1, 'tmcArray', [])))
					)
				)
			);
		return [
			{
				title: "Main",
				value: get(route1, 'compId', null),
				domain: routes,
				type: 'single-select',
				onChange: this.setMainRouteComponent.bind(this)
			},
			{
				title: "Compare",
				value: get(route2, 'compId', null),
				domain: compareRoutes,
				type: 'single-select',
				onChange: this.setCompareRouteComponent.bind(this)
			},
			{ type: "single-select-data" },
			{
				title: reverse ? "Normalize TMCs" : "Reverse TMCs",
				value: reverse,
				onChange: this.setReverseTMCs.bind(this),
				type: 'boolean-toggle'
			}
		];
	}
	generateGraphData(routes, [displayData]) {
		if (routes.length < 2) return [];

		const [route1, route2] = routes,

			{ key, transform } = displayData,

			data1 = get(route1, `data.${ key }`, []),
			data2 = get(route2, `data.${ key }`, []);

		const tmcArray = [...get(route1, 'tmcArray', [])];
		const reverseTMCs = get(this.props, ["state", "reverseTMCs"], false);
		if (reverseTMCs) {
			tmcArray.reverse();
		}

		if (!data1.length && !data2.length) return [];

		const year1 = this.getMaxYear(route1),
			year2 = this.getMaxYear(route2);

		const group1 = d3array.rollup(data1, v => v.pop(), d => d.tmc, d => d.resolution),
			group2 = d3array.rollup(data2, v => v.pop(), d => d.tmc, d => d.resolution);

		const dataMap = {}

		tmcArray.forEach(tmc => {
			const length1 = this.getTmcLength(year1, tmc),
				length2 = this.getTmcLength(year2, tmc);

			dataMap[tmc] = {
				tmc,
				height: length1,
				route1: route1.name,
				route2: route2.name,
				data: []
			}

			// if (length1 !== length2) return;

			const rGroup1 = group1.get(tmc),
				rGroup2 = group2.get(tmc);

			if (rGroup1 && rGroup2) {
				rGroup1.forEach((data1, resolution) => {
					if (rGroup2.has(resolution)) {
						const data2 = rGroup2.get(resolution),
							value1 = transform(data1.value, length1),
							value2 = transform(data2.value, length2);
						dataMap[tmc][resolution] = value1 - value2;
						dataMap[tmc].data.push({
							tmc,
							year1,
							year2,
							value: value1 - value2,
							resolution,
							value1,
							value2
						})
					}
				})
			}
		})
		return Object.values(dataMap).sort((a, b) => tmcArray.indexOf(a.tmc) - tmcArray.indexOf(b.tmc));
	}
	generateTableData(graphData, routeComps, [displayData], resolution) {
		const data = graphData.reduce((a, c) => {
			const base = {
				"TMC": c.tmc,
				"Length": c.height,
				"Resolution Type": getResolutionName(resolution),
				"Data Type": displayData.name,
				"Route 1": c.route1,
				"Route 2": c.route2
			}
			c.data.forEach(d => {
				a.push({
					...base,
					"Value 1": d.value1,
					"Value 2": d.value2,
					"Difference": d.value,
					"Resolution": d.resolution
				})
			})
			return a;
		}, []);
		return { data, keys: ["TMC", "Length", "Route 1", "Route 2", "Data Type", "Value 1", "Value 2", "Difference", "Resolution Type", "Resolution"] };
	}
	getResolutionKeys(routes, [displayData]) {
		if (routes.length < 2) return [];

		const [route1, route2] = routes,

			{ key } = displayData,

			data1 = get(route1, `data.${ key }`, []),
			data2 = get(route2, `data.${ key }`, []);

		if (!data1.length && !data2.length) return [];

		const resolutions = [];

		data1.forEach(({ resolution }) => resolutions.push(resolution));
		data2.forEach(({ resolution }) => resolutions.push(resolution));

		const extent = d3array.extent(resolutions);
		return d3array.range(extent[0], extent[1] + 1);
	}
	getColorScale(graphData, keys, colorRange) {
		const domain = [];
		graphData.forEach(gd => {
			keys.forEach(k => {
				domain.push(gd[k])
			})
		})
		return d3scale.scaleQuantize()
			.domain(d3array.extent(domain))
			.range(colorRange)
	}
	renderGraph(graphData, routes, displayData, resolution, colorRange) {
		const resFormat = getResolutionFormat(resolution),
			resLabel = getResolutionLabel(resolution),
			// formatDiff = d3format.format("+.2f"),
			formatP = d3format.format("+.2%"),
			[{ name, label, reverseColors, format }] = displayData;

		const keys = this.getResolutionKeys(routes, displayData);

		return (
			<GridGraph data={ graphData }
				shouldComponentUpdate={
					["data", "colorRange"]
				}
				indexBy="tmc"
				keys={ keys }
				colors={ this.getColorScale(graphData, keys, colorRange) }
				hoverComp={ {
					valueFormat: ".2f",
					keyFormat: resFormat
				} }
				axisLeft={ {
					label: name
				} }
				margin={ {
					left: 100
				} }
				axisBottom={ {
					tickDensity: 2,
					format: resFormat
				} }
			/>
		)
	}
}
export default GeneralGraphComp.connect(TmcDifferenceGrid)
