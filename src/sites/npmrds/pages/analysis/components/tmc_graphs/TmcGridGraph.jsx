import React from "react"
import { connect } from "react-redux"
import { reduxFalcor } from 'utils/redux-falcor';

import get from "lodash/get"

import HoverComp from "./HoverComp"

import * as d3scale from "d3-scale"
import * as d3array from "d3-array"
import * as d3axis from "d3-axis"
import { select } from "d3-selection"

import DateObject from "./utils/DateObject"

import COLOR_RANGES from "constants/color-ranges"

// const COLOR_RANGE = COLOR_RANGES[5].reduce((a, c) => c.name === "RdYlGn" ? c.colors : a)
let COLOR_RANGE = COLOR_RANGES[5].reduce((a, c) => c.name === "RdYlBu" ? c.colors : a)

class TmcGridGraph extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			height: 400,
			width: 800
		}
		this.container = React.createRef();
		this.resize = this.resize.bind(this);

		this.axisGroup = React.createRef();
	}
	static defaultProps = {
		tmcs: ["120+05860", "120P05860", "120+05861", "120P05861", "120+05863", "120P05863", "120-05891", "120P05864", "120+05865", "120P05865", "120+05866"],
		date: '2018-06-27',
		fill: true,
		colorRange: COLOR_RANGE,
		activeEpoch: null
	}
	componentDidMount() {
		this.resize();
		window.addEventListener("resize", this.resize);
	}
	componentWillUnmount() {
		window.removeEventListener("resize", this.resize)
	}
	componentDidUpdate(oldProps) {
		if (oldProps.tmcs != this.props.tmcs) {
			this.fetchFalcorDeps()
				.then(() => this.forceUpdate())
		}
		this.resize()
	}
	resize() {
		const div = this.container.current,
			height = div.scrollHeight,
			width = div.scrollWidth;
		if ((height !== this.state.height) || (width !== this.state.width)) {
			this.setState({ width, height });
			this.updateAxis(width);
		}
	}
	updateAxis(width) {
		const { tmcs, tmcGraph} = this.props,
			linears = {};
		const year = this.props.date.split('-')[0];
		tmcs.forEach(tmc => {
// FIXME: Deprecated tmc_attributes API Route/Graph Path
				const tmcLinear = get(tmcGraph, `[${ tmc }].meta.${year}.tmclinear`, 0);
				if (!(tmcLinear in linears)) {
					linears[tmcLinear] = true;
				}
		})
		const //PADDING = Object.keys(linears).length > 1 ? 15 : 15,
			widthPadding = 100,
			adjustedWidth = width - widthPadding * 2,
			axisScale = d3scale.scaleLinear()
				.domain([0, 287])
				.range([0, adjustedWidth]),
			xAxis = d3axis.axisBottom(axisScale)
				.tickValues([48, 96, 144, 192, 240])
				.tickFormat(DateObject.epochToTimeString);

		select(this.axisGroup.current)
			.call(xAxis)
	}
	fetchFalcorDeps() {
		const {
			tmcs,
			date,
			year = date.split('-')[0]
		} = this.props;
// FIXME: Deprecated tmc_attributes API Route/Graph Path
		return this.props.falcor.get(
			['tmc', tmcs, 'meta',year, ['length', 'roadname', 'tmclinear', 'firstname']],
			['tmc', tmcs, 'day', date, ['tt', 'tt_fill']]
		).then(d => {
			return d;
		})
	}
	hover(e, { tmc, epoch }) {
		const x = e.clientX,
			y = e.clientY;
		if (tmc !== undefined) {
			this.setState({ tmc, x, y })
		}
		else if (epoch !== undefined) {
			this.setState({ epoch, x, y })
		}
	}
	render() {

		try {
			const {
				tmcs,
				date,
				year = date.split('-')[0],
				tmcGraph,
				sumsByEpochByTmc,
				activeMeasure,
				activeName = activeMeasure.domain.filter(f => f.value === activeMeasure.value)[0].name,
				// congestionData
			} = this.props;
			const {
				width,
				height,
				tmc,
				epoch,
				x,
				y
			} = this.state;
			const epochs = d3array.range(288),
				lengths = {},
				speeds = {},
				dataType = this.props.fill ? 'tt_fill' : 'tt';

			let roadname = "";

			const linears = [],
				linearsMap = {};
			let index = -1;

			tmcs.forEach((tmc, i) => {
// FIXME: Deprecated tmc_attributes API Route/Graph Path
					roadname = roadname || tmcGraph[tmc].meta[year].roadname;
					const tmcLinear = tmcGraph[tmc].meta[year].tmclinear;
					if (!(tmcLinear in linearsMap)) {
						++index;
						linearsMap[tmcLinear] = index;
						linears.push([]);
					}
					linears[linearsMap[tmcLinear]].push(tmc);
			})
			roadname = roadname || "Unknown";

			const PADDING = Object.keys(linears).length > 1 ? 15 : 15,
				horizontalPadding = 150,
				widthPadding = 100,
				adjustedHeight = height - (Object.keys(linears).length - 1) * PADDING - 60,
				adjustedWidth = width - widthPadding * 2,
				boxWidth = adjustedWidth / 288,
				linearLengths = {};

			let totalTmcLength = 0;

			for (const index in linears) {
				const tmcs = linears[index];
				let linearLength = 0;
				tmcs.forEach(tmc => {
// FIXME: Deprecated tmc_attributes API Route/Graph Path
					lengths[tmc] = tmcGraph[tmc].meta[year].length;
					linearLength += lengths[tmc];
					totalTmcLength += lengths[tmc];
				})
				linearLengths[index] = linearLength;
			}


			let tmcFirstNames = [];
			for (const tmptmc in tmcGraph) {
				if (!tmcFirstNames.includes( tmcGraph[tmptmc].meta[year].firstname ) ) tmcFirstNames.push( tmcGraph[tmptmc].meta[year].firstname)
			}

			const gridGraphs = [];
			let groupTranslate = 0;

			linears.forEach((tmcs, i) => {
				let domain = [],
					height = adjustedHeight * (linearLengths[i] / totalTmcLength);

				let maxLength = 0;
				tmcs.forEach(tmc => {
// FIXME: Deprecated tmc_attributes API Route/Graph Path
					speeds[tmc] = {};
					lengths[tmc] = tmcGraph[tmc].meta[year].length;
					maxLength += lengths[tmc];
					epochs.forEach(epoch => {
						if (tmcGraph[tmc].day[date][dataType].value[epoch]) {
							speeds[tmc][epoch] = sumsByEpochByTmc[tmc][epoch];
							domain.push(sumsByEpochByTmc[tmc][epoch])
						}
					})


					/*lengths[tmc] = tmcGraph[tmc].meta[year].length;
					speeds[tmc] = {}
					maxLength += lengths[tmc];
					epochs.forEach(epoch => {
						if (tmcGraph[tmc].day[date][dataType].value[epoch]) {
							const tt = tmcGraph[tmc].day[date][dataType].value[epoch],
								speed = (lengths[tmc] / tt) * 3600;
							speeds[tmc][epoch] = speed;
							domain.push(speed)
						}
					})*/

				})
				const heightScale = d3scale.scaleLinear()
					.domain([0, maxLength])
					.range([0, height])
				//domain = this.props.colorDomain
				COLOR_RANGE = this.props.colorRange
				const colorScale = d3scale.scaleQuantile()
					.domain(domain)
					.range(COLOR_RANGE)

				let current = 0;
				let activeIncidentEpoch = Object.keys(this.props.layer.activeIncidentEpoch);
// FIXME: Deprecated tmc_attributes API Route/Graph Path
				gridGraphs.push(
					<g key={ tmcs.join("|") } className='graphContainer' style={ { transform: `translate(${ 0 }px, ${ groupTranslate }px)`} }>
						<text y="28" x={ `${ width * 0.5 }` } fill="#ccc" textAnchor="middle" style={ { fontSize: "14px"} }>{ tmcGraph[tmcs[0]].meta[year].roadname }</text>
						<g style={ { transform: "translate(0, 30px)" } }>
							{
							tmcs.map(tmc => {
								const y = heightScale(current);
								current += lengths[tmc];

								return (
									<g key={ tmc } style={ { transform: `translate(0, ${ y }px)` } }
										onMouseMove={ e=> this.hover(e, { tmc }) }
										onMouseOut={ e => this.hover(e, { tmc: null }) }>
										{
											 (tmcGraph[tmcs[0]].meta[year].firstname && tmcGraph[tmcs[0]].meta[year].firstname.length > 11 ?
												 <text y={ `${50}` } x={ `${ 0 }` } fill="#ccc" textAnchor="left" style={ { fontSize: "10px", transform:`rotate(-20deg)`} }>
														<tspan y={ `${(50)}` } x={ `${ 0 }` }>{tmcGraph[tmcs[0]].meta[year].firstname.substring(0,11) + '-'}</tspan>
														<tspan y={ `${(50) + 10}` } x={ `${ 0 }`}>{tmcGraph[tmcs[0]].meta[year].firstname.substring(11,tmcGraph[tmcs[0]].meta[year].firstname.length)}</tspan>
													</text>
											:
											<text y={ `${(y/2) + 50}` } x={ `${ 0 }` } fill="#ccc" textAnchor="left" style={ { fontSize: "10px", transform:`rotate(-20deg)`} }>
												{tmcGraph[tmcs[0]].meta[year].firstname ? tmcGraph[tmcs[0]].meta[year].firstname : ''}
											</text>)
										}

										<g style={ { transform: `translate(${horizontalPadding}px, ${ 0 }px)` } }>
										{
											epochs.map(epoch => {
												return (
													activeIncidentEpoch.includes(epoch.toString()) ?
														<rect key={ epoch } x={ (epoch * boxWidth) } y={ 0 }
															  width={ boxWidth } height={  heightScale(lengths[tmc]) }
															  onMouseMove={ e=> this.hover(e, { epoch }) }
															  style= { {
																  fill: speeds[tmc][epoch] ? colorScale(speeds[tmc][epoch]) : "#000",
																  fillOpacity: this.state.tmc === tmc && this.state.epoch === epoch ? 1 : 0.9,
																  stroke: "#090",
																  strokeWidth: 2} }/> :
														<rect key={ epoch } x={ (epoch * boxWidth) } y={ 0 }
															width={ boxWidth } height={ heightScale(lengths[tmc]) }
															onMouseMove={ e=> this.hover(e, { epoch }) }
															style={ {
																fill: speeds[tmc][epoch] ? colorScale(speeds[tmc][epoch]) : "#000",
																fillOpacity: this.state.tmc === tmc && this.state.epoch === epoch ? 1 : 0.9
															} }/>
												)
											})
										}
										</g>
									</g>
								)
							})
						}
						</g>
					</g>
				)
				groupTranslate += height + PADDING;
			})

			// //

			const minutes = epoch * 5,
				hour = Math.floor(minutes / 60),
				minute = minutes % 60,
				rows = [
					["TMC", tmc],
					["Time", `${ hour }:${ (`0${ minute }`).slice(-2) }`]
				]
			if (tmc && speeds[tmc][epoch]) {
				rows.push(
					["Length", `${ lengths[tmc].toFixed(2) } miles`],
					[activeName, `${ Math.round(speeds[tmc][epoch]) } ${activeMeasure.value.includes('pct') ? '%' : 'MPH'}`]
				)
			}

			return (
				<div ref={ this.container }
					style={ { width: "100%", height: "100%", position: "relative"} }>
					<svg style={ { width: "100%", height: "100%", display: "block"} }>
						{ gridGraphs }

						<g className="x axis" ref={ this.axisGroup }
							style={ { transform: `translate(${horizontalPadding}px,${ height - 30 }px)`, stroke: "#ccc" } }/>
					</svg>
					{ !tmc ? null :
						<HoverComp
							x={ x }
							y = { y }
							rows={ rows }/>
					}
				</div>
			)
		}
		catch (e) {
			return (
				<div ref={ this.container }style={ { width: "100%", height: "100%" } }/>
			)
		}
	}
}

const mapStateToProps = state => ({
	tmcGraph: state.graph.tmc
})
const mapDispatchToProps = {

}
export default connect(mapStateToProps, mapDispatchToProps)(reduxFalcor(TmcGridGraph))
