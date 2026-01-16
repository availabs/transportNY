import React from "react"

import isEqual from "lodash/isEqual"
import get from "lodash/get"

import { useFalcor, ScalableLoading } from "~/modules/avl-components/src"

import { Modal, MultiLevelSelect } from "~/sites/npmrds/components"

const DateTimeRegex = /(\d{4}-\d\d-\d\d)(?:T(\d\d[:]\d\d[:]\d\d))?/;

const processDates = dates => {
  const response = [["", ""], ["", ""]];
  const [startDate, endDate] = dates;
  if (DateTimeRegex.test(startDate)) {
    const [, sd, st] = DateTimeRegex.exec(startDate);
    response[0][0] = sd || "";
    response[1][0] = st || "";
  }
  else {
    response[0][0] = startDate || "";
  }
  if (DateTimeRegex.test(endDate)) {
    const [, sd, st] = DateTimeRegex.exec(endDate);
    response[0][1] = sd || "";
    response[1][1] = st || "";
  }
  else {
    response[0][1] = endDate || "";
  }
  return response;
}

const InitReducer = ([loadedRoute, folderId = ""]) => ({
  name: get(loadedRoute, "name", ""),
  description: get(loadedRoute, "description", ""),
  folder: get(loadedRoute, "folder", folderId),
  id: get(loadedRoute, "id", null),
  dates: [...get(loadedRoute, "dates", [])]
})
const Reducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "update-state":
      return {
        ...state,
        ...payload
      }

    case "update-start-date": {
      const [[startDate, endDate], [startTime, endTime]] = processDates(state.dates);
      // const update = payload.startDate.replaceAll("-", "");
      return {
        ...state,
        dates: [
          `${ payload.startDate }${ startTime ? `T${ startTime }` : "" }`,
          `${ endDate }${ endTime ? `T${ endTime }` : "" }`
        ]
      }
    }
    case "update-end-date": {
      const [[startDate, endDate], [startTime, endTime]] = processDates(state.dates);
      // const update = payload.endDate.replaceAll("-", "");
      return {
        ...state,
        dates: [
          `${ startDate }${ startTime ? `T${ startTime }` : "" }`,
          `${ payload.endDate }${ endTime ? `T${ endTime }` : "" }`
        ]
      }
    }

    case "update-start-time": {
      const [[startDate, endDate], [startTime, endTime]] = processDates(state.dates);
      // const update = `${ payload.startTime.replaceAll(":", "") }00`;
      return {
        ...state,
        dates: [
          `${ startDate }T${ payload.startTime }`,
          `${ endDate }${ endTime ? `T${ endTime }` : "" }`
        ]
      }
    }
    case "update-end-time": {
      const [[startDate, endDate], [startTime, endTime]] = processDates(state.dates);
      // const update = `${ payload.endTime.replaceAll(":", "") }00`;
      return {
        ...state,
        dates: [
          `${ startDate }${ startTime ? `T${ startTime }` : "" }`,
          `${ endDate }T${ payload.endTime }`
        ]
      }
    }

    case "reset":
      return InitReducer(payload.data);
    default:
      return state;
  }
}

