import React from "react"

import GeneralGraphComp from "./graphClasses/GeneralGraphComp"

import get from "lodash/get"
import isEqual from "lodash/isEqual"

import * as d3array from "d3-array"
import * as d3selection from "d3-selection"
import * as d3scale from "d3-scale"
import * as d3axis from "d3-axis"
import * as d3transition from "d3-transition"
import * as d3format from "d3-format"

import {
	getColorRange
} from "~/modules/avl-components/src"

import {
	getResolutionFormat,
	getResolutionSort,
	getResolutionName
} from "./utils/resolutionFormats"

// import COLOR_RANGES from "constants/color-ranges"
// const COLOR_RANGE = COLOR_RANGES[5].reduce((a, c) => c.name === "RdYlGn" ? c.colors : a).slice();
const COLOR_RANGE = getColorRange(5, "RdYlGn")

class RouteDifferenceGraph extends GeneralGraphComp {
	getActiveRouteComponents() {
		if (this.props.routes.length < 2) return [];

		let comp1, comp2;

		const [fromState1, fromState2] = get(this.props, 'state.activeRouteComponents', []);

// console.log("<RouteDifferenceGraph.getActiveRouteComponents>", fromState1, fromState2)
		comp1 = this.props.routes.find(r => r.compId === fromState1);
		comp2 = this.props.routes.find(r => r.compId === fromState2);

		if (!comp1 && !comp2) {
			comp1 = this.props.routes[0];
			comp2 = this.props.routes
								.find(r => r.compId !== comp1.compId &&
											r.settings.resolution === comp1.settings.resolution &&
											isEqual(r.tmcArray, comp1.tmcArray));
		}
		else if (comp1 && !comp2) {
			comp2 = this.props.routes
								.find(r => r.compId !== comp1.compId &&
											r.settings.resolution === comp1.settings.resolution &&
											isEqual(r.tmcArray, comp1.tmcArray));
		}
		else if (!comp1 && comp2) {
			comp1 = this.props.routes
								.find(r => r.compId !== comp2.compId &&
											r.settings.resolution === comp2.settings.resolution &&
											isEqual(r.tmcArray, comp2.tmcArray));
		}

// console.log("<RouteDifferenceGraph.getActiveRouteComponents>", comp1, comp2)
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
	generateHeaderData(graphData, [route1, route2]) {
		const routes = this.mapRouteComps(this.props.routes),
			compareRoutes = this.mapRouteComps(
				this.props.routes.filter(r =>
					(r.compId === get(route2, 'compId', null)) || (
						(r.settings.resolution === get(route1, 'settings.resolution', 'unknown')) &&
						(r.compId !== get(route1, 'compId', null)) &&
						(isEqual(r.tmcArray, get(route1, 'tmcArray', [])))
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
			{ type: "single-select-data" }
		];
	}
	generateGraphData(routeComps, [displayData], resolution) {
		if (routeComps.length < 2) return [];

		const {
			key,
			// transform,
			reducer
		} = displayData;

		const [comp1, comp2] = routeComps,

			data1 = get(comp1, `data.${ key }`, []),
			data2 = get(comp2, `data.${ key }`, []),

			dataMap = {};

		const year1 = this.getMaxYear(comp1),
			year2 = this.getMaxYear(comp2),

			rolled1 = d3array.rollup(data1, v => reducer(v, this.props.tmcGraph, year1), d => d.resolution),
			rolled2 = d3array.rollup(data2, v => reducer(v, this.props.tmcGraph, year2), d => d.resolution);

		rolled1.forEach((value, resolution) => {
			if (rolled2.has(resolution)) {
				dataMap[resolution] = {
					y1: value
				}
			}
		})
		rolled2.forEach((value, resolution) => {
			if (resolution in dataMap) {
				dataMap[resolution].y2 = value;
				const { y1, y2 } = dataMap[resolution];
				dataMap[resolution].diff = y1 - y2;
				dataMap[resolution].y1 = y1;
				dataMap[resolution].y2 = y2;
			}
		})

		return Object.keys(dataMap).map(x => ({
			...dataMap[x],
			x: +x
		})).sort(getResolutionSort(resolution));
	}
	generateTableData(graphData, [route1, route2], [displayData], res) {
		const data = graphData.map(({ y1, y2, diff, x }) => ({
			"Route 1": route1.name,
			"Route 2": route2.name,
			"Data Type": displayData.name,
			"Value 1": y1,
			"Value 2": y2,
			"Difference": diff,
			"Resolution Type": getResolutionName(res),
			"Resolution": x
		}));
		return {
			data,
			keys: ["Route 1", "Route 2", "Data Type", "Value 1", "Value 2", "Difference", "Resolution Type", "Resolution"]
		};
	}
	axisBottomTickValues(graphData, resolution) {
		switch (resolution) {
			case "5-minutes":
			case "15-minutes":
			case "hour": {
				const xDomain = graphData.map(d => +d.x),
					xScale = d3scale.scaleLinear()
						.domain([d3array.min(xDomain), d3array.max(xDomain)]);
				return xScale.ticks(10);
			};
			default:
				return graphData.map(d => +d.x)
		}
	}
	renderGraph(graphData, routes, [{ reverseColors, label, format }], resolution, colorRange) {
		return (
			<DifferenceBarGraph
				data={ graphData }
				colorRange={ colorRange }
			  axisLeft={ {
			    "legend": `Difference in ${ label }`
			  } }
			  axisBottom={ {
			  	"format": getResolutionFormat(resolution),
			  	"tickValues": this.axisBottomTickValues(graphData, resolution)
			  } }
			  tooltipFormat={ v => `${ format(v) } ${ label }` }/>
		)
	}
}
export default GeneralGraphComp.connect(RouteDifferenceGraph)

class DifferenceBarGraph extends React.Component {
	state = {
		graph: d3DifferenceBarGraph()
	}
	container = React.createRef();
	componentDidMount() {
		this.interval = setInterval(this.resize.bind(this), 50);
		this.updateGraph();
	}
	componentWillUnmount() {
		clearInterval(this.interval);
	}
	componentDidUpdate(oldProps) {
		if (!isEqual(this.props.data, oldProps.data) ||
				!isEqual(this.props.colorRange, oldProps.colorRange)) {
			this.updateGraph();
		}
	}
	resize() {
		if (!this.container.current) return;

		const width = this.container.current.scrollWidth,
			height = this.container.current.scrollHeight;

		if ((width !== this.state.width) || (height !== this.state.height)) {
			this.setState({ width, height });
			this.updateGraph(true);
		}
	}
	updateGraph(resizing = false) {
		if (!this.container.current) return;

		const {
			data,
			colorRange,
			axisLeft,
			axisBottom,
			tooltipFormat
		} = this.props;

		d3selection.select(this.container.current)
			.call(
				this.state.graph
					.resizing(resizing)
					.data(data)
					.colorRange(colorRange)
					.axisLeft(axisLeft)
					.axisBottom(axisBottom)
					.tooltipFormat(tooltipFormat)
			);
	}
	render() {
		return (
			<div style={ { height: "100%" } } ref={ this.container }>
				<svg style={ { width: "100%", height: "100%", display: "block" } }/>
			</div>
		)
	}
}
// //
function d3DifferenceBarGraph() {
	let data = [],
		margin = {
			top: 20,
			right: 20,
			bottom: 20,
			left: 50
		},
		resizing = false,
		colorRange = COLOR_RANGE.slice(),
		axisLeft = null,
		axisBottom = null,
		hoverComp = HoverComp(),
		div = null,
		tooltipFormat = v => v;

	function graph(selection) {
		div = selection;

		selection.on("mousemove", mousemove)

		const node = selection.node(),
			width = node.scrollWidth - margin.left - margin.right,
			height = node.scrollHeight - margin.top - margin.bottom;

		const xScale = d3scale.scaleBand()
			.domain(data.map(d => d.x))
			.range([0, width]);

		const diffExtent = d3array.extent(data, d => d.diff),
			diffMax = Math.max(...diffExtent.map(Math.abs));

		const heightScale = d3scale.scaleLinear()
			.domain([0, diffMax])
			.range([0, height * 0.5]);

		const colorScale = d3scale.scaleQuantize()
			.domain([-diffMax, diffMax])
			.range(colorRange);

		const yScale = d3scale.scaleLinear()
			.domain([-diffMax, diffMax])
			.range([height, 0])

		const svg = selection.select("svg");

		let gridGroup = svg.select("g.grid-group");
		if (!gridGroup.size()) {
			gridGroup = svg.append("g")
				.attr("class", "grid-group")
		}
		gridGroup.style("transform", `translate(${ margin.left }px, ${ margin.top }px)`)

		let graphGroup = svg.select("g.graph-group");
		if (!graphGroup.size()) {
			graphGroup = svg.append("g")
				.attr("class", "graph-group")
		}
		graphGroup.style("transform", `translate(${ margin.left }px, ${ margin.top }px)`)

		const gridLines = gridGroup.selectAll("line.grid")
			.data(yScale.ticks())

		gridLines.enter().append("line")
			.attr("class", "grid")
			.attr("x1", 0)
			.attr("x2", width)
			.attr("y1", height * 0.5)
			.attr("y2", height * 0.5)
			.attr("stroke", "rgba(200, 200, 200, 0.3)")
			.attr("stroke-width", 2)
			// .transition(d3transition.transition().duration(1000))
				.attr("y1", d => yScale(d))
				.attr("y2", d => yScale(d))

		gridLines.exit()
			// .transition(d3transition.transition().duration(1000))
				.attr("y1", height * 0.5)
				.attr("y2", height * 0.5)
			.remove();

		if (resizing) {
			gridLines
				.attr("x1", 0)
				.attr("x2", width)
				.attr("y1", d => yScale(d))
				.attr("y2", d => yScale(d))
		}
		else {
			gridLines
				// .transition(d3transition.transition().duration(1000))
				.attr("x1", 0)
				.attr("x2", width)
				.attr("y1", d => yScale(d))
				.attr("y2", d => yScale(d))
		}

		const rects = graphGroup.selectAll("rect")
			.data(data, d => d.x);

		rects.enter().append("rect")
			.attr("x", d => xScale(d.x))
			.attr("width", xScale.bandwidth())
			.attr("height", 0)
			.attr("y", height * 0.5)
			.attr("fill", d => colorScale(d.diff))
			.on("mouseenter", mouseenter)
			.on("mouseleave", mouseleave)
			// .transition(d3transition.transition().duration(1000))
				.attr("y", d => d.diff > 0 ? (height * 0.5) - heightScale(d.diff) : height * 0.5)
				.attr("height", d => heightScale(Math.abs(d.diff)))
				.attr("fill", d => colorScale(d.diff));

		rects.exit()
			// .transition(d3transition.transition().duration(1000))
				.attr("height", 0)
				.attr("y", height * 0.5)
			.remove()

		if (resizing) {
			rects
				.attr("x", d => xScale(d.x))
				.attr("width", xScale.bandwidth())
				.attr("height", d => heightScale(Math.abs(d.diff)))
				.attr("y", d => d.diff > 0 ? (height * 0.5) - heightScale(d.diff) : height * 0.5)
				.attr("fill", d => colorScale(d.diff));
		}
		else {
			rects
				// .transition(d3transition.transition().duration(1000))
				.attr("x", d => xScale(d.x))
				.attr("width", xScale.bandwidth())
				.attr("height", d => heightScale(Math.abs(d.diff)))
				.attr("y", d => d.diff > 0 ? (height * 0.5) - heightScale(d.diff) : height * 0.5)
				.attr("fill", d => colorScale(d.diff));
		}

		if (axisLeft) {
			let axisLeftGroup = svg.select("g.axis-left");
			if (!axisLeftGroup.size()) {
				axisLeftGroup = svg.append("g")
					.attr("class", "axis-left");
			}

			let yLegend = axisLeftGroup.select("text.y.legend")
			if (!yLegend.size()) {
				yLegend = axisLeftGroup.append("text")
					.attr("class", "y legend")
			}
			yLegend.attr("transform", `translate(15, ${ margin.top + height * 0.5 }) rotate(-90)`)
				.attr("text-anchor", "middle")
				.text(get(axisLeft, "legend", ""))

			let yAxisGroup = axisLeftGroup.select("g.y.axis")
			if (!yAxisGroup.size()) {
				yAxisGroup = axisLeftGroup.append("g")
					.attr("class", "y axis");
			}
			yAxisGroup.style("transform", `translate(${ margin.left }px, ${ margin.top }px)`)

			const yAxis = d3axis.axisLeft()
				.scale(yScale)
			// if (resizing) {
				yAxisGroup.call(yAxis);
			// }
			// else {
			// 	yAxisGroup.transition(d3transition.transition().duration(1000)).call(yAxis);
			// }
		}
		else {
			svg.select("g.axis-bottom").remove()
		}

		if (axisBottom) {
			let axisBottomGroup = svg.select("g.axis-bottom");
			if (!axisBottomGroup.size()) {
				axisBottomGroup = svg.append("g")
					.attr("class", "axis-bottom");
			}
			axisBottomGroup.style("transform", `translate(${ margin.left }px, ${ margin.top + height }px)`);

			let xLegend = axisBottomGroup.select("text.x.legend")
			if (!xLegend.size()) {
				xLegend = axisBottomGroup.append("text")
					.attr("class", "x legend")
			}
			xLegend.attr("transform", `translate(${ width * 0.5 }, ${ margin.top + margin.bottom + height - 5 })`)
				.attr("text-anchor", "middle")
				.text(get(axisLeft, "legend", ""))

			let xAxisGroup = axisBottomGroup.select("g.x.axis")
			if (!xAxisGroup.size()) {
				xAxisGroup = axisBottomGroup.append("g")
					.attr("class", "x axis");
			}

			const xAxis = d3axis.axisBottom(xScale)
			const { format, tickValues } = axisBottom;
			if (format) {
				xAxis.tickFormat(format);
			}
			if (tickValues) {
				xAxis.tickValues(tickValues);
			}

			// if (resizing) {
				xAxisGroup.call(xAxis);
			// }
			// else {
			// 	xAxisGroup.transition(d3transition.transition().duration(1000)).call(xAxis);
			// }
		}
		else {
			svg.select("g.axis-bottom").remove()
		}

		resizing = false;
	}
	graph.tooltipFormat = function(d) {
		if (!arguments.length) {
			return tooltipFormat;
		}
		tooltipFormat = d;
		return graph;
	}
	graph.axisBottom = function(d) {
		if (!arguments.length) {
			return axisBottom;
		}
		axisBottom = d;
		return graph;
	}
	graph.axisLeft = function(d) {
		if (!arguments.length) {
			return axisLeft;
		}
		axisLeft = d;
		return graph;
	}
	graph.colorRange = function(d) {
		if (!arguments.length) {
			return colorRange;
		}
		colorRange = d;
		return graph;
	}
	graph.resizing = function(d) {
		if (!arguments.length) {
			return resizing;
		}
		resizing = d;
		return graph;
	}
	graph.data = function(d) {
		if (!arguments.length) {
			return data;
		}
		data = d;
		return graph;
	}
	return graph;

	function mouseenter(e, d) {
		const format = d3format.format("+.2%");
		hoverComp
			.data([tooltipFormat(d.y1), format((d.diff)/d.y1)])
			.show(true)(div);
	}
	function mousemove(e, d) {
		const pos = d3selection.pointer(e, this);
		hoverComp.pos(pos)(div);
	}
	function mouseleave(e, d) {
		hoverComp.show(false)(div);
	}
}

function HoverComp() {
	let data = [],
		pos = [0, 0],
		show = false;

	function hover(selection) {
		if (!selection.size()) return;

		const node = selection.node(),
			nodeWidth = node.scrollWidth,
			nodeHeight = node.scrollHeight;

		let hoverComp = selection.select("div.hover-comp");
		if (!hoverComp.size()) {
			hoverComp = selection.append("div")
				.attr("class", "hover-comp")
				.style("position", "absolute")
				.style("background-color", "#fff")
				.style("pointer-events", "none")
				.style("padding", "7px 8px 3px 8px")
				.style("border-radius", "4px");
		}

		hoverComp.style("display", show ? "block" : "none")
		if (!show) return;

		hoverComp.selectAll("div")
			.data(data)
			.join("div")
			.style("display", "inline-block")
			.style("padding-left", (d, i) => i === 0 ? "0px" : "10px")
			.text(d => d)

		const [x, y] = pos,

			comp = hoverComp.node(),
			compWidth = comp.scrollWidth,
			compHeight = comp.scrollHeight;

		const left = x + 10 + compWidth > nodeWidth ? x - 10 - compWidth : x + 10,
			top = y + 10 + compHeight > nodeHeight ? nodeHeight - compHeight : y + 10;

		hoverComp
			.style("left", `${ left }px`)
			.style("top", `${ top }px`);
	}
	hover.data = function(d) {
		if (!arguments.length) {
			return data;
		}
		data = d;
		return hover;
	}
	hover.pos = function(p) {
		if (!arguments.length) {
			return pos;
		}
		pos = p;
		return hover
	}
	hover.show = function(s) {
		if (!arguments.length) {
			return show;
		}
		show = s;
		return hover;
	}
	return hover;
}
