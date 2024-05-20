import React from "react"

import moment from "moment"

import {
  RELATIVE_DATE_REGEX,
  RelativeDateOptions,
  SpecialOptions,
  StartOptions
} from "~/sites/npmrds/pages/analysis/reports/store/utils/relativedates.utils"

import {
  MultiLevelSelect,
  Input,
  Button,
  useTheme,
  useClickOutside
} from "~/modules/avl-map-2/src/uicomponents"

const getRelativeDateDescriptor = relativeDate => {
  if (!RELATIVE_DATE_REGEX.test(relativeDate)) return "";

  const [, inputdate,
            timespan,
            operation = "",
            amount = "",
            duration = ""] = RELATIVE_DATE_REGEX.exec(relativeDate);

  if (SpecialOptions.includes(timespan)) {
    return RelativeDateOptions.reduce((a, c) => {
      return c.value === timespan ? c.display : a;
    }, null);
  }
  const id = inputdate === "startDate" ? "start date" : "end date";
  const o = operation === "-" ? "before" : "after";
  return `${ amount } ${ timespan }${ amount > 1 ? "s" : "" } ${ o } ${ id } for ${ duration } ${ timespan }${ duration > 1 ? "s" : "" }`;
}

const RelativeDateControls = ({ relativeDate, setRelativeDate }) => {

  const doSetRelativeDate = React.useCallback(relativeDate => {
    const descriptor = getRelativeDateDescriptor(relativeDate);
    setRelativeDate({ relativeDate, descriptor });
  }, [setRelativeDate]);

  const [inputDate,
          timespan,
          operation = "-",
          amount = "1",
          duration = "1"] = React.useMemo(() => {
    if (!RELATIVE_DATE_REGEX.test(relativeDate)) {
      return ["startDate", ""];
    }
    return RELATIVE_DATE_REGEX.exec(relativeDate).slice(1);
  }, [relativeDate]);

  const setTimespan = React.useCallback(timespan => {
    if (SpecialOptions.includes(timespan)) {
      doSetRelativeDate(`${ inputDate }=>${ timespan }`);
    }
    else {
      doSetRelativeDate(`${ inputDate }=>${ timespan }${ operation }${ amount }${ timespan }->${ duration }${ timespan }`);
    }
  }, [doSetRelativeDate, inputDate, operation, amount, duration]);

  const setAmount = React.useCallback(amount => {
    doSetRelativeDate(`${ inputDate }=>${ timespan }${ operation }${ amount }${ timespan }->${ duration }${ timespan }`);
  }, [doSetRelativeDate, inputDate, timespan, operation, duration]);

  const setOperation = React.useCallback(operation => {
    doSetRelativeDate(`${ operation === "+" ? "endDate" : "startDate" }=>${ timespan }${ operation }${ amount }${ timespan }->${ duration }${ timespan }`);
  }, [doSetRelativeDate, timespan, amount, duration]);

  const setDuration = React.useCallback(duration => {
    doSetRelativeDate(`${ inputDate }=>${ timespan }${ operation }${ amount }${ timespan }->${ duration }${ timespan }`);
  }, [doSetRelativeDate, inputDate, timespan, amount, operation]);

  return (
    <div className="relative">

      <div className="py-1">Relative Date...</div>

      <div className="flex items-center mt-2 mb-1">
        <div>Time Span</div>
        <div className="flex-1 ml-1">
          <MultiLevelSelect
            placeholder="Select a timespan..."
            value={ timespan }
            searchable={ false }
            displayAccessor={ v => v.display }
            valueAccessor={ v => v.value }
            onChange={ setTimespan }
            options={ RelativeDateOptions }/>
          </div>
      </div>

      { !timespan || SpecialOptions.includes(timespan) ? null :
        <>
          <div>
            <div className="flex items-center mb-1">
              <div className="w-12"/>
              <Input type="number" min="1"
                value={ amount }
                onChange={ setAmount }/>
              <div className="ml-1">{ timespan }(s)</div>
            </div>
            <MultiLevelSelect
              removable={ false }
              value={ operation }
              searchable={ false }
              displayAccessor={ v => v.display }
              valueAccessor={ v => v.value }
              onChange={ setOperation }
              options={ StartOptions }/>
          </div>

          <div className="flex items-center mt-1">
            <div className="w-12 text-right">for</div>
            <div className="flex items-center ml-1">
              <Input type="number" min="1"
                value={ duration }
                onChange={ setDuration }/>
              <div className="ml-1">{ timespan }(s)</div>
            </div>
          </div>
        </>
      }

    </div>
  )
}
export default RelativeDateControls;

const ValueItem = ({ relativeDate, remove }) => {
  const doRemove = React.useCallback(e => {
    e.stopPropagation();
    remove(relativeDate);
  }, [remove, relativeDate]);
  const theme = useTheme();
  return (
    <div className={ `
        px-1 flex items-center rounded mt-1 ml-1
        ${ theme.bgAccent1 }
      ` }
    >
      { relativeDate.descriptor }
      <span onClick={ doRemove }
        className={ `
          fa fa-remove text-xs ml-2 px-1 rounded
          ${ theme.bgAccent3Hover }
        ` }/>
    </div>
  )
}
const PlaceHolder = ({ children }) => {
  const theme = useTheme();
  return (
    <div className={ `px-1 mt-1 ml-1 ${ theme.textDisabled }` }>
      { children }
    </div>
  )
}
const ValueContainer = props => {
  const {
    relativeDates,
    remove
  } = props;
  const theme = useTheme();
  return (
    <div tabIndex={ -1 }
      className={ `
        ${ theme.bgInput } rounded pl-1 pb-1 pr-2 flex flex-wrap
        focus:outline-1 focus:outline focus:outline-current
        hover:outline-1 hover:outline hover:outline-gray-300
      ` }
    >
      { !relativeDates.length ?
        <PlaceHolder>
          { "Add a relative date..." }
        </PlaceHolder> :
        relativeDates.map(rd => (
          <ValueItem key={ rd.relativeDate }
            relativeDate={ rd }
            remove={ remove }/>
        ))
      }
    </div>
  )
}
