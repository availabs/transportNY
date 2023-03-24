import React from "react"

import get from "lodash.get"

import { useFalcor } from "modules/avl-components/src"

import { Modal, MultiLevelSelect } from "sites/npmrds/components"

const Reducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "update-state":
      return {
        ...state,
        ...payload
      }
    default:
      return state;
  }
}
const InitReducer = props => ({
  name: "",
  description: "",
  conflation_version: "0_4_2",
  folder: null,
  routeId: null
})

const RouteSaveModal = ({ isOpen, close, ...props }) => {

  const [state, dispatch] = React.useReducer(Reducer, props, InitReducer);

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

  const { falcor, falcorCache } = useFalcor();

  const [folders, setFolders] = React.useState([]);

  React.useEffect(() => {
    falcor.get(["folders2", "for", "user"]);
  }, [falcor]);

  React.useEffect(() => {
    const folders = get(falcorCache, ["folders2", "for", "user", "value"], []);
    setFolders(folders);
  }, [falcorCache]);

  const saveRoute = React.useCallback(e => {
    const data = {
      ...state,
      points: props.points,
      tmc_array: props.tmc_array,
      conflation_array: props.conflation_array
    }
    falcor.call(["routes2", "save"], [data])
      .then(res => console.log("SAVE RES:", res));
  }, [falcor, state, props.points, props.tmc_array, props.conflation_array]);

  return (
    <Modal isOpen={ isOpen } close={ close }>
      <div className="w-screen max-w-3xl">
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

          <div className="col-span-6 border-t-2 border-current"/>

          <div className="col-span-6 flex justify-end">
            <button disabled={ !state.name || !state.folder }
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

        </div>
      </div>
    </Modal>
  )
}

export default RouteSaveModal;

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
