import React from "react"

import { range as d3range } from "d3-array"
import get from "lodash/get"
import moment from "moment"

import {
  useFalcor,
  withAuth,
  Input
} from "~/modules/avl-components/src"

import { FolderStuff, getStuffSorter } from "./Stuff"
import { Link } from 'react-router-dom'
import FolderModal from "./FolderModal"
import ActionBar from "./ActionBar"
import FolderIcon from "./FolderIcon"
import ConfirmModal from "./ConfirmModal"

import { FuseWrapper } from "~/sites/npmrds/components"

import { csvParseRows } from "d3-dsv"

const StuffInFolder = ({ folders, openedFolders, setOpenedFolders, filter, deleteFolder }) => {
  const { falcor, falcorCache } = useFalcor();

  const [stuff, setStuff] = React.useState([]);

  const folder = openedFolders[openedFolders.length - 1] || {};

  React.useEffect(() => {
    falcor.get(["folders2", "stuff", folder?.id])
  }, [falcor, folder?.id]);

  React.useEffect(() => {
    const stuff = get(falcorCache, ["folders2", "stuff", folder?.id, "value"], []);
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
  }, [falcor, falcorCache, folder?.id, filter]);

  React.useEffect(() => {
    if (!folder) {
      setStuff([]);
      return;
    }

    const stuff = get(falcorCache, ["folders2", "stuff", folder?.id, "value"], [])
      .filter(s => !filter ||
                  (s.stuff_type === "folder") ||
                  filter.includes(s.stuff_type) ||
                  ((filter === "reports") && (s.stuff_type === "template"))
      )
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
      .sort(getStuffSorter(folder));

    setStuff(stuff);
  }, [falcorCache, folder, filter]);

  const [selectedStuff, setSelectedStuff] = React.useState([]);
  const selectStuff = React.useCallback(stuff => {
    setSelectedStuff(prev => [...prev, stuff]);
  }, []);
  const selectAll = React.useCallback(e => {
    setSelectedStuff(stuff.map(s => ({ id: s.stuff_id, type: s.stuff_type })));
  }, [stuff]);
  const deselectStuff = React.useCallback(stuff => {
    setSelectedStuff(prev => prev.filter(s => !((s.type === stuff.type) && (s.id === stuff.id))));
  }, []);
  const deselectAll = React.useCallback(e => {
    setSelectedStuff([]);
  }, []);

  React.useEffect(() => {
    deselectAll();
  }, [folder?.id, deselectAll]);

  const [search, setSearch] = React.useState("");
  const clearSearch = React.useCallback(() => {
    setSearch("");
  }, []);

  const fuse = React.useMemo(() => {
    return FuseWrapper(stuff, { keys: ["name", "description"] });
  }, [stuff]);

  const fused = React.useMemo(() => {
    return fuse(search);
  }, [fuse, search]);

  return (
    <div>
      <FolderPath filter={ filter }
        openedFolders={ openedFolders }
        setOpenedFolders={ setOpenedFolders }
        deleteFolder={ deleteFolder }/>

      <div className='flex items-center'>
        <div className="flex-1 flex border border-gray-100 mt-1">

          <Input type="text" className="w-full px-4 py-2 focus:outline-none
            border-b-2 border-transparent focus:border-blue-400 focus:bg-blue-50
            shadow rounded-sm text-lg"
            value={ search }
            onChange={ setSearch }
            placeholder="Search..."/>

          { !search.length ? null :
            <div onClick={ clearSearch }
              className={ `
                w-10 h-10 flex items-center justify-center
                cursor-pointer  rounded -ml-12
                text-large text-lg hover:text-2xl
              ` }
            >
              <span className={ `fa fa-close text-blue-500` }/>
            </div>
          }
        </div>
        <div>
          <ButtonNew openedFolders={ openedFolders }/>
        </div>
      </div>
      <div className='mt-2'>
        <ActionBar parent={ folder?.id }
          stuff={ stuff }
          selectedStuff={ selectedStuff }
          selectAll={ selectAll }
          deselectAll={ deselectAll }/>
      </div>
      <div className='bg-white p-4 shadow rounded-sm border border-gray-100 mt-2'>
        <DropArea
          hasChildren={ Boolean(fused.length )}
          folderId={ folder?.id }
        >
          { fused.map((s, i)=> (
              <FolderStuff key={ i }
                openedFolders={ openedFolders }
                setOpenedFolders={ setOpenedFolders }
                type={ s.stuff_type }
                id={ s.stuff_id }
                selected={
                  selectedStuff.reduce((a, c) => {
                    return a || ((c.id == s.stuff_id) && (c.type == s.stuff_type));
                  }, false)
                }
                select={ selectStuff }
                deselect={ deselectStuff }
                parent={ folder?.id }/>
            ))
          }
        </DropArea>
      </div>
    </div>
  )
}
export default StuffInFolder;

