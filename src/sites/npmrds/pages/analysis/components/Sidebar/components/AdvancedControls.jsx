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
	ControlContainer
} from "./parts"

import { getRequestKey } from "../../tmc_graphs/graphClasses/GeneralGraphComp"

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
    route
  } = props;

  let {
    startDate,
    endDate,
    startTime,
    endTime,
    resolution,
    weekdays,
    dataColumn,
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

      <Row>
        <Label>Start Date</Label>
        <InputBox>
          <Input type="date"
            onChange={ v => {
              const date = +moment(v, 'YYYY-MM-DD').format('YYYYMMDD');
              if (!isNaN(date)) {
                updateSettings("startDate", date);
              }
            } }
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
            onChange={ v => {
              const date = +moment(v, 'YYYY-MM-DD').format('YYYYMMDD');
              if (!isNaN(date)) {
                updateSettings("endDate", date);
              }
            } }
            value={ endDate }
            min={ min } max={ max }/>
        </InputBox>
        <CopyIcon setting="endDate"
          isDifferent={ isDifferent }
          onClick={ props.copy }/>
      </Row>

      <Row>
        <Label>Start Time</Label>
        <InputBox>
          <Input type="time"
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
          <Input type="time"
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
