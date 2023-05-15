import React from "react"

import { ControlBox, Control } from "./components/parts"
import ColorPicker from "./components/ColorPicker"
import EditableTitle from "./components/EditableTitle"
import StationControls from "./components/StationControls"

import { PEAKS } from "../../reports/store/utils/general.utils"
import DateObject from "../tmc_graphs/utils/DateObject"

import deepequal from "deep-equal"

class StationComponent extends React.Component {
  state = {
    color: this.props.station_comp.color
  }
  needsUpdate() {
    return this.shouldReloadData() ||
      this.props.station_comp.color !== this.state.color;
  }
  shouldReloadData() {
    const { settings, workingSettings } = this.props.station_comp;
    return !deepequal(settings, workingSettings);
  }
  updateSettings(key, value) {
    const { compId } = this.props.station_comp,
      update = { [key]: value };
    if ((key === "startTime") || (key === "endTime")) {
      update.amPeak = false;
      update.offPeak = false;
      update.pmPeak = false;
    }
    this.props.updateSettings(compId, update);
  }
  updateStation() {
    const { compId } = this.props.station_comp;
    this.props.updateStation(compId, this.state.color);
  }
  togglePeaks(peak) {
    const { compId, workingSettings } = this.props.station_comp,
      { amPeak, offPeak, pmPeak } = workingSettings,
      update = {
        amPeak,
        offPeak,
        pmPeak,
        [peak]: !workingSettings[peak]
      };
    let startTime = "07:00", endTime = "19:00";
    const range = PEAKS.reduce((a, c) => {
      if (update[c.peak]) {
        if (!a.length) {
          a = [...c.range];
        }
        else {
          a[0] = Math.min(a[0], c.range[0]);
          a[1] = Math.max(a[1], c.range[1]);
        }
      }
      return a;
    }, [])
    if (range.length) {
      startTime = DateObject.epochToTimeString(range[0]);
      endTime = DateObject.epochToTimeString(range[1]);
    }
    this.props.updateSettings(compId, { startTime, endTime, ...update });
  }
  render() {
    const { name, workingSettings } = this.props.station_comp,
      { title } = this.props.station_comp.settings,
      needsUpdate = this.needsUpdate();
    return (
			<div style={ { padding: "10px" } }>

        <EditableTitle color={ this.state.color }
          onChange={ t => this.updateSettings("compTitle", t) }
          title={ title || name }/>

				<div style={ { borderBottom: `2px solid currentColor` } }>
					<ControlBox>
            <Control />
						<Control onClick={ e => needsUpdate && this.updateStation() }
							disabled={ !needsUpdate }>
							<span>Update</span>
							<span className='fa fa-refresh'/>
						</Control>
					</ControlBox>
				</div>

        <StationControls settings={ workingSettings }
          updateSettings={ (k, v) => this.updateSettings(k, v) }
          updateStation={ () => this.updateStation() }
          peaks={ PEAKS }
          togglePeaks={ peak => this.togglePeaks(peak) }/>

        <div style={ { paddingTop: "10px" } }>
          <ColorPicker color={ this.state.color }
            onChangeComplete={ ({ hex }) => this.setState({ color: hex }) }/>
        </div>

      </div>
    )
  }
}
export default StationComponent
