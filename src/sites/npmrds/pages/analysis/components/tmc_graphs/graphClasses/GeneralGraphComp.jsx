import React from "react"
import * as redux from "react-redux"
// import { reduxFalcor } from 'utils/redux-falcor';
import { avlFalcor } from "~/modules/avl-components/src"

import isEqual from "lodash/isEqual"
import get from "lodash/get"
import moment from "moment"
import styled from "styled-components"

import GraphContainer from "./GraphContainer"
import MessageBox from "./components/MessageBox"

import DateObject from "../utils/DateObject"

import DATA_TYPES from "../utils/dataTypes"
import {
	// BASE_DATA_TYPES,
	INDICES,
	INDICES_BY_DATE_RANGE,
	TMC_ATTRIBUTES
} from "../utils/dataTypes"

import * as DomainManager from "../utils/DomainManager"

import "./styles.css"

import { GRAPH_TYPES } from "../index"

import Scheduler from "./components/GraphLoadingScheduler"
const SCHEDULER = new Scheduler();

export const getRequest = ({ settings, tmcArray }, { group, alias, key }) => {
	// if (group === "tmcAttribute") return null;

	const overrides = { ...get(settings, "overrides", {}) };
	if ("speed" in overrides) {
		overrides.speed = Math.round(overrides.speed * 1000); // can't send deciaml value in URL
	}

	return {
		tmcArray,
		startDate: settings.startDate,
		endDate: settings.endDate,
		startTime: DateObject.timeStringToEpoch(settings.startTime),
		endTime: DateObject.timeStringToEpoch(settings.endTime === "00:00" ? "24:00" : settings.endTime, true),
		weekdays: Object.keys(settings.weekdays).filter(w => settings.weekdays[w]),
		resolution: settings.resolution,
		dataColumn: settings.dataColumn || "travel_time_all",
		dataType: group || alias || key,
		overrides,
		state: 'ny'
	}
}
export const getRequestKey = (...args) => {
	const request = getRequest(...args);

	if (request === null) return null;

	const {
		tmcArray,
		startDate, // format: YYYYMMDD
		endDate, // format: YYYYMMDD
		startTime, // as epoch
		endTime, // as epoch, exclusive
		weekdays,
		resolution,
		dataColumn,
		dataType,
		overrides,
		state
	} = request;
	return [
		tmcArray,
		startDate,
		endDate,
		startTime,
		endTime,
		weekdays,
		resolution,
		dataColumn,
		dataType,
		encodeURI(JSON.stringify(overrides)),
		state
	].join("|")
}

class GeneralGraphComp extends React.Component {
	static getDateRangeString({ settings }) {
		const {
			startDate,
			endDate
		} = settings;
		const start = moment(startDate, "YYYYMMDD")
				.format("MM-DD-YY"),
			end = moment(endDate, "YYYYMMDD")
				.format("MM-DD-YY");

		const yearStartRegex = /01-01-(\d\d)/,
			yearEndRegex = /12-31-(\d\d)/,

			startMatch = yearStartRegex.exec(start),
			endMatch = yearEndRegex.exec(end),

			entireYear = startMatch && endMatch
				&& startMatch[1] === endMatch[1];
		return start === end
			? `${ start }`
			: entireYear
			? `${ startDate.toString().slice(0, 4) }`
			: `${ start } - ${ end }`;
	}
	static connect(comp) {
		const mapStateToProps = state => ({
			// tmcGraph: get(state, ["graph", "tmc"], {}),
			// routesGraph: get(state, ["graph", "routes"], {}),
			// hdsGraph: get(state, ["graph", "hds"], {}),
			allYearsWithData: get(state, ["report", "allYearsWithData"], [])
		})
		const mapDispatchToProps = {

		}
		const mapCacheToProps = falcorCache => {
			return {
				tmcGraph: get(falcorCache, ["tmc"], {}),
				routesGraph: get(falcorCache, ["routes"], {}),
				hdsGraph: get(falcorCache, ["hds"], {})
			}
		}
		return redux.connect(mapStateToProps, mapDispatchToProps)(avlFalcor(comp, { mapCacheToProps }));
	}

	constructor(...args) {
		super(...args);
		this.state = {
			loading: 0,
			svgToSave: null,
			fileName: this.props.state.title || this.props.type,
			resizing: false,
			position: { x: 0, y: 0 },
			direction: "none",
			savingImage: false
		}

		this.IS_ACTIVE = false;

		this.DATA_TYPES = DATA_TYPES;

		this.graphDivRef = React.createRef();

		this.updateTitle = this.updateTitle.bind(this);
		this.setSavingImage = this.setSavingImage.bind(this);
		this.fetchFalcorDeps = this.fetchFalcorDeps.bind(this);
		this.doFetchFalcorDeps = this.doFetchFalcorDeps.bind(this);
	}

