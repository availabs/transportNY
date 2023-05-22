import React from "react"

import GeneralGraphComp from "./graphClasses/GeneralGraphComp"

import TableContainer from "./components/TableContainer"

import get from "lodash.get"

import DateObject from "./utils/DateObject"

class TranscomEventsChart extends GeneralGraphComp {
	getDisplayData() {
		return [{ key: "transcom" }]
	}
	setDisplayedEventTypes(displayedEventTypes) {
		this.props.updateGraphComp(this.props.index, { state: { displayedEventTypes } });
	}
	generateHeaderData(graphData, [route], displayData, resolution) {
		const displayedEventTypes = get(this.props, 'state.displayedEventTypes', ['accident']),
			eventTypes = [...new Set(get(route, 'data.transcom', []).map(t => t.event_type.toLowerCase()))]
				.sort((a, b) => a < b ? -1 : b < a ? 1 : 0);
		return [
			{ type: "single-select-route" },
			{
				title: "Event Types",
				value: displayedEventTypes,
				domain: eventTypes,
				onChange: this.setDisplayedEventTypes.bind(this),
				type: 'multi-select',
				keyAccessor: d => d,
				nameAccessor: d => d
			}
		];
	}
	generateGraphData([route], displayData, resolution) {
		const displayedEventTypes = new Set(get(this.props, 'state.displayedEventTypes', ['accident']));
		return get(route, 'data.transcom', [])
			.filter(t => displayedEventTypes.has(t.event_type.toLowerCase()))
			.sort((a, b) => {
				if (a.startDate === b.startDate) {
					return a.startTime - b.startTime;
				}
				return new Date(b.startDate).valueOf() - new Date(a.startDate).valueOf();
			})
	}
	generateTableData(graphData, [route], displayData, resolution) {
		const data = graphData.map(d => ({
			"Route Name": route.name,
			"Event Type": d.event_type,
			"TMC": d.tmc,
			"Description": d.description,
			"Start Date": d.startDate,
			"Start Time": DateObject.epochToTimeString(d.startTime),
			"End Date": d.endDate,
			"End Time": DateObject.epochToTimeString(d.endTime)
		}));
		return { data, keys: ["Route Name", "TMC", "Event Type", "Description", "Start Date", "Start Time", "End Date", "End Time"] };
	}
	renderGraph(graphData, routeComps) {
		return (
			<TableContainer>
				<thead>
					<tr>
						<th>Type</th>
						<th>TMC</th>
						<th>Description</th>
						<th>{ "Date" }</th>
					</tr>
				</thead>
				<tbody>
					{
						graphData.map(transcom =>
							<tr key={ transcom.event_id }>
								<td>{ transcom.event_type.toLowerCase() }</td>
								<th>{ transcom.tmc }</th>
								<td>{ transcom.description }</td>
								{ transcom.startDate === transcom.endDate ?
									<td style={ { whiteSpace: "nowrap" } }>
										<div style={ { whiteSpace: "nowrap" } }>
											{ transcom.startDate }
										</div>
										<div style={ { whiteSpace: "nowrap" } }>
											{ DateObject.epochToTimeString(transcom.startTime) }
											{ " - " }
											{ DateObject.epochToTimeString(transcom.endTime) }
										</div>
									</td>
									:
									<td>
										<div style={ { whiteSpace: "nowrap" } }>
											{ transcom.startDate }
										</div>
										<div style={ { whiteSpace: "nowrap" } }>
											{ transcom.endDate }
										</div>
									</td>
								}
							</tr>
						)
					}
				</tbody>
			</TableContainer>
		)
	}
}

export default GeneralGraphComp.connect(TranscomEventsChart)
