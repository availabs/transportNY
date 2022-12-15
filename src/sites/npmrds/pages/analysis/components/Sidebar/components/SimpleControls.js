import React from "react"

import * as d3array from "d3-array"

// import ItemSelector from 'components/common/item-selector/item-selector';

import {
  Select
} from "modules/avl-components/src"

import {
	Row,
	Label,
	InputBox,
	CopyIcon,
	ControlContainer
} from "./parts"

const MONTHS = {
	1: "January",
	2: "February",
	3: "March",
	4: "April",
	5: "May",
	6: "June",
	7: "July",
	8: "August",
	9: "September",
	10: "October",
	11: "November",
	12: "December"
}

const SimpleControls = props => {
	const { SETTINGS, isDifferent } = props;
	const { year, month } = SETTINGS;

	let months = d3array.range(1, 13)
		.map(m => ({ m, label: MONTHS[m] }));

	months = [
		({ m: "all", label: "All" }),
		...months
	]
	if (months === "advanced") {
		months = [
			{ m: "advanced", label: "advanced" },
			...months
		]
	}
	return (
		<ControlContainer>

			<Row>
				<Label>Year</Label>
				<InputBox>
					<Select
						value={ year }
  					multi={ false }
  					searchable={ false }
  					accessor={ d => d }
  					valueAccessor={ d => d }
						onChange={ v => props.updateSettings("year", v) }
						options={ props.yearsWithData }/>
				</InputBox>
				<CopyIcon setting="year"
					isDifferent={ isDifferent }
					onClick={ props.copy }/>
			</Row>

			<Row>
				<Label>Month</Label>
				<InputBox>
					<Select
						value={ month }
  					multi={ false }
  					searchable={ false }
  					accessor={ d => d.label || months.reduce((a, c) => c.m === d ? c.label : a, d) }
  					valueAccessor={ d => d.m }
						onChange={ v => props.updateSettings("month", v) }
						options={ months }/>
				</InputBox>
				<CopyIcon setting="month"
					isDifferent={ isDifferent }
					onClick={ props.copy }/>
			</Row>

			<Row>
				<div>
					Peak Selector
				</div>
				<div className="btn-group" style={ { width: "85%", display: "flex" } }>
					{
						props.PEAKS.map(({ peak, name }) =>
							<button key={ peak } style={ { flex: `0 0 ${ 100 / 3 }%` } }
								className={ `btn btn-sm ${ SETTINGS[peak] ? 'btn-success' : 'btn-danger' }` }
								onClick={ () => props.togglePeaks(peak) }>
								{ name }
							</button>
						)
					}
				</div>
				<CopyIcon setting="peaks"
					isDifferent={ isDifferent }
					onClick={ props.copy }/>
			</Row>

		</ControlContainer>
	)
}
export default SimpleControls