	setSavingImage(savingImage) {
		this.setState({ savingImage });
	}

	mapRouteComps(routeComps) {
		return routeComps.map((r, i) =>
			({ key: r.compId,
				name: r.name
			})
		);
	}

	componentDidMount() {
		this.IS_ACTIVE = true;
	}
	componentWillUnmount() {
		this.IS_ACTIVE = false;
		DomainManager.unregister(this.props.id);
	}
	setState(...args) {
		this.IS_ACTIVE && super.setState(...args);
	}
	forceUpdate() {
		this.IS_ACTIVE && super.forceUpdate();
	}

	componentDidUpdate(oldProps) {
		const oldRouteSettings = oldProps.routes.map(r => r.settings),
			routeSettings = this.props.routes.map(r => r.settings);

		if (!isEqual(oldProps.state, this.props.state) ||
				!isEqual(oldRouteSettings, routeSettings)) {
		// if (!isEqual(oldProps.state, this.props.state)) {
			this.fetchFalcorDeps();
		}
	}

	fetchFalcorDeps() {
		// this.setState(prev => ({ loading: prev.loading + 1 }));
		return SCHEDULER.request(this.props.id, this.doFetchFalcorDeps)
			// .then(() => this.setState(prev => ({ loading: prev.loading - 1 })))
	}

	doFetchFalcorDeps() {
		const routes = this.getActiveRouteComponents().filter(r => get(r, 'tmcArray.length', 0));
		if (!routes.length) return Promise.resolve();

		const displayData = this.getDisplayData();
		if (!displayData.length) return Promise.resolve();

		this.setState(prev => ({ loading: prev.loading + 1 }));

		return routes.reduce((promise, route) => {
			const { tmcArray } = route,
				year = this.getMaxYear(route),
				requestKeys = displayData.map(dd => ({ dd: dd.key, alias: dd.alias, group: dd.group, key: getRequestKey(route, dd) }))
					.filter(({ key }) => Boolean(key));

			return promise.then(() => {
				return this.props.falcor.get(
					['tmc', tmcArray, 'meta', year, ['miles', 'bounding_box', 'congestion_level', 'directionality', 'f_system']],
					['tmc', tmcArray, 'year', year, 'geometries'],
				)
				.then(() => {

					return requestKeys.reduce((promise, { dd, alias, group, key }) => {
						return promise.then(() => {
							return this.props.falcor.get(
								['routes', 'data', key]
							)
							.then(res => {
								if (group === "indices") {
									INDICES.forEach(index => {
										route.data[index.key] = get(res, `json.routes.data.${ key }`, [])
											.map(d => ({ tmc: d.tmc, resolution: d.resolution, value: d[index.key] }))
											.filter(({ value }) => value !== undefined)
									})
								}
								else if (group === "indices-byDateRange") {
									INDICES_BY_DATE_RANGE.forEach(index => {
										route.data[index.key] = get(res, `json.routes.data.${ key }`, [])
											.map(d => ({ tmc: d.tmc, value: d[index.key] }))
											.filter(({ value }) => value !== undefined)
									})
								}
								else if (group === "tmcAttribute") {
									TMC_ATTRIBUTES.forEach(att => {
										route.data[att.key] = get(res, `json.routes.data.${ key }`, [])
											.map(d => ({ tmc: d.tmc, value: d[att.alias || att.key] }))
											.filter(({ value }) => value !== undefined)
									})
								}
								else if (group === "hoursOfDelay") {
									route.data["hoursOfDelay"] = get(res, `json.routes.data.${ key }`, [])
										.map(d => ({ ...d, value: d["hoursOfDelay"] }));
									route.data["avgHoursOfDelay"] = get(res, `json.routes.data.${ key }`, [])
										.map(d => ({ ...d, value: d["avgHoursOfDelay"] }));
								}
								else if (group === "co2Emissions") {
									route.data["co2Emissions"] = get(res, `json.routes.data.${ key }`, [])
										.map(d => ({ ...d, value: d["co2Emissions"] }));
									route.data["avgCo2Emissions"] = get(res, `json.routes.data.${ key }`, [])
										.map(d => ({ ...d, value: d["avgCo2Emissions"] }));
								}
								else {
									route.data[dd] = get(res, `json.routes.data.${ key }`, []);
									if (alias) {
										route.data[alias] = get(res, `json.routes.data.${ key }`, []);
									}
								}
							})
						})
					}, Promise.resolve())
				})
			})
		}, Promise.resolve())
		.then(() => {
			this.setState(prev => ({ loading: prev.loading - 1 }));
		})
	}
	getMaxYear({ settings }) {
		return +settings.endDate.toString().slice(0, 4);
		// const start = +settings.startDate.toString().slice(0, 4),
		// 	end = +settings.endDate.toString().slice(0, 4);
		// return range(start, end + 1);
	}

