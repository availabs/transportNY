import React from "react"

import get from "lodash.get"
import { range as d3range } from "d3-array"

import {
  useFalcor,
  Input,
  ScalableLoading
} from "modules/avl-components/src"

import ConfirmModal from "./ConfirmModal"
import Dropdown from "./MultiLevelDropdown"
import FolderIcon from "./FolderIcon"

const Folder = ({ id, openedFolders, setOpenedFolders, forFolder, ...props }) => {
  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    falcor.get([
      "folders2", "id", id,
      ["name", "icon", "color", "id",
        "updated_at", "created_at",
        "type", "owner", "editable"
      ]
    ])
  }, [falcor, id]);

  const [folder, setFolder] = React.useState({});
  React.useEffect(() => {
    setFolder(get(falcorCache, ["folders2", "id", id], {}));
  }, [falcorCache, id]);

  const openFolder = React.useCallback(e => {
    e.stopPropagation();
    setOpenedFolders([...openedFolders.map(f => f.id), folder.id]);
  }, [openedFolders, setOpenedFolders, folder]);

  const edit = React.useCallback(() => {

  }, []);

  // const folderItems = React.useMemo(() => {
  //   return [
  //     { item: }
  //   ]
  // }, [])

  const Container = forFolder ? FolderStuffContainer : StuffContainer;

  return (
    <div onClick={ openFolder }>
      <Container { ...props } { ...folder } id={ id } type="folder"
        edit={ edit }
      >
        <div className="mr-1">
          <FolderIcon size={ 1.25 }
            icon={ get(folder, "icon", "") }
            color={ get(folder, "color", "#000") }/>
        </div>
        <span className="pt-1">
          { get(folder, "name", "loading...") }
        </span>
      </Container>
    </div>
  )
}
const Route = ({ id, forFolder, ...props }) => {
  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    falcor.get(["routes2", "id", id, ["name", "description", "updated_at"]]);
  }, [falcor, id]);

  const [route, setRoute] = React.useState({});
  React.useEffect(() => {
    setRoute(get(falcorCache, ["routes2", "id", id], {}));
  }, [falcorCache, id]);

  const edit = React.useCallback(() => {

  }, []);
  const view = React.useCallback(() => {

  }, []);

  const RouteItems = React.useMemo(() => {
    return [
      { item: (
          <ListItem>
            <span className="fa fa-eye mr-1"/>View in Report
          </ListItem>
        )
      },
      { item: (
          <ListItem>
            <span className="fa fa-pen-to-square mr-1"/>Edit
          </ListItem>
        )
      }
    ]
  }, []);

  const Container = forFolder ? FolderStuffContainer : StuffContainer;

  return (
    <Container { ...props } { ...route } id={ id } type="route"
      items={ RouteItems }
    >
      <span className="fa fa-road mr-1"/>
      <span className="pt-1">
        { get(route, "name", "loading...") }
      </span>
    </Container>
  )
}
const Report = ({ id, forFolder, ...props }) => {
  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    falcor.get(["reports2", "id", id, ["name", "description", "updated_at"]]);
  }, [falcor, id]);

  const [report, setReport] = React.useState({});
  React.useEffect(() => {
    setReport(get(falcorCache, ["reports2", "id", id], {}));
  }, [falcorCache, id]);

  const edit = React.useCallback(() => {

  }, []);
  const view = React.useCallback(() => {

  }, []);

  const ReportItems = React.useMemo(() => {
    return [
      { item: (
          <ListItem>
            <span className="fa fa-eye mr-1"/>View
          </ListItem>
        )
      },
      { item: (
          <ListItem>
            <span className="fa fa-pen-to-square mr-1"/>Edit
          </ListItem>
        )
      }
    ]
  }, []);

  const Container = forFolder ? FolderStuffContainer : StuffContainer;

  return (
    <Container { ...props } { ...report } id={ id } type="report"
      items={ ReportItems }
    >
      <span className="fa fa-chart-column mr-1"/>
      <span className="pt-1">
        { get(report, "name", "loading...") }
      </span>
    </Container>
  )
}
const Template = ({ id, forFolder, ...props }) => {
  const { falcor, falcorCache } = useFalcor();

  React.useEffect(() => {
    falcor.get(["templates2", "id", id, ["name", "description", "updated_at"]]);
  }, [falcor, id]);

  const [template, setTemplate] = React.useState({});
  React.useEffect(() => {
    setTemplate(get(falcorCache, ["templates2", "id", id], {}));
  }, [falcorCache, id]);

  const edit = React.useCallback(() => {

  }, []);
  const view = React.useCallback(() => {

  }, []);

  const TemplateItems = React.useMemo(() => {
    return [
      { item: (
          <ListItem>
            <span className="fa fa-eye mr-1"/>View
          </ListItem>
        )
      },
      { item: (
          <ListItem>
            <span className="fa fa-pen-to-square mr-1"/>Edit
          </ListItem>
        )
      }
    ]
  }, []);

  const Container = forFolder ? FolderStuffContainer : StuffContainer;

  return (
    <Container { ...props } { ...template } id={ id } type="template"
      items={ TemplateItems }
    >
      <span className="fa fa-gear mr-1"/>
      <span className="pt-1">
        { get(template, "name", "loading...") }
      </span>
    </Container>
  )
}

