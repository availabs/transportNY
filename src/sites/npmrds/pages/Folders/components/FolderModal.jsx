import React from "react"

import get from "lodash/get"

import {
  useFalcor,
  withAuth,
  Input,
  Select,
  ColorInput,
  Button,
  Modal
} from "~/modules/avl-components/src"

import FolderIcon from "./FolderIcon"

const Types = ["user", "group"]

const Icons = [
  "fa fa-road",
  "fa fa-gear",
  "fa fa-chart-column",
  "fa fa-map",
  "fa fa-eye",
  "fa fa-circle-info",
  "fa fa-file",
  "fa fa-tachometer",
  "fa fa-car"
]

const Init = ({ folder, user, parent }) => {
  return {
    name: get(folder, "name", ""),
    type: get(parent, "type", get(folder, "type", "user")),
    owner: get(parent, "owner", get(folder, "owner", user.id)),
    icon: get(folder, "icon", Icons[0]),
    color: get(folder, "color", "#000000")
  }
}
const Reducer = (state, action) => {
  const { actionType, ...payload } = action;
  switch (actionType) {
    case "update":
      return {
        ...state,
        ...payload
      }
    case "reset":
      return payload.state;
    default:
      return state;
  }
}

const NameRegex = /\w+/
const ColorRegex = /[#][0-9a-fA-F]{6}/
const checkCanCreate = state => {
  const { name, type, owner, icon, color } = state;
  return NameRegex.test(name) &&
    Types.includes(type) &&
    Boolean(owner) &&
    Icons.includes(icon) &&
    ColorRegex.test(color);
}
const checkCanEdit = (folder, state) => {
  return folder && checkCanCreate(state) &&
    !((folder.name === state.name) &&
      (folder.type === state.type) &&
      (folder.owner === state.owner) &&
      (folder.icon === state.icon) &&
      (folder.color === state.color)
    )
}

const FolderModal = ({ openedFolders = [], isOpen = false, close, folder, user }) => {

  const stopPropagation = React.useCallback(e => {
    e.stopPropagation();
  }, []);

  const parent = React.useMemo(() => {
    return get(openedFolders, [openedFolders.length - 1], {})
  }, [openedFolders]);

  const [state, dispatch] = React.useReducer(Reducer, { folder, user, parent }, Init);
  const update = React.useCallback((key, value) => {
    dispatch({
      actionType: "update",
      [key]: value
    });
  }, []);
  const updateType = React.useCallback(type => {
    dispatch({
      actionType: "update",
      type,
      owner: type === "user" ? user.id : get(user, ["groups", 0], null)
    })
  }, [user]);

  const prev = React.useRef(isOpen);

  React.useEffect(() => {
    if (isOpen && (isOpen !== prev.current)) {
      dispatch({
        actionType: "reset",
        state: Init({ folder, user, parent })
      })
    }
    prev.current = isOpen;
  }, [folder, user, parent, isOpen])

  const canCreate = checkCanCreate(state);
  const canEdit = checkCanEdit(folder, state);

  const { falcor } = useFalcor();
  const createFolder = React.useCallback(e => {
    falcor.call(["folders2", "create"], [{ ...state, parent: parent.id }])
      // .then(res => console.log("RES:", res))
      .then(() => close(e));
  }, [falcor, state, close, parent]);
  const editFolder = React.useCallback(e => {
    falcor.call(["folders2", "edit"], [state, folder.id])
      .then(() => {
        close(e);
      });
  }, [falcor, state, close, folder]);

  return (
    <Modal open={ isOpen }>
      <div className="bg-gray-100 overflow-auto h-fit"
        onClick={ stopPropagation }
      >
        <div onClick={ close }
          className={ `
            absolute top-1 right-1 h-6 w-6
            rounded hover:bg-gray-400
            flex items-center justify-center
            cursor-pointer
          ` }
        >
          <span className="fa fa-close"/>
        </div>

        <div className="px-4 py-4">
          <div className="grid grid-cols-1 gap-1">
            <InputWrapper label="Name">
              <Input type="text"
                value={ state.name }
                onChange={ v => update("name", v) }/>
            </InputWrapper>
            <InputWrapper label="Type">
              <Select options={ Types }
                value={ state.type }
                onChange={ updateType }
                disabled={ Boolean(parent.id) }/>
            </InputWrapper>
            <InputWrapper label="Owner">
              { state.type === "user" ?
                <Input type="text" value="self" disabled/> :
                <Select options={ user.groups }
                  value={ state.owner }
                  onChange={ v => update("owner", v) }
                  disabled={ Boolean(parent.id) }/>
              }
            </InputWrapper>
            <InputWrapper label="Color">
              <ColorInput value={ state.color } small
                onChange={ v => update("color", v) }
                showInputs={ false }/>
            </InputWrapper>
            <InputWrapper label="Icon">
              <IconSelector value={ state.icon }
                onChange={ v => update("icon", v) }
                color={ state.color }/>
            </InputWrapper>
            { folder ?
              <Button disabled={ !canEdit }
                onClick={ editFolder }>
                Edit
              </Button> :
              <Button disabled={ !canCreate }
                onClick={ createFolder }>
                Create
              </Button>
            }
          </div>
        </div>
      </div>
    </Modal>
  )
}
export default withAuth(FolderModal);

const InputWrapper = ({ label, children }) => {
  return (
    <div className="flex items-center">
      <div className="mr-2 font-bold w-20">
        { label }
      </div>
      <div className="flex-1">
        { children }
      </div>
    </div>
  )
}

const IconSelector = ({ value, onChange, color }) => {
  return (
    <div className="grid grid-cols-4 gap-1">
      { Icons.map(icon => (
          <div key={ icon }
            onClick={ e => onChange(icon) }
            className={ `
              border-2 rounded flex justify-center
              ${ value === icon ? "border-current" : "border-transparent" }
              hover:border-current
            ` }
          >
            <FolderIcon size={ 5 }
              icon={ icon }
              color={ color }/>
          </div>
        ))
      }
    </div>
  )
}
