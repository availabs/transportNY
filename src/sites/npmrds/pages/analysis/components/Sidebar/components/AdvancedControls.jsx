import React from "react"

import get from "lodash/get"

import moment from "moment"
import styled from "styled-components"
import { saveAs } from "file-saver"

import {
  useFalcor,
  Input,
  Select,
  ScalableLoading
} from "~/modules/avl-components/src"

// import { Input } from "components/common/styled-components"
// import ItemSelector from 'components/common/item-selector/item-selector';

import { resolutions } from "../../tmc_graphs/utils/resolutionFormats"

// import { falcorGraph } from "store/falcorGraph"

import {
	Row,
	Label,
	InputBox,
	CopyIcon,
	ControlContainer,
  CheckBox
} from "./parts"

import { getRequestKey } from "../../tmc_graphs/graphClasses/GeneralGraphComp"

import {
  RELATIVE_DATE_REGEX,
  calculateRelativeDates,
  RelativeDateOptions,
  SpecialOptions,
  StartOptions
} from "../../../reports/store/utils/relativedates.utils"

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

const AdvancedControls = props => {
  const {
    dateExtent: [min, max],
    SETTINGS,
    PEAKS,
    isDifferent,
    updateSettings,
    compId,
    route,
    inRouteGroup,
    usingRelativeDates,
    relativeDateBase
  } = props;

  let {
    startDate,
    endDate,
    startTime,
    endTime,
    resolution,
    weekdays,
    dataColumn,
    isRelativeDateBase,
    relativeDate,
    useRelativeDateControls = false,
    overrides = {}
  } = SETTINGS;

  const regex = /^(\d{0,4})(\d{2})(\d{2})$/;
  startDate = startDate.toString()
    .replace(regex, (p, y, m, d) => `${ `0000${ y }`.slice(-4) }-${ m }-${ d }`);
  endDate = endDate.toString()
    .replace(regex, (p, y, m, d) => `${ `0000${ y }`.slice(-4) }-${ m }-${ d }`);


  const [state, _setState] = React.useState({ showConfirm: false, downloading: false })
  const setState = React.useCallback(update => {
    _setState(prev => ({ ...prev, ...update }))
  }, []);

  const { falcor } = useFalcor();

  const downloadRawData = React.useCallback(() => {
    const Route = {
      settings: {
        ...SETTINGS,
        resolution: "NONE"
      },
      tmcArray: get(route, "tmcArray", [])
    }
    const key = getRequestKey(Route, { key: 'travelTime' });

    setState({ downloading: true, showConfirm: false });

    falcor.get(["routes", "data", key])
      .then(res => {

        const data = get(res, ["json", "routes", "data", key], []);

        if (data.length) {
          const keys = ["tmc", "epoch", "date", "travel_time_all"],
            rows = [keys.join(",")];

          data.forEach(row => {
            rows.push(keys.map(k => row[k]).join(","));
          })

          const blob = new Blob([rows.join("\n")], { type: "text/csv" }),
            title = get(route, "name", "");

          saveAs(blob, `npmrds${ title ? "_" : "" }${ title.replace(/\s/g, "_") }.csv`);
        }

        setState({ downloading: false });
      })
  }, [falcor, route, setState]);

  const updateStartDate = React.useCallback(v => {
    const date = +moment(v, 'YYYY-MM-DD').format('YYYYMMDD');
    if (!isNaN(date)) {
      updateSettings("startDate", date);
    }
  }, [updateSettings]);
  const updateEndDate = React.useCallback(v => {
    const date = +moment(v, 'YYYY-MM-DD').format('YYYYMMDD');
    if (!isNaN(date)) {
      updateSettings("endDate", date);
    }
  }, [updateSettings]);

  const setUseRelativeDateControls = React.useCallback(v => {
    const update = { useRelativeDateControls: v };
    if (!v) {
      update.relativeDate = null;
    }
    updateSettings(update);
  }, [updateSettings]);

  const updateOverrides = React.useCallback((key, value) => {
    const newOverrides = { ...overrides };
    if (!value) {
      delete newOverrides[key];
    }
    else {
      newOverrides[key] = value;
    }
    updateSettings("overrides", newOverrides);
  }, [updateSettings, overrides]);

// console.log("AdvancedControls", useRelativeDateControls, usingRelativeDates, isRelativeDateBase);

  return (
    <ControlContainer>

      { !state.downloading ? null :
        <DownloadingOverlay>
          <Message>
            <div>Downloading raw NPMRDS data.</div>
            <div>Please wait...</div>
          </Message>
          <ScalableLoading />
        </DownloadingOverlay>
      }

      { !usingRelativeDates || isRelativeDateBase ? null :
        <div className="flex items-center border-y border-current py-2"
          style={ { marginBottom: "10px" } }
        >
          <div style={ { width: "85%", display: "flex" } }>
            Use Relative Date Controls
          </div>
          <div style={ { width: "15%", display: "flex" } }
            className="flex items-center justify-center"
          >
            <CheckBox value={ useRelativeDateControls }
              onChange={ setUseRelativeDateControls }/>
          </div>
        </div>
      }

      { !useRelativeDateControls || isRelativeDateBase ?
        <>
          <Row>
            <Label>Start Date</Label>
            <InputBox>
              <Input type="date"
                onChange={ updateStartDate }
                value={ startDate }
                min={ min } max={ max }/>
            </InputBox>
            <CopyIcon setting="startDate"
              isDifferent={ isDifferent }
              onClick={ props.copy }/>
          </Row>
          <Row>
            <Label>End Date</Label>
            <InputBox>
              <Input type="date"
                onChange={ updateEndDate }
                value={ endDate }
                min={ min } max={ max }/>
            </InputBox>
            <CopyIcon setting="endDate"
              isDifferent={ isDifferent }
              onClick={ props.copy }/>
          </Row>
        </> :
        <RelativeDateControls
          updateSettings={ updateSettings }
          relativeDate={ relativeDate }
          relativeDateBase={ relativeDateBase }
          startDate={ startDate }
          endDate={ endDate }/>
      }

      <div className="flex items-center border-y border-current py-2"
        style={ { marginBottom: "10px" } }
      >
        <div style={ { width: "85%", display: "flex" } }>
          Set as relative date base
        </div>
        <div style={ { width: "15%", display: "flex" } }
          className="flex items-center justify-center"
        >
          <CheckBox value={ isRelativeDateBase }
            onChange={ v => updateSettings("isRelativeDateBase", v) }/>
        </div>
      </div>

      <Row>
        <Label>Start Time</Label>
        <InputBox>
          <Input type="time" step={ 1 }
            onChange={ v => updateSettings("startTime", v) }
            value={ startTime }/>
        </InputBox>
        <CopyIcon setting="startTime"
          isDifferent={ isDifferent }
          onClick={ props.copy }/>
      </Row>
      <Row>
        <Label>End Time</Label>
        <InputBox>
          <Input type="time" step={ 1 }
            onChange={ v => updateSettings("endTime", v) }
            value={ endTime }/>
        </InputBox>
        <CopyIcon setting="endTime"
          isDifferent={ isDifferent }
          onClick={ props.copy }/>
      </Row>

      <Row>
        <div>
          Peak Selector
        </div>
        <div style={ { width: "85%", display: "flex" } }>
          {
            PEAKS.map(({ peak, name }) =>
              <button key={ peak } style={ { flex: `0 0 ${ 100 / 3 }%` } }
  								className={ `rounded ${ SETTINGS[peak] ? 'bg-green-400' : 'bg-red-400' }` }
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

      <Row>
        <div>
          Weekday Selector
        </div>
        <div style={ { width: "85%", display: "flex" } }>
          {
            WEEKDAYS.map(({ day, key }) =>
              <button key={ key } style={ { flex: `0 0 ${ 100 / 7 }%` } }
                className={ `rounded ${ weekdays[day] ? 'bg-green-400' : 'bg-red-400' }` }
                onClick={ e => props.toggleWeekday(day) }>
                { key }
              </button>
            )
          }
        </div>
        <CopyIcon setting="weekdays"
          isDifferent={ isDifferent }
          onClick={ props.copy }/>
      </Row>

      <Row>
        <Label>Resolution</Label>
        <InputBox>
          <Select
            value={ resolution }
            multi={ false }
            searchable={ false }
            accessor={ d => d.name || resolutions.reduce((a, c) => c.resolution === resolution ? c.name : a, d) }
            valueAccessor={ d => d.resolution }
            onChange={ v => updateSettings("resolution", v) }
            options={ resolutions }/>
        </InputBox>
        <CopyIcon setting="resolution"
          isDifferent={ isDifferent }
          onClick={ props.copy }/>
      </Row>

      <Row>
        <Label>Data</Label>
        <InputBox>
          <Select
            value={ dataColumn }
            multi={ false }
            searchable={ false }
            accessor={ d => d.display }
            valueAccessor={ d => d.key }
            onChange={ v => updateSettings("dataColumn", v) }
            options={ DATA_COLUMNS }/>
        </InputBox>
        <CopyIcon setting="dataColumn"
          isDifferent={ isDifferent }
          onClick={ props.copy }/>
      </Row>

      <Row>
        { !state.showConfirm ?
          <button className="btn btn-sm btn-block btn-primary"
            onClick={ () => setState({ showConfirm: true }) }>
            Download Raw NPMRDS Data
          </button>
          :
          <div style={ { position: "relative", width: "100%" } }>
            <button className="btn btn-sm btn-danger"
              onClick={ () => setState({ showConfirm: false }) }>
              Cancel
            </button>
            <button className="btn btn-sm btn-primary"
              style={ { position: "absolute", right: 0 } }
              onClick={ () => downloadRawData() }>
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
                onChange={ v => updateOverrides("aadt", v) }
                value={ overrides.aadt || "" }/>
            </InputBox>
          </Row>

          <Row>
            <Label>Precent Speed</Label>
            <InputBox style={ { maxWidth: "70%", width: "70%", flex: "0 0 70%" } }>
              <Input type="number" step={ 0.25 }
                onChange={ v => updateOverrides("speed", v) }
                value={ overrides.speed || "" }/>
            </InputBox>
          </Row>

          <Row>
            <Label>Threshold Speed</Label>
            <InputBox style={ { maxWidth: "70%", width: "70%", flex: "0 0 70%" } }>
              <Input type="number" step={ 1 }
                onChange={ v => updateOverrides("thresholdSpeed", v) }
                value={ overrides.thresholdSpeed || "" }/>
            </InputBox>
          </Row>

          <Row>
            <Label>Base Speed</Label>
            <InputBox style={ { maxWidth: "70%", width: "70%", flex: "0 0 70%" } }>
              <Input type="number" step={ 1 }
                onChange={ v => updateOverrides("baseSpeed", v) }
                value={ overrides.baseSpeed || "" }/>
            </InputBox>
          </Row>

        </div>
      </Row>

    </ControlContainer>
  )
}
export default AdvancedControls

const InitState = relativeDate => {
  const match = RELATIVE_DATE_REGEX.exec(relativeDate);
  if (match) {
    const [, inputdate, timespan, operation = "", amount = "", duration = ""] = match;
    return {
      inputdate,
      timespan,
      operation,
      amount,
      duration
    }
  }
  return {
    inputdate: "startDate",
    timespan: "",
    operation: "-",
    amount: "1",
    duration: "1"
  };
}
const Reducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "set-timespan": {
      const { timespan } = payload;
      return {
        ...state,
        timespan,
        inputdate: "startDate",
        operation: "-",
        amount: "1",
        duration: "1"
      }
    }
    case "set-operation": {
      const { operation } = payload;
      return {
        ...state,
        operation,
        inputdate: operation === "-" ? "startDate" : "endDate"
      }
    }
    case "set-amount": {
      const { amount } = payload;
      return {
        ...state,
        amount
      }
    }
    case "set-duration": {
      const { duration } = payload;
      return {
        ...state,
        duration
      }
    }
    default:
      return state;
  }
}

const accessor = v => v.display;
const valueAccessor = v => v.value;

const RelativeDateControls = props => {

  const {
    updateSettings,
    relativeDateBase,
    relativeDate,
    startDate,
    endDate
  } = props;

  const [state, dispatch] = React.useReducer(Reducer, relativeDate, InitState);

  const setTimespan = React.useCallback(v => {
    dispatch({
      type: "set-timespan",
      timespan: v
    })
  }, []);
  const setOperation = React.useCallback(v => {
    dispatch({
      type: "set-operation",
      operation: v
    })
  }, []);
  const setAmount = React.useCallback(v => {
    dispatch({
      type: "set-amount",
      amount: v
    })
  }, []);
  const setDuration = React.useCallback(v => {
    dispatch({
      type: "set-duration",
      duration: v
    })
  }, []);

  const calculated = React.useMemo(() => {
    let rd = `${ state.inputdate }=>${ state.timespan }`;
    if (!SpecialOptions.includes(state.timespan)) {
      rd = `${ rd }${ state.operation }${ state.amount }${ state.timespan }->${ state.duration }${ state.timespan }`
    }
    return RELATIVE_DATE_REGEX.test(rd) ? rd : null;
  }, [state]);

  React.useEffect(() => {
    if (calculated) {
      updateSettings("relativeDate", calculated);
    }
  }, [calculated]);

  const inputDates = React.useMemo(() => {
    return [
      moment(relativeDateBase.startDate, "YYYYMMDD").format("YYYY-MM-DD"),
      moment(relativeDateBase.endDate, "YYYYMMDD").format("YYYY-MM-DD")
    ]
  }, [relativeDateBase]);

  return (
    <div className="mb-2">

      <div>
        <div className="flex items-center">
          <div className="flex-1 mr-1">Input Start Date:</div>
          <div className="w-28 text-right">{ inputDates[0] }</div>
        </div>
        <div className="flex items-center">
          <div className="flex-1 mr-1">Input End Date:</div>
          <div className="w-28 text-right">{ inputDates[1] }</div>
        </div>
      </div>

      <div className="flex items-center">
        <div>Time Span</div>
        <div className="flex-1 ml-1">
          <Select
            value={ state.timespan }
            multi={ false }
            searchable={ false }
            accessor={ accessor }
            valueAccessor={ valueAccessor }
            onChange={ setTimespan }
            options={ RelativeDateOptions }/>
          </div>
      </div>

      { !state.timespan || SpecialOptions.includes(state.timespan) ? null :
        <>
          <div>
            <div className="">Relative Start Date</div>
            <div className="flex items-center mb-1">
              <div className="w-12"/>
              <Input type="number" min="1"
                value={ state.amount }
                onChange={ setAmount }/>
              <div className="ml-1">{ state.timespan }(s)</div>
            </div>
            <Select
              value={ state.operation }
              multi={ false }
              searchable={ false }
              accessor={ accessor }
              valueAccessor={ valueAccessor }
              onChange={ setOperation }
              options={ StartOptions }/>
          </div>

          <div className="flex items-center mt-1">
            <div className="w-12 text-right">for</div>
            <div className="flex items-center ml-1">
              <Input type="number" min="1"
                value={ state.duration }
                onChange={ setDuration }/>
              <div className="ml-1">{ state.timespan }(s)</div>
            </div>
          </div>
        </>
      }

      { <div>
          <div className="flex items-center">
            <div className="flex-1 mr-1">Start Date:</div>
            <div className="w-28 text-right">{ startDate }</div>
          </div>
          <div className="flex items-center">
            <div className="flex-1 mr-1">End Date:</div>
            <div className="w-28 text-right">{ endDate }</div>
          </div>
        </div>
      }

    </div>
  )
}