const RouteSaveModal = ({ isOpen, close, loadedRoute, folderId, ...props }) => {

  const [state, dispatch] = React.useReducer(Reducer, [loadedRoute, folderId], InitReducer);

  React.useEffect(() => {
    if (loadedRoute && (state.id !== loadedRoute.id)) {
      dispatch({ type: "reset", data: [loadedRoute, folderId] });
    }
  }, [state.id, loadedRoute, folderId]);

  const setName = React.useCallback(e => {
    dispatch({
      type: "update-state",
      name: e.target.value
    });
  }, []);
  const setDescription = React.useCallback(e => {
    dispatch({
      type: "update-state",
      description: e.target.value
    });
  }, []);
  const setFolder = React.useCallback(v => {
    dispatch({
      type: "update-state",
      folder: v
    });
  }, []);

  const setStartDate = React.useCallback(e => {
    dispatch({
      type: "update-start-date",
      startDate: e.target.value
    });
  }, []);
  const setEndDate = React.useCallback(e => {
    dispatch({
      type: "update-end-date",
      endDate: e.target.value
    });
  }, []);

  const setStartTime = React.useCallback(e => {
    dispatch({
      type: "update-start-time",
      startTime: e.target.value
    });
  }, []);
  const setEndTime = React.useCallback(e => {
    dispatch({
      type: "update-end-time",
      endTime: e.target.value
    });
  }, []);

  const { falcor, falcorCache } = useFalcor();

  const [folders, setFolders] = React.useState([]);

  React.useEffect(() => {
    falcor.get(["folders2", "user", "tree"]);
  }, [falcor]);

  React.useEffect(() => {
    const folders = get(falcorCache, ["folders2", "user", "tree", "value"], []);
    if (Array.isArray(folders)) {
      setFolders(folders);
    }
  }, [falcorCache]);

  const [saving, setSaving] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const doClose = React.useCallback(() => {
    setResult(null);
    close();
  }, [close]);

  const saveRoute = React.useCallback(e => {
    const savePoints = Boolean(props.points.length);
    const { dates, ...rest } = state;
    const [[sd, ed], [st, et]] = processDates(state.dates);
    const saveDates = Boolean(sd) && Boolean(ed);
    const saveTimes = saveDates && Boolean(st) && Boolean(et);
    const data = {
      ...rest,
      routeId: state.id,
      points: savePoints ? props.points : [],
      tmc_array: savePoints ? [] : props.tmc_array,
      metadata: saveTimes ? { dates: [...dates] } : saveDates ? { dates: [sd, ed] } : null
    }
    setSaving(true);
    falcor.call(["routes2", "save"], [data])
      .then(() => setResult({ msg: "success" }))
      .catch(e => setResult({ msg: "failure", error: e }))
      .then(() => setSaving(false));
  }, [falcor, state, props.points, props.tmc_array]);

  React.useEffect(() => {
    if (saving) {
      dispatch({ type: "reset", data: [loadedRoute, folderId] });
    }
  }, [loadedRoute, folderId, saving]);

  const canSave = React.useMemo(() => {
    const { points = [], tmc_array = [], ...route } = loadedRoute || {};

    return state.name && state.folder &&
      !(isEqual(state, route) &&
        isEqual(props.points, points) &&
        isEqual(props.tmc_array, tmc_array)) &&
      (props.points.length || props.tmc_array.length);
  }, [state, loadedRoute, props.points, props.tmc_array]);

  const [[startDate, endDate], [startTime, endTime]] = React.useMemo(() => {
    return processDates(state.dates);
  }, [state.dates]);

  return (
    <Modal isOpen={ isOpen } close={ doClose }>
      { !saving ? null :
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <ScalableLoading />
        </div>
      }
      <div className="w-screen max-w-3xl">

        { !result ?
          <div className="grid grid-cols-6 items-start mt-6 gap-2">

            <div className="font-bold text-right pt-1">Name</div>
            <div className="col-span-5">
              <input type="text"
                className={ `
                  w-full px-2 py-1 rounded
                  focus:outline-2 focus:outline focus:outline-current
                  hover:outline-2 hover:outline hover:outline-gray-300
                ` }
                value={ state.name }
                onChange={ setName }
                placeholder="type a name..."/>
            </div>

            <div className="font-bold text-right pt-1">Description</div>
            <div className="col-span-5">
              <textarea type="text"
                className={ `
                  w-full px-2 py-1 rounded
                  focus:outline-2 focus:outline focus:outline-current
                  hover:outline-2 hover:outline hover:outline-gray-300
                ` }
                style={ { marginBottom: "-0.5rem" } }
                rows={ 5 }
                value={ state.description }
                onChange={ setDescription }
                placeholder="type a description..."/>
            </div>

            <div className="font-bold text-right pt-1">Folder</div>
            <div className="col-span-5">
              <MultiLevelSelect
                placeholder="select a folder..."
                options={ folders }
                value={ state.folder }
                onChange={ setFolder }
                displayAccessor={ f => f.name }
                valueAccessor={ f => f.id }/>
            </div>

            <div className="col-span-6 border-t-2 border"/>

            <div className="font-bold text-right pt-1">Start Date</div>
            <div className="col-span-5">
              <input type="date"
                className={ `
                  w-full px-2 py-1 rounded
                  focus:outline-2 focus:outline focus:outline-current
                  hover:outline-2 hover:outline hover:outline-gray-300
                ` }
                value={ startDate }
                onChange={ setStartDate }/>
            </div>

            <div className="font-bold text-right pt-1">End Date</div>
            <div className="col-span-5">
              <input type="date"
                className={ `
                  w-full px-2 py-1 rounded
                  focus:outline-2 focus:outline focus:outline-current
                  hover:outline-2 hover:outline hover:outline-gray-300
                ` }
                value={ endDate }
                onChange={ setEndDate }/>
            </div>

            <div className="col-span-6 border-t-2 border"/>

            <div className="font-bold text-right pt-1">Start Time</div>
            <div className="col-span-5">
              <input type="time" step={ 1 }
                className={ `
                  w-full px-2 py-1 rounded
                  focus:outline-2 focus:outline focus:outline-current
                  hover:outline-2 hover:outline hover:outline-gray-300
                ` }
                value={ startTime }
                onChange={ setStartTime }/>
            </div>

            <div className="font-bold text-right pt-1">End Time</div>
            <div className="col-span-5">
              <input type="time" step={ 1 }
                className={ `
                  w-full px-2 py-1 rounded
                  focus:outline-2 focus:outline focus:outline-current
                  hover:outline-2 hover:outline hover:outline-gray-300
                ` }
                value={ endTime }
                onChange={ setEndTime }/>
            </div>

            <div className="col-span-6 border-t-2 border-current"/>

            <div className="col-span-6 flex justify-end">
              <button disabled={ !canSave }
                onClick={ saveRoute }
                className={ `
                  rounded py-1 w-40 text-center
                  cursor-pointer disabled:cursor-not-allowed
                  bg-white hover:bg-gray-200
                  disabled:text-gray-400 disabled:hover:bg-white
                ` }
              >
                Save
              </button>
            </div>

          </div> :
          <Result { ...result }/>
        }
      </div>
    </Modal>
  )
}

