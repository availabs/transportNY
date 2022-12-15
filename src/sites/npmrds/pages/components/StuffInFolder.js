import React from "react"

import { range as d3range } from "d3-array"
import get from "lodash.get"

import {
  useFalcor,
  withAuth,
  Input
  // useTheme,
  // getColorRange,
  // ScalableLoading,
  // Select
} from "modules/avl-components/src"

import { FolderStuff } from "./Stuff"
import FolderModal from "./FolderModal"
import ActionBar from "./ActionBar"
import FolderIcon from "./FolderIcon"
import ConfirmModal from "./ConfirmModal"

import { FuseWrapper } from "sites/npmrds/components"

const StuffOrder = {
  folder: 0,
  report: 1,
  route: 2,
  template: 3
}

const stuffSorter = (a, b) => {
  if (a.stuff_type === b.stuff_type) {
    const aDate = new Date(a.updated_at);
    const bDate = new Date(b.updated_at);
    return bDate - aDate;
  }
  return StuffOrder[a.stuff_type] - StuffOrder[b.stuff_type];
}

const StuffInFolder = ({ openedFolders, setOpenedFolders, filter, deleteFolder }) => {
  const { falcor, falcorCache } = useFalcor();

  const [stuff, setStuff] = React.useState([]);

  const folder = openedFolders[openedFolders.length - 1];

  React.useEffect(() => {
    falcor.get(["folders2", "stuff", folder.id])
  }, [falcor, folder]);

  React.useEffect(() => {
    const stuff = get(falcorCache, ["folders2", "stuff", folder.id, "value"], []);
    const [folders, routes, reports, templates] = stuff.reduce((a, c) => {
      switch (c.stuff_type) {
        case "folder":
          a[0].push(c.stuff_id);
          break;
        case "route":
          a[1].push(c.stuff_id);
          break;
        case "report":
          a[2].push(c.stuff_id);
          break;
        case "template":
          a[3].push(c.stuff_id);
          break;
      }
      return a;
    }, [[], [], [], []]);

    const requests = [];
    if (folders.length) {
      requests.push(["folders2", "id", folders, ["name", "description", "updated_at"]])
    }
    if (routes.length && (!filter || (filter === "routes"))) {
      requests.push(["routes2", "id", routes, ["name", "description", "updated_at"]])
    }
    if (reports.length && (!filter || (filter === "reports"))) {
      requests.push(["reports2", "id", reports, ["name", "description", "updated_at"]])
    }
    if (templates.length && (!filter || (filter === "templates"))) {
      requests.push(["templates2", "id", templates, ["name", "description", "updated_at"]])
    }
    if (requests.length) {
      falcor.get(...requests);
    }
  }, [falcor, falcorCache, folder, filter]);

  React.useEffect(() => {
    const stuff = get(falcorCache, ["folders2", "stuff", folder.id, "value"], [])
      .map(s => {
        switch (s.stuff_type) {
          case "folder":
            return {
              ...s,
              ...get(falcorCache, ["folders2", "id", s.stuff_id], {})
            };
          case "route":
            return {
              ...s,
              ...get(falcorCache, ["routes2", "id", s.stuff_id], {})
            };
          case "report":
            return {
              ...s,
              ...get(falcorCache, ["reports2", "id", s.stuff_id], {})
            };
          case "template":
            return {
              ...s,
              ...get(falcorCache, ["templates2", "id", s.stuff_id], {})
            };
        }
      })
      .filter(s => !filter || filter.includes(s.stuff_type))
      .sort(stuffSorter);

    setStuff(stuff);
  }, [falcorCache, folder, filter]);

  const [selectedStuff, setSelectedStuff] = React.useState([]);
  const selectStuff = React.useCallback(stuff => {
    setSelectedStuff(prev => [...prev, stuff]);
  }, []);
  const deselectStuff = React.useCallback(stuff => {
    setSelectedStuff(prev => prev.filter(s => !((s.type === stuff.type) && (s.id === stuff.id))));
  }, []);
  const deselectAll = React.useCallback(e => {
    setSelectedStuff([]);
  }, []);

  React.useEffect(() => {
    deselectAll();
  }, [folder, deselectAll]);

  const [search, setSearch] = React.useState("");
  const clearSearch = React.useCallback(() => {
    setSearch("");
  }, []);

  const fuse = React.useMemo(() => {
    return FuseWrapper(stuff, { keys: ["name", "description"] });
  }, [stuff]);

  return (
    <div>
      <FolderPath filter={ filter }
        openedFolders={ openedFolders }
        setOpenedFolders={ setOpenedFolders }
        deleteFolder={ deleteFolder }/>

      <ActionBar parent={ folder.id }
        selectedStuff={ selectedStuff }
        deselectAll={ deselectAll }/>

      <div className="flex">
        { !stuff.length ? null :
          <Input type="text" className="w-full max-w-md px-2 py-1"
            value={ search }
            onChange={ setSearch }
            placeholder="search stuff..."/>
        }
        { !search.length ? null :
          <div onClick={ clearSearch }
            className={ `
              w-8 h-8 flex items-center justify-center
              cursor-pointer hover:bg-gray-400 rounded ml-1
              text-large hover:text-2xl
            ` }
          >
            <span className={ `
              fa fa-close
            ` }/>
          </div>
        }
      </div>
      { fuse(search).map((s, i)=> (
          <FolderStuff key={ i }
            openedFolders={ openedFolders }
            setOpenedFolders={ setOpenedFolders }
            type={ s.stuff_type }
            id={ s.stuff_id }
            selected={
              selectedStuff.reduce((a, c) => {
                return a || (c.id == s.stuff_id);
              }, false)
            }
            select={ selectStuff }
            deselect={ deselectStuff }
            parent={ folder.id }/>
        ))
      }
    </div>
  )
}
export default StuffInFolder;

