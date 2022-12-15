import React from 'react'
import RouteLineGraph from "./RouteLineGraph"
import RouteBarGraph from "./RouteBarGraph"
import HoursofDelayGraph from "./HoursOfDelayGraph"
import RouteMap from "./RouteMap"
import TMCGridGraph from "./TmcGridGraph.comp"
import RouteInfoBox from "./RouteInfoBox"
import TMCInfoBox from "./TmcInfoBox"
import RouteCompareComponent from "./RouteCompareComponent"
import RouteDifferenceGraph from "./RouteDifferenceGraph"
import BarGraphSummary from "./BarGraphSummary"
import TMCDifferenceGrid from "./TmcDifferenceGrid"
import StackedTranscomGraph from "./StackedTranscomGraph"
import TranscomEventsChart from "./TranscomEventsChart"
import TrafficVolumeGraph from "./TrafficVolumeGraph"

import ExperientialTravelTime from "./ExperientialTravelTime"

import HDSBarGraph from "./HdsBarGraph"
import HDSLineGraph from "./HdsLineGraph"

const NA = ({ type, state, routes }) =>
	<div>
		{ type } Not Implmented
		<div>state:<br />{ JSON.stringify(state) }</div>
	</div>

const NE = ((props) => (<div>{props.type} Doesn't Exist</div>))

export default {
	HDSBarGraph,
	HDSLineGraph,

	RouteLineGraph,
	RouteBarGraph,
	HoursofDelayGraph,
	RouteMap,
	TMCGridGraph,
	RouteInfoBox,
	InfoBox: RouteInfoBox,
	TMCInfoBox,
	InfoCompareComponent: RouteCompareComponent,
	RouteCompareComponent,
	RouteDifferenceGraph,
	BarGraphSummary,
	TMCDifferenceGrid,
	StackedTranscomGraph,
	TranscomEventsChart,
	TranscomIncidentsChart: TranscomEventsChart,
	TrafficVolumeGraph,
	ExperientialTravelTime,
	NE,
	NA
}

export const GRAPH_TYPES = [
	{ type: "Route Line Graph", category: "Line Graphs", saveImage: true },
	{ type: "Route Bar Graph", category: "Bar Graphs", saveImage: true, isColorfull: true },
	{ type: "Bar Graph Summary", category: "Bar Graphs", saveImage: true },
	{ type: "Hours of Delay Graph", category: "Bar Graphs", saveImage: true },
	{ type: "Route Map", category: "Maps", isColorfull: true },
	{ type: "TMC Grid Graph", category: "Grid Graphs", saveImage: true, isColorfull: true },
	{ type: "Route Info Box", category: "Tables" },
	{ type: "TMC Info Box", category: "Tables" },
	{ type: "Route Compare Component", category: "Tables" },
	{ type: "Route Difference Graph", category: "Bar Graphs", saveImage: true, isColorfull: true },
	{ type: "TMC Difference Grid", category: "Grid Graphs", saveImage: true, isColorfull: true },
	{ type: "Stacked Transcom Graph", category: "Bar Graphs", saveImage: true },
	{ type: "Transcom Events Chart", category: "Tables" },
	{ type: "Traffic Volume Graph", category: "Bar Graphs", saveImage: true },
	{ type: "Experiential Travel Time", category: "Bar Graphs", saveImage: true },

	{ type: "HDS Bar Graph", category: "HDS Graph", saveImage: true },
	{ type: "HDS Line Graph", category: "HDS Graph", saveImage: true }
]