const DateTimeRegex = /^(\d{1,2})[/](\d{2})[/](\d{4})(?:\s(\d{2}:\d{2}:\d{2}))?$/;

const REGEXes = [
  /[A-Za-z0-9_ ]+/,
  DateTimeRegex,
  DateTimeRegex,
  /(\d{3}[+-pnPN]\d{5}[|]?)+/
]

const mapDateTime = dt => {
  const [, MM, DD, YYYY, T] = DateTimeRegex.exec(dt);
  return `${ YYYY }-${ MM }-${ DD }T${ T }`;
}

const processCsvFile = file => {
  const filereader = new FileReader();
  filereader.readAsText(file);
  return new Promise((resolve, reject) => {
    filereader.onload = () => {
      const totalRows = csvParseRows(filereader.result);
      const filteredRows = totalRows.filter(
        r => r.reduce((a, c, i) => {
          return a && REGEXes[i].test(c);
        }, r.length === REGEXes.length)
      ).map(row => {
        const [name, sdt, edt, tmcs] = row;
        return [name, mapDateTime(sdt), mapDateTime(edt), tmcs];
      })
      resolve([totalRows.length, filteredRows.length, filteredRows]);
    }
  })
}

const processCsvFiles = async files => {
  const response = [];
  for (const file of files) {
    if (file.type !== "text/csv") {
      response.push({
        filename: file.name,
        message: `Incorrect file type "${ file.type }"`,
        error: true
      })
      continue;
    }
    const [totalRows, okRows, rows] = await processCsvFile(file);
    response.push({
      filename: file.name,
      message: `${ okRows } rows out of ${ totalRows } rows are OK`,
      error: !okRows,
      warning: okRows < totalRows,
      rows
    });
  }
  return response;
}

