import React from "react"
import { connect } from "react-redux"

import get from "lodash/get"

import styled from "styled-components"

import isEqual from "lodash/isEqual"

import moment from "moment"

import { CustomPicker } from 'react-color'
import { Saturation, Hue } from 'react-color/lib/components/common';

import AdvancedControls from "./components/AdvancedControls"
import SimpleControls from "./components/SimpleControls"
import EditableTitle from "./components/EditableTitle"
import { ControlBox, Control } from "./components/parts"
import ColorPicker from "./components/ColorPicker"

import DateObject from "../tmc_graphs/utils/DateObject"

import { avlFalcor } from "~/modules/avl-components/src"

import {
	copyRouteCompSettings,
	getRoutePeaks
} from "../../reports/store"

// const WEEKDAYS = [
// 	{ day: "sunday", key: "Sn" },
// 	{ day: "monday", key: "Mn" },
// 	{ day: "tuesday", key: "Tu" },
// 	{ day: "wednesday", key: "Wd" },
// 	{ day: "thursday", key: "Th" },
// 	{ day: "friday", key: "Fr" },
// 	{ day: "saturday", key: "St" }
// ]
// const DATA_COLUMNS = [
// 	{ key: "travel_time_all", display: "All Vehicles" },
// 	{ key: "travel_time_truck", display: "Freight Trucks Only" },
// 	{ key: "travel_time_passenger", display: "Passenger Vehicles Only" }
// ]

class RouteComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			controls: "Advanced",//props.settings.year === "advanced" ? "Advanced" : "Simple",
			PEAKS: this.loadPeaks(),
			color: this.props.color
		}
	}
	loadPeaks() {
		const {
			amPeakStart,
			amPeakEnd,
			pmPeakStart,
			pmPeakEnd
		} = getRoutePeaks();//(this.props.routesGraph, ["byId", this.props.routeId]);

		return [
			{ peak: "amPeak", name: "AM Peak", bounds: [amPeakStart, amPeakEnd] },
			{ peak: "offPeak", name: "Off Peak", bounds: [amPeakEnd, pmPeakStart] },
			{ peak: "pmPeak", name: "PM Peak", bounds: [pmPeakStart, pmPeakEnd] }
		]
	}
	componentDidUpdate(oldProps) {
		if (oldProps.compId !== this.props.compId) {
			this.setState({
				// controls: this.props.settings.year === "advanced" ? "Advanced" : "Simple",
				PEAKS: this.loadPeaks(),
				color: this.props.color
			})
		}
	}
	toggleControls() {
		this.setState({
			controls: this.state.controls === "Advanced" ? "Simple" : "Advanced"
		})
	}
	updateSettings(key, value) {
		const settings = typeof key === "object" ? { ...key } : { [key]: value };

		if (("startTime" in settings) || ("endTime" in settings)) {
			settings.amPeak = false;
			settings.offPeak = false;
			settings.pmPeak = false;
		}
		else if (("year" in settings) || ("month" in settings)) {
			settings = this.getSimpleSettings(settings);
		}
		else if (this.switchToAdvanced(settings)) {
			settings.year = "advanced";
			settings.month = "advanced";
		}
		this._updateSettings(settings);
	}
	switchToAdvanced(settings) {
		const simpleSettings = this.getSimpleSettings();

		return (settings.startDate && (settings.startDate !== simpleSettings.startDate)) ||
			(settings.endDate && (settings.endDate !== simpleSettings.endDate))
	}
	getSimpleSettings(settings = {}) {
		const SETTINGS = this.props.SETTINGS.get(this.props.compId);
		const dateSettings = {
			year: SETTINGS.year,
			month: SETTINGS.month,
			...settings
		}
		let {
			year,
			month
		} = dateSettings;
		if (year === "advanced") {
			year = Math.min(
				+SETTINGS.endDate.toString().slice(0, 4),
				this.props.yearsWithData[this.props.yearsWithData.length - 1]
			)
		}
		if (month === "advanced") {
			month = "all";
		}
		let startDate = +`${ year }0101`,
			endDate = +`${ year }1231`;
		if (month !== 'all') {
			startDate = +`${ year }${ (`0${ month }`).slice(-2) }01`;
			const date = moment(startDate, 'YYYYMMDD')
				.add(1, 'month')
				.subtract(1, 'day')
				.date();
			endDate = +`${ year }${ (`0${ month }`).slice(-2) }${ (`0${ date }`).slice(-2) }`;
		}
		return {
			year,
			month,
			startDate,
			endDate
		};
	}
	toggleWeekday(day) {
		const SETTINGS = this.props.SETTINGS.get(this.props.compId);
		const settings = {
			weekdays: { ...SETTINGS.weekdays, [day]: !SETTINGS.weekdays[day] }
		}
		this._updateSettings(settings);
	}
	togglePeaks(peak) {
		const SETTINGS = this.props.SETTINGS.get(this.props.compId);
		const settings = {
			amPeak: SETTINGS.amPeak,
			offPeak: SETTINGS.offPeak,
			pmPeak: SETTINGS.pmPeak,
			[peak]: !SETTINGS[peak]
		}
		const bounds = Object.keys(settings)
			.reduce((a, peak) => {
				const { bounds } = this.state.PEAKS.reduce((a, c) => c.peak === peak ? c : a, {});
				if (bounds && settings[peak]) {
					if (!a.length) {
						a = bounds;
					}
					else {
						a = [
							Math.min(a[0], bounds[0]),
							Math.max(a[1], bounds[1])
						]
					}
				}
				return a;
			}, []);
		if (bounds.length) {
			settings.startTime = DateObject.epochToTimeString(bounds[0]);
			settings.endTime = DateObject.epochToTimeString(bounds[1]);
		}
		else {
			settings.startTime = DateObject.epochToTimeString(0);
			settings.endTime = DateObject.epochToTimeString(288);
		}
		this._updateSettings(settings);
	}
	_updateSettings(settings) {
		this.props.updateRouteCompSettings(this.props.compId, settings);
		// const previous = this.props.SETTINGS.get(this.props.compId);
		// this.props.SETTINGS.set(this.props.compId, { ...previous, ...settings });
		// this.forceUpdate();
	}
	needsUpdate() {
		const SETTINGS = this.props.SETTINGS.get(this.props.compId),
			{ settings } = this.props;
		return this.shouldReloadData() ||
			SETTINGS.isRelativeDateBase !== settings.isRelativeDateBase ||
			SETTINGS.compTitle !== settings.compTitle;
	}
	shouldReloadData() {
		const SETTINGS = this.props.SETTINGS.get(this.props.compId),
			{ settings } = this.props;

		return SETTINGS.startDate !== settings.startDate ||
			SETTINGS.endDate !== settings.endDate ||
			SETTINGS.relativeDate !== settings.relativeDate ||
      SETTINGS.useRelativeDateControls !== settings.useRelativeDateControls ||
			SETTINGS.startTime !== settings.startTime ||
			SETTINGS.endTime !== settings.endTime ||
			SETTINGS.resolution !== settings.resolution ||
			SETTINGS.dataColumn !== settings.dataColumn ||
			!isEqual(SETTINGS.weekdays, settings.weekdays) ||
			!isEqual(SETTINGS.overrides, settings.overrides);
	}
	updateRouteComp() {
		if (this.needsUpdate()) {
			const reloadData = this.shouldReloadData(),
				SETTINGS = this.props.SETTINGS.get(this.props.compId);
			this.props.updateRouteComp(this.props.compId, { ...SETTINGS }, reloadData);
		}
		if (this.state.color !== this.props.color) {
			this.props.updateRouteCompColor(this.props.compId, this.state.color);
		}
	}
	onColorChange(color) {
		this.setState({ color });
	}
	copyRouteCompSettings(keys) {
		if (!Array.isArray(keys)) {
			keys = [keys];
		}
		this.props.copyRouteCompSettings(this.props.compId, keys);
	}
	render() {
		const SETTINGS = this.props.SETTINGS.get(this.props.compId),
			{ compTitle } = SETTINGS,
			compName = get(this.props.routesGraph, `id.${ this.props.routeId }.name`, this.props.compId),
			advanced = this.state.controls === "Advanced",
			Controls = advanced ? AdvancedControls : SimpleControls,
			needsUpdate = this.needsUpdate() || (this.props.color !== this.state.color);

		const isDifferent = {};
		for (const [compId, settings] of this.props.SETTINGS) {
			if (compId === this.props.compId) continue;

			const {
				amPeak,
				offPeak,
				pmPeak,
				year,
				month,
				...rest
			} = settings;

			for (const key in rest) {
				isDifferent[key] = isDifferent[key] || !isEqual(settings[key], SETTINGS[key]);
			}
			isDifferent["year"] = (SETTINGS["year"] !== "advanced") && (settings["year"] !== SETTINGS["year"]);
			isDifferent["month"] = (SETTINGS["month"] !== "advanced") && (settings["month"] !== SETTINGS["month"]);
			isDifferent["peaks"] = ["amPeak", "offPeak", "pmPeak"]
				.reduce((a, c) => a || !isEqual(settings[c], SETTINGS[c]), false)
		}

// console.log("RouteComponent::props", this.props);

		return (
			<div style={ {
				padding: "10px",
				position: "absolute",
				top: "0px", bottom: "0px",
				overflow: "auto"
			} }>
				<EditableTitle color={ this.state.color }
					onChange={ t => this.updateSettings("compTitle", t) }
					title={ compTitle || compName }/>

				<div style={ { borderBottom: `2px solid currentColor` } }>
					<ControlBox>
						<Control onClick={ e => this.toggleControls() }>
							<span className={ `mx-1 fa ${ advanced ? 'fa-toggle-on' : 'fa-toggle-off' }` }/>
							<span>{ this.state.controls }</span>
						</Control>
						<Control onClick={ e => needsUpdate && this.updateRouteComp() }
							disabled={ !needsUpdate }>
							<span>Update</span>
							<span className='mx-1 fa fa-refresh'/>
						</Control>
					</ControlBox>
				</div>

				<Controls SETTINGS={ SETTINGS }
					isDifferent={ isDifferent }
					updateSettings={ this.updateSettings.bind(this) }
					usingRelativeDates={ this.props.usingRelativeDates }
					relativeDateBase={ this.props.relativeDateBase }
					compId={ this.props.compId }
					toggleWeekday={ this.toggleWeekday.bind(this) }
					togglePeaks={ this.togglePeaks.bind(this) }
					PEAKS={ this.state.PEAKS }
					dateExtent={ this.props.dateExtent }
					yearsWithData={ this.props.yearsWithData }
					copy={ this.copyRouteCompSettings.bind(this) }
					route={ this.props.route }
					inRouteGroup={ this.props.inRouteGroup }
					route_group={ this.props.route_group }/>

				<div style={ { paddingTop: "10px" } }>
					<ColorPicker color={ this.state.color }
						onChangeComplete={ ({ hex }) => this.onColorChange(hex) }/>
				</div>
			</div>
		)
	}
}
const mapStateToProps = state => ({
	// routesGraph: state.graph.routes
})
const mapDispatchToProps = {
	copyRouteCompSettings
}
const mapCacheToProps = falcorCache => ({
	routesGraph: falcorCache["routes2"]
})
export default connect(mapStateToProps, mapDispatchToProps)(avlFalcor(RouteComponent, { mapCacheToProps }))
