import React from "react"

import GeneralGraphComp from "./graphClasses/GeneralGraphComp"

import get from "lodash.get"

import * as d3array from "d3-array"
import * as d3scale from "d3-scale"

import {
	getResolutionFormat,
	getResolutionLabel,
	getResolutionName
} from "./utils/resolutionFormats"

// import TmcGridGraph from "./components/TmcGridGraph"
import { GridGraph } from "modules/avl-graph/src"

import {
	register
} from "./utils/DomainManager"

class Graph extends GeneralGraphComp {
	setReverseTMCs(reverseTMCs) {
		this.props.updateGraphComp(this.props.index, { state: { reverseTMCs } });
	}
	getReverseTMCs() {
		return get(this.props, 'state.reverseTMCs', false);
	}
	generateHeaderData(graphData, [route], [displayData], resolution) {
		const reverse = this.getReverseTMCs();
		return [
			{ type: "single-select-route" },
			{ type: "single-select-data" },
			{
				title: reverse ? "Normalize TMCs" : "Reverse TMCs",
				value: reverse,
				onChange: this.setReverseTMCs.bind(this),
				type: 'boolean-toggle'
			}
		];
	}
	generateGraphData([route], [displayData], resolution) {
		if (!route) return [];

		const { key, transform } = displayData,
			routeData = get(route, `data.${ key }`, []),
			grouped = d3array.group(routeData, d => d.tmc),
			year = this.getMaxYear(route);

		const tmcArray = [...get(route, 'tmcArray', [])];
		const reverseTMCs = get(this.props, ["state", "reverseTMCs"], false);
		if (reverseTMCs) {
			tmcArray.reverse();
		}

		return tmcArray.reduce((a, tmc) => {
			const length = this.getTmcLength(year, tmc),
				data = grouped.get(tmc) || [];
			if (length) {
				a.push({
					tmc,
					height: length,
					data: data.map(d => ({ ...d, value: transform(d.value, length) })),
					...data.reduce((a, c) => {
						a[c.resolution] = transform(c.value, length)
						return a;
					}, {})
				})
			}
			return a;
		}, []);
	}
	hoverTmc(tmc) {
		this.props.setHighlightedTmcs(tmc ? [tmc] : [])
	}
	generateTableData(graphData, [route], [displayData], resolution) {
		const data = graphData.reduce((a, c) => {
			const base = {
				"TMC": c.tmc,
				"Length": c.height,
				"Resolution Type": getResolutionName(resolution),
				"Data Type": displayData.name,
				"Route Name": route.name
			}
			c.data.forEach(d => {
				a.push({
					...base,
					"Value": d.value,
					"Resolution": d.resolution
				})
			})
			return a;
		}, []);
		return { data, keys: ["Route Name", "TMC", "Length", "Data Type", "Value", "Resolution Type", "Resolution"] };
	}
	getResolutionKeys([route], [displayData]) {
		if (!route) return [];
		if (!displayData) return [];

		const { key } = displayData,

			data = get(route, `data.${ key }`, []);

		if (!data.length) return [];

		const resolutions = [];

		data.forEach(({ resolution }) => resolutions.push(+resolution));

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
		const [{
			name,
			label,
			format,
			key
		}] = displayData;

		const resFormat = getResolutionFormat(resolution),
			resLabel = getResolutionLabel(resolution);

		const [min, max] = register(this.props.type,
												{ key },
												resolution,
												this.props.id,
												graphData.reduce((a, c) => [...a, ...c.data.map(({ value }) => value)], []));

		const keys = this.getResolutionKeys(routes, displayData)
		// const colorScale = this.getColorScale(graphData, keys, colorRange);

		const colorScale = d3scale.scaleQuantize()
			.domain([min, max])
			.range(colorRange);

console.log("TMC GRID GRAPH:", this.props.id, graphData, keys)

		return (
			<GridGraph data={ graphData }
				indexBy="tmc"
				keys={ keys }
				colors={ colorScale }
				axisLeft={ {
					label: name
				} }
				margin={ {
					left: 100
				} }
				axisBottom={ {
					tickDensity: 2,
					format: resFormat
				} }/>
		)
	}
}
export default GeneralGraphComp.connect(Graph)
