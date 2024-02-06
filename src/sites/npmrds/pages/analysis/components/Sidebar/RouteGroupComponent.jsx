import React from "react"

import isEqual from "lodash/isEqual"
import get from "lodash/get"

import EditableTitle from "./components/EditableTitle"
import ColorPicker from "./components/ColorPicker"
import {
	ControlBox,
	Control,
	CheckBox
} from "./components/parts"

const RouteGroupComponent = props => {
	const {
		updateRouteGroup,
		updateRouteGroupWorkingSettings,
		compId,
		name,
		color,
		relativeDateBase,
		usingRelativeDates,
		workingSettings,
		...rest
	} = props
// console.log("RouteGroupComponent::props", props)

	const doUpdateRouteGroup = React.useCallback(e => {
		updateRouteGroup(compId);
	}, [updateRouteGroup, compId]);

	const updateRouteGroupName = React.useCallback(name => {
		updateRouteGroup(compId, "name", name);
	}, [updateRouteGroup, compId]);

	const useRelativeDates = React.useCallback(bool => {
		if (bool) {
			const update = {
				usingRelativeDates: true,
				relativeDateBase: {
			    compId: null,
			    startDate: null,
			    endDate: null
			  }
			}
			updateRouteGroupWorkingSettings(compId, update);
		}
		else {
			const update = {
				usingRelativeDates: false,
				relativeDateBase: null
			}
			updateRouteGroupWorkingSettings(compId, update);
		}
	}, [updateRouteGroupWorkingSettings, compId]);

	const updateRouteGroupColor = React.useCallback(({ hex }) => {
		updateRouteGroupWorkingSettings(compId, "color", hex);
	}, [updateRouteGroupWorkingSettings, compId]);

	const needsUpdate = React.useMemo(() => {
		const currentSettings = {
			color,
			relativeDateBase,
			usingRelativeDates
		}
		return !isEqual(currentSettings, workingSettings);
	}, [color, relativeDateBase, usingRelativeDates, workingSettings]);

	return (
    <div style={ {
      padding: "10px",
      position: "absolute",
      top: "0px", bottom: "0px",
      overflow: "auto",
      width: "100%"
    } }>
      <EditableTitle color={ color }
        onChange={ updateRouteGroupName }
        title={ name }/>

			<div style={ { borderBottom: `2px solid currentColor` } }>
				<ControlBox>
					<Control onClick={ doUpdateRouteGroup }
						disabled={ !needsUpdate }>
						<span className='mx-1 fa fa-refresh'/>
						<span>Update</span>
					</Control>
				</ControlBox>
			</div>

      <div className="flex items-center border-y border-current py-2 mt-2"
        style={ { marginBottom: "10px" } }
      >
        <div style={ { width: "85%", display: "flex" } }>
          Use group specific relative dates
        </div>
        <div style={ { width: "15%", display: "flex" } }
          className="flex items-center justify-center"
        >
          <CheckBox value={ get(workingSettings, "usingRelativeDates", false) }
            onChange={ useRelativeDates }/>
        </div>
      </div>

			<ColorPicker color={ get(workingSettings, "color", "#666666") }
				onChangeComplete={ updateRouteGroupColor }/>
    </div>
	)
}
export default RouteGroupComponent
