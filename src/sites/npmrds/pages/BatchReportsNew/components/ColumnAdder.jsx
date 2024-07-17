import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"
import moment from "moment"
import { v4 as uuidv4 } from "uuid"

import {
  Button,
  Input,
  MultiLevelSelect,
  useClickOutside
} from "~/modules/avl-map-2/src/uicomponents"
import RadioSelector from "./RadioSelector"

import { DATA_COLUMNS } from "./columns"

import RelativeDateControls from "./RelativeDateControls"

const ChevronsRight = () => {
  return (
    <>
      <span className="fa fa-chevron-right"/>
      <span className="fa fa-chevron-right"/>
      <span className="fa fa-chevron-right"/>
    </>
  )
}
const ChevronsLeft = () => {
  return (
    <>
      <span className="fa fa-chevron-left"/>
      <span className="fa fa-chevron-left"/>
      <span className="fa fa-chevron-left"/>
    </>
  )
}

const RadioOptions = [
  { label: "Relative Dates",
    value: "relative"
  },
  { label: "From Route",
    value: "from-route"
  },
  { label: "User Defined",
    value: "user-defined"
  }
]

const DataSources = [
  { label: "Freight Trucks and Passenger Vehicles",
    value: "travel_time_all_vehicles"
  },
  { label: "Freight Trucks only",
    value: "travel_time_freight_trucks"
  },
  { label: "Passenger Vehicles only",
    value: "travel_time_passenger_vehicles"
  }
]

const displayAccessor = o => o.label;
const valueAccessor = o => o.value;
const headerAccessor = c => c.header;
const valueComparator = (a, b) => a.key === b.key;

const getInitialState = (columns = []) => {
  const num = columns.length;
  const defaultDate = moment().subtract(1, "years").format("YYYY-MM-DD");
  return {
    name: num === 0 ? "Base" : `Column ${ num + 1 }`,
    dateSelection: num === 0 ? "from-route" : "relative",
    relativeDate: "",
    descriptor: "",
    startDate: defaultDate,
    endDate: defaultDate,
    dataColumns: [],
    dataSource: "travel_time_all_vehicles",
    uuid: uuidv4(),
    isBase: num === 0,
    editing: false
  }
}
const Reducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "start-new-column":
      return {
        ...getInitialState(payload.columns),
        dataColumns: payload.dataColumns
      }
    case "set-state":
      return { ...state, ...payload };
    case "set-name":
      return { ...state, name: payload.name };
    case "set-date-selection":
      return { ...state, dateSelection: payload.dateSelection };
    case "set-start-date":
      return { ...state, startDate: payload.startDate };
    case "set-end-date":
      return { ...state, endDate: payload.endDate };
    case "set-data-columns":
      return { ...state, dataColumns: [...payload.dataColumns] };
    case "set-data-source":
      return { ...state, dataSource: payload.source }
    case "set-relative-date":
      return { ...state, ...payload };
    case "reset-state":
      return getInitialState(payload.columns);
    default:
      return state;
  }
}