	getTmcLength(year, tmc) {
		return get(this.props.tmcGraph, `[${ tmc }].meta[${ year }].miles`, 0);
	}
	getTmcLengths(year, tmcs) {
		return tmcs.reduce((length, tmc) =>
			length + this.getTmcLength(year, tmc)
		, 0)
	}

	getActiveRouteComponents() {
		const compIds = get(this.props, 'state.activeRouteComponents', [get(this.props, 'routes[0].compId', 'none')]);
		return this.props.routes.filter(r => compIds.includes(r.compId));
	}
	getResolution() {
		return get(this.getActiveRouteComponents(), '[0].settings.resolution', '5-minutes');
	}
	getDisplayData() {
		const keys = get(this.props, 'state.displayData', ['speed']);
		return this.DATA_TYPES.filter(dd => keys.includes(dd.key));
	}

	generateGraphData(routeComps, displayData, resolution) {
		return [];
	}

	renderGraph(graphData, routeComps, displayData, resolution) {
		return <div>{ "OOPS!!! The component's <renderGraph> method has Not yet been implemented." }</div>;
	}
// //
	generateHeaderData(graphData, routeComps, displayData, resolution) {
		return []
	}
	expandHeaderData(headerData, graphData, routeComps, displayData, resolution) {
		const routes = this.mapRouteComps(this.props.routes, true);
		return headerData.reduce((a, c) => {
			switch (c.type) {
				case "single-select-data":
					a.push({
						title: "Display Data",
						value: get(displayData, '[0].key', 'speed'),
						domain: this.DATA_TYPES,
						onChange: this.setSingleDisplayData.bind(this),
						...c,
						type: 'single-select'
					});
					break;
				case "multi-select-data":
					a.push({
						title: "Display Data",
						value: displayData.map(dd => dd.key),
						domain: this.DATA_TYPES,
						onChange: this.setMultiDisplayData.bind(this),
						...c,
						type: 'multi-select'
					});
					break;
				case "single-select-route":
					if (routes.length > 1) {
						a.push({
							title: "Route",
							value: get(routeComps, '[0].compId', 'compId'),
							domain: routes,
							onChange: this.setSingleActiveRouteComponents.bind(this),
							...c,
							type: "single-select"
						});
					break;
				};
				case "multi-select-route":
					if (routes.length > 1) {
						a.push({
							title: "Routes",
							value: routeComps.map(rc => rc.compId),
							domain: routes,
							onChange: this.setMultiActiveRouteComponents.bind(this),
							...c,
							type: "multi-select"
						});
					}
					break;
				default:
					a.push(c);
					break;
			}
			return a;
		}, [])
	}
	setSingleDisplayData(value) {
		this.props.updateGraphComp(this.props.index, { state: { displayData: [value] } });
	}
	setMultiDisplayData(displayData) {
		this.props.updateGraphComp(this.props.index, { state: { displayData } });
	}
	setSingleActiveRouteComponents(value) {
		this.props.updateGraphComp(this.props.index, { state: { activeRouteComponents: [value] } });
	}
	setMultiActiveRouteComponents(activeRouteComponents) {
		this.props.updateGraphComp(this.props.index, { state: { activeRouteComponents } });
	}

	generateTableData(graphData, routeComps, displayData, resolution) {
		return { data: [], keys: [] };
	}

	addMessageBox() {
		this.props.updateGraphComp(this.props.index, { state: { message: { text: "", location: "bottom", width: "100%", height: 125 } } });
	}
	removeMessageBox() {
		this.props.updateGraphComp(this.props.index, { state: { message: null } });
	}
	setMessageBoxText(text) {
		const message = { ...get(this.props, ["state", "message"], {}), text };
		this.props.updateGraphComp(this.props.index, { state: { message } });
	}
	dockMessageBoxRight() {
		const message = { ...get(this.props, ["state", "message"], {}), location: "right", width: 300, height: "100%" };
		this.props.updateGraphComp(this.props.index, { state: { message } });
	}
	dockMessageBoxBottom() {
		const message = { ...get(this.props, ["state", "message"], {}), location: "bottom", width: "100%", height: 125 };
		this.props.updateGraphComp(this.props.index, { state: { message } });
	}