const DropArea = ({ children, hasChildren, folderId }) => {

  const preventDefault = React.useCallback(e => {
    e.preventDefault();
  }, []);

  const [dragging, setDragging] = React.useState(false);

  const [result, setResult] = React.useState([]);

  const [loading, setLoading] = React.useState(false);

  const onDragEnter = React.useCallback(() => {
    setDragging(true);
    setResult([]);
  }, []);
  const onDragLeave = React.useCallback(() => {
    setDragging(false);
  }, []);

  const onDrop = React.useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    // setDragging(false);
    const files = [...get(e, ["dataTransfer", "files"], [])];
    processCsvFiles(files)
      .then(res => setResult(res));
  }, []);

  const { falcor, falcorCache } = useFalcor();

  const hasError = React.useMemo(() => {
    return result.reduce((a, c) => {
      return a || c.error;
    }, false);
  }, [result]);

  React.useEffect(() => {
    if (!result.length) return;

    const okFiles = result.filter(r => !r.error);
    const hasError = result.reduce((a, c) => {
      return a || c.error;
    }, false);

    const finished = { value: true };
    const timeout = { value: null };

    if (okFiles.length) {
      finished.value = false;
      setLoading(true);
      const rows = okFiles.reduce((a, c) => {
        a.push(...c.rows);
        return a;
      }, []);
      falcor.call(["routes2", "batch", "upload"], [folderId, rows])
        .catch(e => console.error(e))
        .finally(() => {
          finished.value = true;
          setLoading(false);
          if (!timeout.value) {
            setResult([]);
            setDragging(false);
          }
        })
    }
    if (hasError) {
      timeout.value = setTimeout(() => {
        timeout.value = null;
        if (finished.value) {
          setResult([]);
          setDragging(false);
        }
      }, 30000);
    }
  }, [result, falcor, folderId, hasError]);

  const remove = React.useCallback(() => {
    if (!loading) {
      setResult([]);
      setDragging(false);
    }
  }, [loading]);

  return (
    <div onDragEnter={ onDragEnter }
      onDragOver={ preventDefault }
    >
      { !dragging ? null :
        <div className={ `
            fixed inset-0 bg-black bg-opacity-90
            flex flex-col items-center justify-center
            text-7xl font-bold text-gray-500 z-50
          ` }
          onDragOver={ preventDefault }
          onDragLeave={ onDragLeave }
          onDrop={ onDrop }
          onClick={ remove }
        >
          { !result.length ?
            <>
              <div>Drop Routes Here</div>
              <div><span className="fa fa-road"/></div>
            </> :
            <div className="w-full">
              { result.map((r, i) => (
                  <div key={ i} className="grid grid-cols-2 gap-4 items-end">
                    <div className="text-right text-4xl">
                      { r.filename }
                    </div>
                    <div style={ { paddingBottom: "2px" } }
                      className={ `
                        text-2xl ${ r.error ? "text-red-600" : r.warning ? "text-orange-600" : "text-current" }
                      ` }
                    >
                      { r.message }
                    </div>
                  </div>
                ))
              }
            </div>
          }
          { loading ? "UPLOADING ROUTES..." : result.length ? "CLICK TO CLOSE" : null }
          { !hasError ? null :
            <UploadInstructions />
          }
        </div>
      }
      { children }
      { hasChildren ? null :
        <div className={ `
            flex flex-col items-center justify-center
            font-bold text-7xl h-48 border rounded-xl
          ` }
        >
          { dragging ? null :
            <>
              Drag Routes Here
              <span className="fa fa-road"/>
            </>
          }
        </div>
      }
    </div>
  )
}

