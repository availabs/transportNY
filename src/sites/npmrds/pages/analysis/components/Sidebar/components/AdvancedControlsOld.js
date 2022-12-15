import React from "react"

import get from "lodash.get"

import moment from "moment"
import styled from "styled-components"

import { Input } from "components/common/styled-components"
import ItemSelector from 'components/common/item-selector/item-selector';

import { resolutions } from "components/tmc_graphs/utils/resolutionFormats"

import { falcorGraph } from "store/falcorGraph"

import {
	Row,
	Label,
	InputBox,
	CopyIcon,
	ControlContainer
} from "./parts"

import { getRequestKey } from "components/tmc_graphs/graphClasses/GeneralGraphComp"
import { saveAs } from "file-saver"

import Loading from "components/loading/loadingPage"
const DownloadingOverlay = styled.div`
	width: 100vw;
	height: 100vh;
	position: fixed;
	left: 0px;
	top: 0px;
	display: flex;
	align-items: center;
	justify-content: center;
	background-image: radial-gradient(rgba(0, 0, 0, 1.0), rgba(0, 0, 0, 0.5));
	z-index: 11000;
`
const Message = styled.div`
	position: absolute;
	left: 0px;
	top: 0px;
	width: 100vw;
	text-align: center;
	font-size: 3.5rem;
	font-weight: bold;
	color: ${ props => props.theme.textColorHl };

	div {
		position: absolute;
		height: 50vh;
		width: 100vw;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	div:first-child {
		top: 0px;
	}
	div:last-child {
		top: 50vh;
	}
`

const WEEKDAYS = [
	{ day: "sunday", key: "Sn" },
	{ day: "monday", key: "Mn" },
	{ day: "tuesday", key: "Tu" },
	{ day: "wednesday", key: "Wd" },
	{ day: "thursday", key: "Th" },
	{ day: "friday", key: "Fr" },
	{ day: "saturday", key: "St" }
]
const DATA_COLUMNS = [
	{ key: "travel_time_all", display: "All Vehicles" },
	{ key: "travel_time_truck", display: "Freight Trucks Only" },
	{ key: "travel_time_passenger", display: "Passenger Vehicles Only" }
]