	startResize(direction, e) {
		e.stopPropagation();
		this.setState({
			resizing: true,
			position: { x: e.screenX, y: e.screenY },
			direction
		})
	}
	doResive(e) {
		e.stopPropagation();
		const message = get(this.props, ["state", "message"], {}),
			pos = this.state.position;
		if (this.state.direction === "vertical") {
			message.height += pos.y - e.screenY;
			message.height = Math.max(message.height, 75);
		}
		else {
			message.width += pos.x - e.screenX;
			message.width = Math.max(message.width, 150);
		}
		this.setState({ position: { x: e.screenX, y: e.screenY } });
	}
	endResize(e) {
		e.stopPropagation();
		this.setState({ resizing: false, direction: "none" });
		const message = { ...get(this.props, ["state", "message"], {}) };
		this.props.updateGraphComp(this.props.index, { state: { message } });
	}

	getColorRange([displayData]) {
		const cr = get(this.props, ["state", "colorRange"], this.props.colorRange).slice();
		return get(displayData, "reverseColors", false) ? cr.reverse() : cr;
	}
	setColorRange(colorRange) {
		if (isEqual(colorRange, this.props.colorRange)) {
			this.props.updateGraphComp(this.props.index, { state: { colorRange: null } });
		}
		else {
			this.props.updateGraphComp(this.props.index, { state: { colorRange } });
		}
	}

	updateTitle(title) {
		this.props.updateGraphComp(this.props.index, { state: { title } });
	}

	render() {
		const resolution = this.getResolution(),
			routeComps = this.getActiveRouteComponents(),
			displayData = this.getDisplayData(),
			graphData = this.generateGraphData(routeComps, displayData, resolution),
			colorRange = this.getColorRange(displayData),
			headerData = this.generateHeaderData(graphData, routeComps, displayData, resolution);

		const {
			x, y, w, h
		} = this.props.layout;

		const {
				saveImage = false,
				isColorfull = false
			} = GRAPH_TYPES.reduce((a, c) => c.type === this.props.type ? c : a, {}),

			hasMessage = Boolean(get(this.props, ["state", "message"], false)),

			message = get(this.props, ["state", "message"], {}),
			location = get(message, "location", null),
			mWidth = location === "bottom" ? 0 : get(message, "width", 0),
			mHeight = location === "bottom" ? get(message, "height", 0) : 0;

		return (
			<GraphContainer id={ this.props.id }
				headerData={ this.expandHeaderData(headerData, graphData, routeComps, displayData, resolution) }
				viewing={ this.props.viewing }
				previewing={ this.props.previewing }
				savingImage={ this.state.savingImage }
				setSavingImage={ this.setSavingImage }
				type={ this.props.type }
				updateTitle={ this.updateTitle }
				title={ this.props.state.title }
				routeComps={ routeComps }
				displayData={ displayData }
				remove={ () => this.props.removeGraphComp(this.props.index, this.props.id) }
				add={ () => this.props.addGraphComp(this.props.type, { x, y, w, h }, this.props.state) }
				loading={ Boolean(this.state.loading) }
				showTableModal={ t => this.props.showTableModal(this.generateTableData(graphData, routeComps, displayData, resolution), t) }
				saveImage={ saveImage }
				addMessageBox={ this.addMessageBox.bind(this) }
				hasMessageBox={ hasMessage }
				defaultColorRange={ this.props.colorRange }
				colorRange={ colorRange }
				setColorRange={ isColorfull ? this.setColorRange.bind(this) : null }>

				<div ref={ this.graphDivRef }
					style={ {
						width: "100%", height: "100%",
						display: "flex",
						flexDirection: location === "bottom" ? "column" : "row"
					} }
					onMouseMove={ this.state.resizing ? (e => this.doResive(e)) : null }
					onMouseUp={ this.state.resizing ? (e => this.endResize(e)) : null }>

					<div id={ this.props.id } style={ { width: `calc(100% - ${ mWidth }px)`, height: `calc(100% - ${ mHeight }px)` } }>
						{ this.renderGraph(graphData, routeComps, displayData, resolution, colorRange) }
					</div>

					{ !Boolean(hasMessage) ? null :
						<MessageBox { ...message }
							onChange={ text => this.setMessageBoxText(text) }
							startResize={ this.startResize.bind(this) }
							viewing={ this.props.viewing }
							resizing={ this.state.resizing }
							dockMessageBoxRight={ this.dockMessageBoxRight.bind(this) }
							dockMessageBoxBottom={ this.dockMessageBoxBottom.bind(this) }
							removeMessageBox={ this.removeMessageBox.bind(this) }/>
					}

				</div>

			</GraphContainer>
		)
	}
}
export default GeneralGraphComp
