import React from "react"

import get from "lodash.get"
import { range as d3range } from "d3-array"

import {
  useFalcor,
  // Input
  // useTheme,
  // getColorRange,
  // ScalableLoading,
  // Select
} from "modules/avl-components/src"

import ConfirmModal from "./ConfirmModal"
import FolderIcon from "./FolderIcon"

const stuffIdsByType = stuff => {
  return stuff.reduce((a, c) => {
    if (c.type === "route") {
      a[0].push(c.id);
    }
    else if (c.type === "report") {
      a[1].push(c.id);
    }
    else if (c.type === "template") {
      a[2].push(c.id);
    }
    else if (c.type === "folder") {
      a[3].push(c.id);
    }
    return a;
  }, [[], [], [], []]);
}

const useStuffActions = (selectedStuff, parent) => {

  const { falcor, falcorCache } = useFalcor();

  const deleteSelected = React.useCallback(() => {
    const [routes, reports, templates, folders] = stuffIdsByType(selectedStuff);
    if (routes.length) {
      falcor.call(["routes2", "delete"], routes);
    }
    if (reports.length) {
      falcor.call(["reports2", "delete"], reports);
    }
    if (templates.length) {
      falcor.call(["templates2", "delete"], templates);
    }
    if (folders.length) {
      falcor.call(["folders2", "delete"], folders);
    }
  }, [falcor, selectedStuff]);

  const moveTo = React.useCallback((e, dst) => {
    e.stopPropagation();
    falcor.call(["folders2", "move"], [selectedStuff, parent, dst]);
  }, [falcor, selectedStuff, parent]);

  const copyTo = React.useCallback((e, dst) => {
    e.stopPropagation();
    falcor.call(["folders2", "copy"], [selectedStuff, dst]);
  }, [falcor, selectedStuff])

  const [confirm, setConfirm] = React.useState({});
  const clearConfirm = React.useCallback(() => {
    setConfirm({});
  }, []);

  const confirmDelete = React.useCallback(() => {
    setConfirm({
      action: "Delete",
      onConfirm: () => { deleteSelected(); setConfirm({}); }
    });
  }, [deleteSelected])

  const StuffActions = [
   
    { key: "move-to",
      label: "Move to folder",
      icon: 'fad fa-folder-open text-sm pr-1 text-gray-500 group-hover:text-blue-300',
      sourceAuth: true,
      targetAuth: true,
      multiple: true,
      types: new Set(["route", "report", "template", "folder"]),
      action: moveTo,
      Comp: FoldersDropdown
    },
    { key: "copy-to",
      label: "Copy to folder",
      icon: 'fad fa-folder-open text-sm pr-1 text-gray-500 group-hover:text-blue-300',
      targetAuth: true,
      multiple: true,
      types: new Set(["route", "report", "template", "folder"]),
      action: copyTo,
      Comp: FoldersDropdown
    },
    // { key: "route-edit",
    //   sourceAuth: true,
    //   types: new Set(["route"]),
    //   Comp: ActionButton
    // },
    // { key: "route-view",
    //   types: new Set(["route"]),
    //   Comp: ActionButton
    // },
    { key: "open-in-template",
      label: "Open in Template",
      icon: 'fa fa-file-chart-line pr-1 text-gray-500 group-hover:text-blue-300',
      sourceAuth: true,
      multiple: true,
      types: new Set(["route"]),
      Comp: ActionButton
    },
     { key: "delete-selected",
      label: "Delete",
      icon: 'fad fa-trash text-sm pr-1 text-red-400 group-hover:text-blue-300',
      sourceAuth: true,
      multiple: true,
      types: new Set(["route", "report", "template", "folder"]),
      color: "red-400",
      action: confirmDelete,
      Comp: ActionButton
    },
    // { key: "open-in-report",
    //   sourceAuth: true,
    //   types: new Set(["route"]),
    //   Comp: ActionButton
    // },
    // { key: "report-edit",
    //   sourceAuth: true,
    //   types: new Set(["report"]),
    //   Comp: ActionButton
    // },
    // { key: "report-view",
    //   types: new Set(["report"]),
    //   Comp: ActionButton
    // },
    // { key: "template-edit",
    //   sourceAuth: true,
    //   types: new Set(["template"]),
    //   Comp: ActionButton
    // },
    // { key: "template-view",
    //   types: new Set(["template"]),
    //   Comp: ActionButton
    // }
  ]

  const stuffActions = React.useMemo(() => {
    const types = selectedStuff.reduce((a, c) => {
      if (!a.includes(c.type)) {
        a.push(c.type);
      }
      return a;
    }, []);
    return StuffActions
      .filter(action => {
        return types.reduce((a, c) => {
          return a && action.types.has(c);
        }, Boolean(types.length))
      })
      .filter(action => {
        return selectedStuff.length > 1 ? action.multiple : true
      })
  }, [selectedStuff]);

  const Confirm = React.useMemo(() => {
    return {
      isOpen: Boolean(confirm.action),
      close: clearConfirm,
      stuff: selectedStuff,
      ...confirm
    }
  }, [selectedStuff, confirm, clearConfirm]);

  return [stuffActions, Confirm];
}