class AdvancedControls extends React.Component {
	// state = {
	// 	startDate: moment(this.props.SETTINGS.startDate, 'YYYYMMDD').format('YYYY-MM-DD')
	// }
	// onDateChange(e) {
	// 	console.log("ON DATE CHANGE:", e.target.value)
	// 	this.setState({ startDate: e.target.value })
	// }
	state = {
		showConfirm: false,
		downloading: false
	}
	updateOverrides(key, value) {
		const overrides = { ...get(this.props, ["SETTINGS", "overrides"], {}) };
		overrides[key] = value;
		if (!value) {
			delete overrides[key];
		}
		this.props.updateSettings("overrides", overrides);
	}
	confirmDownload() {
		this.setState({ showConfirm: true })
	}
	downloadRawData() {
		const route = {
				settings: {
					...this.props.SETTINGS,
					resolution: "NONE"
				},
				tmcArray: get(this.props, ["route", "tmcArray"], [])
			},
			key = getRequestKey(route, { key: 'travelTime' });

		this.setState({ downloading: true, showConfirm: false });

		return falcorGraph.get(["routes", "data", key])
			.then(res => {

				const data = get(res, ["json", "routes", "data", key], []);

				if (data.length) {
					const keys = ["tmc", "epoch", "date", "travel_time_all"],
						rows = [keys.join(",")];

					data.forEach(row => {
						rows.push(keys.map(k => row[k]).join(","));
					})

					const blob = new Blob([rows.join("\n")], { type: "text/csv" }),
						title = get(this.props, ["route", "name"], "");

					saveAs(blob, `npmrds${ title ? "_" : "" }${ title.replace(/\s/g, "_") }.csv`);
				}

				this.setState({ downloading: false });
			})
	}
	render() {
		const {
			dateExtent: [min, max],
			SETTINGS,
			isDifferent
		} = this.props;
		let {
			startDate,
			endDate,
			startTime,
			endTime,
			resolution,
			weekdays,
			dataColumn,
			// compTitle,
			overrides = {}
		} = SETTINGS;

		const regex = /^(\d{0,4})(\d{2})(\d{2})$/;
		startDate = startDate.toString()
			.replace(regex, (p, y, m, d) => `${ `0000${ y }`.slice(-4) }-${ m }-${ d }`);
		endDate = endDate.toString()
			.replace(regex, (p, y, m, d) => `${ `0000${ y }`.slice(-4) }-${ m }-${ d }`);

		return (
			<ControlContainer>

				{ !this.state.downloading ? null :
					<DownloadingOverlay>
						<Message>
							<div>Downloading raw NPMRDS data.</div>
							<div>Please wait...</div>
						</Message>
						<Loading />
					</DownloadingOverlay>
				}

				<Row>
					<Label>Start Date</Label>
					<InputBox>
						<Input type="date"
							onChange={ e => {
								const date = +moment(e.target.value, 'YYYY-MM-DD').format('YYYYMMDD');
								if (!isNaN(date)) {
									this.props.updateSettings("startDate", date);
								}
							} }
							value={ startDate }
							min={ min } max={ max }/>
					</InputBox>
					<CopyIcon setting="startDate"
						isDifferent={ isDifferent }
						onClick={ this.props.copy }/>
				</Row>
				<Row>
					<Label>End Date</Label>
					<InputBox>
						<Input type="date"
							onChange={ e => {
								const date = +moment(e.target.value, 'YYYY-MM-DD').format('YYYYMMDD');
								if (!isNaN(date)) {
									this.props.updateSettings("endDate", date);
								}
							} }
							value={ endDate }
							min={ min } max={ max }/>
					</InputBox>
					<CopyIcon setting="endDate"
						isDifferent={ isDifferent }
						onClick={ this.props.copy }/>
				</Row>

				<Row>
					<Label>Start Time</Label>
					<InputBox>
						<Input type="time"
							onChange={ e => this.props.updateSettings("startTime", e.target.value) }
							value={ startTime }/>
					</InputBox>
					<CopyIcon setting="startTime"
						isDifferent={ isDifferent }
						onClick={ this.props.copy }/>
				</Row>
				<Row>
					<Label>End Time</Label>
					<InputBox>
						<Input type="time"
							onChange={ e => this.props.updateSettings("endTime", e.target.value) }
							value={ endTime }/>
					</InputBox>
					<CopyIcon setting="endTime"
						isDifferent={ isDifferent }
						onClick={ this.props.copy }/>
				</Row>

				<Row>
					<div>
						Peak Selector
					</div>
					<div className="btn-group" style={ { width: "85%", display: "flex" } }>
						{
							this.props.PEAKS.map(({ peak, name }) =>
								<button key={ peak } style={ { flex: `0 0 ${ 100 / 3 }%` } }
									className={ `btn btn-sm ${ this.props.SETTINGS[peak] ? 'btn-success' : 'btn-danger' }` }
									onClick={ () => this.props.togglePeaks(peak) }>
									{ name }
								</button>
							)
						}
					</div>
					<CopyIcon setting="peaks"
						isDifferent={ isDifferent }
						onClick={ this.props.copy }/>
				</Row>

				<Row>
					<div>
						Weekday Selector
					</div>
					<div className="btn-group" style={ { width: "85%", display: "flex" } }>
						{
							WEEKDAYS.map(({ day, key }) =>
								<button key={ day } style={ { flex: `0 0 ${ 100 / 7 }%` } }
									className={ `btn btn-sm ${ weekdays[day] ? 'btn-success' : 'btn-danger' }` }
									onClick={ e => this.props.toggleWeekday(day) }>
									{ key }
								</button>
							)
						}
					</div>
					<CopyIcon setting="weekdays"
						isDifferent={ isDifferent }
						onClick={ this.props.copy }/>
				</Row>

				<Row>
					<Label>Resolution</Label>
					<InputBox>
						<ItemSelector
							selectedItems={ resolution }
    					multiSelect={ false }
    					searchable={ false }
    					displayOption={ d => d.name || resolutions.reduce((a, c) => c.resolution === resolution ? c.name : a, d) }
    					getOptionValue={ d => d.resolution }
							onChange={ v => this.props.updateSettings("resolution", v) }
							options={ resolutions }/>
					</InputBox>
					<CopyIcon setting="resolution"
						isDifferent={ isDifferent }
						onClick={ this.props.copy }/>
				</Row>

				<Row>
					<Label>Data</Label>
					<InputBox>
						<ItemSelector
							selectedItems={ DATA_COLUMNS.reduce((a, c) => c.key === dataColumn ? c : a, {}) }
    					multiSelect={ false }
    					searchable={ false }
    					displayOption={ d => d.display }
    					getOptionValue={ d => d.key }
							onChange={ v => this.props.updateSettings("dataColumn", v) }
							options={ DATA_COLUMNS }/>
					</InputBox>
					<CopyIcon setting="dataColumn"
						isDifferent={ isDifferent }
						onClick={ this.props.copy }/>
				</Row>

				<Row>
					{ !this.state.showConfirm ?
						<button className="btn btn-sm btn-block btn-primary"
							onClick={ () => this.setState({ showConfirm: true }) }>
							Download Raw NPMRDS Data
						</button>
						:
						<div style={ { position: "relative", width: "100%" } }>
							<button className="btn btn-sm btn-danger"
								onClick={ () => this.setState({ showConfirm: false }) }>
								Cancel
							</button>
							<button className="btn btn-sm btn-primary"
								style={ { position: "absolute", right: 0 } }
								onClick={ () => this.downloadRawData() }>
								Download Raw NPMRDS Data
							</button>
						</div>
					}
				</Row>

				<Row>
					<div style={ { width: "100%" } }>Data Overrides</div>
					<div style={ { padding: "0px 10px" } }>

						<Row>
							<Label>AADT</Label>
							<InputBox style={ { maxWidth: "70%", width: "70%", flex: "0 0 70%" } }>
								<Input type="number"
									onChange={ e => this.updateOverrides("aadt", e.target.value) }
									value={ overrides.aadt || "" }/>
							</InputBox>
						</Row>

						<Row>
							<Label>Precent Speed</Label>
							<InputBox style={ { maxWidth: "70%", width: "70%", flex: "0 0 70%" } }>
								<Input type="number" step={ 0.25 }
									onChange={ e => this.updateOverrides("speed", e.target.value) }
									value={ overrides.speed || "" }/>
							</InputBox>
						</Row>

						<Row>
							<Label>Threshold Speed</Label>
							<InputBox style={ { maxWidth: "70%", width: "70%", flex: "0 0 70%" } }>
								<Input type="number" step={ 1 }
									onChange={ e => this.updateOverrides("thresholdSpeed", e.target.value) }
									value={ overrides.thresholdSpeed || "" }/>
							</InputBox>
						</Row>

						<Row>
							<Label>Base Speed</Label>
							<InputBox style={ { maxWidth: "70%", width: "70%", flex: "0 0 70%" } }>
								<Input type="number" step={ 1 }
									onChange={ e => this.updateOverrides("baseSpeed", e.target.value) }
									value={ overrides.baseSpeed || "" }/>
							</InputBox>
						</Row>

					</div>
				</Row>

			</ControlContainer>
		)
	}
}
export default AdvancedControls