const ColumnAdder = props => {

  const {
    addColumn,
    editColumn,
    columns,
    deleteColumn,
    ...rest
  } = props;

  const [isOpen, setIsOpen] = React.useState(false);
  const toggle = React.useCallback(e => {
    e.stopPropagation();
    setIsOpen(o => !o);
  }, []);
  const open = React.useCallback(e => {
    e.stopPropagation();
    setIsOpen(true);
  }, []);
  const close = React.useCallback(e => {
    e.stopPropagation();
    setIsOpen(false);
  }, []);
  const [ref, setRef] = React.useState(null);
  useClickOutside(ref, close);

  const [state, dispatch] = React.useReducer(Reducer, props, getInitialState);

  const setName = React.useCallback(name => {
    dispatch({
      type: "set-name",
      name
    });
  }, []);
  const setDateSelection = React.useCallback(dateSelection => {
    dispatch({
      type: "set-date-selection",
      dateSelection
    });
  }, []);
  const setStartDate = React.useCallback(startDate => {
    dispatch({
      type: "set-start-date",
      startDate
    });
  }, []);
  const setEndDate = React.useCallback(endDate => {
    dispatch({
      type: "set-end-date",
      endDate
    });
  }, []);
  const setRelativeDate = React.useCallback(({ relativeDate, descriptor }) => {
    dispatch({
      type: "set-relative-date",
      relativeDate,
      descriptor
    });
  }, []);
  const setDataColumns = React.useCallback(cols => {
    dispatch({
      type: "set-data-columns",
      dataColumns: cols
    });
  }, []);
  const setDataSource = React.useCallback(source => {
    dispatch({
      type: "set-data-source",
      source
    })
  }, []);
  const resetState = React.useCallback(columns => {
    dispatch({ type: "reset-state", columns });
  }, []);
  const startNewColumn = React.useCallback(() => {
    dispatch({
      type: "start-new-column",
      columns: [...props.columns],
      dataColumns: props.columns.length ? [...columns[columns.length - 1].dataColumns] : []
    });
    setIsOpen(true);
  }, [props.columns]);
  const startEditColumn = React.useCallback((col, i) => {
    dispatch({ type: "set-state", editing: true, ...col });
    setIsOpen(true);
  }, []);

  const disabled = React.useMemo(() => {
    const {
      name,
      dateSelection,
      relativeDate,
      startDate,
      endDate,
      dataColumns
    } = state;
    return !(name && (dateSelection === "relative" ? relativeDate : (startDate && endDate)) && dataColumns.length);
  }, [state]);

  const doAddColumn = React.useCallback(e => {
    const {
      name,
      dateSelection,
      relativeDate,
      descriptor,
      startDate,
      endDate,
      dataColumns,
      dataSource,
      uuid,
      isBase
    } = state;
    const column = {
      name,
      dateSelection,
      relativeDate,
      descriptor,
      startDate,
      endDate,
      dataColumns,
      dataSource,
      uuid,
      isBase
    };
    addColumn(column);
  }, [addColumn, state, resetState, props.columns]);

  const doEditColumn = React.useCallback(e => {
    const {
      name,
      dateSelection,
      relativeDate,
      descriptor,
      startDate,
      endDate,
      dataColumns,
      dataSource,
      uuid,
      isBase
    } = state;
    const column = {
      name,
      dateSelection,
      relativeDate,
      descriptor,
      startDate,
      endDate,
      dataColumns,
      dataSource,
      uuid,
      isBase
    };
    editColumn(column);
  }, [editColumn, state, resetState, props.columns]);

  const prevColumns = React.useRef([]);
  React.useEffect(() => {
    if (!isEqual(prevColumns, props.columns)) {
      resetState(props.columns);
      prevColumns.current = props.columns;
    }
  }, [props.columns]);

  const {
    name,
    dateSelection,
    relativeDate,
    startDate,
    endDate,
    dataColumns,
    dataSource,
    uuid,
    editing
  } = state;

  React.useEffect(() => {
    if (columns.length > 0) {
      const prev = columns[columns.length - 1];
      setDataColumns(prev.dataColumns.map(dc => ({ ...dc })));
    }
  }, [columns, setDataColumns]);

  const dataColumnOptions = React.useMemo(() => {
    const isBase = (columns.length === 0) || (editing && (uuid === columns[0].uuid));
    const regex = /^.+[-]pc$/
    return DATA_COLUMNS.filter(col => !isBase || (isBase && !regex.test(col.key)))
  }, [columns.length, editing, uuid]);

  return (
    <div ref={ setRef } className="grid grid-cols-1 gap-1">
      <div className="border-b-2 font-bold border-current mb-1">
        Column Editor
      </div>
      <Button onClick={ isOpen ? close : startNewColumn }>
        { isOpen ?
          <>
            <ChevronsLeft /> Close
          </> :
          <>
            Create a New Column <ChevronsRight />
          </>
        }
      </Button>

      { columns.map((column, i) => (
          <div key={ column.name }
            className="flex"
          >
            <div>
              <Button className="buttonDangerSmall"
                onClick={ e => deleteColumn(column.uuid) }
                disabled={ columns.length > 1 && i === 0 }
              >
                Delete
              </Button>
            </div>
            <div className="flex-1 ml-2">
              <Button className="buttonSmallBlock"
                onClick={ e => startEditColumn(column) }
              >
                Edit Column: { column.name } <ChevronsRight />
              </Button>
            </div>
          </div>
        ))
      }

      <div className={ `
          absolute top-0 left-full pb-4 h-full z-20
          ${ isOpen ? "w-[400px] overflow-show" : "w-0 overflow-hidden" }
        ` }
      >
        <div className={ `
            h-full w-full p-4 relative flex flex-col
            bg-white shadow-lg shadow-black rounded-b-lg
          ` }
        >
          <div className="grid grid-cols-1 gap-2">
            <div className="font-bold border-current text-xl"
              style={ { borderBottomWidth: "3px" } }
            >
              { editing ? "Edit" : "Create" } a Column
            </div>

            <div className="grid grid-cols-3">
              <div className="mr-1 text-right font-bold py-1">Name</div>
              <div className="col-span-2">
                <Input type="text"
                  value={ name }
                  onChange={ setName }
                  placeholder="Name your column..."/>
              </div>
            </div>

            <div className="border-b-2 font-bold border-current">
              Date Selection
            </div>

            <div className="grid grid-cols-3">
              <div className="col-span-2 col-start-2">
                <RadioSelector
                  options={
                    state.isBase ? RadioOptions.slice(1) : RadioOptions
                  }
                  value={ dateSelection }
                  onChange={ setDateSelection }
                  displayAccessor={ displayAccessor }
                  valueAccessor={ valueAccessor }/>
              </div>
            </div>

            { dateSelection === "relative" ?
              <RelativeDateControls
                relativeDate={ relativeDate }
                setRelativeDate={ setRelativeDate }/> :
              <DateSelector
                startDate={ startDate }
                setStartDate={ setStartDate }
                endDate={ endDate }
                setEndDate={ setEndDate }
                dateSelection={ dateSelection }/>
            }

            <div className="border-b-2">Data Source</div>
            <MultiLevelSelect removable={ false }
              onChange={ setDataSource }
              options={ DataSources }
              displayAccessor={ displayAccessor }
              valueAccessor={ valueAccessor }
              value={ dataSource }
              placeholder="Select a data source..."/>

            <div className="border-b-2">Data Selection</div>
            <MultiLevelSelect isMulti
              onChange={ setDataColumns }
              options={ dataColumnOptions }
              displayAccessor={ headerAccessor }
              value={ dataColumns }
              valueComparator={ valueComparator }
              placeholder="Add a data column..."/>

          </div>
          <div className="flex-1 flex flex-col justify-end">
            <Button className="buttonBlock"
              disabled={ disabled }
              onClick={ editing ? doEditColumn : doAddColumn }
            >
              { editing ? "Edit" : "Add" } Column
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ColumnAdder;

const DateSelector = ({ startDate, setStartDate, endDate, setEndDate, dateSelection }) => {
  return (
    <div className="grid grid-cols-1 gap-1">
      <div>
        { dateSelection === "from-route" ?
          <span>
            Default Dates <span className="text-sm">(for routes lacking date information)</span>
          </span> :
          "User Defined Dates"
        }
      </div>
      <div className="grid grid-cols-3">
        <div className="font-bold text-right mr-1 py-1">
          Start Date
        </div>
        <div className="col-span-2">
          <Input type="date"
            value={ startDate }
            onChange={ setStartDate }/>
        </div>
      </div>
      <div className="grid grid-cols-3">
        <div className="font-bold text-right mr-1 py-1">
          End Date
        </div>
        <div className="col-span-2">
          <Input type="date"
            value={ endDate }
            onChange={ setEndDate }
            min={ startDate }
            disabled={ !startDate }/>
        </div>
      </div>
    </div>
  )
}
