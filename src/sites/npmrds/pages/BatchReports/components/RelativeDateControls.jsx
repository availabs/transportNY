import React from "react"

import moment from "moment"

import {
  RELATIVE_DATE_REGEX,
  calculateRelativeDates,
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

const InitialState = {
  inputdate: "startDate",
  timespan: "",
  operation: "-",
  amount: "1",
  duration: "1",
  relativeDates: []
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
    case "reset-state":
      return {
        ...InitialState,
        relativeDates: [...state.relativeDates]
      };
    case "add-relative-date":
      return {
        ...state,
        relativeDates: [...state.relativeDates, payload.relativeDate]
      }
    case "remove-relative-date":
      return {
        ...state,
        relativeDates: state.relativeDates
          .filter(rd => rd.relativeDate !== payload.relativeDate.relativeDate)
      }
    default:
      return state;
  }
}

const getRelativeDateDescriptor = relativeDate => {
  if (!RELATIVE_DATE_REGEX.test(relativeDate)) return "Invalid Relative Date";

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

const RelativeDateControls = props => {

  const {
    activeDateColumns,
    setActiveDateColumns
  } = props;

  const [state, dispatch] = React.useReducer(Reducer, InitialState);

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
  const resetState = React.useCallback(() => {
    dispatch({
      type: "reset-state"
    })
  }, []);
  const addRelativeDate = React.useCallback(rd => {
    dispatch({
      type: "add-relative-date",
      relativeDate: rd
    })
  }, []);
  const removeRelativeDate = React.useCallback(rd => {
    dispatch({
      type: "remove-relative-date",
      relativeDate: rd
    })
  }, []);

  const relativeDate = React.useMemo(() => {
    const {
      inputdate,
      timespan,
      operation,
      amount,
      duration
    } = state;

    let rd = `${ inputdate }=>${ timespan }`;
    if (!SpecialOptions.includes(timespan)) {
      rd = `${ rd }${ operation }${ amount }${ timespan }->${ duration }${ timespan }`
    }
    return RELATIVE_DATE_REGEX.test(rd) ? rd : null;
  }, [state]);

  const doAddRelativeDate = React.useCallback(e => {
    e.stopPropagation();
    const [, inputdate,
              timespan,
              operation = "",
              amount = "",
              duration = ""] = RELATIVE_DATE_REGEX.exec(relativeDate);
    const descriptor = getRelativeDateDescriptor(relativeDate);
    addRelativeDate({ relativeDate, descriptor });
    resetState();
  }, [relativeDate, addRelativeDate, resetState]);

  React.useEffect(() => {
    const columns = state.relativeDates.reduce((a, c) => {
      const [, inputdate,
                timespan,
                operation = "",
                amount = "",
                duration = ""] = RELATIVE_DATE_REGEX.exec(c.relativeDate);

      const ts = RelativeDateOptions.reduce((a, c) => {
        return c.value === timespan ? c.display : a;
      }, null);

      let startHeader = SpecialOptions.includes(timespan) ? `${ ts } Start Date` :
        `${ amount } ${ timespan }${ amount > 1 ? "s" : "" } ${ operation === "-" ? "Before" : "After" } Start Date`;

      let endHeader = SpecialOptions.includes(timespan) ? `${ ts } End Date` :
        `${ amount } ${ timespan }${ amount > 1 ? "s" : "" } ${ operation === "-" ? "Before" : "After" } End Date`;

      a.push(
        { key: `${ c.relativeDate }-start`,
          relativeDate: c.relativeDate,
          header: startHeader,
          comp: "relative-date",
          type: "date:start",
          removable: true,
          required: false
        },
        { key: `${ c.relativeDate }-end`,
          relativeDate: c.relativeDate,
          header: endHeader,
          comp: "relative-date",
          type: "date:end",
          removable: true,
          required: false
        }
      )
      return a;
    }, []);
    setActiveDateColumns(prev => {
      const prevMap = prev.reduce((a, c) => {
        a[c.key] = c;
        return a;
      }, {});
      return columns.map(col => {
        if (col.key in prevMap) {
          return { ...col, ...prev[col.key] };
        }
        return col;
      });
    });
  }, [state.relativeDates, setActiveDateColumns]);

  const [show, setShow] = React.useState(false);
  const [outter, setOutter] = React.useState(null);
  const toggleDropdown = React.useCallback(e => {
    e.stopPropagation();
    setShow(show => !show);
  }, []);
  const hideDropdown = React.useCallback(e => {
    e.stopPropagation();
    setShow(false);
  }, []);

  useClickOutside(outter, hideDropdown);

  const stopPropagation = React.useCallback(e => {
    e.stopPropagation();
  }, []);

  return (
    <div ref={ setOutter }
      className="relative cursor-pointer"
      onClick={ toggleDropdown }
    >

      <ValueContainer relativeDates={ state.relativeDates }
        remove={ removeRelativeDate }/>

      <div onClick={ stopPropagation }
        className={ `
          absolute w-full max-w-full overflow-autop-2
          ${ show ? "h-fit" : "hidden h-0" }
        ` }
        style={ {
          zIndex: 5,
          top: `100%`,
          left: "0%",
          paddingTop: "0.25rem"
        } }
      >
        <div className="p-2 bg-gray-200">
          <div className="flex items-center mt-2">
            <div>Time Span</div>
            <div className="flex-1 ml-1">
              <MultiLevelSelect
                placeholder="Select a timespan..."
                value={ state.timespan }
                searchable={ false }
                displayAccessor={ v => v.display }
                valueAccessor={ v => v.value }
                onChange={ setTimespan }
                options={ RelativeDateOptions }/>
              </div>
          </div>

          { !state.timespan || SpecialOptions.includes(state.timespan) ? null :
            <>
              <div>
                <div className="py-1">Relative Date...</div>
                <div className="flex items-center mb-1">
                  <div className="w-12"/>
                  <Input type="number" min="1"
                    value={ state.amount }
                    onChange={ setAmount }/>
                  <div className="ml-1">{ state.timespan }(s)</div>
                </div>
                <MultiLevelSelect
                  removable={ false }
                  value={ state.operation }
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
                    value={ state.duration }
                    onChange={ setDuration }/>
                  <div className="ml-1">{ state.timespan }(s)</div>
                </div>
              </div>
            </>
          }
          <div className="mt-2">
            <Button className="buttonBlock"
              onClick={ doAddRelativeDate }
              disabled={ !relativeDate }
            >
              Add Relative Date
            </Button>
          </div>
        </div>

      </div>

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