const ActionBar = ({ selectedStuff, deselectAll, parent }) => {

  const { falcor, falcorCache } = useFalcor();

  const [folders, setFolders] = React.useState([]);

  React.useEffect(() => {
    falcor.get(
        ["folders2", "user", "length"],
        ["folders2", "stuff", parent]
      )
      .then(res => {
        const requests = [];

        const length = get(res, ["json", "folders2", "user", "length"], 0);
        if (length) {
          requests.push([
            "folders2", "user", "index", d3range(length),
            ["name", "icon", "color", "id", "updated_at", "created_at", "type", "owner", "editable"]
          ])
        }
        const folders = get(res, ["json", "folders2", "stuff", parent], [])
          .filter(s => s.stuff_type === "folder")
          .map(s => s.stuff_id);
        if (folders.length) {
          requests.push([
            "folders2", "id", folders,
            ["name", "icon", "color", "id", "updated_at", "created_at", "type", "owner", "editable"]
          ])
        }
        if (requests.length) {
          return falcor.get(...requests);
        }
      })
  }, [falcor, parent]);

  React.useEffect(() => {
    const length = get(falcorCache, ["folders2", "user", "length"], 0);
    const refs = d3range(length).map(i => get(falcorCache, ["folders2", "user", "index", i, "value"]));
    const folders = refs.map(ref => get(falcorCache, ref, null))
      .filter(Boolean)
      .filter(f => f.id != parent)
      .filter(f => f.type !== "default");

    folders.sort((a, b) => {
      if (a.type === b.type) {
        const aDate = new Date(a.updated_at);
        const bDate = new Date(b.updated_at);
        return bDate.getTime() - aDate.getTime();
      }
      return (a.type === "user") ? -1 : 1;
    });

    const selectedFolders = selectedStuff
      .filter(({ type }) => type === "folder")
      .reduce((a, c) => {
        a.add(c.id);
        return a;
      }, new Set());

    const subFolders = get(falcorCache, ["folders2", "stuff", parent, "value"], [])
      .filter(s => s.stuff_type === "folder")
      .map(f => {
        return get(falcorCache, ["folders2", "id", f.stuff_id], null)
      }).filter(Boolean)
      .filter(f => !selectedFolders.has(f.id));

    setFolders([...folders, ...subFolders]);
  }, [falcorCache, parent, selectedStuff]);

  const [stuffActions, confirm] = useStuffActions(selectedStuff, parent)

  return (
    <div className={ `
        py-1 bg-white shadow rounded-sm border border-gray-100 mb-2
        
      ` }
    >
      <div className="px-1 flex">
        <div className="flex-1 flex">
          { !stuffActions.length ?
            <div className="pl-2 py-2 text-gray-400 border border-transparent">
              &nbsp;
            </div> :
            stuffActions.map(({ action, key, Comp, label, ...rest }) => (
              <Comp key={ key }
                folders={ folders }
                action={ action }
                { ...rest }
              >
                { label || key }
              </Comp>
            ))
          }
        </div>
        <div className="flex items-center px-1">
          <input type="checkbox"
            className="cursor-pointer disabled:cursor-not-allowed mr-10"
            checked={ Boolean(selectedStuff.length) }
            onChange={ deselectAll }
            disabled={ !selectedStuff.length }/>
        </div>
      </div>
      <ConfirmModal { ...confirm }/>
    </div>
  )
}
export default ActionBar;

const ActionButton = ({ action, children, icon, color = "gray-300" }) => {
  return (
    <button onClick={ action }
      className={ `
        px-4 py-2 mr-1 rounded cursor-pointer group
        hover:text-blue-300
      ` }
    >
     {icon ? <i className={`${icon}`}/> : ''} { children }
    </button>
  )
}
const ActionDropdown = ({ children, icon, items }) => {
  const [show, setShow] = React.useState(false);
  const onMouseOver = React.useCallback(e => {
    setShow(true);
  }, []);
  const onMouseLeave = React.useCallback(e => {
    setShow(false);
  }, []);
  return (
    <div className="relative"
      onMouseOver={ onMouseOver }
      onMouseLeave={ onMouseLeave }
    >
      <ActionButton>
       {icon ? <i className={`${icon}`}/> : ''} { children }
      </ActionButton>
      { !show ? null :
        <div className="absolute bg-white shadow-lg"
          style={ {
            top: "100%",
            left: "0%"
          } }
        >
          { items }
        </div>
      }
    </div>
  )
}
const FoldersDropdown = ({ action, folders, icon, children }) => {
  return (
    <ActionDropdown
      icon={icon}
      items={
        folders.map(f => (
          <div key={ f.id } className="px-2 flex items-center hover:bg-gray-300 w-52"
            onClick={ e => action(e, f.id) }
          >
            <div className="mr-1">
              <FolderIcon size={ 1.25 }
                icon={ get(f, "icon", "") }
                color={ get(f, "color", "#000") }/>
            </div>
            <span className="pt-1">
              { get(f, "name", "loading...") }
            </span>
          </div>
        ))
      }
    >
      { children }
    </ActionDropdown>
  )
}