export default RouteSaveModal;

const Result = ({ msg, error }) => {
  return (
    <div className="mt-6">
      <div className="text-lg">
        { msg === "success" ?
            "Your route was successfully saved." :
            "There was an error while attempting to save your route."
        }
      </div>
      { !error ? null :
        <div className="text-red-400 whitespace-pre-wrap border-t-2 border-current">
          { error.stack }
        </div>
      }
    </div>
  )
}

const range = (x, y) => {
  const nums = [];
  for (let i = x; i < y; ++i) {
    nums.push(i);
  }
  return nums;
}

const Item = ({ children, ...props }) => {
  return (
    <div className="w-80 px-2 py-1 bg-gray-300" { ...props }>
      { children }
    </div>
  )
}

const items = range(0, 20);

const Test = ({ i = 0 }) => {
  const [show, setShow] = React.useState(false);
  return (
    <div>
      <div className="w-80 px-2 py-1 bg-white"
        onClick={ e => setShow(true) }
      >
        TEST: { i }
      </div>
      <div className={ show ? "absolute" : "hidden" }>
        { items.map(i => (
            <Item key={ i }>
              { `item-${ i }` }
            </Item>
          ))
        }
      </div>
    </div>
  )
}
const Dropdown = () => {
  return (
    <div>
    </div>
  )
}