const Stuff = ({ type, ...props }) => {
  return (
    type === "folder" ? <Folder { ...props }/> :
    type === "route" ? <Route { ...props }/> :
    type === "report" ? <Report { ...props }/> :
    type === "template" ? <Template { ...props }/> : null
  )
}

const FolderStuff = ({ type, ...props }) => {
  return (
    type === "folder" ? <Folder { ...props } forFolder={ true }/> :
    type === "route" ? <Route { ...props } forFolder={ true }/> :
    type === "report" ? <Report { ...props } forFolder={ true }/> :
    type === "template" ? <Template { ...props } forFolder={ true }/> : null
  )
}
export { Stuff, FolderStuff }

const StuffContainer = ({ description, updated_at, children }) => {

  return (
    <div className="flex items-center border-b px-1">
      <div className="flex-1">
        <div className="flex items-center font-bold">
          { children }
        </div>
        <div className="text-sm">
          { new Date(updated_at).toLocaleString() }
        </div>
        <div className="text-sm italic">
          { description }
        </div>
      </div>
    </div>
  )
}

const FolderStuffContainer = props => {
  const {
    description,
    parent,
    updated_at,
    id,
    type,
    name,
    selected,
    select,
    deselect,
    items = [],
    children
  } = props;

  const onChecked = React.useCallback(e => {
    e.stopPropagation();
    const checked = e.target.checked;
    if (checked) {
      select({ type, id });
    }
    else {
      deselect({ type, id });
    }
  }, [id, type, select, deselect]);

  const stopPropagation = React.useCallback(e => {
    e.stopPropagation();
  }, []);

  const [confirm, setConfirm] = React.useState({});
  const clearConfirm = React.useCallback(e => {
    e.stopPropagation();
    e.preventDefault();
    setConfirm({});
  }, []);

  const { falcor, falcorCache } = useFalcor();

  const [folders, setFolders] = React.useState([]);

  React.useEffect(() => {
    falcor.get(["folders2", "user", "length"])
      .then(res => {
        const length = get(res, ["json", "folders2", "user", "length"], 0)
        if (length) {
          return falcor.get([
            "folders2", "user", "index", d3range(length),
            ["name", "icon", "color", "id", "updated_at", "created_at", "type", "owner", "editable"]
          ])
        }
      })
  }, [falcor]);

  React.useEffect(() => {
    const length = get(falcorCache, ["folders2", "user", "length"], 0);
    const refs = d3range(length).map(i => get(falcorCache, ["folders2", "user", "index", i, "value"]));
    const folders = refs.map(ref => get(falcorCache, ref, null)).filter(Boolean);

    folders.sort((a, b) => {
      if (a.type === b.type) {
        const aDate = new Date(a.updated_at);
        const bDate = new Date(b.updated_at);
        return bDate.getTime() - aDate.getTime();
      }
      return (a.type === "user") ? -1 : 1;
    });

    setFolders(folders.filter(f => f.id != parent));
  }, [falcorCache, parent]);

  const deleteStuff = React.useCallback(() => {
    switch (type) {
      case "folder":
        falcor.call(["folders2", "delete"], [id])
        break;
      case "route":
        falcor.call(["routes2", "delete"], [id])
        break;
      case "report":
        falcor.call(["reports2", "delete"], [id])
        break;
      case "template":
        falcor.call(["templates2", "delete"], [id])
        break;
    }
  }, [falcor, type, id]);

  const confirmDelete = React.useCallback(e => {
    e.stopPropagation();
    e.preventDefault();
    setConfirm({
      action: `delete this ${ type }`,
      onConfirm: () => { deleteStuff(); setConfirm({}); }
    });
  }, [deleteStuff, type]);

  const [loading, setLoading] = React.useState(false);

  const copyToFolder = React.useCallback((e, dst) => {
    setLoading(true);
    e.stopPropagation();
    falcor.call(["folders2", "copy"], [[{ id, type }], dst])
      .then(() => setLoading(false));
  }, [falcor, id, type]);

  const moveToFolder = React.useCallback((e, dst) => {
    e.stopPropagation();
    falcor.call(["folders2", "move"], [[{ id, type }], parent, dst]);
  }, [falcor, id, type]);

  const StuffItems = React.useMemo(() => {
    return [
      ...items,
      { item: (
          <ListItem>
            <span className="fa fa-copy mr-1"/>Copy to folder
          </ListItem>
        ),
        children: (
          folders.map(f => ({
            item: (
              <div key={ f.id } className="px-2 flex items-center hover:bg-gray-300 w-52"
                onClick={ e => copyToFolder(e, f.id) }
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
            )
          }))
        )
      },
      { item: (
          <ListItem>
            <span className="fa fa-arrow-up-from-bracket mr-1"/>Move to folder
          </ListItem>
        ),
        children: (
          folders.map(f => ({
            item: (
              <ListItem key={ f.id }>
                <div className="flex items-center"
                  onClick={ e => moveToFolder(e, f.id) }>
                  <div className="mr-1">
                    <FolderIcon size={ 1.25 }
                      icon={ get(f, "icon", "") }
                      color={ get(f, "color", "#000") }/>
                  </div>
                  <span className="pt-1">
                    { get(f, "name", "loading...") }
                  </span>
                </div>
              </ListItem>
            )
          }))
        )
      },
      { item: (
          <ListItem>
            <div onClick={ confirmDelete }>
              <span className="fa fa-trash text-red-400 mr-1"/>Delete { type }
            </div>
          </ListItem>
        )
      },
    ]
  }, [confirmDelete, moveToFolder, copyToFolder, type, folders]);

  return (
    <div className="flex items-center border-b px-1 hover:bg-gray-200">
      <div className="flex-1">
        <div className="flex items-center font-bold">
          { children }
        </div>
        <div className="text-sm">
          { new Date(updated_at).toLocaleString() }
        </div>
        <div className="text-sm italic">
          { description }
        </div>
      </div>
      <div className="flex-0 flex items-center px-1">
        <input type="checkbox"
          className="cursor-pointer"
          onChange={ onChecked }
          checked={ selected }
          onClick={ stopPropagation }/>
        <div className="w-10 flex justify-end"
          onClick={ stopPropagation }>
          <div className="flex-0"
            onClick={ stopPropagation }>
            <Dropdown items={ StuffItems }>
              <span className="fa text-lg fa-list mr-1"/>
            </Dropdown>
          </div>
        </div>
      </div>
      <div className="pointer-events-none">
        <ConfirmModal
          isOpen={ Boolean(confirm.action) }
          close={ clearConfirm }
          stuff={ [{ type, id }] }
          { ...confirm }/>
      </div>
      <div className={ `
          fixed inset-0 items-center justify-center
          bg-black bg-opacity-50
          ${ loading ? "flex" : "hidden" }
        ` }
      >
        <ScalableLoading loading={ loading }/>
      </div>
    </div>
  )
}

const ListItem = ({ children }) => {
  return (
    <div className="w-52 px-2 hover:bg-gray-300">
      { children }
    </div>
  )
}