const UploadInstructions = () => {
  const date = new Date()
  return (
    <div className="text-2xl mt-2">
      <div className="pb-1 border-b border-current mb-1">
        You must upload a .csv text file.<br />
        The .csv must NOT have a header row.
      </div>
      <div className="pb-1 border-b border-current mb-1">
        The first column of each row must be an alphanumeric route name.
      </div>
      <div className="pb-1 border-b border-current mb-1">
        The second column of each row must be the start date and time in the format: "MM/DD/YYYY hh:mm:ss".<br />
        { `The current date and time looks like: "${ moment().format("M/DD/YYYY hh:mm:ss") }".` }
      </div>
      <div className="pb-1 border-b border-current mb-1">
        The third column of each row must be the end date and time in the format "MM/DD/YYYY hh:mm:ss".
      </div>
      <div className="">
        The fourth column of each row must be a list of TMCs.<br />
        Multiple TMCs must be joined with the pipe "|" character.<br />
        A single TMC looks like: 120P12345<br />
        Multiple TMCs look like: 120P12345|120P12346|120P12347
      </div>
    </div>
  )
}

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
      onConfirm: () => { deleteFolder(folder?.id); setConfirm({}); }
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
          stuff={ [{ type: "folder", id: folder?.id }] }
          { ...confirm }/>
      </div>

      <div className="relative">
        <div onMouseOver={ onMouseOver }
          onMouseLeave={ onMouseLeave }
        >
          <FolderIcon { ...folder } size={ 2 }/>
          <div style={ { right: "100%" } }
            className={ `
              absolute top-0 text-base bg-gray-50 font-normal
              ${ show ? "block" : "hidden" }
              shadow-lg text-right
            ` }
          >
            <div onClick={ openModal }
              className="p-2 hover:bg-gray-300 cursor-pointer whitespace-nowrap"
            >
              Edit Folder <span className="fad fa-edit px-2"/>
            </div>
            <div onClick={ confirmDelete }
              className="p-2 hover:bg-gray-300 cursor-pointer whitespace-nowrap"
            >
              Delete Folder <span className="fad fa-trash text-red-400 px-2"/>
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
      else if (c.type === "AVAIL") {
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
    if (fid !== folder?.id) {
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
        onClick={ e => setOpenedFolders([folder?.id]) }
      >
        { folder?.name }
        <span>&nbsp;/&nbsp;</span>
      </div>

{ /* FOLDER SELECTOR */ }
      <div style={ { top: "100%" } }
        className={ `
          absolute left-0 text-base bg-gray-50 font-normal
          ${ show ? "block" : "hidden" }
          grid grid-cols-2 gap-1 shadow-lg w-screen max-w-4xl z-50
        ` }
      >

        <div>
          { foldersByType.slice(0, 2).map(({ type, folders }) => (
              <div key={ type }>
                <div className="font-medium border-b border-gray-100 px-2 mt-1">
                  { type }
                </div>
                { folders.map(f => (
                    <div key={ f.id }
                      onClick={ e => openFolder(e, f.id) }
                      className={ `
                        whitespace-nowrap px-2 py-1 hover:bg-blue-100 flex
                        ${ f.id === folder?.id ?
                          "bg-blue-300 cursor-not-allowed" : "cursor-pointer"
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
                <div className="font-medium border-b border-gray-100 px-2 mt-1">
                  { type }
                </div>
                { folders.map(f => (
                    <div key={ f.id }
                      onClick={ e => openFolder(e, f.id) }
                      className={ `
                        whitespace-nowrap px-2 py-1 hover:bg-blue-100 flex
                        ${ f.id === folder?.id ?
                          "bg-blue-300 cursor-not-allowed" : "cursor-pointer"
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

        <div className="col-span-2 p-1  border-b border-gray-100">
          <button onClick={ openModal }
            className={ `
              w-full flex justify-center items-center
              h-12 border border-gray-100 rounded border border-gray-300 text-blue-500 hover:bg-blue-500 hover:text-white
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
  return (
    <div className="text-3xl font-medium flex relative">
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
        { filter }
      </div>
    </div>
  )
}

const ButtonNew = ({ openedFolders }) => {
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

  const folderId = React.useMemo(() => {
    const length = openedFolders.length;
    return get(openedFolders, [length - 1, "id"], "");
  }, [openedFolders]);

  return (
    <div className='px-2 pt-0.5'>
      <div className='flex items-center bg-blue-500 border border-lime-300 text-gray-50 rounded-md'
        onMouseOver={ onMouseOver }
        onMouseLeave={ onMouseLeave }
      >
        <div className='py-2 px-6 text-lg'>Add New</div>
        <div className="flex items-center justify-center relative">
          <div className={ `
              h-10 w-10 rounded
              flex items-center justify-center
              text-xl hover:text-3xl cursor-pointer
            ` }
          >
            <span className="fa fa-caret-down"/>
          </div>
          <div className={ `
              top-[42px] right-0 absolute bg-gray-50 text-gray-600 z-50
              text-base font-normal whitespace-nowrap
              ${ show ? "block" : "hidden" } cursor-pointer
            ` }
          >
            <div className="p-2 hover:bg-blue-100 w-40"
              onClick={ openModal }
            >
              <span className="fad fa-folder mr-1 px-2 text-blue-500"/>Sub Folder
            </div>
            <Link to={ `/route/creation/folder/${ folderId }` }>
              <div className="p-2 hover:bg-blue-100">
                <span className="fad fa-road mr-1 px-2 text-blue-500"/>Route
              </div>
            </Link>
            <Link to={ `/report/new/folder/${ folderId }` }>
              <div className="p-2 hover:bg-blue-100">
                  <span className="fad fa-chart-column text-blue-500 mr-1 px-2"/>Report
              </div>
             </Link>
          </div>
        </div>
      </div>
      <FolderModal isOpen={ open }
        close={ closeModal }
        openedFolders={ openedFolders }/>
    </div>
  )
}
