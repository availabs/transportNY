import React from "react"

import RadioSelector from "./RadioSelector"

export const TimeSourceOptions = ["From Route", "User Defined"];

import { Input } from "~/modules/avl-map-2/src/uicomponents"

const TimeSelector = props => {
  const {
    timeSource,
    setTimeSource,
    startTime,
    setStartTime,
    endTime,
    setEndTime
  } = props;
  return (
    <div className="grid grid-cols-1 gap-1">
      <div className="border-b-2 font-bold border-current">
        Time Selection
      </div>
      <RadioSelector
        options={ TimeSourceOptions }
        value={ timeSource }
        onChange={ setTimeSource }/>
      <div>
        { timeSource === "From Route" ?
          <span>
            Default Times <span className="text-sm">(for routes lacking time information)</span>
          </span> :
          "User Defined Times"
        }
      </div>
      <div className="grid grid-cols-3">
        <div className="py-1 text-right mr-1 font-bold">Start Time</div>
        <div className="col-span-2">
          <Input type="time" step={ 1 }
            value={ startTime }
            onChange={ setStartTime }/>
        </div>
      </div>
      <div className="grid grid-cols-3">
        <div className="py-1 text-right mr-1 font-bold">End Time</div>
        <div className="col-span-2">
          <Input type="time" step={ 1 }
            value={ endTime }
            onChange={ setEndTime }/>
        </div>
      </div>
    </div>
  )
}
export default TimeSelector;