const defaultFoldersByType = () => ([
  { type: "User Folders", folders: [] },
  { type: "Group Folders", folders: [] },
  { type: "Default Folders", folders: [] }
])

const FolderIconToolBase = ({ folder, deleteFolder, user }) => {

  const [show, _setShow] = React.useState(false);
  const setShow = React.useCallback(show => {
    _setShow((user.authLevel >= folder.editable) && show)
  }, [user, folder]);
  const onMouseOver = React.useCallback(e => {
    setShow(true);
  }, []);
  const onMouseLeave = React.useCallback(e => {
    setShow(false);
  }, []);

  const [open, setOpen] = React.useState(false);
  const openModal = React.useCallback(e => {
    setOpen(true);
  }, []);
  const closeModal = React.useCallback(e => {
    setOpen(false);
  }, []);

  const [confirm, setConfirm] = React.useState({});
  const clearConfirm = React.useCallback(e => {
    e.stopPropagation();
    e.preventDefault();
    setConfirm({});
  }, []);

  const confirmDelete = React.useCallback(e => {
    e.stopPropagation();
    e.preventDefault();
    setConfirm({
      action: `delete this folder`,
      onConfirm: () => { deleteFolder(folder.id); setConfirm({}); }
    });
  }, [deleteFolder, folder]);

  return (
    <>
      <div className="text-base font-normal">
        <FolderModal isOpen={ open }
          close={ closeModal }
          folder={ folder }/>
        <ConfirmModal
          isOpen={ Boolean(confirm.action) }
          close={ clearConfirm }
          stuff={ [{ type: "folder", id: folder.id }] }
          { ...confirm }/>
      </div>

      <div className="relative">
        <div onMouseOver={ onMouseOver }
          onMouseLeave={ onMouseLeave }
        >
          <FolderIcon { ...folder } size={ 3 }/>
          <div style={ { right: "100%" } }
            className={ `
              absolute top-0 text-base bg-gray-200 font-normal
              ${ show ? "block" : "hidden" }
              shadow-lg text-right
            ` }
          >
            <div onClick={ openModal }
              className="px-2 hover:bg-gray-300 cursor-pointer whitespace-nowrap"
            >
              Edit Folder <span className="fa fa-edit"/>
            </div>
            <div onClick={ confirmDelete }
              className="px-2 hover:bg-gray-300 cursor-pointer whitespace-nowrap"
            >
              Delete Folder <span className="fa fa-trash text-red-400"/>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
const FolderIconTool = withAuth(FolderIconToolBase)

const FolderSelector = ({ folder, setOpenedFolders, deleteFolder }) => {

  const { falcor, falcorCache } = useFalcor();

  const [folders, setFolders] = React.useState([]);
  const [foldersByType, setFoldersByType] = React.useState(defaultFoldersByType());

  React.useEffect(() => {
    falcor.get(["folders2", "user", "length"])
      .then(res => {
        const length = get(res, ["json", "folders2", "user", "length"], 0)
        if (length) {
          return falcor.get([
            "folders2", "user", "index", d3range(length),
            ["name", "icon", "color", "id",
              "updated_at", "created_at",
              "type", "owner", "editable"
            ]
          ])
        }
      })
  }, [falcor]);

  React.useEffect(() => {
    const length = get(falcorCache, ["folders2", "user", "length"], 0);
    const refs = d3range(length).map(i => get(falcorCache, ["folders2", "user", "index", i, "value"]));
    const folders = refs.map(ref => get(falcorCache, ref, null)).filter(Boolean);

    folders.sort((a, b) => {
      const aDate = new Date(a.updated_at);
      const bDate = new Date(b.updated_at);
      return bDate.getTime() - aDate.getTime();
    });
    setFolders(folders);

    const foldersByType = folders.reduce((a, c) => {
      if (c.type === "user") {
        a[0].folders.push(c);
      }
      else if (c.type === "group") {
        a[1].folders.push(c);
      }
      else if (c.type === "default") {
        a[2].folders.push(c);
      }
      return a;
    }, defaultFoldersByType());
    setFoldersByType(foldersByType);
  }, [falcorCache]);

  const [show, setShow] = React.useState(false);
  const showSelector = React.useCallback(e => {
    setShow(true);
  }, []);
  const hideSelector = React.useCallback(e => {
    setShow(false);
  }, []);

  const openFolder = React.useCallback((e, fid) => {
    e.stopPropagation();
    if (fid !== folder.id) {
      setOpenedFolders([fid]);
      setShow(false);
    }
  }, [setOpenedFolders, folder]);

  const [open, setOpen] = React.useState(false);
  const openModal = React.useCallback(e => {
    setOpen(true);
  }, []);
  const closeModal = React.useCallback(e => {
    setOpen(false);
  }, []);

  return (
    <div className="relative w-fit"
      onMouseLeave={ hideSelector }
    >

      <div className="inline-block mr-1 cursor-pointer"
        onMouseOver={ hideSelector }
      >
        <FolderIconTool folder={ folder }
          deleteFolder={ deleteFolder }/>
      </div>

      <div className="cursor-pointer inline-block"
        onMouseOver={ showSelector }
        onClick={ e => setOpenedFolders([folder.id]) }
      >
        { folder.name }
        <span>&nbsp;/&nbsp;</span>
      </div>

{ /* FOLDER SELECTOR */ }
      <div style={ { top: "100%" } }
        className={ `
          absolute left-0 text-base bg-gray-200 font-normal
          ${ show ? "block" : "hidden" }
          grid grid-cols-2 gap-1 shadow-lg w-screen max-w-4xl z-50
        ` }
      >

        <div>
          { foldersByType.slice(0, 2).map(({ type, folders }) => (
              <div key={ type }>
                <div className="font-bold border-b-2 border-current px-2 mt-1">
                  { type }
                </div>
                { folders.map(f => (
                    <div key={ f.id }
                      onClick={ e => openFolder(e, f.id) }
                      className={ `
                        whitespace-nowrap px-2 hover:bg-gray-300 flex
                        ${ f.id === folder.id ?
                          "bg-gray-300 cursor-not-allowed" : "cursor-pointer"
                        }
                      ` }
                    >
                      <div className="mr-1">
                        <FolderIcon { ...f } size={ 1.125 }/>
                      </div>
                      { f.name }
                    </div>
                  ))
                }
              </div>
            ))
          }
        </div>

        <div>
          { foldersByType.slice(2).map(({ type, folders }) => (
              <div key={ type }>
                <div className="font-bold border-b-2 border-current px-2 mt-1">
                  { type }
                </div>
                { folders.map(f => (
                    <div key={ f.id }
                      onClick={ e => openFolder(e, f.id) }
                      className={ `
                        whitespace-nowrap px-2 hover:bg-gray-300 flex
                        ${ f.id === folder.id ?
                          "bg-gray-300 cursor-not-allowed" : "cursor-pointer"
                        }
                      ` }
                    >
                      <div className="mr-1">
                        <FolderIcon { ...f } size={ 1.125 }/>
                      </div>
                      { f.name }
                    </div>
                  ))
                }
              </div>
            ))
          }
        </div>

        <div className="col-span-2 p-1 border-t-2 border-current">
          <button onClick={ openModal }
            className={ `
              w-full flex justify-center items-center
              h-12 border border-gray-300 rounded hover:bg-gray-300
            ` }
          >
            <span className="fa fa-plus mr-2 text-lg font-bold"/>
            <span className="pt-1">Add New Folder</span>
          </button>
          <div className="text-base font-normal">
            <FolderModal isOpen={ open }
              close={ closeModal }/>
          </div>
        </div>

      </div>
{ /* FOLDER SELECTOR */ }

    </div>
  )
}

const PathItem = ({ openPath, setOpenedFolders, name }) => {
  const open = React.useCallback(e => {
    e.stopPropagation();
    setOpenedFolders(openPath.map(f => f.id));
  }, [openPath, setOpenedFolders]);
  return (
    <div onClick={ open } className="cursor-pointer">
      { name }<span>&nbsp;/</span>
    </div>
  )
}

const FolderPath = ({ openedFolders, setOpenedFolders, filter, deleteFolder }) => {

  const [show, setShow] = React.useState(false);
  const onMouseOver = React.useCallback(e => {
    setShow(true);
  }, []);
  const onMouseLeave = React.useCallback(e => {
    setShow(false);
  }, []);

  const [open, setOpen] = React.useState(false);
  const openModal = React.useCallback(e => {
    setOpen(true);
  }, []);
  const closeModal = React.useCallback(e => {
    setOpen(false);
  }, []);

  return (
    <>
      <div className="text-4xl font-bold flex relative">
        <div className="flex-1 flex items-end">
          <FolderSelector folder={ openedFolders[0] }
            setOpenedFolders={ setOpenedFolders }
            deleteFolder={ deleteFolder }/>
          { openedFolders.slice(1).map((f, i) => (
              <div key={ f.id }>
                <PathItem name={ f.name }
                  openPath={ openedFolders.slice(0, i + 2) }
                  setOpenedFolders={ setOpenedFolders }
                />
              </div>
            ))
          }
        </div>
        { filter }
        <div className="flex items-center justify-center relative"
          onMouseOver={ onMouseOver }
          onMouseLeave={ onMouseLeave }
        >
          <div className={ `
              h-10 w-10 rounded hover:bg-gray-400
              flex items-center justify-center
              text-xl hover:text-3xl cursor-pointer
            ` }
          >
            <span className="fa fa-plus"/>
          </div>
          <div className={ `
              top-0 right-0 absolute bg-gray-200 z-50
              text-base font-normal whitespace-nowrap
              ${ show ? "block" : "hidden" } cursor-pointer
            ` }
          >
            <div className="px-2 hover:bg-gray-300"
              onClick={ openModal }
            >
              <span className="fa fa-folder mr-1"/>Add New Sub Folder
            </div>
            <div className="px-2 hover:bg-gray-300">
              <span className="fa fa-road mr-1"/>Add New Route
            </div>
            <div className="px-2 hover:bg-gray-300">
              <span className="fa fa-chart-column mr-1"/>Add New Report
            </div>
          </div>
        </div>
      </div>

      <FolderModal isOpen={ open }
        close={ closeModal }
        openedFolders={ openedFolders }/>

    </>
  )
}
