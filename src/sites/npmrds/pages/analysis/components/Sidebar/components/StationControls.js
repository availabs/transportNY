import React from "react"

import get from "lodash.get"

// import { Input } from "components/common/styled-components"
// import ItemSelector from 'components/common/item-selector/item-selector';

import {
	Input,
  Select
} from "modules/avl-components/src"

import {
	Row,
	Label,
	InputBox,
	CopyIcon,
	ControlContainer
} from "./parts"

const hourFormat = hour => {
  const amPm = hour >= 12 ? "PM" : "AM";
  hour = hour > 12 ? hour - 12 : hour == 0 ? 12 : hour;
  return `${ hour }:00 ${ amPm }`;
}
const WEEKDAYS = [
	{ day: "1", key: "Sn", name: "Sunday" },
	{ day: "2", key: "Mn", name: "Monnday" },
	{ day: "3", key: "Tu", name: "Tuesday" },
	{ day: "4", key: "Wd", name: "Wednesday" },
	{ day: "5", key: "Th", name: "Thursday" },
	{ day: "6", key: "Fr", name: "Friday" },
	{ day: "7", key: "St", name: "Saturday" }
]
const dowFormat = wd =>
  WEEKDAYS.reduce((a, c) => c.day == wd ? c.name : a, "");

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
const monthFormat = m => {
  const year = m.slice(0, 4),
    month = +m.slice(5)
  return `${ get(MONTHS, month, "").slice(0, 3) }. ${ year }`;
}
const indentity = d => d;
const RESOLUTIONS = [
  { name: "Hour", value: "hour", format: hourFormat },
  { name: "Date", value: "day", format: indentity },
  { name: "Day of Week", value: "weekday", format: dowFormat },
  { name: "Month", value: "month", format: monthFormat },
  { name: "Year", value: "year", format: indentity }
]

const StationControls = props => {
  const {
    startDate,
    endDate,

    startTime,
    endTime,

    weekdays,

    resolution,

    dataType
  } = props.settings;

  return (
    <ControlContainer>

      <Row>
        <Label>Start Date</Label>
        <InputBox>
          <Input type="date"
            onChange={ v => props.updateSettings("startDate", v) }
            value={ startDate }/>
        </InputBox>
        <CopyIcon setting="startDate"
          isDifferent={ {} }
          onClick={ props.copy }/>
      </Row>
      <Row>
        <Label>End Date</Label>
        <InputBox>
          <Input type="date"
            onChange={ v => props.updateSettings("endDate", v) }
            value={ endDate }/>
        </InputBox>
        <CopyIcon setting="endDate"
          isDifferent={ {} }
          onClick={ props.copy }/>
      </Row>

      <Row>
        <Label>Start Time</Label>
        <InputBox>
          <Input type="time"
            onChange={ v => props.updateSettings("startTime", v) }
            value={ startTime }/>
        </InputBox>
        <CopyIcon setting="startTime"
          isDifferent={ {} }
          onClick={ props.copy }/>
      </Row>
      <Row>
        <Label>End Time</Label>
        <InputBox>
          <Input type="time"
            onChange={ v => props.updateSettings("endTime", v) }
            value={ endTime }/>
        </InputBox>
        <CopyIcon setting="endTime"
          isDifferent={ {} }
          onClick={ props.copy }/>
      </Row>

      <Row>
        <div>Peak Selector</div>
        <div style={ { width: "85%", display: "flex" } }>
          {
            props.peaks.map(({ peak, name }) =>
              <button key={ peak } style={ { flex: `0 0 ${ 100 / 3 }%` } }
                className={ `rounded ${ props.settings[peak] ? 'bg-green-400' : 'bg-red-400' }` }
                onClick={ () => props.togglePeaks(peak) }>
                { name }
              </button>
            )
          }
        </div>
        <CopyIcon setting="peaks"
          isDifferent={ {} }
          onClick={ props.copy }/>
      </Row>

      <Row>
        <div>Weekday Selector</div>
        <div style={ { width: "85%", display: "flex" } }>
          {
            WEEKDAYS.map(({ day, key }) =>
              <button key={ key } style={ { flex: `0 0 ${ 100 / 7 }%` } }
                className={ `rounded ${ weekdays.includes(day) ? 'bg-green-400' : 'bg-red-400' }` }
                onClick={ e => props.toggleWeekday(day) }>
                { key }
              </button>
            )
          }
        </div>
        <CopyIcon setting="weekdays"
          isDifferent={ {} }
          onClick={ props.copy }/>
      </Row>

      <Row>
        <Label>Resolution</Label>
        <InputBox>
          <Select
            value={ RESOLUTIONS.filter(({ value }) => value === resolution) }
            multui={ false }
            searchable={ false }
            accessor={ d => d.name }
            onChange={ v => props.updateSettings("resolution", v.value) }
            options={ RESOLUTIONS }/>
        </InputBox>
      </Row>

    </ControlContainer>
  )
}

export default StationControls;
